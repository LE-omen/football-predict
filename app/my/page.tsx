'use client';
import { useEffect, useState } from 'react';
import type { PredictionHistoryItem } from '../../types/prediction';
import type { SafeUser } from '../../types/user';
import PredictionHistory from '../../components/PredictionHistory';

type Tx = { id: string; amount: number; reason: string; created_at: string };

export default function MyPage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [nicknameMsg, setNicknameMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/mypredictions').then((r) => (r.ok ? r.json() : { predictions: [] })),
      fetch('/api/points-history').then((r) => (r.ok ? r.json() : { transactions: [] })),
    ])
      .then(([me, p, t]) => {
        setUser(me?.user ?? null);
        setPredictions(p.predictions ?? []);
        setTxs(t.transactions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRename() {
    if (!nickname.trim()) return;
    setSaving(true);
    setNicknameMsg(null);
    try {
      const res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: nickname.trim() }) });
      const data = await res.json();
      if (res.ok) {
        setNicknameMsg({ type: 'ok', text: '昵称修改成功' });
        setUser((prev) => prev ? { ...prev, nickname: data.nickname } : prev);
      } else {
        setNicknameMsg({ type: 'err', text: data.error || '修改失败' });
      }
    } catch {
      setNicknameMsg({ type: 'err', text: '网络错误' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('确定要注销账号吗？此操作不可撤销，所有积分和预测记录将被删除。')) return;
    try {
      await fetch('/api/user', { method: 'DELETE' });
      window.location.href = '/';
    } catch {}
  }

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-gray-400">
        <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        <div className="text-sm">加载中…</div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 animate-fade-in">
      {/* 账号管理 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">👤 账号管理</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>当前昵称：</span>
            <span className="font-bold text-gray-900">{user?.nickname}</span>
            {user?.nickname_changed ? (
              <span className="text-xs text-gray-400">（已修改过）</span>
            ) : (
              <span className="text-xs text-green-500">（可修改 1 次）</span>
            )}
          </div>
          {!user?.nickname_changed && (
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="输入新昵称"
                className="input-field flex-1"
              />
              <button
                onClick={handleRename}
                disabled={saving || !nickname.trim()}
                className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {saving ? '保存中…' : '修改'}
              </button>
            </div>
          )}
          {nicknameMsg && (
            <div className={`text-xs font-medium ${nicknameMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {nicknameMsg.text}
            </div>
          )}
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleDeleteAccount}
              className="text-sm text-gray-400 hover:text-red-500 transition"
            >
              注销账号
            </button>
          </div>
        </div>
      </div>

      {/* 预测记录 */}
      <div>
        <h1 className="text-xl font-black text-gray-900 mb-4">📊 我的预测</h1>
        <PredictionHistory items={predictions} />
      </div>

      {/* 积分流水 */}
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-4">💰 积分流水</h2>
        {txs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">暂无流水</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">时间</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">类型</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400">变动</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {new Date(t.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{t.reason}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${t.amount >= 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {t.amount >= 0 ? '+' : ''}{t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}