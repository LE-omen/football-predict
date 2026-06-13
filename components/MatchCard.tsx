'use client';

import Link from 'next/link';
import { formatDate } from '../lib/utils';
import type { MatchItem } from '../types/match';

function StatusBadge({ status }: { status: MatchItem['status'] }) {
  const map: Record<MatchItem['status'], { label: string; color: string }> = {
    scheduled: { label: '可参与', color: 'text-red-600 bg-red-50 border-red-200' },
    locked: { label: '已锁定', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    settled: { label: '已结算', color: 'text-gray-500 bg-gray-100 border-gray-200' },
    canceled: { label: '已取消', color: 'text-red-400 bg-red-50 border-red-200' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'text-gray-500 bg-gray-100 border-gray-200' };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function ScoreDisplay({ match }: { match: MatchItem }) {
  if (match.status === 'settled' && match.ft_home_goals != null) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-red-600">{match.ft_home_goals} : {match.ft_away_goals}</span>
        {match.ht_home_goals != null && (
          <span className="text-[10px] text-gray-400">半场 {match.ht_home_goals} : {match.ht_away_goals}</span>
        )}
      </div>
    );
  }
  return <span className="text-lg font-bold text-gray-300">VS</span>;
}

export default function MatchCard({ match }: { match: MatchItem }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-red-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-500">{match.stage ?? '世界杯'}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-right">
          <div className="text-lg font-bold text-gray-900 truncate max-w-[120px] ml-auto">{match.home_team}</div>
        </div>
        <ScoreDisplay match={match} />
        <div className="flex-1 text-left">
          <div className="text-lg font-bold text-gray-900 truncate max-w-[120px]">{match.away_team}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <StatusBadge status={match.status} />
      </div>
    </Link>
  );
}