import { NextRequest, NextResponse } from 'next/server';
import { startCrawler, stopCrawler, getCrawlerStatus } from '@/lib/keyword-crawler';
import { getDiscoveredKeywords, getDiscoveredKeywordStats } from '@/lib/db';

// GET: 크롤러 상태 + 발굴 결과 조회
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  if (action === 'status') {
    const status = getCrawlerStatus();
    const stats = getDiscoveredKeywordStats();
    return NextResponse.json({ status, stats });
  }

  // 발굴된 키워드 목록 조회
  const domain = searchParams.get('domain') || undefined;
  const grade = searchParams.get('grade') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

  const result = getDiscoveredKeywords({ domain, grade, limit, offset });
  return NextResponse.json(result);
}

// POST: 크롤러 시작/중지
export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action;

  if (action === 'start') {
    const status = getCrawlerStatus();
    if (status.running) {
      return NextResponse.json({ error: '이미 실행 중입니다.', status });
    }
    // 비동기로 크롤러 시작 (응답은 바로 반환)
    startCrawler().catch(() => {});
    return NextResponse.json({ message: '크롤러가 시작되었습니다.', status: getCrawlerStatus() });
  }

  if (action === 'stop') {
    stopCrawler();
    return NextResponse.json({ message: '크롤러가 중지되었습니다.', status: getCrawlerStatus() });
  }

  return NextResponse.json({ error: '유효하지 않은 action입니다.' }, { status: 400 });
}
