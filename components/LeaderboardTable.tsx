'use client';

type Row = { id: string; nickname: string; points: number };
type Props = { users: Row[] };

export default function LeaderboardTable({ users }: Props) {
  if (!users.length)
    return (
      <div className="glass-card-static py-16 text-center text-zinc-400">
        暂无数据
      </div>
    );

  return (
    <div className="glass-card-static overflow-hidden">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/[0.06]">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              排名
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              昵称
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
              金币
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => {
            const isTop3 = i < 3;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <tr
                key={u.id}
                className={`border-t border-black/[0.04] transition hover:bg-accent/[0.02] ${
                  isTop3 ? 'bg-accent/[0.03]' : ''
                }`}
              >
                <td className="px-5 py-3.5">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="font-medium text-zinc-400">{i + 1}</span>
                  )}
                </td>
                <td className={`px-5 py-3.5 font-medium ${isTop3 ? 'text-zinc-900' : 'text-zinc-600'}`}>
                  {u.nickname}
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-accent">
                  {u.points.toLocaleString('zh-CN')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
