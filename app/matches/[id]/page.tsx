'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDate } from '../../../lib/utils';
import TeamFlag from '../../../components/TeamFlag';
import { getTeamRank } from '../../../lib/rankings';
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
  'ht_1x2': '半场胜平负',
};

// 完整比分网格：7列5行，按用户要求排列
const SCORE_GRID: (string | null)[][] = [
  ['1-0', '2-0', '2-1', '3-0', '3-1', '3-2', '4-0'],
  ['4-1', '4-2', '5-0', '5-1', '5-2', 'other_home', '0-0'],
  ['1-1', '2-2', '3-3', 'other_draw', '0-1', '0-2', '1-2'],
  ['0-3', '1-3', '2-3', '0-4', '1-4', '2-4', '0-5'],
  ['1-5', '2-5', 'other_away', null, null, null, null],
];

function prettyOpt(type: MarketType, v: string): string {
  if (type === 'exact_score') return v === 'other' ? '其他' : v;
  return marketOptionLabel[v] ?? v;
}

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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-500">{match.stage ?? '世界杯'}</span>
        <span>{formatDate(match.start_time)}</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <div className="flex-1 text-right">
          <div className="text-xl font-black text-gray-900"><span className="text-xs text-red-400 font-bold mr-1">{getTeamRank(match.home_team) ? `No.${getTeamRank(match.home_team)}` : ""}</span><span className="mr-1.5"><TeamFlag team={match.home_team} /></span>{match.home_team}</div>
        </div>
        <div className="flex flex-col items-center">
          {score ? (
            <>
              <div className="text-4xl font-black tracking-wider text-red-500">{score}</div>
              {halfScore && <div className="mt-1 text-xs text-gray-400">半场 {halfScore}</div>}
            </>
          ) : (
            <div className="text-xl font-black text-gray-300">VS</div>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xl font-black text-gray-900">{match.away_team}<span className="ml-1.5"><TeamFlag team={match.away_team} /></span><span className="text-xs text-red-400 font-bold ml-1">{getTeamRank(match.away_team) ? `No.${getTeamRank(match.away_team)}` : ""}</span></div>
        </div>
      </div>
    </div>
  );
}

