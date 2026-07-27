import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllUsers, setUserStatus, setUserRole, getUserById, countAdmins } from '@/lib/db';

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
  if (!userId || !['approve', 'reject', 'promote', 'demote'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const target = getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 관리자 권한 부여: 승인 상태로 만들고 admin 역할 지정
  if (action === 'promote') {
    setUserRole(userId, 'admin');
    setUserStatus(userId, 'approved');
    return NextResponse.json({ success: true });
  }

  // 관리자 권한 회수
  if (action === 'demote') {
    if (target.id === admin.id) {
      return NextResponse.json({ error: '본인의 관리자 권한은 회수할 수 없습니다.' }, { status: 400 });
    }
    if (target.role !== 'admin') {
      return NextResponse.json({ error: '관리자가 아닙니다.' }, { status: 400 });
    }
    if (countAdmins() <= 1) {
      return NextResponse.json({ error: '마지막 관리자는 회수할 수 없습니다.' }, { status: 400 });
    }
    setUserRole(userId, 'user');
    return NextResponse.json({ success: true });
  }

  // approve / reject 는 관리자가 아닌 계정에만
  if (target.role === 'admin') {
    return NextResponse.json({ error: '관리자 계정의 상태는 변경할 수 없습니다.' }, { status: 400 });
  }

  setUserStatus(userId, action === 'approve' ? 'approved' : 'rejected');
  return NextResponse.json({ success: true });
}
