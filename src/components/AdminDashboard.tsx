'use client';

import { useEffect, useState, useCallback } from 'react';

interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface UsageStat {
  userId: string;
  username: string;
  month: string;
  generations: number;
  inputTokens: number;
  outputTokens: number;
  savedPosts: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
};
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  approved: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-500',
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      loadUsers(),
      fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : [])).then(setStats),
    ]).finally(() => setLoading(false));
  }, [loadUsers]);

  async function act(userId: string, action: 'approve' | 'reject') {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    await loadUsers();
  }

  const pending = users.filter((u) => u.status === 'pending');

  // 사용자별 합계 (전체 기간)
  const totals = new Map<string, { username: string; generations: number; inputTokens: number; outputTokens: number; savedPosts: number }>();
  for (const s of stats) {
    const t = totals.get(s.userId) || { username: s.username, generations: 0, inputTokens: 0, outputTokens: 0, savedPosts: 0 };
    t.generations += s.generations;
    t.inputTokens += s.inputTokens;
    t.outputTokens += s.outputTokens;
    t.savedPosts += s.savedPosts;
    totals.set(s.userId, t);
  }

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  if (loading) return <div className="text-center py-12 text-[var(--muted)]">로딩 중...</div>;

  return (
    <div className="space-y-10">
      {/* 승인 대기 */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          승인 대기 {pending.length > 0 && <span className="text-[var(--primary)]">({pending.length})</span>}
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
            승인 대기 중인 사용자가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{u.username}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">가입: {new Date(u.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => act(u.id, 'approve')} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">승인</button>
                  <button onClick={() => act(u.id, 'reject')} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">거절</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 전체 사용자 */}
      <section>
        <h2 className="text-lg font-bold mb-3">전체 사용자 ({users.length})</h2>
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">아이디</th>
                <th className="px-4 py-3 font-medium">역할</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium text-right">누적 생성</th>
                <th className="px-4 py-3 font-medium text-right">저장 글</th>
                <th className="px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const t = totals.get(u.id);
                return (
                  <tr key={u.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3">{u.role === 'admin' ? '관리자' : '사용자'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[u.status]}`}>{STATUS_LABEL[u.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 text-right">{fmt(t?.generations || 0)}</td>
                    <td className="px-4 py-3 text-right">{fmt(t?.savedPosts || 0)}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <div className="flex gap-1.5">
                          {u.status !== 'approved' && <button onClick={() => act(u.id, 'approve')} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100">승인</button>}
                          {u.status !== 'rejected' && <button onClick={() => act(u.id, 'reject')} className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">거절</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 월별 사용량 */}
      <section>
        <h2 className="text-lg font-bold mb-1">월별 사용량</h2>
        <p className="text-xs text-[var(--muted)] mb-3">생성 = 저장 여부와 무관한 모든 AI 호출(토큰 소비). 저장 = 실제 저장된 글 수.</p>
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">월</th>
                <th className="px-4 py-3 font-medium">사용자</th>
                <th className="px-4 py-3 font-medium text-right">생성 횟수</th>
                <th className="px-4 py-3 font-medium text-right">저장 글</th>
                <th className="px-4 py-3 font-medium text-right">입력 토큰</th>
                <th className="px-4 py-3 font-medium text-right">출력 토큰</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">아직 생성 기록이 없습니다.</td></tr>
              ) : (
                stats.map((s, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{s.month}</td>
                    <td className="px-4 py-3">{s.username}</td>
                    <td className="px-4 py-3 text-right">{fmt(s.generations)}</td>
                    <td className="px-4 py-3 text-right">{fmt(s.savedPosts)}</td>
                    <td className="px-4 py-3 text-right text-[var(--muted)]">{fmt(s.inputTokens)}</td>
                    <td className="px-4 py-3 text-right text-[var(--muted)]">{fmt(s.outputTokens)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
