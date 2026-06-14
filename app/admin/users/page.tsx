'use client';
import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';

type Row = { id: string; nickname: string; role: string; points: number };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/leaderboard').then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => setUsers([])).finally(() => setLoading(false)); }, []);

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">用户管理</h1>
        {loading ? <div className="text-white/60">加载中...</div> : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-white/70"><tr><th className="px-4 py-3">昵称</th><th className="px-4 py-3">角色</th><th className="px-4 py-3 text-right">金币</th></tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{u.nickname}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3 text-right">{u.points.toLocaleString('zh-CN')}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}