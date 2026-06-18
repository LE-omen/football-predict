// lib/jobs/syncOdds.ts
// 独立的赔率同步流程（从 lazq 网页抓取数据写入 Supabase）
// 只处理赔率，不干涉赛程和比分

import * as fs from 'fs';
import * as path from 'path';
import { createAdminClient } from '../supabase/admin';

export interface SyncOddsResult {
  ok: boolean;
  message: string;
  rawFilesProcessed: number;
  oddsExtracted: number;
  marketsUpdated: number;
  errors: string[];
}

function parseCrsKey(key: string): string | null {
  if (key === 's1sa') return 'other_away';
  if (key === 's1sd') return 'other_draw';
  if (key === 's1sh') return 'other_home';
  const m = key.match(/^s(\d+)s(\d+)$/);
  if (!m) return null;
  return `${parseInt(m[1])}-${parseInt(m[2])}`;
}

function parseTtgKey(key: string): string | null {
  const m = key.match(/^s(\d+)$/);
  return m ? m[1] : null;
}

function extractOdds(match: Record<string, unknown>) {
  const result = { '1x2': {} as Record<string, string>, exact_score: {} as Record<string, string>, total_goals: {} as Record<string, string>, btts: {} as Record<string, string>, 'ht_1x2': {} as Record<string, string> };
  
  const had = match.had as Record<string, string> | undefined;
  if (had) { if (had.h) result['1x2'].home = had.h; if (had.d) result['1x2'].draw = had.d; if (had.a) result['1x2'].away = had.a; }
  
  const crs = match.crs as Record<string, string> | undefined;
  if (crs) { for (const [k, o] of Object.entries(crs)) { if (k === 'single') continue; const mapped = parseCrsKey(k); if (mapped) result.exact_score[mapped] = o; } }
  
  const ttg = match.ttg as Record<string, string> | undefined;
  if (ttg) { for (const [k, o] of Object.entries(ttg)) { if (k === 'single') continue; const g = parseTtgKey(k); if (g) result.total_goals[g] = o; } }
  
  if (crs) {
    let y = Infinity, n = Infinity;
    for (const [k, o] of Object.entries(crs)) {
      if (k === 'single' || k.startsWith('s1s')) continue;
      const m2 = k.match(/^s(\d+)s(\d+)$/);
      if (!m2) continue;
      const v = parseFloat(o);
      if (parseInt(m2[1]) > 0 && parseInt(m2[2]) > 0) { if (v < y) y = v; } else { if (v < n) n = v; }
    }
    if (y < Infinity) result.btts.yes = Math.max(1.20, y * 0.15).toFixed(2);
    if (n < Infinity) result.btts.no = Math.max(1.20, n * 0.25).toFixed(2);
    if (!result.btts.yes) result.btts.yes = '1.85';
    if (!result.btts.no) result.btts.no = '1.85';
  }
  
  const hafu = match.hafu as Record<string, string> | undefined;
  if (hafu) {
    const hh = Math.min(parseFloat(hafu.hh || '999'), parseFloat(hafu.ha || '999'), parseFloat(hafu.hd || '999'));
    const hd = Math.min(parseFloat(hafu.dh || '999'), parseFloat(hafu.da || '999'), parseFloat(hafu.dd || '999'));
    const ha = Math.min(parseFloat(hafu.ah || '999'), parseFloat(hafu.ad || '999'), parseFloat(hafu.aa || '999'));
    if (hh < 999) result['ht_1x2'].home = hh.toFixed(2);
    if (hd < 999) result['ht_1x2'].draw = hd.toFixed(2);
    if (ha < 999) result['ht_1x2'].away = ha.toFixed(2);
  }
  
  return result;
}

export async function runSyncOdds(): Promise<SyncOddsResult> {
  const result: SyncOddsResult = { ok: true, message: '', rawFilesProcessed: 0, oddsExtracted: 0, marketsUpdated: 0, errors: [] };
  
  // Step 1: Read all raw lazq files
  const rawDir = path.resolve(process.cwd(), 'data/raw/lazq');
  if (!fs.existsSync(rawDir)) {
    result.message = 'No raw data directory';
    return result;
  }
  
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    result.message = 'No raw data files';
    return result;
  }
  
  // Merge odds from all raw files
  const allOdds = new Map<string, Record<string, Record<string, string>>>();
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf-8'));
      for (const resp of raw) {
        if (!resp?.data || !Array.isArray(resp.data)) continue;
        for (const item of resp.data) {
          if (!(item.competitionName || '').includes('世界杯')) continue;
          if (!item.had && !item.crs && !item.ttg && !item.hafu) continue;
          const home = item.homeTeamName;
          const away = item.awayTeamName;
          if (!home || !away) continue;
          const odds = extractOdds(item);
          const hasAny = Object.values(odds).some(v => Object.keys(v).length > 0);
          if (hasAny) allOdds.set(home + ' vs ' + away, odds);
        }
      }
      result.rawFilesProcessed++;
    } catch (e) {
      result.errors.push(`File ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  
  result.oddsExtracted = allOdds.size;
  console.log(`Extracted odds for ${allOdds.size} matches from ${result.rawFilesProcessed} files`);
  
  if (allOdds.size === 0) {
    result.message = 'No odds data found in raw files';
    return result;
  }
  
  // Step 2: Backfill markets from Supabase
  const admin = createAdminClient();
  
  const { data: matches } = await admin.from('matches').select('id, home_team, away_team');
  if (!matches) {
    result.errors.push('Failed to fetch matches');
    result.ok = false;
    return result;
  }
  
  const { data: markets } = await admin.from('markets').select('id, match_id, market_type');
  if (!markets) {
    result.errors.push('Failed to fetch markets');
    result.ok = false;
    return result;
  }
  
  const mktByMatch = new Map<string, Record<string, string>>();
  for (const m of markets) {
    if (!mktByMatch.has(m.match_id)) mktByMatch.set(m.match_id, {});
    mktByMatch.get(m.match_id)![m.market_type] = m.id;
  }
  
  let updated = 0;
  for (const match of matches) {
    const odds = allOdds.get(match.home_team + ' vs ' + match.away_team);
    if (!odds) continue;
    const mkts = mktByMatch.get(match.id);
    if (!mkts) continue;
    for (const mt of ['1x2', 'exact_score', 'total_goals', 'btts', 'ht_1x2'] as const) {
      const mktId = mkts[mt];
      if (!mktId) continue;
      const optOdds = odds[mt];
      if (!optOdds || Object.keys(optOdds).length === 0) continue;
      const values = Object.values(optOdds).map(Number).filter(v => !isNaN(v) && v > 0);
      const defaultMult = values.length > 0 ? Math.min(...values) : 1.8;
      await admin.from('markets').update({ option_odds: optOdds, multiplier: defaultMult }).eq('id', mktId);
      updated++;
    }
  }
  
  result.marketsUpdated = updated;
  result.message = `Processed ${result.rawFilesProcessed} files, extracted ${result.oddsExtracted} matches, updated ${result.marketsUpdated} markets`;
  
  if (result.errors.length > 0) result.ok = false;
  return result;
}
