import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    deleteSession(sessionId);
  }
  const res = NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
