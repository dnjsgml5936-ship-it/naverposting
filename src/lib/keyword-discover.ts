// S등급 키워드 자동 발굴
// SA API의 연관 키워드 확장 → 검색량 필터 → 블로그 발행수 확인 → S등급 발굴

import crypto from 'crypto';
import { PostDomain } from '@/types';

const SA_API_BASE = 'https://api.searchad.naver.com';
const NAVER_BLOG_SEARCH_API = 'https://openapi.naver.com/v1/search/blog.json';

// 카테고리별 시드 키워드
const SEED_KEYWORDS: Record<PostDomain, Record<string, string[]>> = {
  insurance: {
    whole_life: ['종신보험', '사망보험', '상속보험'],
    pension: ['연금보험', '노후연금', '개인연금'],
    variable_annuity: ['변액연금', '변액보험', '투자보험'],
    health_special: ['건강보험', '암보험', '3대질병보험'],
    general: ['보험설계', '보험리모델링', '보험비교'],
  },
  policy_fund: {
    _all: ['정책자금', '기술보증기금', '신용보증기금', '중진공', '소상공인대출', '지역신보'],
  },
  iso_certification: {
    _all: ['ISO인증', 'ISO9001', 'ISO14001', 'ISO45001', '중대재해처벌법'],
  },
  corporate_consulting: {
    _all: ['법인설립', '법인세절세', '법인전환', '가지급금', '가업승계', '법인차량'],
  },
  smart_factory: {
    _all: ['스마트공장', '스마트공장지원사업', 'MES도입', '제조로봇', '공장자동화', '스마트제조'],
  },
  disabled_workplace: {
    _all: ['장애인표준사업장', '장애인의무고용', '장애인고용장려금', '장애인고용부담금', '장애인고용공단'],
  },
  bizinfo: {
    _all: ['기업마당', '중소기업지원사업', '정부지원금', '정책자금대출', '창업지원사업', '고용지원금'],
  },
};

export interface DiscoveredKeyword {
  keyword: string;
  domain: PostDomain;
  monthlySearchCount: number;
  monthlyPcCount: number;
  monthlyMobileCount: number;
  monthlyBlogCount: number;
  compIdx: string;
  opportunityScore: number;
  grade: 'S' | 'A' | 'B' | 'C';
}

function getSACredentials() {
  const apiKey = process.env.NAVER_SA_API_KEY;
  const secretKey = process.env.NAVER_SA_SECRET_KEY;
  const customerId = process.env.NAVER_SA_CUSTOMER_ID;
  if (!apiKey || !secretKey || !customerId) {
    throw new Error('SA API 키가 설정되지 않았습니다.');
  }
  return { apiKey, secretKey, customerId };
}

function getSearchCredentials() {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('NAVER_SEARCH_CLIENT_ID가 설정되지 않았습니다.');
  }
  return { clientId, clientSecret };
}

