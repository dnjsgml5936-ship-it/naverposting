'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { ImageCard, PostDomain } from '@/types';

const DOMAIN_BRANDING: Record<PostDomain, { label: string; color: string }> = {
  insurance: { label: '보험전문 컨설턴트', color: '#3b82f6' },
  policy_fund: { label: '정책자금 전문 컨설턴트', color: '#22c55e' },
  iso_certification: { label: 'ISO인증 전문 컨설턴트', color: '#f97316' },
  corporate_consulting: { label: '법인컨설팅 전문가', color: '#6366f1' },
  smart_factory: { label: '스마트공장 전문 컨설턴트', color: '#14b8a6' },
  disabled_workplace: { label: '장애인고용 전문 컨설턴트', color: '#f43f5e' },
  bizinfo: { label: '기업지원 전문 컨설턴트', color: '#f59e0b' },
};

const ACCENT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  teal: '#14b8a6',
};

// Pollinations.ai 무료 AI 이미지 생성 URL
function getAiImageUrl(prompt: string, width = 1200, height = 675): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
}

// 이미지를 비동기로 로드
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 캐시된 이미지 저장소
const imageCache = new Map<string, HTMLImageElement>();

async function loadCachedImage(prompt: string): Promise<HTMLImageElement> {
  if (imageCache.has(prompt)) {
    return imageCache.get(prompt)!;
  }
  const url = getAiImageUrl(prompt);
  const img = await loadImage(url);
  imageCache.set(prompt, img);
  return img;
}

// === 핵심 드로잉: AI 이미지 배경 + 텍스트 오버레이 ===
async function drawCardWithAiImage(
  canvas: HTMLCanvasElement,
  card: ImageCard,
  blogTitle: string,
  index: number,
  domain: PostDomain = 'insurance'
): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  const W = 1200;
  const H = 675;
  canvas.width = W;
  canvas.height = H;

  const accent = ACCENT_COLORS[card.theme] || ACCENT_COLORS.blue;
  const branding = DOMAIN_BRANDING[domain] || DOMAIN_BRANDING.insurance;
  const overlayText = card.overlayText || card.title;

  // 1) AI 생성 배경 이미지 로드
  let bgLoaded = false;
  if (card.imagePrompt) {
    try {
      const img = await loadCachedImage(card.imagePrompt);
      // 이미지를 캔버스에 cover 방식으로 그리기
      const scale = Math.max(W / img.width, H / img.height);
      const sw = W / scale;
      const sh = H / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      bgLoaded = true;
    } catch {
      // 이미지 로드 실패 시 폴백 그라데이션
    }
  }

  // 이미지 로드 실패 시 폴백 그라데이션 배경
  if (!bgLoaded) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 2) 어두운 그라데이션 오버레이 (텍스트 가독성 확보)
  // 하단에서 상단으로 점점 진해지는 오버레이
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, H);
  overlayGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
  overlayGrad.addColorStop(0.3, 'rgba(0,0,0,0.35)');
  overlayGrad.addColorStop(0.6, 'rgba(0,0,0,0.50)');
  overlayGrad.addColorStop(1, 'rgba(0,0,0,0.70)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, W, H);

  // 3) 상단 악센트 바
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, accent);
  topBar.addColorStop(0.5, accent + 'cc');
  topBar.addColorStop(1, accent);
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 5);

  // 4) 카드 번호 뱃지 (좌측 상단)
  ctx.beginPath();
  ctx.arc(60, 50, 24, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${index + 1}`, 60, 51);

  // 5) 이모지 (우측 상단)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillText(card.emoji, W - 40, 22);

  // 6) 메인 오버레이 텍스트 (가독성 높은 큰 글씨, 한 문장)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 텍스트 배경 영역 (반투명 블러 효과 시뮬레이션)
  const textAreaY = H * 0.32;
  const textAreaH = H * 0.38;
  const textBgGrad = ctx.createLinearGradient(0, textAreaY - 20, 0, textAreaY + textAreaH + 20);
  textBgGrad.addColorStop(0, 'rgba(0,0,0,0)');
  textBgGrad.addColorStop(0.15, 'rgba(0,0,0,0.45)');
  textBgGrad.addColorStop(0.5, 'rgba(0,0,0,0.55)');
  textBgGrad.addColorStop(0.85, 'rgba(0,0,0,0.45)');
  textBgGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = textBgGrad;
  ctx.fillRect(0, textAreaY - 20, W, textAreaH + 40);

  // 메인 텍스트 렌더링 (큰 폰트, 가독성 최우선)
  const fontSize = calculateFontSize(ctx, overlayText, W - 160, 54, 36);
  ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif`;

  // 텍스트 그림자 (가독성 강화)
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  // 줄바꿈 처리
  const lines = wrapTextCenter(ctx, overlayText, W - 160);
  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = H * 0.5 - totalTextHeight / 2 + lineHeight / 2;

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
  }

  // 그림자 리셋
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 7) 악센트 언더라인 (텍스트 아래)
  const underlineY = startY + (lines.length - 1) * lineHeight + lineHeight * 0.6;
  const underlineW = 120;
  ctx.fillStyle = accent;
  roundRect(ctx, W / 2 - underlineW / 2, underlineY, underlineW, 4, 2);
  ctx.fill();

  // 8) 하단 정보 바
  const bottomH = 50;
  const bottomGrad = ctx.createLinearGradient(0, H - bottomH, 0, H);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - bottomH, W, bottomH);

  // 상단 라인
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - bottomH, W, 2);

  // 블로그 제목 (좌측)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const brandText = blogTitle.length > 40 ? blogTitle.substring(0, 40) + '...' : blogTitle;
  ctx.fillText(brandText, 24, H - bottomH / 2);

  // 도메인 브랜딩 (우측)
  ctx.textAlign = 'right';
  ctx.fillStyle = branding.color;
  ctx.font = 'bold 15px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(branding.label, W - 24, H - bottomH / 2);
}

