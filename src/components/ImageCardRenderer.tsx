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
  real_estate: { label: '부동산 전문 컨설턴트', color: '#10b981' },
};

const SIZE = 1080; // 1:1 정사각형

// Pollinations.ai 무료 AI 이미지 생성 URL (1:1 비율)
function getAiImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${SIZE}&height=${SIZE}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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

// === 핵심 드로잉: AI 이미지 + 가운데 텍스트만 ===
async function drawCardWithAiImage(
  canvas: HTMLCanvasElement,
  card: ImageCard,
): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const overlayText = card.overlayText || card.title;

  // 1) AI 배경 이미지 (원본 비율 그대로, 1:1로 요청)
  let bgLoaded = false;
  if (card.imagePrompt) {
    try {
      const img = await loadCachedImage(card.imagePrompt);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      bgLoaded = true;
    } catch {
      // 폴백
    }
  }

  if (!bgLoaded) {
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // 2) 텍스트 영역 반투명 오버레이 (가운데 밴드)
  const bandY = SIZE * 0.35;
  const bandH = SIZE * 0.30;
  const bandGrad = ctx.createLinearGradient(0, bandY - 40, 0, bandY + bandH + 40);
  bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bandGrad.addColorStop(0.12, 'rgba(0,0,0,0.5)');
  bandGrad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
  bandGrad.addColorStop(0.88, 'rgba(0,0,0,0.5)');
  bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY - 40, SIZE, bandH + 80);

  // 3) 가운데 텍스트
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = calculateFontSize(ctx, overlayText, SIZE - 140, 52, 34);
  ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif`;

  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const lines = wrapTextCenter(ctx, overlayText, SIZE - 140);
  const lineHeight = fontSize * 1.4;
  const totalH = lines.length * lineHeight;
  const startY = SIZE / 2 - totalH / 2 + lineHeight / 2;

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], SIZE / 2, startY + i * lineHeight);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// 폴백 (이미지 없이)
function drawCardFallback(
  canvas: HTMLCanvasElement,
  card: ImageCard,
) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const overlayText = card.overlayText || card.title;

  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = calculateFontSize(ctx, overlayText, SIZE - 140, 52, 34);
  ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif`;

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  const lines = wrapTextCenter(ctx, overlayText, SIZE - 140);
  const lineHeight = fontSize * 1.4;
  const totalH = lines.length * lineHeight;
  const startY = SIZE / 2 - totalH / 2 + lineHeight / 2;

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], SIZE / 2, startY + i * lineHeight);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === 타이틀/아웃로 슬라이드 (영상용) ===
function drawTitleSlide(
  ctx: CanvasRenderingContext2D, S: number, title: string,
  branding: { label: string; color: string }
) {
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(0.5, '#1a3a5c');
  grad.addColorStop(1, '#0c1929');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  const glow = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, 350);
  glow.addColorStop(0, 'rgba(59,130,246,0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapTextCenter(ctx, title, S - 160);
  const lineHeight = 56;
  const startY = S / 2 - 30 - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], S / 2, startY + i * lineHeight);
  }

  ctx.fillStyle = branding.color;
  ctx.font = 'bold 24px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(branding.label, S / 2, startY + lines.length * lineHeight + 30);
  ctx.textAlign = 'left';
}

function drawOutroSlide(
  ctx: CanvasRenderingContext2D, S: number,
  branding: { label: string; color: string }
) {
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(1, '#1a3a5c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText('무료 상담 신청하세요', S / 2, S / 2 - 20);

  ctx.fillStyle = branding.color;
  ctx.font = '28px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(`${branding.label}가 1:1로 상담해드립니다`, S / 2, S / 2 + 40);
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

  useEffect(() => {
    if (!cards.length) return;

    setLoadingStates(cards.map(() => true));
    setPreviews(cards.map(() => ''));

    cards.forEach(async (card, i) => {
      const offscreen = document.createElement('canvas');
      try {
        await drawCardWithAiImage(offscreen, card);
      } catch {
        drawCardFallback(offscreen, card);
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
        await drawCardWithAiImage(canvas, card);
      } catch {
        drawCardFallback(canvas, card);
      }
      const link = document.createElement('a');
      link.download = `blog-image-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    []
  );

  const downloadAllImages = useCallback(async () => {
    for (let i = 0; i < cards.length; i++) {
      await downloadImage(cards[i], i);
      await sleep(500);
    }
  }, [cards, downloadImage]);

  const generateVideo = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.style.position = 'fixed';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%) scale(0.45)';
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
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

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

    drawTitleSlide(ctx, SIZE, blogTitle, branding);
    await sleep(2500);

    for (let i = 0; i < cards.length; i++) {
      for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
        ctx.globalAlpha = alpha;
        if (i === 0) drawTitleSlide(ctx, SIZE, blogTitle, branding);
        else drawCardFallback(canvas, cards[i - 1]);
        await sleep(20);
      }
      ctx.globalAlpha = 1;

      try {
        await drawCardWithAiImage(canvas, cards[i]);
      } catch {
        drawCardFallback(canvas, cards[i]);
      }
      await sleep(3000);
    }

    for (let alpha = 1; alpha >= 0; alpha -= 0.05) {
      ctx.globalAlpha = alpha;
      drawCardFallback(canvas, cards[cards.length - 1]);
      await sleep(20);
    }
    ctx.globalAlpha = 1;
    drawOutroSlide(ctx, SIZE, branding);
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
          const isLoading = loadingStates[i];
          const preview = previews[i];

          return (
            <div
              key={i}
              onClick={() => downloadImage(card, i)}
              className="cursor-pointer group relative rounded-lg overflow-hidden aspect-square"
              style={{ background: '#0f172a' }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white/50 text-[10px]">AI 이미지 생성 중...</span>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt={card.overlayText || card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-3">
                  <p className="text-white text-xs font-bold text-center leading-tight line-clamp-3">
                    {card.overlayText || card.title}
                  </p>
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
