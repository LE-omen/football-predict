'use client';
import { WORLD_CUP_RANKINGS, TIER_COLORS } from '../../lib/rankings';
import TeamFlag from '../../components/TeamFlag';

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      <button onClick={() => window.history.back()} className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900">← 返回</button>
      <h1 className="text-2xl font-black text-gray-900 mb-2">🏆 FIFA实力排行</h1>
      <p className="text-sm text-gray-400 mb-6">48 支参赛队实力分档，含分组与战术标签</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="max-h-[75vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-gray-400 text-xs">
                <th className="py-2.5 px-2 text-center w-10">#</th>
                <th className="py-2.5 px-2 text-center w-10">组</th>
                <th className="py-2.5 px-2 text-left">球队</th>
                <th className="py-2.5 px-2 text-center">档位</th>
                <th className="py-2.5 px-2 text-left hidden sm:table-cell">标签</th>
              </tr>
            </thead>
            <tbody>
              {WORLD_CUP_RANKINGS.map((r) => {
                const tierClass = TIER_COLORS[r.tier] ?? 'text-gray-500 bg-gray-100';
                return (
                  <tr key={r.rank} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-2 px-2 text-center font-bold text-gray-900">
                      {r.rank <= 3 ? <span className="text-red-500">#{r.rank}</span> : r.rank}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold text-gray-600">{r.group}</span>
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-900">
                      <TeamFlag team={r.team} size={20} />{' '}
                      {r.team}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tierClass}`}>{r.tier}</span>
                    </td>
                    <td className="py-2 px-2 hidden sm:table-cell">
                      <div className="flex gap-1">
                        {r.tags.map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-[10px] font-medium">{tag}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
