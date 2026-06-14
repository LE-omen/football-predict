'use client';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';

export default function AdminIndexPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10 animate-fade-in">
        <h1 className="text-2xl font-black text-gray-900 mb-6">🛡️ 管理后台</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/admin/matches" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-red-200 transition-all">
            <div className="text-lg font-bold text-gray-900">⚽ 比赛管理</div>
            <div className="mt-1 text-sm text-gray-400">新增比赛、录入比分、结算</div>
          </Link>
          <Link href="/admin/users" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-red-200 transition-all">
            <div className="text-lg font-bold text-gray-900">👥 用户管理</div>
            <div className="mt-1 text-sm text-gray-400">查看用户与金币</div>
          </Link>
          <Link href="/admin/invite-codes" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-red-200 transition-all">
            <div className="text-lg font-bold text-gray-900">🎟️ 邀请码管理</div>
            <div className="mt-1 text-sm text-gray-400">生成和查看邀请码</div>
          </Link>
        </div>
      </div>
    </AdminGuard>
  );
}