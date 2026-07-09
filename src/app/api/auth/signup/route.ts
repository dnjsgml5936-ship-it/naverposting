import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  countUsers,
  getUserByUsername,
  createUser,
  createSession,
  assignOrphanPostsTo,
} from '@/lib/db';
import {
  hashPassword,
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
    const id = String(username).trim();
    if (id.length < 3) {
      return NextResponse.json({ error: '아이디는 3자 이상이어야 합니다.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
    }
    if (getUserByUsername(id)) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 });
    }

    // 첫 가입자는 자동으로 관리자 + 승인 상태
    const isFirst = countUsers() === 0;
    const userId = randomUUID();
    createUser({
      id: userId,
      username: id,
      passwordHash: hashPassword(String(password)),
      role: isFirst ? 'admin' : 'user',
      status: isFirst ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    });

    if (isFirst) {
      // 로그인 이전에 저장된 기존 글을 관리자 소유로 귀속
      assignOrphanPostsTo(userId);

      // 관리자는 즉시 로그인 처리
      const sessionId = newSessionId();
      createSession(sessionId, userId, sessionExpiry());
      const res = NextResponse.json({ role: 'admin', status: 'approved' }, { status: 201 });
      res.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
      return res;
    }

    // 일반 사용자는 관리자 승인 대기
    return NextResponse.json(
      { role: 'user', status: 'pending', message: '가입 완료. 관리자 승인 후 이용할 수 있습니다.' },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
