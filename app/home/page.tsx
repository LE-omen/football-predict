'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SafeUser } from '../../types/user';

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [reliefMsg, setReliefMsg] = useState('');
  const [reliefLoading, setReliefLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((d) => setUser(d?.user ?? null)).catch(() => setUser(null));
  }, []);

  async function claimRelief() {
    setReliefLoading(true); setReliefMsg('');
    try {
      const res = await fetch('/api/relief', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setReliefMsg(data.error || '领取失败'); }
      else { setReliefMsg('领取成功！'); setUser((prev) => (prev ? { ...prev, points: data.points } : prev)); }
    } catch { setReliefMsg('网络异常'); } finally { setReliefLoading(false); }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mb-6 text-6xl">⚽</div>
        <h1 className="mb-3 text-3xl font-black text-gray-900">足球积分预测</h1>
        <p className="mb-2 text-lg text-gray-500">好友之间的世界杯赛果预测积分站</p>
        <p className="mb-10 text-sm text-gray-400">虚拟积分 · 纯属娱乐 · 不涉及真实货币</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/login" className="rounded-xl border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50">登录</a>
          <a href="/register" className="rounded-xl bg-red-600 px-6 py-2.5 font-medium text-white hover:bg-red-700">邀请注册</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">欢迎回来，{user.nickname}</div>
            <div className="mt-1 text-3xl font-black text-red-600">{user.points.toLocaleString('zh-CN')} <span className="text-base font-medium text-gray-400">积分</span></div>
          </div>
          <button onClick={claimRelief} disabled={reliefLoading} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50">
            {reliefLoading ? '领取中...' : '每日补给'}
          </button>
        </div>
        {reliefMsg && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{reliefMsg}</div>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/matches" className="group rounded-2xl border border-gray-200 p-6 transition hover:border-red-200 hover:shadow-md">
          <div className="mb-2 text-3xl">📋</div>
          <div className="text-lg font-bold text-gray-900 group-hover:text-red-600">赛程</div>
          <div className="mt-1 text-sm text-gray-500">查看比赛并提交预测</div>
        </Link>
        <Link href="/leaderboard" className="group rounded-2xl border border-gray-200 p-6 transition hover:border-red-200 hover:shadow-md">
          <div className="mb-2 text-3xl">🏆</div>
          <div className="text-lg font-bold text-gray-900 group-hover:text-red-600">好友积分榜</div>
          <div className="mt-1 text-sm text-gray-500">看看谁领先</div>
        </Link>
        <Link href="/my" className="group rounded-2xl border border-gray-200 p-6 transition hover:border-red-200 hover:shadow-md">
          <div className="mb-2 text-3xl">📊</div>
          <div className="text-lg font-bold text-gray-900 group-hover:text-red-600">我的预测</div>
          <div className="mt-1 text-sm text-gray-500">预测记录与积分流水</div>
        </Link>
      </div>
    </div>
  );
}