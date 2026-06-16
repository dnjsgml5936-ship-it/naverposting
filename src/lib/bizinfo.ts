import { GovSupportProgram } from '@/types';

const BIZINFO_API_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';

export interface BizinfoSearchParams {
  keyword?: string;
  category?: string;     // searchLclasId: 01=금융, 02=기술, ...
  region?: string;       // 지역명 (hashtags에 포함)
  hashtags?: string[];   // 추가 해시태그 필터
  pageIndex?: number;
  pageUnit?: number;
}

export const BIZINFO_CATEGORIES: Record<string, string> = {
  '': '전체 분야',
  '01': '금융',
  '02': '기술',
  '03': '인력',
  '04': '수출',
  '05': '내수',
  '06': '창업',
  '07': '경영',
  '09': '기타',
};

export const BIZINFO_REGIONS: Record<string, string> = {
  '': '전체 지역',
  '서울': '서울',
  '부산': '부산',
  '대구': '대구',
  '인천': '인천',
  '광주': '광주',
  '대전': '대전',
  '울산': '울산',
  '세종': '세종',
  '경기': '경기',
  '강원': '강원',
  '충북': '충북',
  '충남': '충남',
  '전북': '전북',
  '전남': '전남',
  '경북': '경북',
  '경남': '경남',
  '제주': '제주',
};

export interface BizinfoResponse {
  items: GovSupportProgram[];
  totalCount: number;
  pageIndex: number;
  pageUnit: number;
}

export async function fetchGovSupportPrograms(
  params: BizinfoSearchParams
): Promise<BizinfoResponse> {
  const apiKey = process.env.BIZINFO_API_KEY;
  if (!apiKey) {
    throw new Error('BIZINFO_API_KEY가 설정되지 않았습니다. .env.local 파일에 기업마당 API 키를 추가하세요.');
  }

  const searchParams = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: 'json',
    pageUnit: String(params.pageUnit || 20),
    pageIndex: String(params.pageIndex || 1),
  });

  if (params.category) {
    searchParams.set('searchLclasId', params.category);
  }

  // hashtags = 지역 + 키워드 + 추가태그 조합
  const hashtagParts: string[] = [];
  if (params.region) hashtagParts.push(params.region);
  if (params.keyword) hashtagParts.push(params.keyword);
  if (params.hashtags) hashtagParts.push(...params.hashtags);
  if (hashtagParts.length > 0) {
    searchParams.set('hashtags', hashtagParts.join(','));
  }

  const url = `${BIZINFO_API_URL}?${searchParams.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`기업마당 API 호출 실패: ${res.status}`);
  }

  const data = await res.json();

  const rawItems = data?.jsonArray || [];
  const items: GovSupportProgram[] = rawItems.map((item: Record<string, string>) => ({
    pblancId: item.pblancId || item.seq || '',
    pblancNm: item.pblancNm || item.title || '',
    jrsdInsttNm: item.jrsdInsttNm || item.author || '',
    reqstBeginEndDe: item.reqstBeginEndDe || item.reqstDt || '',
    pblancUrl: item.pblancUrl || item.link || '',
    bizPrchPttnNm: item.bizPrchPttnNm || item.lcategory || '',
    targetNm: item.trgetNm || '',
    bsnsSumryCn: item.bsnsSumryCn || item.description || '',
  }));

  const totalCount = rawItems.length > 0
    ? parseInt(rawItems[0]?.totCnt || '0', 10)
    : 0;

  return {
    items,
    totalCount,
    pageIndex: params.pageIndex || 1,
    pageUnit: params.pageUnit || 20,
  };
}
