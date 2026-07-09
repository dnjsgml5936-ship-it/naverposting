import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminPage() {
  const user = await getCurrentUser();
  // 관리자만 접근 가능
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">관리자</h1>
        <p className="text-[var(--muted)] text-sm mt-1">사용자 승인 및 API 사용량 관리</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