// 폴백용 동기 드로잉 (이미지 없이 그라데이션 배경)
function drawCardFallback(
  canvas: HTMLCanvasElement,
  card: ImageCard,
  blogTitle: string,
  index: number,
  domain: PostDomain = 'insurance'
) {
  const ctx = canvas.getContext('2d')!;
  const W = 1200;
  const H = 675;
  canvas.width = W;
  canvas.height = H;

  const accent = ACCENT_COLORS[card.theme] || ACCENT_COLORS.blue;
  const branding = DOMAIN_BRANDING[domain] || DOMAIN_BRANDING.insurance;
  const overlayText = card.overlayText || card.title;

  // 그라데이션 배경
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 장식 글로우
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 400);
  glow.addColorStop(0, accent + '20');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 상단 바
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 5);

  // 카드 번호
  ctx.beginPath();
  ctx.arc(60, 50, 24, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${index + 1}`, 60, 51);

  // 이모지
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillText(card.emoji, W - 40, 22);

  // 메인 텍스트
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = calculateFontSize(ctx, overlayText, W - 160, 54, 36);
  ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif`;

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  const lines = wrapTextCenter(ctx, overlayText, W - 160);
  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = H * 0.5 - totalTextHeight / 2 + lineHeight / 2;

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 언더라인
  const underlineY = startY + (lines.length - 1) * lineHeight + lineHeight * 0.6;
  ctx.fillStyle = accent;
  roundRect(ctx, W / 2 - 60, underlineY, 120, 4, 2);
  ctx.fill();

  // 하단 바
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 50, W, 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '15px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const brandText = blogTitle.length > 40 ? blogTitle.substring(0, 40) + '...' : blogTitle;
  ctx.fillText(brandText, 24, H - 25);

  ctx.textAlign = 'right';
  ctx.fillStyle = branding.color;
  ctx.font = 'bold 15px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(branding.label, W - 24, H - 25);
}

// 텍스트 크기 자동 계산 (최대 maxSize, 최소 minSize)
function calculateFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
): number {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `bold ${size}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif`;
    const lines = wrapTextCenter(ctx, text, maxWidth);
    if (lines.length <= 2) return size;
  }
  return minSize;
}

// 중앙 정렬용 텍스트 줄바꿈
function wrapTextCenter(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';

  for (const char of text) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === 타이틀/아웃로 슬라이드 ===
function drawTitleSlide(
  ctx: CanvasRenderingContext2D, W: number, H: number, title: string,
  branding: { label: string; color: string }
) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(0.5, '#1a3a5c');
  grad.addColorStop(1, '#0c1929');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 350);
  glow.addColorStop(0, 'rgba(59,130,246,0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, 'transparent');
  topBar.addColorStop(0.5, branding.color);
  topBar.addColorStop(1, 'transparent');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapTextCenter(ctx, title, 800);
  const lineHeight = 56;
  const startY = H / 2 - 30 - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
  }

  ctx.fillStyle = branding.color;
  ctx.font = 'bold 24px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(branding.label, W / 2, startY + lines.length * lineHeight + 30);
  ctx.textAlign = 'left';
}

