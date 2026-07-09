import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllUsers, setUserStatus, getUserById } from '@/lib/db';

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
  return NextResponse.json(getAllUsers());
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { userId, action } = await request.json();
  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const target = getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }
  // 관리자 본인 계정 상태는 변경 불가
  if (target.role === 'admin') {
    return NextResponse.json({ error: '관리자 계정은 변경할 수 없습니다.' }, { status: 400 });
  }

  setUserStatus(userId, action === 'approve' ? 'approved' : 'rejected');
  return NextResponse.json({ success: true });
}
