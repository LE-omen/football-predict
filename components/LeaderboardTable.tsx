'use client';

type Row = { id: string; nickname: string; points: number };
type Props = { users: Row[] };

export default function LeaderboardTable({ users }: Props) {
  if (!users.length) return <div className="text-white/60">暂无数据</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-white/70">
          <tr><th className="px-4 py-3">排名</th><th className="px-4 py-3">昵称</th><th className="px-4 py-3 text-right">积分</th></tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} className="border-t border-white/10">
              <td className="px-4 py-3">{i + 1}</td>
              <td className="px-4 py-3">{u.nickname}</td>
              <td className="px-4 py-3 text-right">{u.points.toLocaleString('zh-CN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}