"""
네이버 블로그 자동 발행 서버
FastAPI + Selenium으로 네이버 블로그에 포스트를 자동 발행합니다.

사용법:
  1. pip install -r requirements.txt
  2. python server.py
  3. 브라우저에서 네이버 로그인 진행 (최초 1회)
  4. 이후 Next.js 앱에서 자동발행 버튼으로 발행
"""

import time
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

app = FastAPI(title="네이버 블로그 자동발행 서버")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global driver instance
driver = None
COOKIE_PATH = os.path.join(os.path.dirname(__file__), "naver_cookies.json")


class PublishRequest(BaseModel):
    title: str
    htmlContent: str
    tags: list[str] = []


class LoginRequest(BaseModel):
    username: str
    password: str


def get_driver():
    """Chrome WebDriver를 가져오거나 생성합니다. (WSL → Windows Chrome 사용)"""
    global driver
    if driver is None:
        import subprocess

        options = Options()
        # Windows Chrome 바이너리 경로 (WSL에서 Windows 경로로 변환)
        options.binary_location = "C:/Program Files/Google/Chrome/Application/chrome.exe"

        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-data-dir=C:\\temp\\selenium-chrome-profile")
        # 자동화 감지 우회
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # WSL에서 Windows chromedriver.exe를 별도 프로세스로 실행
        # C:\temp에 복사된 chromedriver.exe 사용
        cd_port = 9516
        cd_proc = subprocess.Popen(
            ["cmd.exe", "/c", "C:\\temp\\chromedriver.exe", f"--port={cd_port}", "--allowed-ips="],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="/mnt/c/temp",
        )
        time.sleep(3)  # chromedriver 시작 대기

        # WSL → Windows 호스트 IP (게이트웨이) 경유로 연결
        win_host = subprocess.check_output(
            ["ip", "route", "show", "default"]
        ).decode().split()[2]
        driver = webdriver.Remote(
            command_executor=f"http://{win_host}:{cd_port}",
            options=options,
        )
        driver.execute_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        # chromedriver 프로세스 참조 저장
        driver._cd_proc = cd_proc

        # 저장된 쿠키가 있으면 로드
        load_cookies()

    return driver


def save_cookies():
    """현재 브라우저 쿠키를 파일로 저장합니다."""
    if driver:
        cookies = driver.get_cookies()
        with open(COOKIE_PATH, "w") as f:
            json.dump(cookies, f)
        print(f"[INFO] 쿠키 저장 완료: {len(cookies)}개")


def load_cookies():
    """저장된 쿠키를 브라우저에 로드합니다."""
    if not os.path.exists(COOKIE_PATH):
        return
    try:
        driver.get("https://www.naver.com")
        time.sleep(1)
        with open(COOKIE_PATH, "r") as f:
            cookies = json.load(f)
        for cookie in cookies:
            try:
                driver.add_cookie(cookie)
            except Exception:
                pass
        print(f"[INFO] 쿠키 로드 완료: {len(cookies)}개")
    except Exception as e:
        print(f"[WARN] 쿠키 로드 실패: {e}")


def check_login() -> bool:
    """네이버 로그인 상태를 확인합니다."""
    d = get_driver()
    d.get("https://www.naver.com")
    time.sleep(2)
    try:
        # 로그인 상태 확인: 로그인 버튼이 없으면 로그인됨
        d.find_element(By.CSS_SELECTOR, ".MyView-module__link_login___HpHMW")
        return False
    except Exception:
        return True


@app.get("/")
def root():
    return {"status": "ok", "message": "네이버 블로그 자동발행 서버"}


@app.get("/status")
def status():
    """로그인 상태를 확인합니다."""
    try:
        logged_in = check_login()
        return {"logged_in": logged_in}
    except Exception as e:
        return {"logged_in": False, "error": str(e)}


