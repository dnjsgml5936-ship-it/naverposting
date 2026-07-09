'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BlogPost,
  DOMAIN_LABELS,
  PostDomain,
  INSURANCE_CATEGORY_LABELS,
  POLICY_FUND_ORG_LABELS,
  POLICY_FUND_TYPES,
  ISO_CERT_TYPES,
  CORP_CONSULTING_CATEGORIES,
  InsuranceCategory,
  PolicyFundOrg,
} from '@/types';

function getCategoryLabel(post: BlogPost): string {
  const domain = post.domain || 'insurance';
  if (domain === 'insurance') {
    return INSURANCE_CATEGORY_LABELS[post.category as InsuranceCategory] || post.category;
  }
  if (domain === 'policy_fund') {
    for (const org of Object.keys(POLICY_FUND_TYPES) as PolicyFundOrg[]) {
      const found = POLICY_FUND_TYPES[org].find((f) => f.key === post.category);
      if (found) return `${POLICY_FUND_ORG_LABELS[org]} - ${found.label}`;
    }
    return post.category;
  }
  if (domain === 'iso_certification') {
    const iso = ISO_CERT_TYPES.find((t) => t.key === post.category);
    return iso ? `${iso.label} ${iso.fullName}` : post.category;
  }
  if (domain === 'corporate_consulting') {
    for (const cat of CORP_CONSULTING_CATEGORIES) {
      const found = cat.topics.find((t) => t.key === post.category);
      if (found) return found.label;
    }
    return post.category;
  }
  return '정부지원사업';
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
    case 'real_estate': return 'bg-green-100 text-green-700';
  }
}

export default function Dashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPosts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const recentPosts = posts.slice(0, 5);

  const domainCounts: Record<string, number> = {
    insurance: posts.filter((p) => (p.domain || 'insurance') === 'insurance').length,
    policy_fund: posts.filter((p) => p.domain === 'policy_fund').length,
    iso_certification: posts.filter((p) => p.domain === 'iso_certification').length,
    corporate_consulting: posts.filter((p) => p.domain === 'corporate_consulting').length,
    smart_factory: posts.filter((p) => p.domain === 'smart_factory').length,
    disabled_workplace: posts.filter((p) => p.domain === 'disabled_workplace').length,
    bizinfo: posts.filter((p) => p.domain === 'bizinfo').length,
  };

  const stats = [
    { label: '전체 포스트', value: posts.length, color: 'bg-blue-500' },
    { label: '발행 완료', value: publishedCount, color: 'bg-green-500' },
    { label: '초안 대기', value: draftCount, color: 'bg-yellow-500' },
  ];

  const domainStats = [
    { label: '보험', value: domainCounts.insurance, color: 'bg-blue-400' },
    { label: '정책자금', value: domainCounts.policy_fund, color: 'bg-emerald-400' },
    { label: 'ISO인증', value: domainCounts.iso_certification, color: 'bg-orange-400' },
    { label: '법인컨설팅', value: domainCounts.corporate_consulting, color: 'bg-indigo-400' },
    { label: '스마트공장', value: domainCounts.smart_factory, color: 'bg-teal-400' },
    { label: '장애인표준', value: domainCounts.disabled_workplace, color: 'bg-rose-400' },
    { label: '기업마당', value: domainCounts.bizinfo, color: 'bg-amber-400' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-[var(--muted)] text-sm mt-1">블로그 포스팅 현황</p>
        </div>
        <Link href="/posts/new" className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">+ 새 글 작성</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-[var(--border)]">
            <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${stat.color}`} /><span className="text-sm text-[var(--muted)]">{stat.label}</span></div>
            <p className="text-3xl font-bold mt-3">{loading ? '-' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Domain Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {domainStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${stat.color}`} /><span className="text-xs text-[var(--muted)]">{stat.label}</span></div>
            <p className="text-2xl font-bold mt-2">{loading ? '-' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - 5 domains */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {/* 보험 */}
        <div className="bg-white rounded-xl p-5 border border-[var(--border)]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" />보험</h2>
          <div className="space-y-1.5">
            {(Object.entries(INSURANCE_CATEGORY_LABELS) as [InsuranceCategory, string][])
              .filter(([key]) => key !== 'general')
              .map(([key, label]) => (
                <Link key={key} href={`/posts/new?domain=insurance&category=${key}`} className="block px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-blue-50 hover:text-[var(--primary)] transition-colors">{label}</Link>
              ))}
          </div>
        </div>

        {/* 정책자금 */}
        <div className="bg-white rounded-xl p-5 border border-[var(--border)]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />정책자금</h2>
          <div className="space-y-1.5">
            {(Object.entries(POLICY_FUND_ORG_LABELS) as [string, string][]).map(([key, label]) => (
              <Link key={key} href={`/posts/new?domain=policy_fund`} className="block px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-emerald-50 hover:text-emerald-600 transition-colors truncate">{label}</Link>
            ))}
          </div>
        </div>

        {/* 기업마당 */}
        <div className="bg-white rounded-xl p-5 border border-[var(--border)]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" />기업마당</h2>
          <p className="text-xs text-[var(--muted)] mb-3">기업마당 API 연동 (지원사업/금융)</p>
          <Link href="/posts/new?domain=bizinfo" className="block w-full px-3 py-2 bg-amber-50 rounded-lg text-xs text-center text-amber-600 font-medium hover:bg-amber-100 transition-colors">지원사업 검색</Link>
        </div>

        {/* ISO인증 */}
        <div className="bg-white rounded-xl p-5 border border-[var(--border)]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400" />ISO인증</h2>
          <div className="space-y-1.5">
            {ISO_CERT_TYPES.slice(0, 5).map((iso) => (
              <Link key={iso.key} href={`/posts/new?domain=iso_certification`} className="block px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-orange-50 hover:text-orange-600 transition-colors">{iso.label}</Link>
            ))}
          </div>
        </div>

        {/* 법인컨설팅 */}
        <div className="bg-white rounded-xl p-5 border border-[var(--border)]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400" />법인컨설팅</h2>
          <div className="space-y-1.5">
            {CORP_CONSULTING_CATEGORIES.slice(0, 5).map((cat) => (
              <Link key={cat.label} href={`/posts/new?domain=corporate_consulting`} className="block px-3 py-2 bg-gray-50 rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors">{cat.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold">최근 포스트</h2>
          <Link href="/posts" className="text-sm text-[var(--primary)] hover:underline">전체 보기</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)]">로딩 중...</div>
        ) : recentPosts.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <p>아직 작성한 포스트가 없습니다.</p>
            <Link href="/posts/new" className="text-[var(--primary)] hover:underline text-sm mt-2 inline-block">첫 번째 글을 작성해보세요</Link>
          </div>
        ) : (
          <ul>
            {recentPosts.map((post) => (
              <li key={post.id} className="px-6 py-4 border-b border-[var(--border)] last:border-b-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(post.domain || 'insurance')}`}>{DOMAIN_LABELS[post.domain || 'insurance']}</span>
                  </div>
                  <p className="font-medium text-sm">{post.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{getCategoryLabel(post)} &middot; {new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{post.status === 'published' ? '발행됨' : '초안'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
