'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDate, minutesBetween } from '../../../lib/utils';
import { LOCK_MINUTES_BEFORE_KICKOFF, STAKE_MIN, STAKE_MAX, STAKE_STEP } from '../../../lib/constants';
import { marketTypeLabel, marketOptionLabel } from '../../../types/market';
import type { MatchItem } from '../../../types/match';
import type { MarketItem } from '../../../types/market';
import type { MarketType } from '../../../types/database';

/* ------------------------------------------------------------------ */
/*  Market ordering & option layouts                                   */
/* ------------------------------------------------------------------ */

const MARKET_ORDER: MarketType[] = ['1x2', 'exact_score', 'total_goals', 'btts', 'ht_1x2'];

const SHORT_LABELS: Record<MarketType, string> = {
  '1x2': '胜平负',
  exact_score: '比分',
  total_goals: '进球数',
  btts: '双方进球',
  ht_1x2: '半全场',
};

function optLabel(v: string): string {
  return marketOptionLabel[v] ?? v;
}

/* Pretty option label with special formatting */
function prettyOpt(type: MarketType, v: string): string {
  if (type === '1x2' || type === 'ht_1x2') {
    return optLabel(v); // 主胜/平/客胜
  }
  if (type === 'total_goals') {
    return optLabel(v); // 大于2.5 / 小于2.5
  }
  if (type === 'btts') {
    return optLabel(v); // 是/否
  }
  if (type === 'exact_score') {
    return v === 'other' ? '其他比分' : v; // 2-1, 0-0, etc
  }
  return optLabel(v);
}

