// 네이버 검색광고 API - 키워드도구
// https://naver.github.io/searchad-apidoc/#/operations/GET/~2Fkeywordstool

import crypto from 'crypto';

const SA_API_BASE = 'https://api.searchad.naver.com';

interface SACredentials {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

function getCredentials(): SACredentials {
  const apiKey = process.env.NAVER_SA_API_KEY;
  const secretKey = process.env.NAVER_SA_SECRET_KEY;
  const customerId = process.env.NAVER_SA_CUSTOMER_ID;

  if (!apiKey || !secretKey || !customerId) {
    throw new Error('NAVER_SA_API_KEY / NAVER_SA_SECRET_KEY / NAVER_SA_CUSTOMER_ID가 설정되지 않았습니다.');
  }

  return { apiKey, secretKey, customerId };
}

// HMAC-SHA256 서명 생성
function generateSignature(secretKey: string, timestamp: string, method: string, uri: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

export interface KeywordStat {
  relKeyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  monthlyAvePcClkCnt: number;
  monthlyAveMobileClkCnt: number;
  monthlyAvePcCtr: number;
  monthlyAveMobileCtr: number;
  plAvgDepth: number;
  compIdx: string;
  totalSearchCount: number;
}

// 네이버 API에서 "< 10" 같은 문자열을 숫자로 변환
function parseSearchCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  }
  return 0;
}

// 키워드도구 API 호출 - 단일 키워드의 검색량 조회
// SA API는 hintKeywords에 키워드 1개를 넣으면 해당 키워드 + 연관 키워드를 반환
// 띄어쓰기를 제거해야 정상 동작
async function fetchKeywordStat(keyword: string, cred: SACredentials): Promise<KeywordStat | null> {
  const uri = '/keywordstool';
  const method = 'GET';
  const timestamp = String(Date.now());
  const signature = generateSignature(cred.secretKey, timestamp, method, uri);

  // 띄어쓰기 제거 (SA API는 공백 없이 입력해야 함)
  const cleanKeyword = keyword.replace(/\s+/g, '');

  const params = new URLSearchParams({
    hintKeywords: cleanKeyword,
    showDetail: '1',
  });

  const res = await fetch(`${SA_API_BASE}${uri}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': cred.apiKey,
      'X-Customer': cred.customerId,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const keywordList = data.keywordList || [];

  // 반환된 목록에서 입력 키워드와 가장 일치하는 것 찾기
  // 1순위: 정확히 일치 (공백 제거 후)
  // 2순위: 첫 번째 결과 (가장 관련성 높은 키워드)
  const normalizedInput = cleanKeyword;
  const exactMatch = keywordList.find(
    (item: Record<string, unknown>) =>
      (item.relKeyword as string).replace(/\s+/g, '') === normalizedInput,
  );

  const matched = exactMatch || keywordList[0];
  if (!matched) return null;

  const pcCount = typeof matched.monthlyPcQcCnt === 'number' ? matched.monthlyPcQcCnt : parseSearchCount(matched.monthlyPcQcCnt);
  const mobileCount = typeof matched.monthlyMobileQcCnt === 'number' ? matched.monthlyMobileQcCnt : parseSearchCount(matched.monthlyMobileQcCnt);

  return {
    relKeyword: matched.relKeyword as string,
    monthlyPcQcCnt: pcCount,
    monthlyMobileQcCnt: mobileCount,
    monthlyAvePcClkCnt: Number(matched.monthlyAvePcClkCnt) || 0,
    monthlyAveMobileClkCnt: Number(matched.monthlyAveMobileClkCnt) || 0,
    monthlyAvePcCtr: Number(matched.monthlyAvePcCtr) || 0,
    monthlyAveMobileCtr: Number(matched.monthlyAveMobileCtr) || 0,
    plAvgDepth: Number(matched.plAvgDepth) || 0,
    compIdx: (matched.compIdx as string) || '',
    totalSearchCount: pcCount + mobileCount,
  };
}

// 여러 키워드의 실제 월간 검색량을 조회
// 키워드를 순차적으로 1개씩 조회 (SA API rate limit 방지)
export async function batchGetKeywordStats(keywords: string[]): Promise<Map<string, KeywordStat>> {
  const result = new Map<string, KeywordStat>();
  const cred = getCredentials();

  for (const kw of keywords) {
    try {
      const stat = await fetchKeywordStat(kw, cred);
      if (stat) {
        result.set(kw, stat);
      }
    } catch {
      // 개별 키워드 실패 시 스킵
    }
    // SA API rate limit 방지: 요청 간 200ms 간격
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}
