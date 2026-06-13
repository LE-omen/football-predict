'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SafeUser } from '../types/user';

export default function AppHeader() {
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={user ? '/home' : '/'} className="flex items-center gap-2 text-lg font-bold text-red-600">
          <span className="text-2xl">⚽</span> 足球积分预测
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/home" className="rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900">首页</Link>
              <Link href="/matches" className="rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900">赛程</Link>
              <Link href="/leaderboard" className="rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900">积分榜</Link>
              <Link href="/my" className="rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900">我的</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 hover:bg-red-100">管理</Link>
              )}
              <span className="ml-1 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">{user.points.toLocaleString()} 积分</span>
              <button
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-500 hover:bg-gray-100"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100">登录</Link>
              <Link href="/register" className="rounded-lg bg-red-600 px-4 py-1.5 text-white hover:bg-red-700">注册</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}