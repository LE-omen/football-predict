'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SafeUser } from '../../types/user';

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [reliefMsg, setReliefMsg] = useState('');
  const [reliefLoading, setReliefLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function claimRelief() {
    setReliefLoading(true);
    setReliefMsg('');
    try {
      const res = await fetch('/api/relief', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setReliefMsg(data.error || '领取失败');
      } else {
        setReliefMsg('领取成功！');
        setUser((prev) => (prev ? { ...prev, points: data.points } : prev));
      }
    } catch {
      setReliefMsg('网络异常');
    } finally {
      setReliefLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="relative mx-auto max-w-xl px-4 py-24 text-center animate-fade-in">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-5xl">
          ⚽
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-zinc-900">
          足球竞猜
        </h1>
        <p className="mb-2 text-lg text-zinc-500">
          好友之间的世界杯赛果预测积分站
        </p>
        <p className="mb-12 text-sm text-zinc-400">
          虚拟积分 · 纯属娱乐 · 不涉及真实货币
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="btn-ghost">
            登录
          </Link>
          <Link href="/register" className="btn-primary">
            邀请注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      {/* Welcome Card */}
      <div className="glass-card-static relative mb-8 overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 70% 20%, rgba(220,38,38,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">欢迎回来</div>
            <div className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
              {user.nickname}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-black text-accent">
                {user.points.toLocaleString('zh-CN')}
              </span>
              <span className="text-sm font-medium text-zinc-400">积分</span>
            </div>
          </div>
          <button
            onClick={claimRelief}
            disabled={reliefLoading}
            className="btn-primary text-sm"
          >
            {reliefLoading ? '领取中…' : '每日补给'}
          </button>
        </div>
        {reliefMsg && (
          <div className="relative mt-4 rounded-xl bg-accent/[0.06] px-4 py-2.5 text-sm font-medium text-accent animate-fade-in">
            {reliefMsg}
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/matches" className="glass-card group p-6 animate-slide-up">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/[0.06] text-xl transition group-hover:bg-accent/[0.12]">
            🏟️
          </div>
          <div className="text-base font-bold text-zinc-900 group-hover:text-accent transition-colors">
            赛程
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            查看比赛并提交预测
          </div>
        </Link>

        <Link href="/leaderboard" className="glass-card group p-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/[0.06] text-xl transition group-hover:bg-accent/[0.12]">
            🏆
          </div>
          <div className="text-base font-bold text-zinc-900 group-hover:text-accent transition-colors">
            好友积分榜
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            看看谁领先
          </div>
        </Link>

        <Link href="/my" className="glass-card group p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/[0.06] text-xl transition group-hover:bg-accent/[0.12]">
            📊
          </div>
          <div className="text-base font-bold text-zinc-900 group-hover:text-accent transition-colors">
            我的预测
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            预测记录与积分流水
          </div>
        </Link>
      </div>
    </div>
  );
}
