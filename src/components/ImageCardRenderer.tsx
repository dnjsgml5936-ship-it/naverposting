'use client';

import { useRef, useCallback } from 'react';
import { ImageCard, PostDomain } from '@/types';

const THEMES: Record<string, { bg1: string; bg2: string; accent: string; text: string; light: string; glow: string }> = {
  blue: { bg1: '#0c1929', bg2: '#1a3a5c', accent: '#3b82f6', text: '#ffffff', light: '#93c5fd', glow: 'rgba(59,130,246,0.3)' },
  green: { bg1: '#0a1f12', bg2: '#14532d', accent: '#22c55e', text: '#ffffff', light: '#86efac', glow: 'rgba(34,197,94,0.3)' },
  purple: { bg1: '#1a0533', bg2: '#3b0764', accent: '#a855f7', text: '#ffffff', light: '#d8b4fe', glow: 'rgba(168,85,247,0.3)' },
  orange: { bg1: '#1c0f05', bg2: '#7c2d12', accent: '#f97316', text: '#ffffff', light: '#fdba74', glow: 'rgba(249,115,22,0.3)' },
  teal: { bg1: '#0a1f1d', bg2: '#134e4a', accent: '#14b8a6', text: '#ffffff', light: '#5eead4', glow: 'rgba(20,184,166,0.3)' },
};

const DOMAIN_BRANDING: Record<PostDomain, { label: string; color: string }> = {
  insurance: { label: '보험전문 컨설턴트', color: '#3b82f6' },
  policy_fund: { label: '정책자금 전문 컨설턴트', color: '#22c55e' },
  iso_certification: { label: 'ISO인증 전문 컨설턴트', color: '#f97316' },
  corporate_consulting: { label: '법인컨설팅 전문가', color: '#6366f1' },
  smart_factory: { label: '스마트공장 전문 컨설턴트', color: '#14b8a6' },
  disabled_workplace: { label: '장애인고용 전문 컨설턴트', color: '#f43f5e' },
  bizinfo: { label: '기업지원 전문 컨설턴트', color: '#f59e0b' },
};

