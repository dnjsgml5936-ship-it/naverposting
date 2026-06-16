import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/claude';
import { GenerateRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
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

    const result = await generateBlogPost(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
