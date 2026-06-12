'use client';
import { useEffect, useState } from 'react';
import LeaderboardTable from '../../components/LeaderboardTable';

type Row = { id: string; nickname: string; points: number };

export default function LeaderboardPage() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/leaderboard').then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => setUsers([])).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">好友积分榜</h1>
      {loading ? <div className="text-white/60">加载中...</div> : <LeaderboardTable users={users} />}
    </div>
  );
}