'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  PostDomain,
  DOMAIN_LABELS,
  INSURANCE_CATEGORY_LABELS,
  InsuranceCategory,
  PolicyFundOrg,
  POLICY_FUND_ORG_LABELS,
  POLICY_FUND_TYPES,
  ISO_CERT_TYPES,
  CORP_CONSULTING_CATEGORIES,
} from '@/types';

interface KeywordScore {
  keyword: string;
  domain: PostDomain;
  category?: string;
  monthlySearchCount: number;
  monthlyPcCount: number;
  monthlyMobileCount: number;
  monthlyBlogCount: number;
  compIdx: string;
  opportunityScore: number;
  grade: 'S' | 'A' | 'B' | 'C';
}

type TabMode = 'analyze' | 'discover';

const DOMAIN_OPTIONS_ALL: { value: PostDomain | ''; label: string }[] = [
  { value: '', label: '전체 도메인' },
  { value: 'insurance', label: '보험' },
  { value: 'policy_fund', label: '정책자금' },
  { value: 'iso_certification', label: 'ISO인증' },
  { value: 'corporate_consulting', label: '법인컨설팅' },
  { value: 'smart_factory', label: '스마트공장' },
  { value: 'disabled_workplace', label: '장애인표준사업장' },
  { value: 'bizinfo', label: '기업마당' },
];

const DOMAIN_OPTIONS_REQUIRED: { value: PostDomain; label: string }[] = [
  { value: 'insurance', label: '보험' },
  { value: 'policy_fund', label: '정책자금' },
  { value: 'iso_certification', label: 'ISO인증' },
  { value: 'corporate_consulting', label: '법인컨설팅' },
  { value: 'smart_factory', label: '스마트공장' },
  { value: 'disabled_workplace', label: '장애인표준사업장' },
  { value: 'bizinfo', label: '기업마당' },
];