@app.get("/debug-login-page")
def debug_login_page():
    """로그인 페이지의 실제 HTML 요소들을 확인합니다."""
    d = get_driver()
    d.get("https://nid.naver.com/nidlogin.login")
    time.sleep(3)

    # 모든 input 요소 찾기
    inputs = d.find_elements(By.TAG_NAME, "input")
    input_info = []
    for inp in inputs:
        input_info.append({
            "id": inp.get_attribute("id"),
            "name": inp.get_attribute("name"),
            "type": inp.get_attribute("type"),
            "placeholder": inp.get_attribute("placeholder"),
            "class": inp.get_attribute("class"),
        })

    # 모든 button 요소 찾기
    buttons = d.find_elements(By.TAG_NAME, "button")
    button_info = []
    for btn in buttons:
        button_info.append({
            "id": btn.get_attribute("id"),
            "text": btn.text,
            "class": btn.get_attribute("class"),
            "type": btn.get_attribute("type"),
        })

    # iframe 확인
    iframes = d.find_elements(By.TAG_NAME, "iframe")
    iframe_info = [{"id": f.get_attribute("id"), "src": f.get_attribute("src")} for f in iframes]

    return {
        "url": d.current_url,
        "title": d.title,
        "inputs": input_info,
        "buttons": button_info,
        "iframes": iframe_info,
    }


@app.post("/login")
def login(req: LoginRequest):
    """
    네이버 아이디/비밀번호로 자동 로그인합니다.
    클립보드 붙여넣기 방식으로 자동화 감지를 우회합니다.
    """
    d = get_driver()

    try:
        d.get("https://nid.naver.com/nidlogin.login")
        time.sleep(2)

        wait = WebDriverWait(d, 10)

        # 아이디 입력 — ActionChains로 실제 키보드 이벤트 발생
        id_input = wait.until(
            EC.presence_of_element_located((By.ID, "id"))
        )
        id_input.click()
        time.sleep(0.5)

        # ActionChains를 사용하여 실제 키보드 입력처럼 동작
        actions = ActionChains(d)
        actions.click(id_input)
        for ch in req.username:
            actions.send_keys(ch)
            actions.pause(0.08 + (0.05 * (ord(ch) % 3)))
        actions.perform()
        time.sleep(1)

        # 비밀번호 입력
        pw_input = d.find_element(By.ID, "pw")
        pw_input.click()
        time.sleep(0.5)

        actions = ActionChains(d)
        actions.click(pw_input)
        for ch in req.password:
            actions.send_keys(ch)
            actions.pause(0.08 + (0.05 * (ord(ch) % 3)))
        actions.perform()
        time.sleep(1)

        # 로그인 버튼 활성화 확인 및 강제 활성화
        login_btn = d.find_element(By.ID, "log.login")
        # off 클래스 제거하여 버튼 활성화
        d.execute_script("""
            var btn = arguments[0];
            btn.classList.remove('off');
            btn.removeAttribute('disabled');
        """, login_btn)
        time.sleep(0.3)

        # 폼 직접 submit (버튼 클릭 대신)
        d.execute_script("document.querySelector('form[name=frmNIDLogin]').submit();")
        time.sleep(5)

        # 로그인 결과 확인
        current_url = d.current_url
        page_source = d.page_source[:2000]  # 디버깅용

        # 에러 메시지 확인
        error_msg = ""
        try:
            err_el = d.find_element(By.CSS_SELECTOR, "#err_common, .error_message, #errorContent, .input_error")
            error_msg = err_el.text
        except Exception:
            pass

        # 캡차나 2차 인증 페이지 체크
        if "captcha" in current_url or "deviceConfirm" in current_url or "보안" in page_source:
            return {
                "success": False,
                "message": "보안 인증이 필요합니다. 열린 Chrome 창에서 인증을 완료해주세요. 완료 후 다시 로그인 버튼을 눌러주세요.",
                "needsVerification": True,
                "url": current_url,
            }

        if check_login():
            save_cookies()
            return {"success": True, "message": "네이버 로그인 성공!"}
        else:
            return {
                "success": False,
                "message": f"로그인 실패. {error_msg}" if error_msg else "로그인 실패. 아이디/비밀번호를 확인해주세요.",
                "url": current_url,
                "debug": error_msg or "에러 메시지 없음 - Chrome 창을 확인해주세요",
            }

    except Exception as e:
        return {"success": False, "message": f"로그인 중 오류: {str(e)}"}


