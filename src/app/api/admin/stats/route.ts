import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUsageStats } from '@/lib/db';

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
  return NextResponse.json(getUsageStats());
}
