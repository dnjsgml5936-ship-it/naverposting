'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/keywords', label: '키워드 추천', icon: '🔍' },
  { href: '/keywords/discovered', label: 'S등급 수집기', icon: '🏆' },
  { href: '/posts/new', label: '새 글 작성', icon: '✍️' },
  { href: '/posts', label: '포스트 관리', icon: '📋' },
  { href: '/settings', label: '설정 (네이버 로그인)', icon: '⚙️' },
];

const adminItem = { href: '/admin', label: '관리자 (사용자·사용량)', icon: '🛡️' };

export default function Sidebar({
  isAdmin = false,
  username,
}: {
  isAdmin?: boolean;
  username?: string;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[var(--border)] flex flex-col z-10">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold text-[var(--primary)]">
          BlogAuto
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          블로그 포스팅 자동화 플랫폼
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[var(--primary)]'
                      : 'text-[var(--muted)] hover:bg-gray-50 hover:text-[var(--foreground)]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] space-y-3">
        {username && (
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{username}</p>
              <p className="text-[10px] text-[var(--muted)]">{isAdmin ? '관리자' : '사용자'}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors">
                로그아웃
              </button>
            </form>
          </div>
        )}
        <div className="px-4 py-2 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-[var(--primary)]">AIEO 최적화</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">네이버 홈판 상위노출</p>
        </div>
      </div>
    </aside>
  );
}
