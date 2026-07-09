import { notFound } from 'next/navigation';
import { getPost } from '@/lib/db';
import { DOMAIN_LABELS } from '@/types';

// 공유 링크는 항상 최신 DB 내용을 반영하도록 정적 캐시 비활성화
export const dynamic = 'force-dynamic';

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPost(id);

  if (!post) {
    notFound();
  }

  const domain = post.domain || 'insurance';

  return (
    // 루트 레이아웃의 사이드바를 덮어 외부 공유용 깔끔한 읽기 화면 구성
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <article className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <header className="px-8 pt-8 pb-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
                {DOMAIN_LABELS[domain]}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-[var(--muted)]">
                {post.keyword}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
            <div className="mt-3 text-xs text-[var(--muted)]">
              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-blue-50 text-[var(--primary)] rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="blog-preview prose max-w-none px-8 py-8"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />
        </article>

        <p className="text-center text-xs text-[var(--muted)] mt-6">
          네이버 블로그 포스팅 자동화로 작성된 글입니다
        </p>
      </div>
    </div>
  );
}
