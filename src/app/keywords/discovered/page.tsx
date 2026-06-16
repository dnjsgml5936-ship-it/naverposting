'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PostDomain, DOMAIN_LABELS } from '@/types';

interface CrawlerStatus {
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

interface Stats {
  total: number;
  s: number;
  a: number;
  b: number;
  c: number;
  byDomain: Record<string, number>;
}

interface DiscoveredKeyword {
  id: number;
  keyword: string;
  domain: PostDomain;
  seedKeyword: string;
  monthlySearchCount: number;
  monthlyPcCount: number;
  monthlyMobileCount: number;
  monthlyBlogCount: number;
  compIdx: string;
  opportunityScore: number;
  grade: string;
  discoveredAt: string;
}

function getGradeStyle(grade: string): string {
  switch (grade) {
    case 'S': return 'bg-red-100 text-red-700 border-red-200';
    case 'A': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'C': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getDomainColor(domain: string): string {
  switch (domain) {
    case 'insurance': return 'bg-blue-100 text-blue-700';
    case 'policy_fund': return 'bg-emerald-100 text-emerald-700';
    case 'iso_certification': return 'bg-orange-100 text-orange-700';
    case 'corporate_consulting': return 'bg-indigo-100 text-indigo-700';
    case 'smart_factory': return 'bg-teal-100 text-teal-700';
    case 'disabled_workplace': return 'bg-rose-100 text-rose-700';
    case 'bizinfo': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
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

export default function DiscoveredPage() {
  const [status, setStatus] = useState<CrawlerStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keywords, setKeywords] = useState<DiscoveredKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterGrade, setFilterGrade] = useState('S');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords/crawler?action=status');
      const data = await res.json();
      setStatus(data.status);
      setStats(data.stats);
    } catch { /* ignore */ }
  }, []);

  const fetchKeywords = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterDomain) params.set('domain', filterDomain);
    if (filterGrade) params.set('grade', filterGrade);
    params.set('limit', String(limit));
    params.set('offset', String(page * limit));
    try {
      const res = await fetch(`/api/keywords/crawler?${params}`);
      const data = await res.json();
      setKeywords(data.items || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
  }, [filterDomain, filterGrade, page]);

  useEffect(() => {
    fetchStatus();
    fetchKeywords();
  }, [fetchStatus, fetchKeywords]);

  // 크롤러가 실행 중이면 5초마다 상태 갱신
  useEffect(() => {
    if (!status?.running) return;
    const interval = setInterval(() => {
      fetchStatus();
      fetchKeywords();
    }, 5000);
    return () => clearInterval(interval);
  }, [status?.running, fetchStatus, fetchKeywords]);

  async function handleStart() {
    await fetch('/api/keywords/crawler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    fetchStatus();
  }

  async function handleStop() {
    await fetch('/api/keywords/crawler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
    fetchStatus();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">S등급 키워드 수집기</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            전체 도메인의 연관 키워드를 자동으로 탐색하여 S등급 키워드를 DB에 저장합니다
          </p>
        </div>
        <div className="flex gap-3">
          {status?.running ? (
            <button onClick={handleStop} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              수집 중지
            </button>
          ) : (
            <button onClick={handleStart} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              전체 수집 시작
            </button>
          )}
        </div>
      </div>

      {/* Crawler Status */}
      {status?.running && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-red-800">수집 진행 중...</span>
            <span className="text-xs text-red-600">
              시드 {status.processedSeeds}/{status.totalSeeds}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-red-600">현재 도메인</span>
              <p className="font-medium mt-0.5">{DOMAIN_LABELS[status.currentDomain as PostDomain] || status.currentDomain}</p>
            </div>
            <div>
              <span className="text-red-600">현재 시드</span>
              <p className="font-medium mt-0.5">{status.currentSeed}</p>
            </div>
            <div>
              <span className="text-red-600">발굴된 키워드</span>
              <p className="font-medium mt-0.5">{status.discoveredTotal}개 (S등급: {status.discoveredS}개)</p>
            </div>
            <div>
              <span className="text-red-600">진행률</span>
              <div className="mt-1">
                <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${(status.processedSeeds / status.totalSeeds) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DB Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-4">
            <span className="text-xs text-[var(--muted)]">전체 발굴</span>
            <p className="text-2xl font-bold mt-1">{formatNumber(stats.total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getGradeStyle('S')}`}>S등급</span>
            <p className="text-2xl font-bold mt-1 text-red-600">{formatNumber(stats.s)}</p>
          </div>
          {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
            <div key={key} className="bg-white rounded-xl border border-[var(--border)] p-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(key)}`}>{label}</span>
              <p className="text-xl font-bold mt-1">{stats.byDomain[key] || 0}</p>
              <p className="text-xs text-[var(--muted)]">S등급</p>
            </div>
          )).slice(0, 4)}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
          >
            <option value="">전체 등급</option>
            <option value="S">S등급만</option>
            <option value="A">A등급만</option>
            <option value="B">B등급만</option>
          </select>
          <select
            value={filterDomain}
            onChange={(e) => { setFilterDomain(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
          >
            <option value="">전체 도메인</option>
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <span className="text-sm text-[var(--muted)]">
            총 {formatNumber(total)}개
          </span>
        </div>
      </div>

      {/* Keyword Table */}
      {keywords.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)]">등급</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)]">키워드</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)]">도메인</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[var(--muted)]">시드</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)]">월간 검색량</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)]">월간 블로그</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-[var(--muted)]">광고경쟁</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-[var(--muted)]">기회점수</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-[var(--muted)]">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id} className="border-b border-[var(--border)] hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getGradeStyle(kw.grade)}`}>{kw.grade}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{kw.keyword}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(kw.domain)}`}>
                          {DOMAIN_LABELS[kw.domain as PostDomain] || kw.domain}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[var(--muted)]">{kw.seedKeyword}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold">{formatNumber(kw.monthlySearchCount)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-medium ${kw.monthlyBlogCount < 10 ? 'text-green-600' : kw.monthlyBlogCount < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {kw.monthlyBlogCount >= 0 ? formatNumber(kw.monthlyBlogCount) : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium ${getCompIdxStyle(kw.compIdx)}`}>{kw.compIdx || '-'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold">{kw.opportunityScore.toFixed(1)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-[var(--muted)]">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="font-semibold text-lg mb-2">아직 발굴된 키워드가 없습니다</h3>
          <p className="text-[var(--muted)] text-sm">
            &quot;전체 수집 시작&quot; 버튼을 누르면 모든 도메인의 연관 키워드를 탐색하여
            S등급 키워드를 자동으로 발굴합니다.
          </p>
        </div>
      )}
    </div>
  );
}
