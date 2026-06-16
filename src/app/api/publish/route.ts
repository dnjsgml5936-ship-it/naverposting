import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { postId, method } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'postId는 필수입니다.' }, { status: 400 });
    }

    const post = getPost(postId);
    if (!post) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (method === 'selenium') {
      // Call the Python Selenium server
      try {
        const seleniumUrl = process.env.SELENIUM_SERVER_URL || 'http://localhost:8000';
        const res = await fetch(`${seleniumUrl}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: post.title,
            htmlContent: post.htmlContent,
            tags: post.tags,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || '셀레니움 서버 오류');
        }

        updatePost(postId, {
          status: 'published',
          publishedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, method: 'selenium' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '셀레니움 서버에 연결할 수 없습니다.';
        return NextResponse.json(
          { error: `셀레니움 발행 실패: ${message}. 셀레니움 서버가 실행 중인지 확인하세요.` },
          { status: 502 }
        );
      }
    }

    // method === 'copy' — just mark as published
    updatePost(postId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, method: 'copy' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
