'use client';

import Link from 'next/link';
import { formatDate } from '../lib/utils';
import TeamFlag from './TeamFlag';
import { getTeamRank } from '../lib/rankings';
import type { MatchItem } from '../types/match';

function StatusBadge({ status }: { status: MatchItem['status'] }) {
  const map: Record<MatchItem['status'], { label: string; classes: string }> = {
    scheduled: { label: '半ɲ半半半', classes: 'bg-red-50 text-red-500 border border-red-100' },
    locked: { label: '半半半半半半', classes: 'bg-amber-50 text-amber-600 border border-amber-200' },
    settled: { label: '半ѽ半半半', classes: 'bg-gray-100 text-gray-500 border border-gray-200' },
    canceled: { label: '半半ȡ半半', classes: 'bg-red-50 text-red-400 border border-red-200' },
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
            半볡 {match.ht_home_goals} : {match.ht_away_goals}
          </span>
        )}
      </div>
    );
  }
  return <span className="text-lg font-bold text-gray-300">VS</span>;
}

function RankBadge({ team }: { team: string }) {
  const rank = getTeamRank(team);
  if (!rank) return null;
  return (
    <span className="text-[10px] font-bold text-red-400">No.{rank}</span>
  );
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export default function MatchCard({ match }: { match: MatchItem }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all block p-4"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-500">{match.stage ?? '半半半籭'}</span>
        <span>{formatMatchTime(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-right">
          <div className="truncate text-lg font-bold text-gray-900 max-w-[130px] ml-auto">
            <RankBadge team={match.home_team} />{' '}
            <span className="mr-1.5"><TeamFlag team={match.home_team} /></span>{match.home_team}
          </div>
        </div>
        <ScoreDisplay match={match} />
        <div className="flex-1 text-left">
          <div className="truncate text-lg font-bold text-gray-900 max-w-[130px]">
            {match.away_team}<span className="ml-1.5"><TeamFlag team={match.away_team} /></span>{' '}
            <RankBadge team={match.away_team} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <StatusBadge status={match.status} />
      </div>
    </Link>
  );
}