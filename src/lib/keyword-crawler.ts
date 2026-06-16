// S등급 키워드 백그라운드 크롤러
// 모든 도메인/시드를 순회하며 연관 키워드를 확장하고 S등급을 DB에 저장

import crypto from 'crypto';
import { PostDomain } from '@/types';
import { upsertDiscoveredKeyword } from './db';

const SA_API_BASE = 'https://api.searchad.naver.com';
const NAVER_BLOG_SEARCH_API = 'https://openapi.naver.com/v1/search/blog.json';

// 전체 시드 키워드 맵 (도메인 → 시드 목록)
const ALL_SEEDS: { domain: PostDomain; seed: string }[] = [
  // 보험
  { domain: 'insurance', seed: '종신보험' },
  { domain: 'insurance', seed: '사망보험' },
  { domain: 'insurance', seed: '상속보험' },
  { domain: 'insurance', seed: '연금보험' },
  { domain: 'insurance', seed: '노후연금' },
  { domain: 'insurance', seed: '개인연금' },
  { domain: 'insurance', seed: '변액연금' },
  { domain: 'insurance', seed: '변액보험' },
  { domain: 'insurance', seed: '투자보험' },
  { domain: 'insurance', seed: '건강보험' },
  { domain: 'insurance', seed: '암보험' },
  { domain: 'insurance', seed: '3대질병보험' },
  { domain: 'insurance', seed: '보험설계' },
  { domain: 'insurance', seed: '보험리모델링' },
  { domain: 'insurance', seed: '보험비교' },
  { domain: 'insurance', seed: '실손보험' },
  { domain: 'insurance', seed: '비갱신형보험' },
  { domain: 'insurance', seed: '보험해지' },
  { domain: 'insurance', seed: '보험리모델링' },
  { domain: 'insurance', seed: '달러종신보험' },
  // 정책자금
  { domain: 'policy_fund', seed: '정책자금' },
  { domain: 'policy_fund', seed: '기술보증기금' },
  { domain: 'policy_fund', seed: '신용보증기금' },
  { domain: 'policy_fund', seed: '중진공' },
  { domain: 'policy_fund', seed: '소상공인대출' },
  { domain: 'policy_fund', seed: '지역신보' },
  { domain: 'policy_fund', seed: '창업자금' },
  { domain: 'policy_fund', seed: '중소기업대출' },
  { domain: 'policy_fund', seed: '정부지원대출' },
  { domain: 'policy_fund', seed: '소진공대출' },
  // 기업마당
  { domain: 'bizinfo', seed: '정부지원사업' },
  { domain: 'bizinfo', seed: '창업지원' },
  { domain: 'bizinfo', seed: '고용지원금' },
  { domain: 'bizinfo', seed: '수출바우처' },
  { domain: 'bizinfo', seed: '중소기업지원' },
  { domain: 'bizinfo', seed: '일자리안정자금' },
  { domain: 'bizinfo', seed: '청년창업지원' },
  { domain: 'bizinfo', seed: 'R&D지원사업' },
  { domain: 'bizinfo', seed: '디지털전환지원' },
  // ISO인증
  { domain: 'iso_certification', seed: 'ISO인증' },
  { domain: 'iso_certification', seed: 'ISO9001' },
  { domain: 'iso_certification', seed: 'ISO14001' },
  { domain: 'iso_certification', seed: 'ISO45001' },
  { domain: 'iso_certification', seed: '중대재해처벌법' },
  { domain: 'iso_certification', seed: 'ISO27001' },
  { domain: 'iso_certification', seed: 'ISO22000' },
  { domain: 'iso_certification', seed: 'ISO13485' },
  { domain: 'iso_certification', seed: 'IATF16949' },
  { domain: 'iso_certification', seed: 'ISO인증컨설팅' },
  // 법인컨설팅
  { domain: 'corporate_consulting', seed: '법인설립' },
  { domain: 'corporate_consulting', seed: '법인세절세' },
  { domain: 'corporate_consulting', seed: '법인전환' },
  { domain: 'corporate_consulting', seed: '가지급금' },
  { domain: 'corporate_consulting', seed: '가업승계' },
  { domain: 'corporate_consulting', seed: '법인차량' },
  { domain: 'corporate_consulting', seed: '법인배당' },
  { domain: 'corporate_consulting', seed: '비상장주식' },
  { domain: 'corporate_consulting', seed: '법인부동산' },
  { domain: 'corporate_consulting', seed: '법인청산' },
  { domain: 'corporate_consulting', seed: '법인경비처리' },
  { domain: 'corporate_consulting', seed: '대표이사급여' },
];

