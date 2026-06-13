'use client';

type Row = { id: string; nickname: string; points: number };
type Props = { users: Row[] };

export default function LeaderboardTable({ users }: Props) {
  if (!users.length) return <div className="py-10 text-center text-gray-400">暂无数据</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-red-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">排名</th>
            <th className="px-4 py-3 font-semibold text-gray-700">昵称</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">积分</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} className={`border-t border-gray-100 ${i === 0 ? 'bg-red-50/50' : ''}`}>
              <td className="px-4 py-3">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{u.nickname}</td>
              <td className="px-4 py-3 text-right font-bold text-red-600">{u.points.toLocaleString('zh-CN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}