function ScoreGrid({
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
  const option_odds = market.option_odds ?? {};

  const getOdds = (key: string) => {
    const val = option_odds[key];
    if (val) {
      const num = parseFloat(val);
      return isNaN(num) ? '-' : num.toFixed(2);
    }
    return '-';
  };

  const labelMap: Record<string, string> = {
    'other_home': '胜其他',
    'other_draw': '平其他',
    'other_away': '负其他',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">比分</span>
        <span className="text-[10px] text-gray-400">参考指数</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr>
              <th className="py-1 px-0.5 text-gray-400 text-[10px] font-medium" colSpan={7}>全场比分</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_GRID.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => {
                  if (cell === null) {
                    return <td key={colIdx} className="py-1 px-0.5" />;
                  }
                  const active = selectedOption === cell;
                  const isOther = cell.startsWith('other_');
                  // 主胜(红) 平局(灰) 客胜(蓝) 颜色区分
                  let bgClass = 'bg-gray-50 text-gray-700 hover:bg-gray-100';
                  let oddsColor = 'text-red-500';
                  if (isOther || (!isOther && cell.split('-')[0] > cell.split('-')[1])) {
                    bgClass = active ? 'bg-red-500 text-white' : 'bg-red-50 text-gray-700 hover:bg-red-100';
                    oddsColor = active ? 'text-white/80' : 'text-red-500';
                  } else if (!isOther && cell.split('-')[0] === cell.split('-')[1]) {
                    bgClass = active ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                    oddsColor = active ? 'text-white/80' : 'text-gray-500';
                  } else {
                    bgClass = active ? 'bg-blue-500 text-white' : 'bg-blue-50 text-gray-700 hover:bg-blue-100';
                    oddsColor = active ? 'text-white/80' : 'text-blue-500';
                  }

                  return (
                    <td key={colIdx} className="py-1 px-0.5">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => onSelect(cell)}
                        className={`w-full rounded-lg px-0.5 py-1.5 text-center transition-all ${bgClass} disabled:cursor-not-allowed disabled:opacity-30`}
                      >
                        <div className="font-bold text-[11px] leading-tight">{labelMap[cell] ?? cell}</div>
                        <div className={`text-[10px] mt-0.5 ${oddsColor}`}>
                          {getOdds(cell)}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

  if (market.market_type === 'exact_score') {
    return (
      <ScoreGrid
        market={market}
        selectedOption={selectedOption}
        onSelect={onSelect}
        locked={locked}
      />
    );
  }

  let gridClass = 'grid-cols-3';
  if (market.market_type === 'total_goals') gridClass = 'grid-cols-4';
  if (market.market_type === 'btts') gridClass = 'grid-cols-2';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{shortLabel}</span>
        <span className="text-[10px] text-gray-400">参考指数</span>
      </div>
      <div className={`grid ${gridClass} gap-2`}>
        {market.options.map((opt) => {
          const odds = getOptionOdds(market.option_odds, opt, market.multiplier);
          const active = selectedOption === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              onClick={() => onSelect(opt)}
              className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all ${
                active
                  ? 'border-red-500 bg-red-50 text-red-600 shadow-sm'
                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-red-200 hover:bg-red-50/50'
              } disabled:cursor-not-allowed disabled:opacity-30`}
            >
              <span className="text-sm font-bold leading-tight">{prettyOpt(market.market_type, opt)}</span>
              <span className={`mt-1 text-[11px] font-semibold ${active ? 'text-red-500' : 'text-red-400'}`}>
                {odds}
              </span>
            </button>
          );
        })}
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
  const [customStake, setCustomStake] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { type: 'ok' | 'err'; text: string } | null>>({});
  const [activeTab, setActiveTab] = useState<MarketType>('1x2');

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMatch(d.match);
        setMarkets(d.markets ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const sortedMarkets = useMemo(() => {
    const map = new Map(markets.map((m) => [m.market_type, m]));
    return MARKET_ORDER.filter((t) => map.has(t)).map((t) => map.get(t)!);
  }, [markets]);

  const locked = useMemo(() => {
    if (!match) return false;
    const kickoff = new Date(match.start_time).getTime();
    const now = Date.now();
    return kickoff - now < 30 * 60 * 1000;
  }, [match]);

  const currentMarket = useMemo(() => {
    return sortedMarkets.find(m => m.market_type === activeTab);
  }, [sortedMarkets, activeTab]);

  async function handleSubmit(marketId: string) {
    const opt = selected[marketId];
    const customVal = customStake[marketId];
    const stake = customVal ? Number(customVal) : (stakes[marketId] ?? 200);
    if (!opt) return;
    setSubmitting(marketId);
    setMsg((p) => ({ ...p, [marketId]: null }));
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: marketId, selected_option: opt, stake_points: stake }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg((prev) => ({
          ...prev,
          [marketId]: { type: 'ok', text: `投入 ${stake} 金币成功！` },
        }));
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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-gray-400">
        <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        <div className="text-sm">加载中…</div>
      </div>
    );
  if (!match)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-red-500">比赛不存在</div>
    );

  const isSettled = match.status === 'settled';
  const isLocked = match.status === 'locked' || locked;
  const canPredict = match.status === 'scheduled' && !isLocked;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 animate-fade-in">
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900"
      >
        ← 返回赛程
      </button>

      <MatchHeader match={match} />

      {isLocked && !isSettled && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-600 animate-fade-in">
          ⏰ 本场已锁定，不能继续参与预测
        </div>
      )}
      {isSettled && (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500 animate-fade-in">
          ✅ 本场已结算
        </div>
      )}
      {canPredict && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500 animate-fade-in">
          🎯 选择预测项目和选项，投入金币参与预测
        </div>
      )}

      {/* Tab 切换 */}
      <div className="mt-5 flex gap-1 bg-gray-100 rounded-xl p-1">
        {sortedMarkets.map((m) => (
          <button
            key={m.market_type}
            onClick={() => setActiveTab(m.market_type)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              activeTab === m.market_type
                ? 'bg-white text-red-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {SHORT_LABELS[m.market_type] ?? m.title}
          </button>
        ))}
      </div>

      {/* 当前选中的市场 */}
      {currentMarket && (
        <div className="mt-4">
          <MarketSection
            market={currentMarket}
            selectedOption={selected[currentMarket.id] ?? null}
            onSelect={(v) => {
              setSelected((p) => ({ ...p, [currentMarket.id]: v }));
              if (!stakes[currentMarket.id]) setStakes((p) => ({ ...p, [currentMarket.id]: 200 }));
            }}
            locked={isLocked}
          />

          {selected[currentMarket.id] && canPredict && (
            <div className="bg-white rounded-2xl border border-gray-100 mt-3 p-4 shadow-sm animate-slide-up">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  已选: <span className="font-medium text-gray-900">{prettyOpt(currentMarket.market_type, selected[currentMarket.id]!)}</span>
                </span>
                <span className="text-xl font-black text-red-500">
                  🪙 {customStake[currentMarket.id] ? Number(customStake[currentMarket.id]).toLocaleString() : (stakes[currentMarket.id] ?? 200).toLocaleString()} 金币
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[100, 200, 500, 1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        setStakes((p) => ({ ...p, [currentMarket.id]: v }));
                        setCustomStake((p) => ({ ...p, [currentMarket.id]: '' }));
                      }}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-30 ${
                        (stakes[currentMarket.id] ?? 200) === v && !customStake[currentMarket.id]
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'border border-gray-100 bg-gray-50 text-gray-600 hover:border-red-200 hover:bg-red-50/50'
                      }`}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">任意</span>
                    <input
                      type="number"
                      min={100}
                      step={1}
                      placeholder="自定义"
                      value={customStake[currentMarket.id] ?? ''}
                      disabled={locked}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomStake((p) => ({ ...p, [currentMarket.id]: val }));
                        if (val) setStakes((p) => ({ ...p, [currentMarket.id]: Number(val) || 0 }));
                      }}
                      className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-bold text-gray-700 focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-300 disabled:opacity-30"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={submitting === currentMarket.id || !selected[currentMarket.id]}
                  onClick={() => handleSubmit(currentMarket.id)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting === currentMarket.id ? '提交中…' : '确认预测'}
                </button>
              </div>
              {msg[currentMarket.id] && msg[currentMarket.id]!.text && (
                <div
                  className={`mt-3 text-xs font-medium animate-fade-in ${
                    msg[currentMarket.id]!.type === 'ok' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {msg[currentMarket.id]!.text}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}