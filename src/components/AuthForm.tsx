'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '요청에 실패했습니다.');
        return;
      }

      if (mode === 'signup' && data.status === 'pending') {
        // 승인 대기: 로그인 화면으로 안내
        setInfo(data.message || '가입 완료. 관리자 승인 후 이용할 수 있습니다.');
        setUsername('');
        setPassword('');
        return;
      }

      // 로그인 성공 또는 관리자 최초 가입 → 홈으로
      router.push('/');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f8fa] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold">네이버 블로그 포스팅 자동화</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {mode === 'login' ? '로그인' : '회원가입'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-7 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              placeholder="아이디 (3자 이상)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              placeholder="비밀번호 (6자 이상)"
            />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {info && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--muted)] mt-5">
          {mode === 'login' ? (
            <>계정이 없으신가요? <Link href="/signup" className="text-[var(--primary)] font-medium hover:underline">회원가입</Link></>
          ) : (
            <>이미 계정이 있으신가요? <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">로그인</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
