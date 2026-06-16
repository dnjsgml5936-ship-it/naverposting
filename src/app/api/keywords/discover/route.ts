import { NextRequest, NextResponse } from 'next/server';
import { discoverKeywords } from '@/lib/keyword-discover';
import { PostDomain } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const domain = searchParams.get('domain') as PostDomain | null;

    if (!domain) {
      return NextResponse.json({ error: '도메인을 선택해주세요.' }, { status: 400 });
    }

    const category = searchParams.get('category') || undefined;
    const minSearchCount = searchParams.get('minSearchCount')
      ? parseInt(searchParams.get('minSearchCount')!, 10)
      : 500;
    const topN = searchParams.get('topN')
      ? parseInt(searchParams.get('topN')!, 10)
      : 20;

    const results = await discoverKeywords({
      domain,
      category,
      minSearchCount,
      topN: Math.min(topN, 30),
    });

    return NextResponse.json({ items: results, total: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
