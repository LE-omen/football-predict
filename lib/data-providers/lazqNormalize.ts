// lib/data-providers/lazqNormalize.ts
// Normalizes raw lazq scraper output into the NormalizedMatch format.
// Filters for World Cup matches only (competitionName === '世界杯').

import * as fs from 'fs';
import * as path from 'path';

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
  rawJson: unknown;
}

const NORMALIZED_PATH = path.resolve(process.cwd(), 'data/normalized/lazq-matches.json');

/** Try to find the competition/round label for a match object. */
function extractStage(obj: Record<string, unknown>): string {
  return (
    (obj.competitionName as string) ??
    (obj.round as string) ??
    (obj.stage as string) ??
    (obj.kindName as string) ??
    ''
  );
}

/** Determine whether a match object belongs to the World Cup. */
function isWorldCup(obj: Record<string, unknown>): boolean {
  const comp = (obj.competitionName ?? obj.kindName ?? '') as string;
  return comp.includes('世界杯');
}

/** Convert a lazq unix-timestamp (seconds) to ISO string. */
function toISO(ts: unknown): string {
  if (typeof ts === 'number' && ts > 0) {
    return new Date(ts * 1000).toISOString();
  }
  if (typeof ts === 'string' && !Number.isNaN(Number(ts))) {
    return new Date(Number(ts) * 1000).toISOString();
  }
  return new Date().toISOString();
}

/** Parse a score string like "2" into number, null if missing. */
function parseScore(val: unknown): number | null {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
    return Number(val);
  }
  return null;
}

/** Extract NormalizedMatch from a single match object. */
function normalizeOne(obj: Record<string, unknown>): NormalizedMatch | null {
  if (!isWorldCup(obj)) return null;

  const externalId = String(obj.gameId ?? obj.id ?? obj.matchId ?? '');
  if (!externalId) return null;

  const homeTeam = String(obj.homeTeamName ?? obj.home ?? obj.h ?? '');
  const awayTeam = String(obj.awayTeamName ?? obj.away ?? obj.a ?? '');

  // Score parsing - supports both object and array formats
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let halfHomeScore: number | null = null;
  let halfAwayScore: number | null = null;

  if (Array.isArray(obj.sc)) {
    // lazq style: [ftHome, ftAway, htHome, htAway]
    homeScore = parseScore(obj.sc[0]);
    awayScore = parseScore(obj.sc[1]);
    halfHomeScore = parseScore(obj.sc[2]);
    halfAwayScore = parseScore(obj.sc[3]);
  } else {
    homeScore = parseScore(obj.homeScore ?? obj.ftHomeGoals);
    awayScore = parseScore(obj.awayScore ?? obj.ftAwayGoals);
    halfHomeScore = parseScore(obj.halfHomeScore ?? obj.htHomeGoals);
    halfAwayScore = parseScore(obj.halfAwayScore ?? obj.htAwayGoals);
  }

  const state = typeof obj.state === 'number' ? obj.state : 0;
  const startTime = toISO(obj.matchTime ?? obj.t ?? obj.startTime);
  const stage = extractStage(obj);

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
    rawJson: obj,
  };
}

/** Walk a raw JSON response and extract all match objects. */
function extractMatches(json: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  if (!json || typeof json !== 'object') return results;

  if (Array.isArray(json)) {
    for (const item of json) {
      if (item && typeof item === 'object') results.push(item as Record<string, unknown>);
    }
    return results;
  }

  const obj = json as Record<string, unknown>;
  for (const key of ['data', 'matches', 'list', 'rows', 'items', 'result', 'fixtures']) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object') results.push(item as Record<string, unknown>);
      }
    } else if (val && typeof val === 'object') {
      for (const nested of Object.values(val as Record<string, unknown>)) {
        if (Array.isArray(nested)) {
          for (const item of nested) {
            if (item && typeof item === 'object') results.push(item as Record<string, unknown>);
          }
        }
      }
    }
  }
  return results;
}

export function normalizeLazqData(responses: unknown[]): NormalizedMatch[] {
  const seen = new Set<string>();
  const matches: NormalizedMatch[] = [];

  for (const response of responses) {
    const rawObjects = extractMatches(response);
    for (const obj of rawObjects) {
      const normalized = normalizeOne(obj);
      if (!normalized) continue;
      if (seen.has(normalized.externalId)) continue;
      seen.add(normalized.externalId);
      matches.push(normalized);
    }
  }

  // Persist
  const dir = path.dirname(NORMALIZED_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(matches, null, 2), 'utf-8');

  return matches;
}