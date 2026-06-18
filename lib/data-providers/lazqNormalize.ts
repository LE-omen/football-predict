// lib/data-providers/lazqNormalize.ts
// Normalizes raw lazq scraper/API output into the NormalizedMatch format.
// Only includes World Cup matches (competitionName contains '世界杯').
// Also extracts per-option odds for all 5 market types.

import * as fs from 'fs';
import * as path from 'path';
import { extractOdds, type ExtractedOdds } from './lazqOddsExtractor';

export interface NormalizedMatch {
  externalProvider: 'lazq';
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  state: number;
  odds: ExtractedOdds;
  rawJson: unknown;
}

const NORMALIZED_PATH = path.resolve(process.cwd(), 'data/normalized/lazq-matches.json');

/** Determine whether a match belongs to the World Cup. */
function isWorldCup(obj: Record<string, unknown>): boolean {
  const comp = (obj.competitionName ?? obj.kindName ?? '') as string;
  return comp.includes('世界杯');
}

/** Convert a lazq unix-timestamp (seconds) to ISO string. */
function toISO(ts: unknown): string {
  if (typeof ts === 'number' && ts > 0) return new Date(ts * 1000).toISOString();
  if (typeof ts === 'string' && !Number.isNaN(Number(ts))) return new Date(Number(ts) * 1000).toISOString();
  return new Date().toISOString();
}

/** Parse a score string like "2" into number, null if missing. */
function parseScore(val: unknown): number | null {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) return Number(val);
  return null;
}

/** Convert typed object to Record<string, unknown> for extractOdds */
function toRecord(obj: unknown): Record<string, unknown> {
  if (obj && typeof obj === 'object') {
    return { ...(obj as Record<string, unknown>) };
  }
  return {};
}

/** Extract NormalizedMatch from API match object. */
function normalizeApiMatch(
  obj: Record<string, unknown>,
  teamMap: Map<string, string>,
  roundMap: Map<number, string>,
): NormalizedMatch | null {
  const externalId = String(obj.id ?? '');
  if (!externalId) return null;

  const homeIdx = String(obj.h ?? '');
  const awayIdx = String(obj.a ?? '');
  const homeTeam = teamMap.get(homeIdx) ?? `Team#${homeIdx}`;
  const awayTeam = teamMap.get(awayIdx) ?? `Team#${awayIdx}`;

  const sc = obj.sc as string[] | undefined;
  const homeScore = sc ? parseScore(sc[0]) : null;
  const awayScore = sc ? parseScore(sc[1]) : null;
  const halfHomeScore = sc ? parseScore(sc[2]) : null;
  const halfAwayScore = sc ? parseScore(sc[3]) : null;

  const state = typeof obj.s === 'number' ? obj.s : 0;
  const startTime = toISO(obj.t);
  
  let stage = '世界杯';
  const kindId = obj.kindId as number | undefined;
  if (kindId && roundMap.has(kindId)) {
    stage = roundMap.get(kindId)!;
  }

  const odds = extractOdds(toRecord(obj));

  return {
    externalProvider: 'lazq',
    externalId,
    homeTeam,
    awayTeam,
    startTime,
    stage,
    homeScore,
    awayScore,
    halfHomeScore,
    halfAwayScore,
    state,
    odds,
    rawJson: obj,
  };
}

/** Extract NormalizedMatch from scraper-style object (homeTeamName, competitionName). */
function normalizeScraperMatch(obj: Record<string, unknown>): NormalizedMatch | null {
  if (!isWorldCup(obj)) return null;

  const externalId = String(obj.gameId ?? obj.id ?? '');
  if (!externalId) return null;

  const homeTeam = String(obj.homeTeamName ?? '');
  const awayTeam = String(obj.awayTeamName ?? '');

  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let halfHomeScore: number | null = null;
  let halfAwayScore: number | null = null;

  if (Array.isArray(obj.sc)) {
    homeScore = parseScore(obj.sc[0]);
    awayScore = parseScore(obj.sc[1]);
    halfHomeScore = parseScore(obj.sc[2]);
    halfAwayScore = parseScore(obj.sc[3]);
  } else {
    homeScore = parseScore(obj.homeScore);
    awayScore = parseScore(obj.awayScore);
    halfHomeScore = parseScore(obj.homeHalfScore);
    halfAwayScore = parseScore(obj.awayHalfScore);
  }

  const state = typeof obj.state === 'number' ? obj.state : 0;
  const startTime = toISO(obj.matchTime ?? obj.startTime);
  const stage = (obj.competitionName as string) ?? '世界杯';

  const odds = extractOdds(obj);

  return {
    externalProvider: 'lazq',
    externalId,
    homeTeam,
    awayTeam,
    startTime,
    stage,
    homeScore,
    awayScore,
    halfHomeScore,
    halfAwayScore,
    state,
    odds,
    rawJson: obj,
  };
}

// Flexible types for API response normalization
interface FlexTeamEntry { 0: number; 1: string; 2: string }
interface FlexMatch { id: string; h: string; a: string; s: number; t: number; sc: string[]; [key: string]: unknown }
interface FlexKindEntry { 0: number; 1: string; 2: string; 3: number }

/** Normalize from API response (fetchWorldCupFixtures format). */
export function normalizeFromApiResponse(
  resp: { data: { teams: Record<string, FlexTeamEntry>; matches: Record<string, FlexMatch[]>; kinds: FlexKindEntry[] } },
): NormalizedMatch[] {
  const { teams, matches, kinds } = resp.data;
  const teamMap = new Map<string, string>();
  for (const entry of Object.values(teams)) {
    teamMap.set(String(entry[0]), entry[1]);
  }
  const roundMap = new Map(kinds.map(k => [k[0], k[1]]));

  const seen = new Set<string>();
  const result: NormalizedMatch[] = [];

  for (const [, roundMatches] of Object.entries(matches)) {
    for (const m of roundMatches) {
      const extId = String(m.id ?? '');
      if (seen.has(extId)) continue;
      seen.add(extId);

      const normalized = normalizeApiMatch(m as unknown as Record<string, unknown>, teamMap, roundMap);
      if (normalized) result.push(normalized);
    }
  }

  return result;
}

/** Normalize from scraper raw data (array of responses). */
export function normalizeFromScraperData(responses: unknown[]): NormalizedMatch[] {
  const seen = new Set<string>();
  const matches: NormalizedMatch[] = [];

  for (const response of responses) {
    const arr = Array.isArray(response) ? response : 
      (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) 
        ? (response as Record<string, unknown>).data 
        : [];
    
    const items = Array.isArray(arr) ? arr : [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const normalized = normalizeScraperMatch(obj);
      if (!normalized) continue;
      if (seen.has(normalized.externalId)) continue;
      seen.add(normalized.externalId);
      matches.push(normalized);
    }
  }

  return matches;
}

/** Persist normalized data to file for fallback. */
export function persistNormalized(matches: NormalizedMatch[]): void {
  const dir = path.dirname(NORMALIZED_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(matches, null, 2), 'utf-8');
}

/** Load normalized data from file (fallback). */
export function loadNormalizedFromFile(): NormalizedMatch[] | null {
  if (!fs.existsSync(NORMALIZED_PATH)) return null;
  try {
    const raw = fs.readFileSync(NORMALIZED_PATH, 'utf-8');
    return JSON.parse(raw) as NormalizedMatch[];
  } catch { return null; }
}