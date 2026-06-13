'use client';
import { useEffect, useState, useMemo } from 'react';
import MatchCard from '../../components/MatchCard';
import type { MatchItem } from '../../types/match';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'result'>('upcoming');

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'upcoming') {
      return matches.filter((m) => m.status === 'scheduled' || m.status === 'locked');
    }
    return matches.filter((m) => m.status === 'settled');
  }, [matches, tab]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">⚽ 赛程</h1>

      {/* 两个 tab */}
      <div className="mb-4 flex gap-2 text-sm">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-lg px-4 py-2 font-medium transition ${
            tab === 'upcoming' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          当前赛程
        </button>
        <button
          onClick={() => setTab('result')}
          className={`rounded-lg px-4 py-2 font-medium transition ${
            tab === 'result' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          赛果
        </button>
        <span className="ml-auto self-center text-xs text-white/30">{filtered.length} 场</span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-white/50">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/50">{tab === 'upcoming' ? '暂无待参与的比赛' : '暂无已结算的比赛'}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}