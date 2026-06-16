import { NextRequest, NextResponse } from 'next/server';
import { fetchGovSupportPrograms } from '@/lib/bizinfo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const result = await fetchGovSupportPrograms({
      keyword: searchParams.get('keyword') || undefined,
      category: searchParams.get('category') || undefined,
      region: searchParams.get('region') || undefined,
      pageIndex: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      pageUnit: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