// 크롤러 상태
interface CrawlerState {
  running: boolean;
  currentSeed: string;
  currentDomain: string;
  processedSeeds: number;
  totalSeeds: number;
  discoveredTotal: number;
  discoveredS: number;
  startedAt: string | null;
  lastUpdated: string | null;
  errors: string[];
}

const state: CrawlerState = {
  running: false,
  currentSeed: '',
  currentDomain: '',
  processedSeeds: 0,
  totalSeeds: ALL_SEEDS.length,
  discoveredTotal: 0,
  discoveredS: 0,
  startedAt: null,
  lastUpdated: null,
  errors: [],
};

export function getCrawlerStatus(): CrawlerState {
  return { ...state };
}

export function stopCrawler(): void {
  state.running = false;
}

// SA API 호출
async function fetchRelatedKeywords(seedKeyword: string): Promise<
  { keyword: string; pc: number; mobile: number; total: number; compIdx: string }[]
> {
  const apiKey = process.env.NAVER_SA_API_KEY!;
  const secretKey = process.env.NAVER_SA_SECRET_KEY!;
  const customerId = process.env.NAVER_SA_CUSTOMER_ID!;

  const uri = '/keywordstool';
  const timestamp = String(Date.now());
  const sig = crypto.createHmac('sha256', secretKey)
    .update(`${timestamp}.GET.${uri}`).digest('base64');

  const params = new URLSearchParams({
    hintKeywords: seedKeyword.replace(/\s+/g, ''),
    showDetail: '1',
  });

  const res = await fetch(`${SA_API_BASE}${uri}?${params}`, {
    headers: {
      'X-API-KEY': apiKey,
      'X-Customer': customerId,
      'X-Signature': sig,
      'X-Timestamp': timestamp,
    },
  });

  if (!res.ok) throw new Error(`SA API ${res.status}`);

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

// 월간 블로그 발행수
// API 제한(start 최대 1000) 초과 시 날짜 기반 추정
async function fetchMonthlyBlogCount(keyword: string): Promise<number> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return -1;

  const cutoff = getCutoff();
  let count = 0;
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

    if (!res.ok) return count > 0 ? count : -1;

    const data = await res.json();
    const items: { postdate: string }[] = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      if (item.postdate >= cutoff) {
        count++;
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
  if (!reachedOlderPosts && count >= 1000 && lastPostdate) {
    const today = new Date();
    const lastDate = new Date(
      `${lastPostdate.slice(0, 4)}-${lastPostdate.slice(4, 6)}-${lastPostdate.slice(6, 8)}`
    );
    const daysCovered = Math.max(1, Math.ceil((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)));
    return Math.round(count * 30 / daysCovered);
  }

  return count;
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 메인 크롤러: 모든 시드를 순회하며 S등급 키워드를 발굴하여 DB에 저장
export async function startCrawler(): Promise<void> {
  if (state.running) return;

  state.running = true;
  state.processedSeeds = 0;
  state.discoveredTotal = 0;
  state.discoveredS = 0;
  state.startedAt = new Date().toISOString();
  state.errors = [];

  for (const { domain, seed } of ALL_SEEDS) {
    if (!state.running) break;

    state.currentSeed = seed;
    state.currentDomain = domain;
    state.lastUpdated = new Date().toISOString();

    try {
      // 1) SA API로 연관 키워드 가져오기
      const related = await fetchRelatedKeywords(seed);
      await delay(300);

      // 2) 검색량 300 이상인 키워드 필터 (너무 적으면 의미 없음)
      const candidates = related
        .filter((r) => r.total >= 300)
        .sort((a, b) => b.total - a.total)
        .slice(0, 50); // 시드당 상위 50개

      // 3) 각 키워드의 블로그 발행수 확인 + DB 저장
      for (const candidate of candidates) {
        if (!state.running) break;

        const blogCount = await fetchMonthlyBlogCount(candidate.keyword);
        const score = calculateScore(candidate.total, blogCount >= 0 ? blogCount : 100);
        const grade = getGrade(score);

        // DB에 저장 (모든 등급 저장, 나중에 필터)
        upsertDiscoveredKeyword({
          keyword: candidate.keyword,
          domain,
          seedKeyword: seed,
          monthlySearchCount: candidate.total,
          monthlyPcCount: candidate.pc,
          monthlyMobileCount: candidate.mobile,
          monthlyBlogCount: blogCount >= 0 ? blogCount : -1,
          compIdx: candidate.compIdx,
          opportunityScore: score,
          grade,
          discoveredAt: new Date().toISOString(),
        });

        state.discoveredTotal++;
        if (grade === 'S') state.discoveredS++;
        state.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      state.errors.push(`[${seed}] ${msg}`);
    }

    state.processedSeeds++;
    // 시드 간 딜레이
    await delay(500);
  }

  state.running = false;
  state.lastUpdated = new Date().toISOString();
}
