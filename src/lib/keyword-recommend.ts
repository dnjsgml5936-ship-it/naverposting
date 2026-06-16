import { PostDomain } from '@/types';
import { KeywordEntry, getKeywordsByDomain, getKeywordsByCategory } from './keyword-database';
import { batchGetKeywordStats } from './naver-searchad';

const NAVER_BLOG_SEARCH_API = 'https://openapi.naver.com/v1/search/blog.json';

export interface KeywordScore {
  keyword: string;
  domain: PostDomain;
  category: string;
  monthlySearchCount: number;
  monthlyPcCount: number;
  monthlyMobileCount: number;
  monthlyBlogCount: number;
  compIdx: string;
  opportunityScore: number;
  grade: 'S' | 'A' | 'B' | 'C';
}

// 30일 전 날짜를 yyyymmdd 형식으로 반환
function getThirtyDaysAgoCutoff(): string {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return thirtyDaysAgo.toISOString().slice(0, 10).replace(/-/g, '');
}

// 최근 30일 내 블로그 발행수 조회
// 최신순으로 100개씩 가져오면서 30일 이내 발행된 건수를 카운트
// API 제한: start 최대 1000 → 1000건 초과 시 날짜 기반 추정
async function fetchMonthlyBlogCount(
  keyword: string,
  clientId: string,
  clientSecret: string,
): Promise<number> {
  const cutoff = getThirtyDaysAgoCutoff();
  let totalMonthlyCount = 0;
  let start = 1;
  const display = 100;
  let lastPostdate = '';
  let reachedOlderPosts = false;

  while (start <= 1000) {
    const params = new URLSearchParams({
      query: keyword,
      display: String(display),
      start: String(start),
      sort: 'date',
    });

    const res = await fetch(`${NAVER_BLOG_SEARCH_API}?${params.toString()}`, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!res.ok) return -1;

    const data = await res.json();
    const items: { postdate: string }[] = data.items || [];

    if (items.length === 0) break;

    for (const item of items) {
      if (item.postdate >= cutoff) {
        totalMonthlyCount++;
        lastPostdate = item.postdate;
      } else {
        reachedOlderPosts = true;
        break;
      }
    }

    // 30일보다 오래된 글을 발견하면 더 이상 조회 불필요
    if (reachedOlderPosts) break;

    // 다음 페이지
    start += display;
  }

  // API 제한에 도달했고 모든 결과가 30일 이내인 경우 → 날짜 기반 추정
  if (!reachedOlderPosts && totalMonthlyCount >= 1000 && lastPostdate) {
    const today = new Date();
    const lastDate = new Date(
      `${lastPostdate.slice(0, 4)}-${lastPostdate.slice(4, 6)}-${lastPostdate.slice(6, 8)}`
    );
    const daysCovered = Math.max(1, Math.ceil((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)));
    return Math.round(totalMonthlyCount * 30 / daysCovered);
  }

  return totalMonthlyCount;
}

function calculateOpportunityScore(searchCount: number, blogCount: number): number {
  if (searchCount <= 0) return 0;
  if (blogCount <= 0) return searchCount;
  const score = searchCount / blogCount;
  return Math.round(score * 100) / 100;
}

function getGrade(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 100) return 'S';
  if (score >= 30) return 'A';
  if (score >= 10) return 'B';
  return 'C';
}

export interface RecommendOptions {
  domain?: PostDomain;
  category?: string;
  limit?: number;
}

export async function getKeywordRecommendations(
  options: RecommendOptions = {},
): Promise<KeywordScore[]> {
  const searchClientId = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const searchClientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;

  if (!searchClientId || !searchClientSecret) {
    throw new Error('NAVER_SEARCH_CLIENT_ID가 설정되지 않았습니다.');
  }

  let keywords: KeywordEntry[];
  if (options.domain && options.category) {
    keywords = getKeywordsByCategory(options.domain, options.category);
  } else if (options.domain) {
    keywords = getKeywordsByDomain(options.domain);
  } else {
    const { KEYWORD_DATABASE } = await import('./keyword-database');
    keywords = [...KEYWORD_DATABASE];
  }

  const limit = options.limit || 20;
  const targetKeywords = keywords.slice(0, limit);
  const keywordStrings = targetKeywords.map((k) => k.keyword);

  // 1) SA API로 실제 월간 검색량 조회 (전체 키워드)
  const saStats = await batchGetKeywordStats(keywordStrings);

  // 2) 네이버 검색 API로 월간 블로그 발행수 조회 (3개씩 병렬)
  const results: KeywordScore[] = [];
  const BATCH_SIZE = 3;

  for (let i = 0; i < targetKeywords.length; i += BATCH_SIZE) {
    const batch = targetKeywords.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (entry) => {
        const monthlyBlogCount = await fetchMonthlyBlogCount(entry.keyword, searchClientId, searchClientSecret);
        const stat = saStats.get(entry.keyword);

        const monthlySearchCount = stat?.totalSearchCount || 0;
        const monthlyPcCount = stat?.monthlyPcQcCnt || 0;
        const monthlyMobileCount = stat?.monthlyMobileQcCnt || 0;
        const compIdx = stat?.compIdx || '';

        const blogCount = monthlyBlogCount >= 0 ? monthlyBlogCount : 100;
        const opportunityScore = calculateOpportunityScore(monthlySearchCount, blogCount);

        return {
          keyword: entry.keyword,
          domain: entry.domain,
          category: entry.category,
          monthlySearchCount,
          monthlyPcCount,
          monthlyMobileCount,
          monthlyBlogCount: monthlyBlogCount >= 0 ? monthlyBlogCount : -1,
          compIdx,
          opportunityScore,
          grade: getGrade(opportunityScore),
        };
      }),
    );
    results.push(...batchResults);
  }

  results.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return results;
}
