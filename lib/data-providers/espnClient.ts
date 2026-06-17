// lib/data-providers/espnClient.ts
// ESPN API client for World Cup match scores.
// Only runs server-side. Never import from client components.

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

export interface EspnTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
}

export interface EspnCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: EspnTeam;
  score: string;
  winner: boolean | null;
  linescores?: { value: number }[];
}

export interface EspnStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
    detail: string;
    shortDetail: string;
  };
}

export interface EspnCompetition {
  id: string;
  date: string;
  status: EspnStatus;
  competitors: [EspnCompetitor, EspnCompetitor];
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  competitions: [EspnCompetition];
}

export interface EspnScoreboardResponse {
  events: EspnEvent[];
  season: { year: number };
}

/**
 * Fetch World Cup scoreboard from ESPN for a date range.
 * @param startDate e.g. "20260611"
 * @param endDate   e.g. "20260630"
 */
export async function fetchEspnScoreboard(
  startDate: string,
  endDate: string,
): Promise<EspnEvent[]> {
  const url = `${ESPN_BASE}/scoreboard?dates=${startDate}-${endDate}&limit=500`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`ESPN HTTP ${res.status}`);
  const json = await res.json() as EspnScoreboardResponse;
  return json.events ?? [];
}

/**
 * Fetch a single ESPN event by ID.
 */
export async function fetchEspnEvent(eventId: string): Promise<EspnEvent | null> {
  const url = `${ESPN_BASE}/scoreboard/${eventId}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.event ?? null;
}