@app.post("/publish")
def publish(req: PublishRequest):
    """네이버 블로그에 포스트를 발행합니다."""
    if not check_login():
        raise HTTPException(
            status_code=401,
            detail="네이버 로그인이 필요합니다. /login 엔드포인트를 먼저 호출하세요.",
        )

    d = get_driver()

    try:
        # 1. 네이버 블로그 글쓰기 페이지로 이동
        d.get("https://blog.naver.com/GoBlogWrite.naver")
        time.sleep(3)

        # 2. SmartEditor로 전환 (iframe 내부)
        wait = WebDriverWait(d, 15)

        # 메인 iframe으로 전환
        main_frame = wait.until(
            EC.presence_of_element_located((By.ID, "mainFrame"))
        )
        d.switch_to.frame(main_frame)
        time.sleep(2)

        # 3. 제목 입력
        title_area = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, ".se-ff-system.se-fs28")
            )
        )
        title_area.click()
        time.sleep(0.5)

        # 제목 텍스트 입력
        active = d.switch_to.active_element
        active.send_keys(req.title)
        time.sleep(0.5)

        # 4. 본문 영역 클릭
        body_area = d.find_element(
            By.CSS_SELECTOR, ".se-component.se-text .se-text-paragraph"
        )
        body_area.click()
        time.sleep(0.5)

        # 5. HTML 모드로 전환하여 컨텐츠 입력
        # '더보기' 버튼 클릭
        more_btn = d.find_element(
            By.CSS_SELECTOR, 'button.se-toolbar-button[data-name="more"]'
        )
        more_btn.click()
        time.sleep(1)

        # HTML 편집 버튼 클릭
        html_btn = d.find_element(
            By.CSS_SELECTOR,
            'button.se-toolbar-button[data-name="htmlMode"]',
        )
        html_btn.click()
        time.sleep(2)

        # HTML 편집기에 내용 입력
        html_editor = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".se-html-editor textarea"))
        )
        html_editor.clear()
        html_editor.send_keys(req.htmlContent)
        time.sleep(1)

        # HTML 적용 버튼 클릭
        apply_btn = d.find_element(
            By.CSS_SELECTOR, ".se-html-editor .se-html-confirm button"
        )
        apply_btn.click()
        time.sleep(2)

        # 6. 태그 입력
        if req.tags:
            try:
                tag_input = d.find_element(By.CSS_SELECTOR, ".blog_tag input")
                for tag in req.tags[:10]:  # 최대 10개
                    tag_input.send_keys(tag)
                    tag_input.send_keys("\n")
                    time.sleep(0.3)
            except Exception:
                print("[WARN] 태그 입력 실패 - 계속 진행")

        # 7. 발행 버튼 클릭
        publish_btn = wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, ".publish_btn button, #publish-btn")
            )
        )
        publish_btn.click()
        time.sleep(1)

        # 발행 확인 버튼
        try:
            confirm_btn = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, ".confirm_btn, .se-popup-button-confirm")
                )
            )
            confirm_btn.click()
            time.sleep(3)
        except Exception:
            pass

        d.switch_to.default_content()
        save_cookies()

        return {"success": True, "message": "네이버 블로그에 발행 완료!"}

    except Exception as e:
        d.switch_to.default_content()
        raise HTTPException(status_code=500, detail=f"발행 중 오류: {str(e)}")


@app.on_event("shutdown")
def shutdown():
    global driver
    if driver:
        driver.quit()
        driver = None


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print(" 네이버 블로그 자동발행 서버")
    print(" http://localhost:8000")
    print("=" * 50)
    print()
    print("1. 서버 시작 후 http://localhost:8000/login 으로 POST 요청")
    print("2. 열린 브라우저에서 네이버 로그인")
    print("3. 로그인 완료 후 http://localhost:8000/login/confirm 으로 POST 요청")
    print("4. 이후 Next.js 앱에서 자동발행 가능")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8000)
