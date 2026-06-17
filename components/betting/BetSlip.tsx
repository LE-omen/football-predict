'use client';
import { useState, useMemo, useEffect } from 'react';
import { useBetSlip } from '../../lib/betSlipContext';
import { calculateFullParlay, getAvailablePassTypes, getPassTypeLineCount, PASS_TYPE_MAP } from '../../lib/parlay';

export default function BetSlip() {
  const { matches, removeOption, removeMatch, clearAll, toSelectedMatches, matchCount } = useBetSlip();
  const [stakePerLine, setStakePerLine] = useState(100);
  const [multiple, setMultiple] = useState(1);
  const [selectedPasses, setSelectedPasses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  // 可用过关方式
  const availablePasses = useMemo(() => {
    if (matchCount < 2) return [];
    const marketTypes = Array.from(new Set(matches.map(m => m.marketType)));
    return getAvailablePassTypes(matchCount, marketTypes);
  }, [matchCount, matches]);

  // 默认选中所有自由过关
  useEffect(() => {
    if (matchCount >= 2) {
      const freePasses = availablePasses.filter(p => p.endsWith('x1'));
      setSelectedPasses(freePasses);
    } else {
      setSelectedPasses([]);
    }
  }, [availablePasses, matchCount]);

  // 计算预览
  const preview = useMemo(() => {
    if (matchCount < 2 || selectedPasses.length === 0) return null;
    const selectedMatches = toSelectedMatches();
    try {
      return calculateFullParlay({ selectedMatches, passTypes: selectedPasses, stakePerLine, multiple });
    } catch { return null; }
  }, [matchCount, selectedPasses, stakePerLine, multiple, toSelectedMatches]);

  async function handleSubmit() {
    if (matchCount < 2 || !preview) return;
    setSubmitting(true); setMsg(null);
    try {
      const selectedMatches = toSelectedMatches();
      const res = await fetch('/api/bets/parlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedMatches, passTypes: selectedPasses, stakePerLine, multiple }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error || 'submit failed', type: 'err' }); }
      else { setMsg({ text: `success! cost ${data.totalStake}`, type: 'ok' }); clearAll(); }
    } catch { setMsg({ text: 'network error', type: 'err' }); }
    finally { setSubmitting(false); }
  }

  if (matchCount === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-gray-400">
        <div className="text-3xl mb-2">📋</div>
        <div className="text-sm">点击赔率添加到投注单</div>
        <div className="mt-1 text-xs">选择 2 场以上可开启串关</div>
      </div>
    );
  }

  // 按比赛分组显示
  const uniqueMatches = Array.from(new Map(matches.map(m => [m.matchId, m])).values());

  return (
    <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between">
        <div className="text-white font-bold text-sm">
          🎯 投注单
          <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">已选 {matchCount} 场</span>
        </div>
        <button onClick={clearAll} className="text-white/70 hover:text-white text-xs">清空</button>
      </div>

      {/* 已选比赛 */}
      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
        {uniqueMatches.map(m => (
          <div key={m.matchId} className="px-4 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400 truncate flex-1">{m.matchTitle}</div>
              <button onClick={() => removeMatch(m.matchId)} className="text-gray-300 hover:text-red-400 text-xs ml-2">×</button>
            </div>
            {matches.filter(x => x.matchId === m.matchId).map(group => (
              <div key={group.marketType} className="flex flex-wrap gap-1 mt-1">
                {group.options.map(opt => (
                  <button
                    key={opt.selection}
                    onClick={() => removeOption(group.matchId, group.marketType, opt.selection)}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100"
                  >
                    {opt.label} {opt.odds.toFixed(2)}
                    <span className="text-red-300">×</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 过关方式 */}
      {matchCount >= 2 && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="text-xs text-gray-400 mb-2">过关方式</div>
          <div className="flex flex-wrap gap-1.5">
            {/* 自由过关 */}
            {availablePasses.filter(p => p.endsWith('x1')).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPasses(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  selectedPasses.includes(p) ? 'bg-red-500 text-white' : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300'
                }`}
              >
                {p}
              </button>
            ))}
            {/* M串N */}
            {availablePasses.filter(p => !p.endsWith('x1')).map(p => {
              const lines = getPassTypeLineCount(matchCount, p);
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPasses(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedPasses.includes(p) ? 'bg-amber-500 text-white' : 'border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                  }`}
                  title={`${lines} 注`}
                >
                  {p} <span className="opacity-60">({lines})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 金币输入 */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">每注金币</span>
          <span className="text-xs text-gray-400">倍数</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {[100, 200, 500, 1000, 2000, 5000].map(v => (
              <button key={v} onClick={() => setStakePerLine(v)}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                  stakePerLine === v ? 'bg-red-500 text-white' : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300'
                }`}>{v}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMultiple(Math.max(1, multiple - 1))} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold">-</button>
            <span className="w-8 text-center text-sm font-bold text-gray-900">{multiple}</span>
            <button onClick={() => setMultiple(multiple + 1)} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold">+</button>
          </div>
        </div>
        <div className="mt-2">
          <input type="number" min={100} step={100} placeholder="自定义金额"
            value={stakePerLine >= 100 && ![100,200,500,1000,2000,5000].includes(stakePerLine) ? stakePerLine : ''}
            onChange={e => { const v = Number(e.target.value); if (v > 0) setStakePerLine(v); }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:border-red-300 focus:outline-none"
          />
        </div>
      </div>

      {/* 预览 */}
      {preview && preview.numberOfLines > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><div className="text-gray-400">注数</div><div className="font-bold text-gray-900 text-sm">{preview.numberOfLines}</div></div>
            <div><div className="text-gray-400">总花费</div><div className="font-bold text-red-500 text-sm">🪙 {preview.totalStake.toLocaleString()}</div></div>
            <div><div className="text-gray-400">最高回报</div><div className="font-bold text-green-600 text-sm">🪙 {Math.round(preview.maxPotentialReturn).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      {/* 提交 */}
      <div className="border-t border-gray-100 p-4">
        <button onClick={handleSubmit} disabled={submitting || !preview || preview.numberOfLines === 0}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl py-3 text-sm shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? '提交中...' : `确认投注 🪙 ${preview?.totalStake?.toLocaleString() ?? 0}`}
        </button>
        {msg && <div className={`mt-2 text-xs text-center font-medium ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</div>}
      </div>
    </div>
  );
}
