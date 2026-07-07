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

export async function generateBlogPost(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }

  const client = new Anthropic({ apiKey });

  const domain = request.domain || 'insurance';
  const systemPrompt = buildSystemPrompt(domain);
  const userPrompt = buildGeneratePrompt(request);

  const model = await getLatestSonnetModel(apiKey);

  const message = await client.messages.create({
    model,
    max_tokens: 64000,
    stream: false,
    system: systemPrompt + '\n\n중요: 반드시 순수 JSON으로만 응답하세요. 코드블록(```)이나 마크다운 없이 { 로 시작하고 } 로 끝나는 JSON만 출력하세요.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // stop_reason 확인 (잘린 응답)
  if (message.stop_reason === 'max_tokens') {
    throw new Error('AI 응답이 너무 길어 잘렸습니다. 키워드를 더 구체적으로 입력하거나 다시 시도해주세요.');
  }

  // JSON 추출 시도 함수
  const tryParse = (str: string): GenerateResponse | null => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // 1차: 전체 텍스트를 JSON으로 파싱
  const directParse = tryParse(text.trim());
  if (directParse) return directParse;

  // 2차: ```json ... ``` 블록 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const parsed = tryParse(jsonMatch[1]);
    if (parsed) return parsed;
  }

  // 3차: ``` ... ``` 블록 추출 (json 라벨 없는 경우)
  const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    const parsed = tryParse(codeMatch[1]);
    if (parsed) return parsed;
  }

  // 4차: 첫 번째 { 부터 마지막 } 까지 추출
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const parsed = tryParse(text.slice(firstBrace, lastBrace + 1));
    if (parsed) return parsed;
  }

  // 5차: 이스케이프 문제 수정 후 재시도
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const raw = text.slice(firstBrace, lastBrace + 1);
    // content 필드 내부의 줄바꿈/탭 이스케이프 처리
    const fixed = raw.replace(/(?<=:\s*")([\s\S]*?)(?="(?:\s*[,}]))/g, (match) =>
      match.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
    );
    const parsed = tryParse(fixed);
    if (parsed) return parsed;
  }

  console.error('JSON 추출 실패. AI 원본 응답:', text.substring(0, 500));
  throw new Error('AI 응답에서 JSON을 추출할 수 없습니다. 다시 시도해주세요.');
}
