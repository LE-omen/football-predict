// lib/data-providers/lazqScraper.ts
// Playwright-based scraper for lazq.com calculator page.
// Captures XHR/fetch JSON responses containing football match data.
// Only captures what the public page normally loads - no bypass of login/captcha/VIP.

import { chromium, type Page, type Response } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TIMEOUT_MS = 30_000;
const TARGET_URL = 'https://www.lazq.com/home/calculator.html';
const RAW_DIR = path.resolve(process.cwd(), 'data/raw/lazq');

/** Heuristic: does the response body look like football match data? */
function isMatchData(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false;

  // Direct array of match objects
  if (Array.isArray(json)) {
    return json.some(isMatchObject);
  }

  // Object with a `data` wrapper that contains an array
  const obj = json as Record<string, unknown>;
  for (const key of ['data', 'matches', 'list', 'rows', 'items', 'result', 'fixtures']) {
    const val = obj[key];
    if (Array.isArray(val) && val.some(isMatchObject)) return true;
    if (val && typeof val === 'object') {
      for (const nested of Object.values(val as Record<string, unknown>)) {
        if (Array.isArray(nested) && nested.some(isMatchObject)) return true;
      }
    }
  }
  return false;
}

function isMatchObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    ('homeTeamName' in o || 'h' in o || 'home' in o) &&
    ('awayTeamName' in o || 'a' in o || 'away' in o)
  );
}

export async function scrapeLazqCalculator(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ responses: unknown[]; rawFilePath: string }> {
  const captured: unknown[] = [];
  const seen = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  // Intercept every response and try to parse JSON bodies
  page.on('response', async (response: Response) => {
    try {
      const contentType = response.headers()['content-type'] ?? '';
      if (!contentType.includes('json')) return;
      const url = response.url();
      if (seen.has(url)) return;
      const body = await response.json();
      if (isMatchData(body)) {
        seen.add(url);
        captured.push(body);
      }
    } catch {
      // non-JSON or network error - ignore
    }
  });

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: timeoutMs });
    // Give extra time for late XHR calls
    await page.waitForTimeout(3000);
  } finally {
    await browser.close();
  }

  // Persist raw JSON
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rawFilePath = path.join(RAW_DIR, `lazq-${ts}.json`);
  fs.writeFileSync(rawFilePath, JSON.stringify(captured, null, 2), 'utf-8');

  return { responses: captured, rawFilePath };
}