function drawCard(
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

  const theme = THEMES[card.theme] || THEMES.blue;
  const branding = DOMAIN_BRANDING[domain] || DOMAIN_BRANDING.insurance;

  // === 배경: 멀티톤 그라데이션 ===
  const grad = ctx.createLinearGradient(0, 0, W * 0.3, H);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(0.5, theme.bg2);
  grad.addColorStop(1, theme.bg1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // === 장식: 글로우 오브 ===
  const orbGrad1 = ctx.createRadialGradient(W - 200, 100, 0, W - 200, 100, 300);
  orbGrad1.addColorStop(0, theme.glow);
  orbGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad1;
  ctx.fillRect(0, 0, W, H);

  const orbGrad2 = ctx.createRadialGradient(100, H - 100, 0, 100, H - 100, 250);
  orbGrad2.addColorStop(0, theme.glow);
  orbGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad2;
  ctx.fillRect(0, 0, W, H);

  // === 장식: 미세한 그리드 패턴 ===
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // === 상단: 악센트 그라데이션 바 ===
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, theme.accent);
  topBar.addColorStop(0.5, theme.light);
  topBar.addColorStop(1, theme.accent);
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 5);

  // === 좌측 악센트 라인 ===
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, 5, H);

  // === 카드 번호 뱃지 (원형) ===
  ctx.beginPath();
  ctx.arc(80, 65, 28, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  // 외곽 링
  ctx.beginPath();
  ctx.arc(80, 65, 32, 0, Math.PI * 2);
  ctx.strokeStyle = theme.light;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  // 번호
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${index + 1}`, 80, 66);

  // === 이모지 (우측 상단, 글로우 효과) ===
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  // 이모지 뒤 글로우
  const emojiGlow = ctx.createRadialGradient(W - 90, 60, 0, W - 90, 60, 60);
  emojiGlow.addColorStop(0, theme.glow);
  emojiGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = emojiGlow;
  ctx.fillRect(W - 160, 0, 160, 130);
  // 이모지
  ctx.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillText(card.emoji, W - 50, 30);

  // === 타이틀 ===
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = theme.text;
  ctx.font = 'bold 40px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  const titleY = wrapText(ctx, card.title, 55, 150, W - 180, 50);

  // === 구분선 (그라데이션) ===
  const divY = titleY + 20;
  const divGrad = ctx.createLinearGradient(55, 0, 350, 0);
  divGrad.addColorStop(0, theme.accent);
  divGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = divGrad;
  ctx.fillRect(55, divY, 300, 3);

  // === 서브타이틀 ===
  ctx.fillStyle = theme.light;
  ctx.font = '26px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  const subY = wrapText(ctx, card.subtitle, 55, divY + 35, W - 120, 34);

  // === 본문 (반투명 카드 배경) ===
  const bodyStartY = subY + 15;
  const bodyPadding = 20;
  // 반투명 배경 박스
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  roundRect(ctx, 40, bodyStartY, W - 80, H - bodyStartY - 80, 12);
  ctx.fill();
  // 좌측 악센트
  ctx.fillStyle = theme.accent;
  ctx.fillRect(40, bodyStartY, 4, H - bodyStartY - 80);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '22px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  wrapText(ctx, card.body, 40 + bodyPadding + 10, bodyStartY + bodyPadding + 20, W - 80 - bodyPadding * 2, 32);

  // === 하단 바 ===
  // 그라데이션 배경
  const bottomGrad = ctx.createLinearGradient(0, H - 55, 0, H);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 55, W, 55);
  // 상단 라인
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, H - 55, W, 1);

  // 블로그 제목 (좌측)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '16px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.textAlign = 'left';
  const brandText = blogTitle.length > 45 ? blogTitle.substring(0, 45) + '...' : blogTitle;
  ctx.fillText(brandText, 55, H - 23);

  // 도메인별 브랜딩 (우측)
  ctx.textAlign = 'right';
  ctx.fillStyle = branding.color;
  ctx.font = 'bold 16px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.fillText(branding.label, W - 55, H - 23);
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxWidth: number, lineHeight: number
): number {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (const char of words) {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}

interface Props {
  cards: ImageCard[];
  blogTitle: string;
  domain?: PostDomain;
}

export default function ImageCardRenderer({ cards, blogTitle, domain = 'insurance' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadImage = useCallback(
    (card: ImageCard, index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawCard(canvas, card, blogTitle, index, domain);
      const link = document.createElement('a');
      link.download = `blog-image-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    [blogTitle, domain]
  );

  const downloadAllImages = useCallback(() => {
    cards.forEach((card, i) => {
      setTimeout(() => downloadImage(card, i), i * 300);
    });
  }, [cards, downloadImage]);

  const generateVideo = useCallback(async () => {
    // 영상 생성 전용 canvas (화면에 보이도록)
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

    // 배경 오버레이
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;display:flex;align-items:end;justify-content:center;padding-bottom:40px;';
    overlay.innerHTML = '<p style="color:white;font-size:14px;font-family:sans-serif;">영상 녹화 중... 자동으로 다운로드됩니다</p>';
    document.body.appendChild(overlay);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (canvas as any).captureStream(30);

    // 코덱 지원 확인
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
      // 정리
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

    // Title slide
    drawTitleSlide(ctx, canvas.width, canvas.height, blogTitle, branding);
    await sleep(2500);

    // Each card slide with fade transition
    for (let i = 0; i < cards.length; i++) {
      for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
        ctx.globalAlpha = alpha;
        if (i === 0) {
          drawTitleSlide(ctx, canvas.width, canvas.height, blogTitle, branding);
        } else {
          drawCard(canvas, cards[i - 1], blogTitle, i - 1, domain);
        }
        await sleep(20);
      }
      ctx.globalAlpha = 1;

      for (let alpha = 0; alpha <= 1; alpha += 0.05) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = alpha;
        drawCard(canvas, cards[i], blogTitle, i, domain);
        await sleep(20);
      }
      ctx.globalAlpha = 1;
      drawCard(canvas, cards[i], blogTitle, i, domain);
      await sleep(3000);
    }

    // Outro slide
    for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
      ctx.globalAlpha = alpha;
      drawCard(canvas, cards[cards.length - 1], blogTitle, cards.length - 1, domain);
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
          const theme = THEMES[card.theme] || THEMES.blue;
          return (
            <div
              key={i}
              onClick={() => downloadImage(card, i)}
              className="cursor-pointer group relative rounded-lg overflow-hidden aspect-video"
              style={{ background: `linear-gradient(135deg, ${theme.bg1}, ${theme.bg2})` }}
            >
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: theme.accent, color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-lg">{card.emoji}</span>
                  </div>
                  <p className="text-white text-xs font-bold mt-1.5 leading-tight line-clamp-2">
                    {card.title}
                  </p>
                </div>
                <p className="text-white/60 text-[10px] line-clamp-1">{card.subtitle}</p>
              </div>
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

function drawTitleSlide(
  ctx: CanvasRenderingContext2D, W: number, H: number, title: string,
  branding: { label: string; color: string }
) {
  // 배경
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(0.5, '#1a3a5c');
  grad.addColorStop(1, '#0c1929');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 글로우
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 350);
  glow.addColorStop(0, 'rgba(59,130,246,0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 상단 악센트
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, 'transparent');
  topBar.addColorStop(0.5, branding.color);
  topBar.addColorStop(1, 'transparent');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 4);

  // 타이틀
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  wrapText(ctx, title, W / 2 - 400, H / 2 - 20, 800, 56);

  // 브랜딩
  ctx.fillStyle = branding.color;
  ctx.font = 'bold 24px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.fillText(branding.label, W / 2, H / 2 + 60);
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

  // 글로우
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 300);
  glow.addColorStop(0, 'rgba(59,130,246,0.12)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.fillText('무료 상담 신청하세요', W / 2, H / 2 - 20);

  ctx.fillStyle = branding.color;
  ctx.font = '28px "Segoe UI", "Malgun Gothic", Arial, sans-serif';
  ctx.fillText(`${branding.label}가 1:1로 상담해드립니다`, W / 2, H / 2 + 40);
  ctx.textAlign = 'left';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
