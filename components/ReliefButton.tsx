'use client';
import { useState, useEffect } from 'react';
import { RELIEF_AMOUNT, RELIEF_MAX_PER_DAY, RELIEF_MIN_POINTS } from '../lib/constants';

interface ReliefButtonProps {
  points: number;
  onClaimed: (newPoints: number) => void;
}

export default function ReliefButton({ points, onClaimed }: ReliefButtonProps) {
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  const canClaim = points < RELIEF_MIN_POINTS && (todayCount === null || todayCount < RELIEF_MAX_PER_DAY);

  useEffect(() => {
    // Fetch today's relief count
    fetch('/api/relief/count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count !== undefined) setTodayCount(d.count); })
      .catch(() => {});
  }, []);

  async function handleClaim() {
    if (!canClaim || claiming) return;
    setClaiming(true);
    setMsg(null);
    try {
      const res = await fetch('/api/relief', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: `领取成功！+${RELIEF_AMOUNT} 金币` });
        setTodayCount((c) => (c ?? 0) + 1);
        onClaimed(data.points);
      } else {
        setMsg({ type: 'err', text: data.error || '领取失败' });
      }
    } catch {
      setMsg({ type: 'err', text: '网络错误' });
    } finally {
      setClaiming(false);
    }
  }

  if (points >= RELIEF_MIN_POINTS) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-amber-800">🪙 每日补给</div>
          <div className="text-xs text-amber-600 mt-0.5">
            金币不足时可领取，每次 +{RELIEF_AMOUNT}，每天最多 {RELIEF_MAX_PER_DAY} 次
          </div>
          {todayCount !== null && (
            <div className="text-xs text-amber-500 mt-1">
              今日已领 {todayCount}/{RELIEF_MAX_PER_DAY} 次
            </div>
          )}
        </div>
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {claiming ? '领取中...' : canClaim ? `领取 +${RELIEF_AMOUNT}` : '暂不可领'}
        </button>
      </div>
      {msg && (
        <div className={`mt-2 text-xs font-medium ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