function drawOutroSlide(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  branding: { label: string; color: string }
) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(1, '#1a3a5c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 300);
  glow.addColorStop(0, 'rgba(59,130,246,0.12)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText('무료 상담 신청하세요', W / 2, H / 2 - 20);

  ctx.fillStyle = branding.color;
  ctx.font = '28px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(`${branding.label}가 1:1로 상담해드립니다`, W / 2, H / 2 + 40);
  ctx.textAlign = 'left';
}

// === 컴포넌트 ===
interface Props {
  cards: ImageCard[];
  blogTitle: string;
  domain?: PostDomain;
}

export default function ImageCardRenderer({ cards, blogTitle, domain = 'insurance' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);

  // 카드가 변경되면 프리뷰 이미지 생성
  useEffect(() => {
    if (!cards.length) return;

    const initialLoading = cards.map(() => true);
    setLoadingStates(initialLoading);
    setPreviews(cards.map(() => ''));

    cards.forEach(async (card, i) => {
      const offscreen = document.createElement('canvas');
      try {
        await drawCardWithAiImage(offscreen, card, blogTitle, i, domain);
      } catch {
        drawCardFallback(offscreen, card, blogTitle, i, domain);
      }
      const dataUrl = offscreen.toDataURL('image/png');

      setPreviews((prev) => {
        const next = [...prev];
        next[i] = dataUrl;
        return next;
      });
      setLoadingStates((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    });
  }, [cards, blogTitle, domain]);

  const downloadImage = useCallback(
    async (card: ImageCard, index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        await drawCardWithAiImage(canvas, card, blogTitle, index, domain);
      } catch {
        drawCardFallback(canvas, card, blogTitle, index, domain);
      }
      const link = document.createElement('a');
      link.download = `blog-image-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    [blogTitle, domain]
  );

  const downloadAllImages = useCallback(async () => {
    for (let i = 0; i < cards.length; i++) {
      await downloadImage(cards[i], i);
      await sleep(500);
    }
  }, [cards, downloadImage]);

  const generateVideo = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    canvas.style.position = 'fixed';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%) scale(0.5)';
    canvas.style.zIndex = '9999';
    canvas.style.borderRadius = '12px';
    canvas.style.boxShadow = '0 25px 50px rgba(0,0,0,0.5)';
    document.body.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;display:flex;align-items:end;justify-content:center;padding-bottom:40px;';
    overlay.innerHTML = '<p style="color:white;font-size:14px;font-family:sans-serif;">영상 녹화 중... 자동으로 다운로드됩니다</p>';
    document.body.appendChild(overlay);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (canvas as any).captureStream(30);

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      canvas.remove();
      overlay.remove();

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'blog-video.webm';
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    recorder.start();

    const ctx = canvas.getContext('2d')!;
    const branding = DOMAIN_BRANDING[domain] || DOMAIN_BRANDING.insurance;

    // 타이틀 슬라이드
    drawTitleSlide(ctx, canvas.width, canvas.height, blogTitle, branding);
    await sleep(2500);

    // 각 카드 슬라이드
    for (let i = 0; i < cards.length; i++) {
      // 페이드 아웃
      for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
        ctx.globalAlpha = alpha;
        if (i === 0) {
          drawTitleSlide(ctx, canvas.width, canvas.height, blogTitle, branding);
        } else {
          drawCardFallback(canvas, cards[i - 1], blogTitle, i - 1, domain);
        }
        await sleep(20);
      }
      ctx.globalAlpha = 1;

      // 페이드 인 (AI 이미지 포함)
      try {
        await drawCardWithAiImage(canvas, cards[i], blogTitle, i, domain);
      } catch {
        drawCardFallback(canvas, cards[i], blogTitle, i, domain);
      }
      await sleep(3000);
    }

    // 아웃로
    for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
      ctx.globalAlpha = alpha;
      drawCardFallback(canvas, cards[cards.length - 1], blogTitle, cards.length - 1, domain);
      await sleep(20);
    }
    ctx.globalAlpha = 1;
    drawOutroSlide(ctx, canvas.width, canvas.height, branding);
    await sleep(2500);

    recorder.stop();
  }, [cards, blogTitle, domain]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">블로그 이미지 & 영상</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadAllImages}
            className="px-4 py-2 text-xs font-medium bg-blue-50 text-[var(--primary)] rounded-lg hover:bg-blue-100 transition-colors"
          >
            이미지 5장 전체 다운로드
          </button>
          <button
            onClick={generateVideo}
            className="px-4 py-2 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            영상 생성 & 다운로드
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-5 gap-3">
        {cards.map((card, i) => {
          const accent = ACCENT_COLORS[card.theme] || ACCENT_COLORS.blue;
          const isLoading = loadingStates[i];
          const preview = previews[i];

          return (
            <div
              key={i}
              onClick={() => downloadImage(card, i)}
              className="cursor-pointer group relative rounded-lg overflow-hidden aspect-video"
              style={{ background: '#0f172a' }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: accent, borderTopColor: 'transparent' }}
                  />
                  <span className="text-white/50 text-[10px]">AI 이미지 생성 중...</span>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt={card.overlayText || card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: accent, color: '#fff' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-lg">{card.emoji}</span>
                    </div>
                    <p className="text-white text-xs font-bold mt-1.5 leading-tight line-clamp-2">
                      {card.overlayText || card.title}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  PNG 다운로드
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