// SA API로 연관 키워드 + 검색량 조회
async function fetchRelatedKeywords(
  seedKeyword: string,
): Promise<{ keyword: string; pc: number; mobile: number; total: number; compIdx: string }[]> {
  const cred = getSACredentials();
  const uri = '/keywordstool';
  const timestamp = String(Date.now());
  const sig = crypto.createHmac('sha256', cred.secretKey)
    .update(`${timestamp}.GET.${uri}`).digest('base64');

  const params = new URLSearchParams({
    hintKeywords: seedKeyword.replace(/\s+/g, ''),
    showDetail: '1',
  });

  const res = await fetch(`${SA_API_BASE}${uri}?${params}`, {
    headers: {
      'X-API-KEY': cred.apiKey,
      'X-Customer': cred.customerId,
      'X-Signature': sig,
      'X-Timestamp': timestamp,
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.keywordList || []).map((item: Record<string, unknown>) => {
    const pc = typeof item.monthlyPcQcCnt === 'number' ? item.monthlyPcQcCnt : 0;
    const mobile = typeof item.monthlyMobileQcCnt === 'number' ? item.monthlyMobileQcCnt : 0;
    return {
      keyword: item.relKeyword as string,
      pc,
      mobile,
      total: pc + mobile,
      compIdx: (item.compIdx as string) || '',
    };
  });
}

// 최근 30일 블로그 발행수 조회
// 100건씩 페이지네이션하며 30일 이내 글을 카운트
// API 제한(start 최대 1000) 초과 시 날짜 기반 추정
async function fetchMonthlyBlogCountFast(
  keyword: string,
  clientId: string,
  clientSecret: string,
): Promise<number> {
  const cutoff = getCutoff();
  let totalCount = 0;
  let start = 1;
  let lastPostdate = '';
  let reachedOlderPosts = false;

  while (start <= 1000) {
    const params = new URLSearchParams({
      query: keyword,
      display: '100',
      start: String(start),
      sort: 'date',
    });

    const res = await fetch(`${NAVER_BLOG_SEARCH_API}?${params}`, {
      headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
    });

    if (!res.ok) return totalCount > 0 ? totalCount : -1;

    const data = await res.json();
    const items: { postdate: string }[] = data.items || [];

    if (items.length === 0) break;

    for (const item of items) {
      if (item.postdate >= cutoff) {
        totalCount++;
        lastPostdate = item.postdate;
      } else {
        reachedOlderPosts = true;
        break;
      }
    }

    if (reachedOlderPosts || items.length < 100) break;
    start += 100;
  }

  // API 제한에 도달했고 모든 결과가 30일 이내인 경우 → 날짜 기반 추정
  if (!reachedOlderPosts && totalCount >= 1000 && lastPostdate) {
    const today = new Date();
    const lastDate = new Date(
      `${lastPostdate.slice(0, 4)}-${lastPostdate.slice(4, 6)}-${lastPostdate.slice(6, 8)}`
    );
    const daysCovered = Math.max(1, Math.ceil((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)));
    return Math.round(totalCount * 30 / daysCovered);
  }

  return totalCount;
}

function getCutoff(): string {
  const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function calculateScore(searchCount: number, blogCount: number): number {
  if (searchCount <= 0) return 0;
  if (blogCount <= 0) return searchCount;
  return Math.round((searchCount / blogCount) * 100) / 100;
}

function getGrade(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 100) return 'S';
  if (score >= 30) return 'A';
  if (score >= 10) return 'B';
  return 'C';
}

export interface DiscoverOptions {
  domain: PostDomain;
  category?: string;
  minSearchCount?: number;
  topN?: number;
}

export async function discoverKeywords(options: DiscoverOptions): Promise<DiscoveredKeyword[]> {
  const { domain, category, minSearchCount = 500, topN = 20 } = options;
  const searchCred = getSearchCredentials();

  // 1) 시드 키워드 결정
  const domainSeeds = SEED_KEYWORDS[domain];
  let seeds: string[];
  if (category && domainSeeds[category]) {
    seeds = domainSeeds[category];
  } else {
    seeds = domainSeeds._all || Object.values(domainSeeds).flat();
  }

  // 2) SA API로 연관 키워드 수집 (시드별로 순차 호출)
  const allRelated = new Map<string, { pc: number; mobile: number; total: number; compIdx: string }>();

  for (const seed of seeds) {
    const related = await fetchRelatedKeywords(seed);
    for (const item of related) {
      const existing = allRelated.get(item.keyword);
      if (!existing || item.total > existing.total) {
        allRelated.set(item.keyword, { pc: item.pc, mobile: item.mobile, total: item.total, compIdx: item.compIdx });
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  // 3) 최소 검색량 필터 + 검색량 높은 순 정렬
  const candidates = Array.from(allRelated.entries())
    .filter(([, v]) => v.total >= minSearchCount)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, topN);

  // 4) 블로그 발행수 확인 (1개씩 순차, rate limit 방지)
  const results: DiscoveredKeyword[] = [];

  for (const [keyword, stats] of candidates) {
    const blogCount = await fetchMonthlyBlogCountFast(keyword, searchCred.clientId, searchCred.clientSecret);
    const score = calculateScore(stats.total, blogCount >= 0 ? blogCount : 100);
    results.push({
      keyword,
      domain,
      monthlySearchCount: stats.total,
      monthlyPcCount: stats.pc,
      monthlyMobileCount: stats.mobile,
      monthlyBlogCount: blogCount >= 0 ? blogCount : -1,
      compIdx: stats.compIdx,
      opportunityScore: score,
      grade: getGrade(score),
    });
  }

  results.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return results;
}
