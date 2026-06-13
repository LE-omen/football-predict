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
    <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900 mb-6">⚽ 赛程</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'upcoming'
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          当前赛程
        </button>
        <button
          onClick={() => setTab('result')}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'result'
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          赛果
        </button>
        <span className="ml-auto self-center text-xs text-gray-400">
          {filtered.length} 场
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <div className="text-sm">加载中…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
          {tab === 'upcoming' ? '暂无待参与的比赛' : '暂无已结算的比赛'}
        </div>
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