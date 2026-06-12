'use client';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';

export default function AdminIndexPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">管理后台</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/admin/matches" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <div className="text-lg font-semibold">比赛管理</div>
            <div className="mt-1 text-sm text-white/60">新增比赛、录入比分、结算</div>
          </Link>
          <Link href="/admin/users" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <div className="text-lg font-semibold">用户管理</div>
            <div className="mt-1 text-sm text-white/60">查看用户与积分</div>
          </Link>
        </div>
      </div>
    </AdminGuard>
  );
}