import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { getSessionUser, UserRow } from './db';

export const SESSION_COOKIE = 'blog_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30일

export type SessionUser = Omit<UserRow, 'passwordHash'>;

// --- 비밀번호 해싱 (node:crypto scrypt, 외부 의존성 없음) ---
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// --- 세션 ---
export function newSessionId(): string {
  return randomUUID() + randomBytes(16).toString('hex');
}

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

// 현재 로그인 사용자 조회 (없으면 null). 비밀번호 해시는 제외하고 반환
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const user = getSessionUser(sessionId);
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  void _passwordHash;
  return safe;
}
