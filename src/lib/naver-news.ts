import { NaverNewsItem } from '@/types';

const NAVER_SEARCH_API = 'https://openapi.naver.com/v1/search/news.json';

export interface NaverNewsSearchParams {
  query: string;
  display?: number;  // 결과 개수 (기본 10, 최대 100)
  sort?: 'sim' | 'date';  // sim=관련도순, date=최신순
}

export interface NaverNewsResponse {
  items: NaverNewsItem[];
  total: number;
}

export async function searchNaverNews(
  params: NaverNewsSearchParams
): Promise<NaverNewsResponse> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    display: String(params.display || 10),
    sort: params.sort || 'date',
  });

  const res = await fetch(`${NAVER_SEARCH_API}?${searchParams.toString()}`, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  });

  if (!res.ok) {
    throw new Error(`네이버 뉴스 API 호출 실패: ${res.status}`);
  }

  const data = await res.json();

  const items: NaverNewsItem[] = (data.items || []).map((item: Record<string, string>) => ({
    title: item.title?.replace(/<[^>]*>/g, '') || '',
    link: item.link || '',
    description: item.description?.replace(/<[^>]*>/g, '') || '',
    pubDate: item.pubDate || '',
  }));

  return {
    items,
    total: data.total || 0,
  };
}