function getGradeStyle(grade: string): string {
  switch (grade) {
    case 'S': return 'bg-red-100 text-red-700 border-red-200';
    case 'A': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'C': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getDomainColor(domain: PostDomain): string {
  switch (domain) {
    case 'insurance': return 'bg-blue-100 text-blue-700';
    case 'policy_fund': return 'bg-emerald-100 text-emerald-700';
    case 'iso_certification': return 'bg-orange-100 text-orange-700';
    case 'corporate_consulting': return 'bg-indigo-100 text-indigo-700';
    case 'smart_factory': return 'bg-teal-100 text-teal-700';
    case 'disabled_workplace': return 'bg-rose-100 text-rose-700';
    case 'bizinfo': return 'bg-amber-100 text-amber-700';
  }
}

function getCompIdxStyle(compIdx: string): string {
  switch (compIdx) {
    case '높음': return 'text-red-600';
    case '중간': return 'text-yellow-600';
    case '낮음': return 'text-green-600';
    default: return 'text-gray-400';
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function getInsuranceCategoryOptions(): { value: string; label: string }[] {
  return Object.entries(INSURANCE_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }));
}

function getCategoryOptions(domain: PostDomain): { value: string; label: string }[] {
  switch (domain) {
    case 'insurance':
      return getInsuranceCategoryOptions();
    case 'policy_fund': {
      const options: { value: string; label: string }[] = [];
      (Object.keys(POLICY_FUND_ORG_LABELS) as PolicyFundOrg[]).forEach((org) => {
        POLICY_FUND_TYPES[org].forEach((f) => {
          options.push({ value: f.key, label: `${POLICY_FUND_ORG_LABELS[org]} - ${f.label}` });
        });
      });
      return options;
    }
    case 'iso_certification':
      return ISO_CERT_TYPES.map((t) => ({ value: t.key, label: `${t.label} ${t.fullName}` }));
    case 'corporate_consulting': {
      const options: { value: string; label: string }[] = [];
      CORP_CONSULTING_CATEGORIES.forEach((cat) => {
        cat.topics.forEach((t) => {
          options.push({ value: t.key, label: `${cat.label} - ${t.label}` });
        });
      });
      return options;
    }
    default:
      return [];
  }
}

// 키워드 테이블 (공통 컴포넌트)
function KeywordTable({ keywords, description }: { keywords: KeywordScore[]; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <h2 className="font-semibold">키워드 분석 결과</h2>
        <p className="text-xs text-[var(--muted)] mt-1">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">등급</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">키워드</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">도메인</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">월간 검색량</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">PC</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">모바일</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">월간 블로그 발행</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">광고경쟁</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">기회점수</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase">액션</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, idx) => (
              <tr key={idx} className="border-b border-[var(--border)] hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getGradeStyle(kw.grade)}`}>
                    {kw.grade}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium">{kw.keyword}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(kw.domain)}`}>
                    {DOMAIN_LABELS[kw.domain]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-sm font-bold">
                    {kw.monthlySearchCount > 0 ? formatNumber(kw.monthlySearchCount) : '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs text-[var(--muted)]">
                    {kw.monthlyPcCount > 0 ? formatNumber(kw.monthlyPcCount) : '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs text-[var(--muted)]">
                    {kw.monthlyMobileCount > 0 ? formatNumber(kw.monthlyMobileCount) : '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {kw.monthlyBlogCount >= 0 ? (
                    <span className={`text-sm font-medium ${kw.monthlyBlogCount < 10 ? 'text-green-600' : kw.monthlyBlogCount < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatNumber(kw.monthlyBlogCount)}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`text-xs font-medium ${getCompIdxStyle(kw.compIdx)}`}>
                    {kw.compIdx || '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-sm font-bold">{kw.opportunityScore.toFixed(1)}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Link
                    href={`/posts/new?domain=${kw.domain}&keyword=${encodeURIComponent(kw.keyword)}`}
                    className="inline-block px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    글 작성
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 등급 서머리 (공통)
function GradeSummary({ keywords }: { keywords: KeywordScore[] }) {
  const s = keywords.filter((k) => k.grade === 'S').length;
  const a = keywords.filter((k) => k.grade === 'A').length;
  const b = keywords.filter((k) => k.grade === 'B').length;
  const c = keywords.filter((k) => k.grade === 'C').length;

  const grades = [
    { grade: 'S', label: '최고 기회', count: s, color: 'text-red-600' },
    { grade: 'A', label: '높은 기회', count: a, color: 'text-orange-600' },
    { grade: 'B', label: '보통', count: b, color: 'text-blue-600' },
    { grade: 'C', label: '경쟁 높음', count: c, color: 'text-gray-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {grades.map((g) => (
        <div key={g.grade} className="bg-white rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getGradeStyle(g.grade)}`}>{g.grade}</span>
            <span className="text-xs text-[var(--muted)]">{g.label}</span>
          </div>
          <p className={`text-2xl font-bold ${g.color}`}>{g.count}</p>
        </div>
      ))}
    </div>
  );
}

export default function KeywordsPage() {
  const [tab, setTab] = useState<TabMode>('analyze');
  const [domain, setDomain] = useState<PostDomain | ''>('');
  const [discoverDomain, setDiscoverDomain] = useState<PostDomain>('insurance');
  const [discoverCategory, setDiscoverCategory] = useState('');
  const [minSearchCount, setMinSearchCount] = useState(500);
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState<KeywordScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const categoryOptions = domain ? getCategoryOptions(domain) : [];
  const discoverCategoryOptions = getCategoryOptions(discoverDomain);

  // 기존 분석
  async function handleAnalyze() {
    setLoading(true);
    setError('');
    setKeywords([]);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (domain) params.set('domain', domain);
      if (category) params.set('category', category);
      params.set('limit', '25');
      const res = await fetch(`/api/keywords?${params}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setKeywords(data.items || []);
    } catch {
      setError('키워드 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // S등급 발굴
  async function handleDiscover() {
    setLoading(true);
    setError('');
    setKeywords([]);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      params.set('domain', discoverDomain);
      if (discoverCategory) params.set('category', discoverCategory);
      params.set('minSearchCount', String(minSearchCount));
      params.set('topN', '20');
      const res = await fetch(`/api/keywords/discover?${params}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setKeywords(data.items || []);
    } catch {
      setError('키워드 발굴 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(newTab: TabMode) {
    setTab(newTab);
    setKeywords([]);
    setSearched(false);
    setError('');
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">키워드 추천</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          네이버 검색광고 API 실제 검색량 + 블로그 발행수 기반 블루오션 키워드 분석
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleTabChange('analyze')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'analyze' ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          키워드 분석
        </button>
        <button
          onClick={() => handleTabChange('discover')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'discover' ? 'bg-white text-red-600 shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          S등급 발굴
        </button>
      </div>

      {/* Analyze Tab Filters */}
      {tab === 'analyze' && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">도메인</label>
              <select
                value={domain}
                onChange={(e) => { setDomain(e.target.value as PostDomain | ''); setCategory(''); }}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {DOMAIN_OPTIONS_ALL.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {domain && domain !== 'bizinfo' && categoryOptions.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">세부 카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">전체</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? '분석 중...' : '키워드 분석'}
            </button>
          </div>
        </div>
      )}

      {/* Discover Tab Filters */}
      {tab === 'discover' && (
        <div className="bg-white rounded-xl border border-red-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getGradeStyle('S')}`}>S</span>
            <p className="text-sm font-medium">네이버 연관 키워드를 자동 확장하여 블루오션 키워드를 발굴합니다</p>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">도메인 (필수)</label>
              <select
                value={discoverDomain}
                onChange={(e) => { setDiscoverDomain(e.target.value as PostDomain); setDiscoverCategory(''); }}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              >
                {DOMAIN_OPTIONS_REQUIRED.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {discoverDomain !== 'bizinfo' && discoverCategoryOptions.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">세부 카테고리</label>
                <select
                  value={discoverCategory}
                  onChange={(e) => setDiscoverCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {discoverCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-40">
              <label className="block text-sm font-medium mb-2">최소 검색량</label>
              <select
                value={minSearchCount}
                onChange={(e) => setMinSearchCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              >
                <option value={100}>100+</option>
                <option value={300}>300+</option>
                <option value={500}>500+</option>
                <option value={1000}>1,000+</option>
                <option value={3000}>3,000+</option>
                <option value={5000}>5,000+</option>
              </select>
            </div>
            <button
              onClick={handleDiscover}
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? '발굴 중...' : 'S등급 발굴'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
          {tab === 'analyze' ? (
            <>
              <p className="text-[var(--muted)] text-sm">네이버 검색광고 API + 블로그 데이터를 분석하고 있습니다...</p>
              <p className="text-[var(--muted)] text-xs mt-1">키워드별 검색량 + 최근 30일 블로그 발행수를 조회 중입니다 (약 30~60초)</p>
            </>
          ) : (
            <>
              <p className="text-[var(--muted)] text-sm">연관 키워드를 확장하고 블루오션을 발굴하고 있습니다...</p>
              <p className="text-[var(--muted)] text-xs mt-1">시드 키워드에서 수백 개의 연관 키워드를 분석 중입니다 (약 40~90초)</p>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && searched && keywords.length > 0 && (
        <>
          <GradeSummary keywords={keywords} />
          <KeywordTable
            keywords={keywords}
            description={
              tab === 'analyze'
                ? '월간 검색량 = 네이버 검색광고 API (PC+모바일) | 월간 블로그 발행 = 최근 30일 내 신규 블로그 포스트 수'
                : '네이버 연관 키워드에서 자동 발굴 | 검색량 높고 블로그 발행 적은 키워드만 선별'
            }
          />

          {/* Tips */}
          <div className={`${tab === 'discover' ? 'bg-red-50' : 'bg-blue-50'} rounded-xl p-6 mt-6`}>
            <h3 className={`font-semibold text-sm ${tab === 'discover' ? 'text-red-800' : 'text-blue-800'} mb-3`}>
              {tab === 'discover' ? 'S등급 발굴 결과 활용법' : '키워드 선점 전략 팁'}
            </h3>
            <ul className={`space-y-2 text-xs ${tab === 'discover' ? 'text-red-700' : 'text-blue-700'}`}>
              {tab === 'discover' ? (
                <>
                  <li>발굴된 키워드는 네이버 연관 키워드에서 자동으로 확장된 것으로, 기존 DB에 없던 새로운 기회입니다</li>
                  <li>기회점수가 높은 키워드부터 빠르게 글을 작성하여 선점하세요</li>
                  <li>같은 도메인의 다른 카테고리도 발굴해보면 더 많은 기회를 찾을 수 있습니다</li>
                  <li>최소 검색량을 낮추면 더 니치한 키워드도 발견할 수 있습니다</li>
                </>
              ) : (
                <>
                  <li>S등급: 월간 검색량 대비 월간 블로그 발행이 매우 적어 빠르게 상위노출 가능</li>
                  <li>월간 블로그 발행 10건 미만 + 월간 검색량 1,000회 이상이면 최적의 선점 키워드</li>
                  <li>광고경쟁 &quot;낮음&quot;인 키워드는 광고주도 적어 자연 검색에서 유리합니다</li>
                  <li>모든 데이터는 네이버 공식 API에서 실시간으로 가져온 실제 수치입니다</li>
                </>
              )}
            </ul>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && searched && keywords.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <p className="text-[var(--muted)]">해당 조건에 맞는 키워드가 없습니다.</p>
          {tab === 'discover' && (
            <p className="text-[var(--muted)] text-xs mt-2">최소 검색량을 낮춰보세요.</p>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searched && !loading && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="text-4xl mb-4">{tab === 'discover' ? '🏆' : '🔍'}</div>
          <h3 className="font-semibold text-lg mb-2">
            {tab === 'discover' ? 'S등급 키워드를 발굴하세요' : '블루오션 키워드를 찾아보세요'}
          </h3>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
            {tab === 'discover'
              ? '도메인을 선택하면 네이버 연관 키워드를 자동으로 확장하여 검색량은 높지만 블로그 경쟁이 적은 S등급 키워드를 발굴합니다.'
              : '도메인을 선택하고 "키워드 분석" 버튼을 누르면 네이버 검색광고 API의 실제 검색량과 블로그 발행수를 비교하여 선점 가능한 키워드를 추천해드립니다.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
