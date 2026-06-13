'use client';

import Link from 'next/link';
import { formatDate, getTeamFlag } from '../lib/utils';
import type { MatchItem } from '../types/match';

function StatusBadge({ status }: { status: MatchItem['status'] }) {
  const map: Record<MatchItem['status'], { label: string; classes: string }> = {
    scheduled: { label: '可参与', classes: 'bg-red-50 text-red-500 border border-red-100' },
    locked: { label: '已锁定', classes: 'bg-amber-50 text-amber-600 border border-amber-200' },
    settled: { label: '已结算', classes: 'bg-gray-100 text-gray-500 border border-gray-200' },
    canceled: { label: '已取消', classes: 'bg-red-50 text-red-400 border border-red-200' },
  };
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-500 border border-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function ScoreDisplay({ match }: { match: MatchItem }) {
  if (match.status === 'settled' && match.ft_home_goals != null) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black tracking-wider text-gray-900">
          {match.ft_home_goals} : {match.ft_away_goals}
        </span>
        {match.ht_home_goals != null && (
          <span className="mt-0.5 text-[10px] text-gray-400">
            半场 {match.ht_home_goals} : {match.ht_away_goals}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="text-lg font-bold text-gray-300">VS</span>
  );
}

export default function MatchCard({ match }: { match: MatchItem }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all block p-4"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-500">{match.stage ?? '世界杯'}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-right">
          <div className="truncate text-lg font-bold text-gray-900 max-w-[120px] ml-auto">
            <span className="mr-1.5">{getTeamFlag(match.home_team)}</span>{match.home_team}
          </div>
        </div>
        <ScoreDisplay match={match} />
        <div className="flex-1 text-left">
          <div className="truncate text-lg font-bold text-gray-900 max-w-[120px]">
            {match.away_team}<span className="ml-1.5">{getTeamFlag(match.away_team)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <StatusBadge status={match.status} />
      </div>
    </Link>
  );
}