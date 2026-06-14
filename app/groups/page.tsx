'use client';

import { useEffect, useState } from 'react';
import TeamFlag from '../../components/TeamFlag';
import { getTeamRank } from '../../lib/rankings';
import Link from 'next/link';

interface Standing {
  team: string;
  fifaRank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface GroupData {
  letter: string;
  teams: string[];
  standings: Standing[];
}

const GROUP_COLORS: Record<string, string> = {
  A: 'from-red-500 to-red-600',
  B: 'from-blue-500 to-blue-600',
  C: 'from-yellow-500 to-yellow-600',
  D: 'from-green-500 to-green-600',
  E: 'from-purple-500 to-purple-600',
  F: 'from-pink-500 to-pink-600',
  G: 'from-indigo-500 to-indigo-600',
  H: 'from-teal-500 to-teal-600',
  I: 'from-orange-500 to-orange-600',
  J: 'from-cyan-500 to-cyan-600',
  K: 'from-rose-500 to-rose-600',
  L: 'from-emerald-500 to-emerald-600',
};

function GroupCard({ group }: { group: GroupData }) {
  const color = GROUP_COLORS[group.letter] ?? 'from-gray-500 to-gray-600';
  const s = group.standings;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${color} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-black text-lg">组 {group.letter}</span>
        <div className="flex gap-1.5">
          {group.teams.map((t) => (
            <span key={t} className="text-lg"><TeamFlag team={t} size={20} /></span>
          ))}
        </div>
      </div>
      {s.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          暂无已结算比赛
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-50">
                <th className="py-2 px-2 text-left font-medium">球队</th>
                <th className="py-2 px-1 text-center font-medium">场</th>
                <th className="py-2 px-1 text-center font-medium">胜</th>
                <th className="py-2 px-1 text-center font-medium">平</th>
                <th className="py-2 px-1 text-center font-medium">负</th>
                <th className="py-2 px-1 text-center font-medium">净</th>
                <th className="py-2 px-1.5 text-center font-bold text-gray-700">分</th>
              </tr>
            </thead>
            <tbody>
              {s.map((row, idx) => (
                <tr
                  key={row.team}
                  className={`border-b border-gray-50 transition ${
                    idx < 2 ? 'bg-green-50/50' : ''
                  }`}
                >
                  <td className="py-2 px-2 font-medium text-gray-900">
                    <span className="mr-1"><TeamFlag team={row.team} size={20} /></span>
                    <span className="text-[10px] text-red-400 font-bold mr-0.5">No.{row.fifaRank}</span>
                    {row.team}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-500">{row.played}</td>
                  <td className="py-2 px-1 text-center text-gray-500">{row.won}</td>
                  <td className="py-2 px-1 text-center text-gray-500">{row.drawn}</td>
                  <td className="py-2 px-1 text-center text-gray-500">{row.lost}</td>
                  <td className="py-2 px-1 text-center text-gray-500">
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className="py-2 px-1.5 text-center font-black text-gray-900">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {s.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            前2名出线
          </span>
          <span>积分 = 胜3 + 平1 + 负0</span>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in">
      <Link href="/home" className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900">
        ← 返回
      </Link>
      <h1 className="text-2xl font-black text-gray-900 mb-1">📊 分组积分榜</h1>
      <p className="text-sm text-gray-400 mb-6">2026 FIFA 世界杯 · 小组赛积分排名</p>

      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <div className="text-sm">加载中…</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
          暂无分组数据
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.letter} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
