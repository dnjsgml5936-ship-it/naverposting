'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BlogPost,
  DOMAIN_LABELS,
  PostDomain,
  INSURANCE_CATEGORY_LABELS,
  POLICY_FUND_TYPES,
  ISO_CERT_TYPES,
  CORP_CONSULTING_CATEGORIES,
  SMART_FACTORY_CATEGORIES,
  DISABLED_WORKPLACE_CATEGORIES,
  InsuranceCategory,
  PolicyFundOrg,
} from '@/types';

function getCategoryLabel(post: BlogPost): string {
  const domain = post.domain || 'insurance';
  if (domain === 'insurance') return INSURANCE_CATEGORY_LABELS[post.category as InsuranceCategory] || post.category;
  if (domain === 'policy_fund') {
    for (const org of Object.keys(POLICY_FUND_TYPES) as PolicyFundOrg[]) {
      const found = POLICY_FUND_TYPES[org].find((f) => f.key === post.category);
      if (found) return found.label;
    }
    return post.category;
  }
  if (domain === 'iso_certification') {
    const iso = ISO_CERT_TYPES.find((t) => t.key === post.category);
    return iso ? iso.label : post.category;
  }
  if (domain === 'corporate_consulting') {
    for (const cat of CORP_CONSULTING_CATEGORIES) {
      const found = cat.topics.find((t) => t.key === post.category);
      if (found) return found.label;
    }
    return post.category;
  }
  if (domain === 'smart_factory') {
    for (const cat of SMART_FACTORY_CATEGORIES) {
      const found = cat.topics.find((t) => t.key === post.category);
      if (found) return found.label;
    }
    return post.category;
  }
  if (domain === 'disabled_workplace') {
    for (const cat of DISABLED_WORKPLACE_CATEGORIES) {
      const found = cat.topics.find((t) => t.key === post.category);
      if (found) return found.label;
    }
    return post.category;
  }
  if (domain === 'bizinfo') return '기업마당';
  return post.category;
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

async function copyToClipboard(text: string, successMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert(successMsg);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert(successMsg);
  }
}

function sharePost(id: string) {
  const url = `${window.location.origin}/share/${id}`;
  copyToClipboard(url, `공유 링크가 복사되었습니다.\n${url}`);
}

const TONE_LABELS: Record<string, string> = {
  warm: '따뜻한',
  professional: '전문적인',
  story: '스토리텔링',
  casual: '캐주얼한',
  authoritative: '권위있는',
};

