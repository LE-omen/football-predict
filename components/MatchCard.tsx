'use client';

import Link from 'next/link';
import { formatDate } from '../lib/utils';
import type { MatchItem } from '../types/match';

function StatusBadge({ status }: { status: MatchItem['status'] }) {
  const map: Record<MatchItem['status'], { label: string; color: string }> = {
    scheduled: { label: '可参与', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' },
    locked: { label: '已锁定', color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' },
    settled: { label: '已结算', color: 'text-white/50 bg-white/10 border-white/20' },
    canceled: { label: '已取消', color: 'text-red-300 bg-red-500/20 border-red-500/30' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'text-white/50 bg-white/10 border-white/20' };
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${color}`}>{label}</span>;
}

function ScoreDisplay({ match }: { match: MatchItem }) {
  if (match.status === 'settled' && match.ft_home_goals != null) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-emerald-300">{match.ft_home_goals} : {match.ft_away_goals}</span>
        {match.ht_home_goals != null && (
          <span className="text-[10px] text-white/30">半场 {match.ht_home_goals} : {match.ht_away_goals}</span>
        )}
      </div>
    );
  }
  return <span className="text-lg text-white/40">VS</span>;
}

export default function MatchCard({ match }: { match: MatchItem }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-400/30 hover:bg-white/8"
    >
      {/* Top row: league + time */}
      <div className="mb-3 flex items-center justify-between text-xs text-white/50">
        <span>{match.league ?? '世界杯'} {match.stage ?? ''}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-right">
          <div className="text-lg font-bold truncate max-w-[120px] ml-auto">{match.home_team}</div>
        </div>
        <ScoreDisplay match={match} />
        <div className="flex-1 text-left">
          <div className="text-lg font-bold truncate max-w-[120px]">{match.away_team}</div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center justify-center">
        <StatusBadge status={match.status} />
      </div>
    </Link>
  );
}