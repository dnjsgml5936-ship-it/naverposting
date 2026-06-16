import { NextRequest, NextResponse } from 'next/server';
import { searchNaverNews } from '@/lib/naver-news';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: '검색어는 필수입니다.' }, { status: 400 });
    }

    const result = await searchNaverNews({
      query,
      display: searchParams.get('display') ? parseInt(searchParams.get('display')!, 10) : 5,
      sort: (searchParams.get('sort') as 'sim' | 'date') || 'date',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
