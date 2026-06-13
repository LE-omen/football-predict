'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDate, minutesBetween } from '../../../lib/utils';
import { LOCK_MINUTES_BEFORE_KICKOFF } from '../../../lib/constants';
import { marketOptionLabel } from '../../../types/market';
import type { MatchItem } from '../../../types/match';
import type { MarketItem } from '../../../types/market';
import type { MarketType } from '../../../types/database';

const MARKET_ORDER: MarketType[] = ['1x2', 'exact_score', 'total_goals', 'btts', 'ht_1x2'];

const SHORT_LABELS: Record<MarketType, string> = {
  '1x2': '胜平负',
  exact_score: '比分',
  total_goals: '进球数',
  btts: '双方进球',
  ht_1x2: '半场胜平负',
};

const QUICK_SCORES = [
  '0-0','1-0','0-1','1-1','2-0','0-2','2-1','1-2',
  '2-2','3-0','0-3','3-1','1-3','3-2','2-3','other',
];

function prettyOpt(type: MarketType, v: string): string {
  if (type === 'exact_score') return v === 'other' ? '其他' : v;
  return marketOptionLabel[v] ?? v;
}

// 获取某选项的赔率显示文字
function getOptionOdds(option_odds: Record<string, string> | undefined, option: string, fallbackMultiplier: number): string {
  if (option_odds && option_odds[option]) {
    const val = parseFloat(option_odds[option]);
    if (!isNaN(val) && val > 0) return val.toFixed(2);
  }
  return fallbackMultiplier.toFixed(2);
}

function MatchHeader({ match }: { match: MatchItem }) {
  const settled = match.status === 'settled';
  const score = settled && match.ft_home_goals != null ? `${match.ft_home_goals} : ${match.ft_away_goals}` : null;
  const halfScore = settled && match.ht_home_goals != null ? `(${match.ht_home_goals} : ${match.ht_away_goals})` : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-red-50 to-white p-6">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-500">{match.stage ?? '世界杯'}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <div className="flex-1 text-right">
          <div className="text-xl font-black text-gray-900">{match.home_team}</div>
        </div>
        <div className="flex flex-col items-center">
          {score ? (
            <>
              <div className="text-4xl font-black tracking-wider text-red-600">{score}</div>
              {halfScore && <div className="mt-1 text-xs text-gray-400">半场 {halfScore}</div>}
            </>
          ) : (
            <div className="text-xl font-black text-gray-300">VS</div>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xl font-black text-gray-900">{match.away_team}</div>
        </div>
      </div>
    </div>
  );
}

function OptionCell({
  label,
  oddsText,
  active,
  disabled,
  onClick,
}: {
  label: string;
  oddsText: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all ${
        active
          ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50/50'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="text-sm font-bold leading-tight">{label}</span>
      <span className={`mt-1 text-[11px] font-semibold ${active ? 'text-red-500' : 'text-red-400'}`}>
        {oddsText}
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
  const options =
    market.market_type === 'exact_score'
      ? QUICK_SCORES.filter((s) => market.options.includes(s))
      : market.options;

  let gridClass = 'grid-cols-3';
  if (market.market_type === 'total_goals') gridClass = 'grid-cols-4';
  if (market.market_type === 'exact_score') gridClass = 'grid-cols-4';
  if (market.market_type === 'btts') gridClass = 'grid-cols-2';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{shortLabel}</span>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500">
          参考指数
        </span>
      </div>
      <div className={`grid ${gridClass} gap-2`}>
        {options.map((opt) => (
          <OptionCell
            key={opt}
            label={prettyOpt(market.market_type, opt)}
            oddsText={getOptionOdds(market.option_odds, opt, market.multiplier)}
            active={selectedOption === opt}
            disabled={locked}
            onClick={() => onSelect(opt)}
          />
        ))}
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [showStakePanel, setShowStakePanel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { type: 'ok' | 'err'; text: string } | null>>({});

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
    if (!match) return false;
    if (match.status === 'locked' || match.status === 'settled') return true;
    if (match.status !== 'scheduled') return true;
    return minutesBetween(new Date(), new Date(match.start_time)) <= LOCK_MINUTES_BEFORE_KICKOFF;
  }, [match]);

  const sortedMarkets = useMemo(() => {
    return [...markets].sort(
      (a, b) => MARKET_ORDER.indexOf(a.market_type) - MARKET_ORDER.indexOf(b.market_type),
    );
  }, [markets]);

  async function handleSubmit(marketId: string) {
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
        setMsg((prev) => ({
          ...prev,
          [marketId]: { type: 'ok', text: `投入 ${stake} 积分成功！` },
        }));
        // Refresh user points
        fetch('/api/auth/me').then((r) => r.json()).catch(() => {});
      } else {
        setMsg((prev) => ({
          ...prev,
          [marketId]: { type: 'err', text: data.error || '提交失败' },
        }));
      }
    } catch {
      setMsg((prev) => ({ ...prev, [marketId]: { type: 'err', text: '网络错误' } }));
    } finally {
      setSubmitting(null);
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-gray-400">加载中...</div>
    );
  if (!match)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-red-500">比赛不存在</div>
    );

  const isSettled = match.status === 'settled';
  const isLocked = match.status === 'locked' || locked;
  const canPredict = match.status === 'scheduled' && !isLocked;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
      >
        ← 返回赛程
      </button>

      <MatchHeader match={match} />

      {isLocked && !isSettled && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⏰ 本场已锁定，不能继续参与预测
        </div>
      )}
      {isSettled && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          ✅ 本场已结算
        </div>
      )}
      {canPredict && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          🎯 选择预测项目和选项，投入积分参与预测
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sortedMarkets.map((m) => (
          <div key={m.id}>
            <MarketSection
              market={m}
              selectedOption={selected[m.id] ?? null}
              onSelect={(v) => {
                setSelected((p) => ({ ...p, [m.id]: v }));
                if (!stakes[m.id]) setStakes((p) => ({ ...p, [m.id]: 200 }));
                setShowStakePanel(m.id);
              }}
              locked={isLocked}
            />
            {selected[m.id] && showStakePanel === m.id && canPredict && (
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    已选: {prettyOpt(m.market_type, selected[m.id]!)}
                  </span>
                  <span className="text-xl font-black text-red-600">
                    {stakes[m.id] ?? 200} 积分
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {[100, 200, 500, 1000, 2000, 5000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setStakes((p) => ({ ...p, [m.id]: v }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          (stakes[m.id] ?? 200) === v
                            ? 'bg-red-600 text-white'
                            : 'border border-gray-200 bg-white text-gray-600 hover:border-red-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={submitting === m.id || !selected[m.id]}
                    onClick={() => handleSubmit(m.id)}
                    className="shrink-0 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting === m.id ? '提交中...' : '确认预测'}
                  </button>
                </div>
                {msg[m.id] && (
                  <div
                    className={`mt-2 text-xs font-medium ${
                      msg[m.id]!.type === 'ok' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {msg[m.id]!.text}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}