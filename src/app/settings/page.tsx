'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [naverId, setNaverId] = useState('');
  const [naverPw, setNaverPw] = useState('');
  const [loginStatus, setLoginStatus] = useState<'checking' | 'logged_in' | 'logged_out'>('checking');
  const [loginMessage, setLoginMessage] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoginStatus('checking');
    try {
      const res = await fetch('http://localhost:8000/status');
      const data = await res.json();
      setServerOnline(true);
      setLoginStatus(data.logged_in ? 'logged_in' : 'logged_out');
    } catch {
      setServerOnline(false);
      setLoginStatus('logged_out');
    }
  }

  async function handleLogin() {
    if (!naverId.trim() || !naverPw.trim()) {
      setLoginMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoggingIn(true);
    setLoginMessage('');

    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: naverId, password: naverPw }),
      });
      const data = await res.json();

      if (data.success) {
        setLoginMessage('네이버 로그인 성공! 이제 자동발행을 사용할 수 있습니다.');
        setLoginStatus('logged_in');
        setNaverPw(''); // 비밀번호 클리어
      } else if (data.needsVerification) {
        setLoginMessage('보안 인증이 필요합니다. 열린 Chrome 창에서 인증을 완료해주세요.');
      } else {
        const debug = data.debug ? ` (${data.debug})` : '';
        const url = data.url ? ` [URL: ${data.url}]` : '';
        setLoginMessage((data.message || '로그인 실패') + debug + url);
      }
    } catch {
      setLoginMessage('셀레니움 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">설정</h1>
      <p className="text-[var(--muted)] text-sm mb-8">
        네이버 블로그 자동발행 설정
      </p>

      {/* Server Status */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">셀레니움 서버 상태</h2>
          <button
            onClick={checkStatus}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            새로고침
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              serverOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            {serverOnline ? '서버 실행 중 (localhost:8000)' : '서버 연결 안 됨'}
          </span>
        </div>
        {!serverOnline && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            셀레니움 서버가 실행되지 않고 있습니다.
            <code className="block mt-1 bg-yellow-100 px-2 py-1 rounded text-xs">
              cd selenium && python3 server.py
            </code>
          </div>
        )}
      </div>

      {/* Naver Login */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
        <h2 className="font-semibold mb-4">네이버 로그인</h2>

        {loginStatus === 'logged_in' ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-green-700 font-medium">
              네이버 로그인 완료 — 자동발행 사용 가능
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              네이버 블로그 자동발행을 위해 로그인이 필요합니다.
              입력한 정보는 서버 메모리에서만 사용되며 저장되지 않습니다.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                네이버 아이디
              </label>
              <input
                type="text"
                value={naverId}
                onChange={(e) => setNaverId(e.target.value)}
                placeholder="네이버 아이디"
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                disabled={loggingIn}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={naverPw}
                onChange={(e) => setNaverPw(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                disabled={loggingIn}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {loginMessage && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  loginMessage.includes('성공')
                    ? 'bg-green-50 text-green-700'
                    : loginMessage.includes('인증')
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-600'
                }`}
              >
                {loginMessage}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loggingIn || !serverOnline}
              className="w-full py-3 bg-[#03c75a] text-white rounded-lg font-medium hover:bg-[#02b350] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '네이버 로그인'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-5">
        <h3 className="text-sm font-medium text-[var(--primary)] mb-2">
          자동발행 사용 방법
        </h3>
        <ol className="text-sm text-[var(--muted)] space-y-1.5 list-decimal list-inside">
          <li>위에서 네이버 로그인을 완료합니다</li>
          <li>새 글 작성 페이지에서 포스팅을 생성합니다</li>
          <li>포스트 관리에서 "자동발행" 버튼을 클릭합니다</li>
          <li>또는 "복사" 버튼으로 HTML을 복사해 직접 붙여넣기 합니다</li>
        </ol>
      </div>
    </div>
  );
}
