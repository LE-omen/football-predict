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
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={user ? '/home' : '/'} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-lg">
            ⚽
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">
            足球预测
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link href="/home" className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                首页
              </Link>
              <Link href="/matches" className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                赛程
              </Link>
              <Link href="/leaderboard" className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                排行榜
              </Link>
              <Link href="/my" className="rounded-lg px-3 py-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
                我的
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="rounded-lg bg-red-50 px-3 py-1.5 text-red-500 transition hover:bg-red-100">
                  管理
                </Link>
              )}
              <div className="ml-2 flex items-center gap-2">
                <span className="badge-accent">{user.points.toLocaleString()} 积分</span>
                <button
                  className="rounded-lg px-2.5 py-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">登录</Link>
              <Link href="/register" className="bg-red-500 text-white font-semibold rounded-lg px-4 py-1.5 text-sm shadow-sm hover:bg-red-600 transition">注册</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}