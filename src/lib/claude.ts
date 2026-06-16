import Anthropic from '@anthropic-ai/sdk';
import { GenerateRequest, GenerateResponse } from '@/types';
import { buildSystemPrompt, buildGeneratePrompt } from './prompts';

// 모델 우선순위: 최신 별칭 → 특정 버전 순서로 폴백
const MODEL_CANDIDATES = [
  'claude-sonnet-4-latest',
  'claude-sonnet-4-20250514',
];

function getModelCandidates(): string[] {
  const envModel = process.env.CLAUDE_MODEL;
  if (envModel) {
    // 환경변수로 지정한 모델을 최우선으로, 나머지는 폴백
    return [envModel, ...MODEL_CANDIDATES.filter(m => m !== envModel)];
  }
  return MODEL_CANDIDATES;
}

async function createMessageWithFallback(
  client: Anthropic,
  params: Omit<Anthropic.MessageCreateParams, 'model' | 'stream'>
): Promise<Anthropic.Message> {
  const models = getModelCandidates();
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      return await client.messages.create({ ...params, model, stream: false });
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // 모델을 찾을 수 없거나 지원하지 않는 경우에만 다음 모델 시도
      // 그 외 오류(인증, 요금 등)는 즉시 throw
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 400) {
        console.warn(`모델 ${model} 사용 불가, 다음 모델로 폴백 시도...`);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error('사용 가능한 모델이 없습니다.');
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

  const message = await createMessageWithFallback(client, {
    max_tokens: 16000,
    system: systemPrompt + '\n\n중요: 반드시 JSON 코드블록(```json ... ```)으로 응답하세요. JSON 외의 텍스트는 출력하지 마세요.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // 1차: ```json ... ``` 블록 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // JSON 블록은 찾았지만 파싱 실패 - 아래로 계속
    }
  }

  // 2차: ``` ... ``` 블록 추출 (json 라벨 없는 경우)
  const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    try {
      return JSON.parse(codeMatch[1]);
    } catch {
      // 계속
    }
  }

  // 3차: { 로 시작하는 JSON 객체 직접 추출
  const braceMatch = text.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      // 계속
    }
  }

  // 4차: 전체 텍스트를 JSON으로 파싱 시도
  try {
    return JSON.parse(text.trim());
  } catch {
    // 마지막: stop_reason이 max_tokens인 경우 (잘린 응답)
    if (message.stop_reason === 'max_tokens') {
      throw new Error('AI 응답이 너무 길어 잘렸습니다. 키워드를 더 구체적으로 입력하거나 다시 시도해주세요.');
    }
    throw new Error('AI 응답에서 JSON을 추출할 수 없습니다. 다시 시도해주세요.');
  }
}
