// lib/lazq.ts
// Server-only lazq.com API client for World Cup fixture data.
// Never import from client components.

import * as crypto from 'crypto';

const BASE_URL = 'https://api.lazq.com/';
const WC_COMPETITION_ID = 'c060169dded265c661970209008e1744';

export type LazqTeamEntry = [number, string, string]; // [teamId, chineseName, englishName]

export interface LazqMatch {
  h: string;       // home team index
  a: string;       // away team index
  s: number;       // state: -1=finished, 0=not started, 1=in-play
  t: number;       // unix timestamp (seconds)
  id: string;      // match id
  sc: string[];    // [ftHome, ftAway, htHome, htAway] - strings, empty = no score
}

export type LazqKindEntry = [number, string, string, number]; // [roundId, cn, en, flag]

export interface LazqFixturesResponse {
  status: number;
  msg?: string;
  data: {
    teams: Record<string, LazqTeamEntry>;
    matches: Record<string, LazqMatch[]>;
    kinds: LazqKindEntry[];
    jiFen: unknown;
  };
}

export function generateLazqToken(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const shanghai = new Date(utcMs + 8 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${shanghai.getFullYear()}-${pad(shanghai.getMonth() + 1)}-${pad(shanghai.getDate())}-${pad(shanghai.getHours())}-${pad(shanghai.getMinutes())}`;
  return crypto.createHash('md5').update(`WZP-@-ZHAO-*-%383b${stamp}`).digest('hex');
}

export async function fetchWorldCupFixtures(year?: number): Promise<LazqFixturesResponse> {
  if (!year) {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
    year = new Date(utcMs + 8 * 3600_000).getFullYear();
  }

  const token = generateLazqToken();
  const res = await fetch(`${BASE_URL}MobileIndex/getShaiType2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token-app': token },
    body: JSON.stringify({ comId: WC_COMPETITION_ID, year }),
  });

  if (!res.ok) throw new Error(`lazq API HTTP ${res.status}`);
  const json = (await res.json()) as LazqFixturesResponse;
  if (json.status !== 0) throw new Error(`lazq API error: ${json.msg ?? 'unknown'}`);
  return json;
}