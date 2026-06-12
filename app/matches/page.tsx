'use client';
import { useEffect, useState, useMemo } from 'react';
import MatchCard from '../../components/MatchCard';
import type { MatchItem } from '../../types/match';

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'locked' | 'settled'>('all');

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return matches;
    return matches.filter((m) => m.status === filter);
  }, [matches, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, MatchItem[]> = {};
    for (const m of filtered) {
      const key = formatDateGroup(m.start_time);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">⚽ 赛程列表</h1>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 text-sm">
        {([['all', '全部'], ['scheduled', '可参与'], ['locked', '已锁定'], ['settled', '已结算']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === key
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-white/30">{filtered.length} 场</span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-white/50">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/50">暂无赛程</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateLabel, group]) => (
            <div key={dateLabel}>
              <div className="mb-2 text-xs font-medium text-white/40">{dateLabel}</div>
              <div className="grid grid-cols-1 gap-3">
                {group.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}