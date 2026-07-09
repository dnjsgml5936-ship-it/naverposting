import Anthropic from '@anthropic-ai/sdk';
import { GenerateRequest, GenerateResponse } from '@/types';
import { buildSystemPrompt, buildGeneratePrompt } from './prompts';

// 캐시된 최신 Sonnet 모델 ID (서버 재시작 시마다 갱신)
let cachedSonnetModel: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1시간

async function getLatestSonnetModel(apiKey: string): Promise<string> {
  // 환경변수로 지정한 모델이 있으면 최우선
  if (process.env.CLAUDE_MODEL) {
    return process.env.CLAUDE_MODEL;
  }

  // 캐시가 유효하면 재사용
  if (cachedSonnetModel && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSonnetModel;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (res.ok) {
      const body = await res.json() as { data: { id: string; created_at: string }[] };
      // sonnet 모델 중 가장 최신 것 선택
      const sonnetModels = body.data
        .filter((m: { id: string }) => m.id.includes('sonnet'))
        .sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sonnetModels.length > 0) {
        cachedSonnetModel = sonnetModels[0].id;
        cacheTimestamp = Date.now();
        console.log(`최신 Sonnet 모델 감지: ${cachedSonnetModel}`);
        return cachedSonnetModel;
      }
    }
  } catch (err) {
    console.warn('모델 목록 조회 실패, 폴백 모델 사용:', err);
  }

  // API 조회 실패 시 폴백
  return 'claude-sonnet-4-6';
}

// 블로그 글 생성 결과를 구조화된 JSON으로 강제하기 위한 Tool 정의
const BLOG_POST_TOOL: Anthropic.Tool = {
  name: 'submit_blog_post',
  description: '작성한 네이버 블로그 글을 구조화된 형식으로 제출합니다. 모든 필드를 반드시 채워야 합니다.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '네이버 검색에 최적화된 블로그 제목 (30자 내외, 키워드 포함)' },
      content: { type: 'string', description: '마크다운 형식의 본문 텍스트 (2,500~4,000자)' },
      htmlContent: { type: 'string', description: '네이버 블로그에 바로 붙여넣을 수 있는 HTML (content의 HTML 버전)' },
      tags: { type: 'array', items: { type: 'string' }, description: '해시태그 (최대 8개)' },
      seoScore: { type: 'number', description: 'SEO 점수 (0~100)' },
      tips: { type: 'array', items: { type: 'string' }, description: 'SEO 개선 팁 목록' },
      imageCards: {
        type: 'array',
        description: '본문에 삽입되는 인포그래픽 카드 (5장)',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '카드 제목 (15~25자)' },
            subtitle: { type: 'string', description: '부제목/보충 설명 (15~30자)' },
            body: { type: 'string', description: '핵심 정보 4~6줄, 줄바꿈(\\n)으로 구분' },
            emoji: { type: 'string', description: '관련 이모지 1개' },
            theme: { type: 'string', enum: ['blue', 'green', 'purple', 'orange', 'teal'] },
            imagePrompt: { type: 'string', description: '영문 이미지 생성 프롬프트' },
            overlayText: { type: 'string', description: '이미지 위 오버레이 핵심 문장 (20~35자)' },
          },
          required: ['title', 'subtitle', 'body', 'emoji', 'theme'],
        },
      },
    },
    required: ['title', 'content', 'htmlContent', 'tags', 'seoScore', 'tips', 'imageCards'],
  },
};

export interface GenerateResult {
  post: GenerateResponse | null;
  error: string | null;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateBlogPost(
  request: GenerateRequest
): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }

  const client = new Anthropic({ apiKey });

  const domain = request.domain || 'insurance';
  const systemPrompt = buildSystemPrompt(domain);
  const userPrompt = buildGeneratePrompt(request);

  const model = await getLatestSonnetModel(apiKey);

  // 구조화 출력(Tool Use)으로 유효한 JSON을 보장 — 텍스트 파싱 실패 원천 제거
  const stream = client.messages.stream({
    model,
    max_tokens: 64000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [BLOG_POST_TOOL],
    tool_choice: { type: 'tool', name: BLOG_POST_TOOL.name },
  });

  const message = await stream.finalMessage();

  // 성공/실패와 무관하게 소비된 토큰을 집계 (API 비용 추적)
  const usage = {
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0,
  };

  // stop_reason 확인 (응답이 잘리면 tool_use 입력 JSON도 불완전해짐)
  if (message.stop_reason === 'max_tokens') {
    return { post: null, error: 'AI 응답이 너무 길어 잘렸습니다. 키워드를 더 구체적으로 입력하거나 다시 시도해주세요.', usage };
  }

  // tool_use 블록에서 이미 파싱된 구조화 결과 추출
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (toolUse && toolUse.input && typeof toolUse.input === 'object') {
    return { post: toolUse.input as GenerateResponse, error: null, usage };
  }

  console.error(
    'tool_use 결과 없음. stop_reason:',
    message.stop_reason,
    '| content types:',
    message.content.map((b) => b.type).join(', ')
  );
  return { post: null, error: 'AI가 구조화된 응답을 반환하지 못했습니다. 다시 시도해주세요.', usage };
}
