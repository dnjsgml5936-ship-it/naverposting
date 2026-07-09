import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { generateBlogPost } from '@/lib/claude';
import { GenerateRequest } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { logGeneration } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 승인된 사용자만 생성 가능 (토큰 비용 발생)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    if (user.status !== 'approved') {
      return NextResponse.json({ error: '관리자 승인 후 이용할 수 있습니다.' }, { status: 403 });
    }

    const body: GenerateRequest = await request.json();

    if (!body.keyword || !body.category) {
      return NextResponse.json(
        { error: '키워드와 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.domain) {
      body.domain = 'insurance';
    }

    const { post, error, usage } = await generateBlogPost(body);

    // 저장 여부와 무관하게 모든 생성 호출을 기록 (사용량/비용 추적)
    logGeneration({
      id: randomUUID(),
      userId: user.id,
      keyword: body.keyword,
      domain: body.domain,
      category: body.category,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      success: post ? 1 : 0,
      createdAt: new Date().toISOString(),
    });

    if (!post) {
      return NextResponse.json({ error: error || '생성에 실패했습니다.' }, { status: 500 });
    }
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
