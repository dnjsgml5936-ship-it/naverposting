import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, createSession } from '@/lib/db';
import {
  verifyPassword,
  newSessionId,
  sessionExpiry,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });
    }

    const user = getUserByUsername(String(username).trim());
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: '아직 관리자 승인 대기 중입니다.' }, { status: 403 });
    }
    if (user.status === 'rejected') {
      return NextResponse.json({ error: '승인이 거절된 계정입니다. 관리자에게 문의하세요.' }, { status: 403 });
    }

    const sessionId = newSessionId();
    createSession(sessionId, user.id, sessionExpiry());
    const res = NextResponse.json({ role: user.role, status: user.status });
    res.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
