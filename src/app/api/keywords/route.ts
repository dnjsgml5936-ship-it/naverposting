import { NextRequest, NextResponse } from 'next/server';
import { getKeywordRecommendations } from '@/lib/keyword-recommend';
import { PostDomain } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const domain = searchParams.get('domain') as PostDomain | null;
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const results = await getKeywordRecommendations({
      domain: domain || undefined,
      category,
      limit: Math.min(limit, 30), // 최대 30개 (API 호출 제한)
    });

    return NextResponse.json({ items: results, total: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
