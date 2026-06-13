'use client';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';

export default function AdminIndexPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10 animate-fade-in">
        <h1 className="section-title mb-6">🛡️ 管理后台</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/admin/matches" className="glass-card group p-6">
            <div className="text-lg font-bold text-zinc-900 group-hover:text-accent transition-colors">比赛管理</div>
            <div className="mt-1 text-sm text-zinc-400">新增比赛、录入比分、结算</div>
          </Link>
          <Link href="/admin/users" className="glass-card group p-6">
            <div className="text-lg font-bold text-zinc-900 group-hover:text-accent transition-colors">用户管理</div>
            <div className="mt-1 text-sm text-zinc-400">查看用户与积分</div>
          </Link>
        </div>
      </div>
    </AdminGuard>
  );
}
