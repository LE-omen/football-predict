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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={user ? '/home' : '/'} className="text-lg font-semibold tracking-tight">
          足球积分预测
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/home" className="rounded-lg px-2 py-1 hover:bg-white/10">首页</Link>
              <Link href="/matches" className="rounded-lg px-2 py-1 hover:bg-white/10">赛程</Link>
              <Link href="/leaderboard" className="rounded-lg px-2 py-1 hover:bg-white/10">好友积分榜</Link>
              <Link href="/my" className="rounded-lg px-2 py-1 hover:bg-white/10">我的</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="rounded-lg bg-amber-500/20 px-2 py-1 text-amber-300 hover:bg-amber-500/30">管理后台</Link>
              )}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">{user.points} 积分</span>
              <button
                className="rounded-lg bg-white/10 px-2 py-1 hover:bg-white/20"
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
              <Link href="/login" className="rounded-lg px-2 py-1 hover:bg-white/10">登录</Link>
              <Link href="/register" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500">注册</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}