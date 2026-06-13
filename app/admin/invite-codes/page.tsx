'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminGuard from '../../../components/AdminGuard';

interface InviteCode {
  id: string;
  code: string;
  is_active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [batchCount, setBatchCount] = useState(10);
  const [prefix, setPrefix] = useState('WC');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await fetch('/api/admin/invite-codes');
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const available = codes.filter(c => c.is_active && !c.used_by);
  const used = codes.filter(c => !c.is_active || c.used_by);

  async function handleCreateSingle() {
    if (!newCode.trim()) return;
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: `邀请码 "${data.code.code}" 创建成功` });
        setNewCode('');
        fetchCodes();
      } else {
        setMsg({ type: 'err', text: data.error || '创建失败' });
      }
    } catch {
      setMsg({ type: 'err', text: '网络错误' });
    } finally {
      setCreating(false);
    }
  }

  async function handleBatchCreate() {
    setCreating(true);
    setMsg(null);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < batchCount; i++) {
      const code = `${prefix}${String(Date.now()).slice(-6)}${String.fromCharCode(65 + (i % 26))}`;
      try {
        const res = await fetch('/api/admin/invite-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setMsg({ type: 'ok', text: `批量生成完成：成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}` });
    setCreating(false);
    fetchCodes();
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-4 py-10 animate-fade-in">
        <h1 className="text-2xl font-black text-gray-900 mb-6">🎟️ 邀请码管理</h1>

        {/* 单个创建 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">创建单个邀请码</h2>
          <div className="flex gap-2">
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="输入邀请码内容"
              className="input-field flex-1"
            />
            <button
              onClick={handleCreateSingle}
              disabled={creating || !newCode.trim()}
              className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </div>

        {/* 批量生成 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">批量生成邀请码</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">前缀</span>
              <input
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="input-field w-20 text-center"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">数量</span>
              <input
                type="number"
                min={1}
                max={100}
                value={batchCount}
                onChange={e => setBatchCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="input-field w-20 text-center"
              />
            </div>
            <button
              onClick={handleBatchCreate}
              disabled={creating}
              className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm hover:bg-red-600 transition disabled:opacity-50"
            >
              {creating ? '生成中…' : '批量生成'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">格式：{prefix} + 时间戳 + 序号字母，如 {prefix}123456A</p>
        </div>

        {msg && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            msg.type === 'ok' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {msg.text}
          </div>
        )}

        {/* 统计 */}
        <div className="flex gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-black text-green-500">{available.length}</div>
            <div className="text-xs text-gray-400">可用</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-black text-gray-400">{used.length}</div>
            <div className="text-xs text-gray-400">已使用</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-black text-gray-900">{codes.length}</div>
            <div className="text-xs text-gray-400">总计</div>
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="py-10 text-center text-gray-400">加载中…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-gray-400 text-xs">
                    <th className="py-2 px-4 text-left">邀请码</th>
                    <th className="py-2 px-4 text-center">状态</th>
                    <th className="py-2 px-4 text-right">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} className="border-t border-gray-50">
                      <td className="py-2 px-4 font-mono font-bold text-gray-900">{c.code}</td>
                      <td className="py-2 px-4 text-center">
                        {c.is_active && !c.used_by ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 text-[11px] font-semibold">可用</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 text-[11px] font-semibold">已使用</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-400 text-xs">{new Date(c.created_at).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}