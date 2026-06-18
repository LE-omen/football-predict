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
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-5xl">
          ⚽
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900">
          足球金币预测
        </h1>
        <p className="mb-2 text-lg text-gray-500">
          好友之间的世界杯赛果预测娱乐站
        </p>
        <p className="mb-10 text-sm text-gray-400">
          虚拟金币 · 不涉及真实金钱 · 纯娱乐排名
        </p>
        <div className="mb-10 text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">📖 玩法说明</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">1</span>
              <span>使用<strong>邀请码</strong>注册，每个账号获 <strong className="text-red-500">10,000</strong> 初始金币</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">2</span>
              <span>进入赛程选择比赛可预测<strong>胜平负、比分、进球数、双方是否进球、半场胜平负</strong>共 5 种玩法</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">3</span>
              <span>每次投入 <strong>100~5,000</strong> 金币，100 的数倍，无单场总投入限制</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">4</span>
              <span>开赛前<strong>30 分钟自动锁定</strong>，锁定后不能再投入</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">5</span>
              <span>投入后根据<strong>投入 × 参考指数</strong>计算命中返还，未命中不返还</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold shrink-0">6</span>
              <span>金币低于 100 可领取<strong>每日补给</strong>，每次 1,000 金币，每天最多 3 次</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            登录
          </Link>
          <Link href="/register" className="bg-red-500 text-white font-semibold rounded-lg px-6 py-2.5 text-sm shadow-sm hover:bg-red-600 transition">
            邀请注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative mb-6 overflow-hidden p-6">
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">欢迎回来</div>
            <div className="mt-1 text-3xl font-black tracking-tight text-gray-900">{user.nickname}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-2xl font-black text-red-500">🪙 {user.points.toLocaleString('zh-CN')}</span>
              <span className="text-sm font-medium text-gray-400">金币</span>
            </div>
          </div>
          <button onClick={claimRelief} disabled={reliefLoading}
            className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50">
            {reliefLoading ? '领取中..' : '每日补给'}
          </button>
        </div>
        {reliefMsg && (
          <div className="relative mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500 animate-fade-in">{reliefMsg}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <Link href="/matches" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">🏆</div>
          <div className="text-sm font-bold text-gray-900">赛程</div>
          <div className="mt-0.5 text-xs text-gray-400">查看赛程并提交预测</div>
        </Link>
        <Link href="/leaderboard" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">🏅</div>
          <div className="text-sm font-bold text-gray-900">金币榜</div>
          <div className="mt-0.5 text-xs text-gray-400">看看谁最强</div>
        </Link>
        <Link href="/my" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all animate-slide-up">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">📋</div>
          <div className="text-sm font-bold text-gray-900">我的预测</div>
          <div className="mt-0.5 text-xs text-gray-400">预测记录、金币流水</div>
        </Link>
      </div>

      <Link href="/rankings" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all mb-6 block">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">🏆 FIFA实力排行</div>
            <div className="mt-1 text-xs text-gray-400">48 支球队实力值总览，点击查看详情</div>
          </div>
          <div className="text-gray-300 text-lg">›</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { rank: 1, name: '西班牙' }, { rank: 2, name: '法国' }, { rank: 3, name: '阿根廷' },
            { rank: 4, name: '英格兰' }, { rank: 5, name: '葡萄牙' }, { rank: 6, name: '巴西' },
          ].map(t => (
            <span key={t.name} className="bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              No.{t.rank} {t.name}
            </span>
          ))}
        </div>
      </Link>

      <Link href="/groups" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all mb-6 block">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">📅 球队分组积分榜</div>
            <div className="mt-1 text-xs text-gray-400">世界杯小组赛实时积分排名，点击查看详情</div>
          </div>
          <div className="text-gray-300 text-lg">›</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
            <span key={g} className="bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              {g} 组
            </span>
          ))}
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">📖 玩法说明</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">1</span>
            <span>使用<strong>邀请码</strong>注册，每个账号获 <strong className="text-red-500">10,000</strong> 初始金币</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">2</span>
            <span>进入赛程选择比赛可预测<strong>胜平负、比分、进球数、双方是否进球、半场胜平负</strong>共 5 种玩法</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">3</span>
            <span>每次投入 <strong>100~5,000</strong> 金币，100 的数倍，无单场总投入限制</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">4</span>
            <span>开赛前<strong>30 分钟自动锁定</strong>，锁定后不能再投入</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">5</span>
            <span>投入后根据<strong>投入 × 参考指数</strong>计算命中返还，未命中不返还</span>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 font-bold shrink-0">6</span>
            <span>金币低于 100 可领取<strong>每日补给</strong>，每次 1,000 金币，每天最多 3 次</span>
          </div>
        </div>
      </div>
    </div>
  );
}
