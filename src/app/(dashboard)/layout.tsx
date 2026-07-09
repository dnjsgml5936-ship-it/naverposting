import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // 로그인하지 않았으면 로그인 화면으로
  if (!user) {
    redirect('/login');
  }

  // 승인 대기/거절 상태면 안내 화면
  if (user.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3">⏳</p>
          <h1 className="text-lg font-bold">
            {user.status === 'pending' ? '관리자 승인 대기 중입니다' : '승인이 거절되었습니다'}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            {user.status === 'pending'
              ? '관리자가 계정을 승인하면 이용할 수 있습니다.'
              : '관리자에게 문의하세요.'}
          </p>
          <form action="/api/auth/logout" method="post" className="mt-6">
            <button className="text-xs text-[var(--primary)] hover:underline">로그아웃</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex">
      <Sidebar isAdmin={user.role === 'admin'} username={user.username} />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
