// 네이버 데이터랩 검색어트렌드 API
// https://developers.naver.com/docs/serviceapi/datalab/search/search.md

const DATALAB_API_URL = 'https://openapi.naver.com/v1/datalab/search';

interface DatalabKeywordGroup {
  groupName: string;
  keywords: string[];
}

interface DatalabRequestBody {
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  timeUnit: 'date' | 'week' | 'month';
  keywordGroups: DatalabKeywordGroup[];
}

interface DatalabResultItem {
  period: string;
  ratio: number; // 0~100 상대적 검색량
}

interface DatalabResultGroup {
  title: string;
  keywords: string[];
  data: DatalabResultItem[];
}

export interface DatalabResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: DatalabResultGroup[];
}

// 데이터랩 API는 한 번에 최대 5개 키워드 그룹까지 비교 가능
// 각 그룹 내에 최대 20개 키워드를 묶을 수 있음
// ratio는 그룹 간 상대 비교값 (가장 높은 시점 = 100)

export async function fetchSearchTrend(
  keywordGroups: DatalabKeywordGroup[],
  options?: { startDate?: string; endDate?: string; timeUnit?: 'date' | 'week' | 'month' },
): Promise<DatalabResponse> {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID;
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_DATALAB_CLIENT_ID / NAVER_DATALAB_CLIENT_SECRET이 설정되지 않았습니다.');
  }

  // 기본: 최근 12개월, 월간 단위
  const now = new Date();
  const endDate = options?.endDate || now.toISOString().slice(0, 10);
  const startDate = options?.startDate || new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

  const body: DatalabRequestBody = {
    startDate,
    endDate,
    timeUnit: options?.timeUnit || 'month',
    keywordGroups: keywordGroups.slice(0, 5), // API 제한: 최대 5그룹
  };

  const res = await fetch(DATALAB_API_URL, {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`데이터랩 API 오류 (${res.status}): ${errorText}`);
  }

  return res.json();
}

// 키워드 목록에 대해 검색 트렌드 지수를 계산
// 데이터랩은 상대값이므로, 각 키워드의 최근 평균 ratio를 반환
export async function getKeywordTrendScores(
  keywords: string[],
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  if (keywords.length === 0) return scores;

  // 5개씩 묶어서 API 호출 (데이터랩 제한: 최대 5그룹/요청)
  const BATCH_SIZE = 5;
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    const groups: DatalabKeywordGroup[] = batch.map((kw) => ({
      groupName: kw,
      keywords: [kw],
    }));

    try {
      const response = await fetchSearchTrend(groups);

      for (const result of response.results) {
        // 최근 3개월 평균 ratio 계산
        const recentData = result.data.slice(-3);
        const avgRatio = recentData.length > 0
          ? recentData.reduce((sum, d) => sum + d.ratio, 0) / recentData.length
          : 0;
        scores.set(result.title, Math.round(avgRatio * 100) / 100);
      }
    } catch {
      // API 실패 시 해당 배치는 0으로 처리
      batch.forEach((kw) => scores.set(kw, 0));
    }
  }

  return scores;
}