/* For exact_score, only show a curated subset on the main card */
const QUICK_SCORES = ['1-0', '0-1', '1-1', '2-1', '1-2', '2-0', '0-2', '2-2', '3-1', '1-3', '3-0', '0-3', '0-0', 'other'];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MatchHeader({ match }: { match: MatchItem }) {
  const settled = match.status === 'settled';
  const score = settled && match.ft_home_goals != null
    ? `${match.ft_home_goals} : ${match.ft_away_goals}`
    : null;
  const halfScore = settled && match.ht_home_goals != null
    ? `(${match.ht_home_goals} : ${match.ht_away_goals})`
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/30 to-gray-900/50 p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-white/50">
        <span>{match.league ?? '世界杯'} {match.stage ?? ''}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-right">
          <div className="text-xl font-bold">{match.home_team}</div>
        </div>
        <div className="flex flex-col items-center">
          {score ? (
            <>
              <div className="text-3xl font-black tracking-wider text-emerald-300">{score}</div>
              {halfScore && <div className="mt-0.5 text-xs text-white/40">半场 {halfScore}</div>}
            </>
          ) : (
            <div className="text-lg text-white/40">VS</div>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xl font-bold">{match.away_team}</div>
        </div>
      </div>
      {match.venue && (
        <div className="mt-2 text-center text-xs text-white/30">📍 {match.venue}</div>
      )}
    </div>
  );
}

function OptionCell({
  label,
  multiplier,
  active,
  disabled,
  onClick,
}: {
  label: string;
  multiplier: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
        active
          ? 'border-orange-400 bg-orange-500/25 text-orange-200 shadow-lg shadow-orange-500/10'
          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className={`mt-0.5 text-[11px] font-semibold ${active ? 'text-orange-300' : 'text-emerald-400'}`}>
        {multiplier.toFixed(2)}
      </span>
    </button>
  );
}

function MarketSection({
  market,
  selectedOption,
  onSelect,
  locked,
}: {
  market: MarketItem;
  selectedOption: string | null;
  onSelect: (v: string) => void;
  locked: boolean;
}) {
  const shortLabel = SHORT_LABELS[market.market_type] ?? market.title;
  const options = market.market_type === 'exact_score'
    ? QUICK_SCORES.filter((s) => market.options.includes(s))
    : market.options;

  // Grid columns: 3 for 1x2/btts/ht_1x2, 2 for total_goals, 4 for exact_score
  let gridClass = 'grid-cols-3';
  if (market.market_type === 'total_goals') gridClass = 'grid-cols-2';
  if (market.market_type === 'exact_score') gridClass = 'grid-cols-4';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-white/90">{shortLabel}</span>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
          参考指数
        </span>
      </div>
      <div className={`grid ${gridClass} gap-1.5`}>
        {options.map((opt) => (
          <OptionCell
            key={opt}
            label={prettyOpt(market.market_type, opt)}
            multiplier={market.multiplier}
            active={selectedOption === opt}
            disabled={locked}
            onClick={() => onSelect(opt)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-market selections
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  // Per-market stake
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { type: 'ok' | 'err'; text: string } | null>>({});
  const [showStakePanel, setShowStakePanel] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMatch(d.match ?? null);
        setMarkets(d.markets ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const locked = useMemo(() => {
    if (!match) return true;
    if (match.status !== 'scheduled') return true;
    return minutesBetween(new Date(), new Date(match.start_time)) <= LOCK_MINUTES_BEFORE_KICKOFF;
  }, [match]);

  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => MARKET_ORDER.indexOf(a.market_type) - MARKET_ORDER.indexOf(b.market_type));
  }, [markets]);

  // Total stake used for this match
  const totalStakeUsed = useMemo(() => {
    return Object.values(stakes).reduce((s, v) => s + v, 0);
  }, [stakes]);

  async function handleSubmit(marketId: string, marketType: MarketType) {
    const selectedOption = selected[marketId];
    const stake = stakes[marketId] ?? 200;
    if (!selectedOption) return;
    setSubmitting(marketId);
    setMsg((prev) => ({ ...prev, [marketId]: null }));
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id, marketId, selectedOption, stakePoints: stake }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg((prev) => ({ ...prev, [marketId]: { type: 'ok', text: `投入 ${stake} 积分成功！` } }));
        // Refresh match data to update points
        fetch('/api/auth/me').then((r) => r.json()).catch(() => {});
      } else {
        setMsg((prev) => ({ ...prev, [marketId]: { type: 'err', text: data.error || '提交失败' } }));
      }
    } catch {
      setMsg((prev) => ({ ...prev, [marketId]: { type: 'err', text: '网络错误' } }));
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center text-white/50">加载中...</div>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center text-red-400">比赛不存在</div>
      </div>
    );
  }

  const isSettled = match.status === 'settled';
  const isLocked = match.status === 'locked' || locked;
  const canPredict = match.status === 'scheduled' && !isLocked;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-white/50 hover:text-white/80"
      >
        ← 返回赛程
      </button>

      {/* Match Header */}
      <MatchHeader match={match} />

      {/* Status banners */}
      {isLocked && !isSettled && (
        <div className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          ⏰ 本场已锁定，不能继续参与预测
        </div>
      )}
      {isSettled && (
        <div className="mt-3 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/50">
          ✅ 本场已结算
        </div>
      )}
      {canPredict && (
        <div className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          🎯 选择预测项目和选项，投入积分参与预测
        </div>
      )}

      {/* Markets grid */}
      <div className="mt-4 space-y-3">
        {sortedMarkets.map((m) => (
          <div key={m.id}>
            <MarketSection
              market={m}
              selectedOption={selected[m.id] ?? null}
              onSelect={(v) => {
                setSelected((p) => ({ ...p, [m.id]: v }));
                // Show stake panel when option selected
                if (!stakes[m.id]) setStakes((p) => ({ ...p, [m.id]: 200 }));
                setShowStakePanel(m.id);
              }}
              locked={isLocked}
            />
            {/* Stake & Submit area for this market */}
            {selected[m.id] && showStakePanel === m.id && canPredict && (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/60">投入积分</span>
                  <span className="font-bold text-emerald-300">{stakes[m.id] ?? 200}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 flex-wrap gap-1">
                    {[100, 200, 500, 1000, 2000, 5000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setStakes((p) => ({ ...p, [m.id]: v }))}
                        className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                          (stakes[m.id] ?? 200) === v
                            ? 'bg-emerald-500/30 text-emerald-200'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={submitting === m.id || !selected[m.id]}
                    onClick={() => handleSubmit(m.id, m.market_type)}
                    className="shrink-0 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting === m.id ? '提交中...' : '确认预测'}
                  </button>
                </div>
                {msg[m.id] && (
                  <div className={`mt-2 text-xs ${msg[m.id]!.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {msg[m.id]!.text}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sync info */}
      {match.last_synced_at && (
        <div className="mt-4 text-right text-[10px] text-white/20">
          参考指数更新: {formatDate(match.last_synced_at)}
        </div>
      )}
    </div>
  );
}