// 저장된 생성 입력값(GenerateRequest)을 사람이 읽기 좋게 표시
function GenerationInfo({ post }: { post: BlogPost }) {
  const gi = post.generationInput;

  const rows: { label: string; value: ReactNode }[] = [
    { label: '키워드', value: post.keyword },
    { label: '도메인', value: DOMAIN_LABELS[post.domain || 'insurance'] },
    { label: '카테고리', value: getCategoryLabel(post) },
  ];

  if (gi) {
    if (gi.tone) rows.push({ label: '말투/톤', value: TONE_LABELS[gi.tone] || gi.tone });
    if (gi.targetAge) rows.push({ label: '타겟 연령', value: gi.targetAge });
    if (gi.painPoint) rows.push({ label: '고민/니즈', value: gi.painPoint });
    if (gi.additionalContext) rows.push({ label: '추가 맥락', value: gi.additionalContext });
    if (gi.fundOrg) rows.push({ label: '정책자금 기관', value: gi.fundOrg });
    if (gi.fundType) rows.push({ label: '정책자금 유형', value: gi.fundType });
    if (gi.isoType) rows.push({ label: 'ISO 유형', value: gi.isoType });
    if (gi.corpTopic) rows.push({ label: '법인컨설팅 주제', value: gi.corpTopic });
    if (gi.smartFactoryTopic) rows.push({ label: '스마트공장 주제', value: gi.smartFactoryTopic });
    if (gi.disabledWorkplaceTopic) rows.push({ label: '장애인표준사업장 주제', value: gi.disabledWorkplaceTopic });
    if (gi.realEstateTopic) rows.push({ label: '부동산 주제', value: gi.realEstateTopic });
    if (gi.govProgram?.pblancNm) rows.push({ label: '정부지원사업', value: gi.govProgram.pblancNm });
    if (gi.referenceUrls && gi.referenceUrls.length > 0) {
      rows.push({
        label: '참고 URL',
        value: (
          <div className="flex flex-col gap-1">
            {gi.referenceUrls.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline break-all">{u}</a>
            ))}
          </div>
        ),
      });
    }
    if (gi.newsArticles && gi.newsArticles.length > 0) {
      rows.push({
        label: '참고 뉴스',
        value: (
          <div className="flex flex-col gap-1">
            {gi.newsArticles.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline break-all">{n.title.replace(/<[^>]+>/g, '')}</a>
            ))}
          </div>
        ),
      });
    }
  }

  return (
    <div>
      {!gi && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-xs">
          이 글은 생성 정보 저장 기능이 추가되기 전에 만들어져, 아래 기본 정보만 확인할 수 있습니다.
        </div>
      )}
      <dl className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-[var(--muted)] pt-0.5">{row.label}</dt>
            <dd className="flex-1 text-sm whitespace-pre-wrap break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [domainFilter, setDomainFilter] = useState<'all' | PostDomain>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [detailTab, setDetailTab] = useState<'preview' | 'html' | 'markdown' | 'info'>('preview');

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPosts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter((p) => {
    const statusMatch = filter === 'all' || p.status === filter;
    const domainMatch = domainFilter === 'all' || (p.domain || 'insurance') === domainFilter;
    return statusMatch && domainMatch;
  });

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (selectedPost?.id === id) setSelectedPost(null);
  }

  async function handlePublishSelenium(post: BlogPost) {
    if (!confirm('셀레니움으로 네이버 블로그에 자동 발행합니다. 계속하시겠습니까?')) return;
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.id, method: 'selenium' }) });
      const data = await res.json();
      if (data.error) { alert(`발행 실패: ${data.error}`); }
      else { alert('네이버 블로그에 발행되었습니다!'); setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: 'published', publishedAt: new Date().toISOString() } : p)); }
    } catch { alert('셀레니움 서버에 연결할 수 없습니다.'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">포스트 관리</h1>
          <p className="text-[var(--muted)] text-sm mt-1">총 {posts.length}개의 포스트</p>
        </div>
        <Link href="/posts/new" className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">+ 새 글 작성</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'draft', 'published'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:bg-gray-50'}`}>
              {f === 'all' ? '전체' : f === 'draft' ? '초안' : '발행됨'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'insurance', 'policy_fund', 'iso_certification', 'corporate_consulting', 'smart_factory', 'disabled_workplace', 'bizinfo'] as const).map((d) => (
            <button key={d} onClick={() => setDomainFilter(d)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${domainFilter === d ? 'bg-gray-800 text-white' : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:bg-gray-50'}`}>
              {d === 'all' ? '전체' : DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">로딩 중...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center"><p className="text-[var(--muted)]">포스트가 없습니다.</p></div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-[var(--border)] p-5 flex items-center justify-between cursor-pointer hover:border-[var(--primary)] transition-colors"
              onClick={() => { setSelectedPost(post); setDetailTab('preview'); }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${post.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{post.status === 'published' ? '발행됨' : '초안'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(post.domain || 'insurance')}`}>{DOMAIN_LABELS[post.domain || 'insurance']}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-[var(--muted)]">{getCategoryLabel(post)}</span>
                </div>
                <h3 className="font-medium mt-2 truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--muted)]">
                  <span>키워드: {post.keyword}</span>
                  <span>&middot;</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                  {post.tags.length > 0 && (<><span>&middot;</span><span>#{post.tags.slice(0, 3).join(' #')}</span></>)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => sharePost(post.id)} className="px-3 py-2 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">공유</button>
                <button onClick={() => copyToClipboard(post.content, '텍스트가 복사되었습니다.')} className="px-3 py-2 text-xs font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">텍스트</button>
                <button onClick={() => copyToClipboard(post.htmlContent, 'HTML이 복사되었습니다.')} className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">HTML</button>
                {post.status === 'draft' && (<button onClick={() => handlePublishSelenium(post)} className="px-3 py-2 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">자동발행</button>)}
                <button onClick={() => handleDelete(post.id)} className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selectedPost.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {selectedPost.status === 'published' ? '발행됨' : '초안'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDomainColor(selectedPost.domain || 'insurance')}`}>
                    {DOMAIN_LABELS[selectedPost.domain || 'insurance']}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-[var(--muted)]">
                    {getCategoryLabel(selectedPost)}
                  </span>
                </div>
                <button onClick={() => setSelectedPost(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] text-xl leading-none">&times;</button>
              </div>
              <h2 className="text-lg font-bold">{selectedPost.title}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                <span>키워드: {selectedPost.keyword}</span>
                <span>&middot;</span>
                <span>{new Date(selectedPost.createdAt).toLocaleDateString('ko-KR')}</span>
                {selectedPost.publishedAt && (
                  <><span>&middot;</span><span>발행: {new Date(selectedPost.publishedAt).toLocaleDateString('ko-KR')}</span></>
                )}
              </div>
              {/* Tags */}
              {selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedPost.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-[var(--primary)] rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs + Actions */}
            <div className="flex items-center justify-between px-6 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex">
                {(['preview', 'html', 'markdown', 'info'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      detailTab === tab
                        ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {tab === 'preview' ? '미리보기' : tab === 'html' ? 'HTML' : tab === 'markdown' ? '마크다운' : '생성 정보'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 py-2">
                <button
                  onClick={() => sharePost(selectedPost.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  공유 링크 복사
                </button>
                <button
                  onClick={() => copyToClipboard(selectedPost.content, '전체 텍스트가 복사되었습니다.')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  텍스트 복사
                </button>
                <button
                  onClick={() => copyToClipboard(selectedPost.htmlContent, 'HTML이 복사되었습니다. 네이버 블로그에 붙여넣기 하세요.')}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  HTML 복사
                </button>
                <button
                  onClick={() => {
                    const fullText = `${selectedPost.title}\n\n${selectedPost.content}\n\n${selectedPost.tags.map(t => '#' + t).join(' ')}`;
                    copyToClipboard(fullText, '제목 + 본문 + 해시태그 전체가 복사되었습니다.');
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  전체 복사
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'preview' ? (
                <div className="blog-preview prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedPost.htmlContent }} />
              ) : detailTab === 'html' ? (
                <pre className="text-xs font-mono bg-gray-50 p-4 rounded-lg border border-[var(--border)] whitespace-pre-wrap break-all">{selectedPost.htmlContent}</pre>
              ) : detailTab === 'markdown' ? (
                <pre className="text-sm bg-gray-50 p-4 rounded-lg border border-[var(--border)] whitespace-pre-wrap leading-relaxed">{selectedPost.content}</pre>
              ) : (
                <GenerationInfo post={selectedPost} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
