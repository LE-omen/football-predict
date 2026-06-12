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
      else { setReliefMsg('领取成功'); setUser((prev) => (prev ? { ...prev, points: data.points } : prev)); }
    } catch { setReliefMsg('网络异常'); } finally { setReliefLoading(false); }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold">足球积分预测</h1>
        <p className="mb-2 text-white/70">好友之间的世界杯赛果预测积分站</p>
        <p className="mb-8 text-xs text-white/40">本站仅为朋友间娱乐性质的虚拟积分预测，不涉及任何真实货币交易。</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/login" className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20">登录</a>
          <a href="/register" className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">邀请注册</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">欢迎回来，{user.nickname}</div>
            <div className="mt-1 text-2xl font-bold">{user.points.toLocaleString('zh-CN')} 积分</div>
          </div>
          <button onClick={claimRelief} disabled={reliefLoading} className="rounded-xl bg-amber-500/20 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/30 disabled:opacity-50">
            {reliefLoading ? '领取中...' : '每日补给'}
          </button>
        </div>
        {reliefMsg && <div className="mt-2 text-sm text-white/70">{reliefMsg}</div>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/matches" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
          <div className="text-lg font-semibold">赛程列表</div>
          <div className="mt-1 text-sm text-white/60">查看比赛并提交预测</div>
        </Link>
        <Link href="/leaderboard" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
          <div className="text-lg font-semibold">好友积分榜</div>
          <div className="mt-1 text-sm text-white/60">看看谁领先</div>
        </Link>
        <Link href="/my" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
          <div className="text-lg font-semibold">我的预测</div>
          <div className="mt-1 text-sm text-white/60">预测记录与积分流水</div>
        </Link>
      </div>
    </div>
  );
}