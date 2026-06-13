// lib/data-providers/lazqScraper.ts
// Playwright-based scraper for lazq.com calculator page.
// This file is only used locally (not on Vercel). playwright is not a Vercel dependency.

const DEFAULT_TIMEOUT_MS = 30_000;
const TARGET_URL = 'https://www.lazq.com/home/calculator.html';

function isMatchObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    ('homeTeamName' in o || 'h' in o || 'home' in o) &&
    ('awayTeamName' in o || 'a' in o || 'away' in o)
  );
}

function isMatchData(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false;
  if (Array.isArray(json)) return json.some(isMatchObject);
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

export async function scrapeLazqCalculator(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ responses: unknown[]; rawFilePath: string }> {
  const fs = require('fs');
  const path = require('path');
  // @ts-ignore - playwright is a local-only dependency, not installed on Vercel
  const { chromium } = await import('playwright');

  const captured: unknown[] = [];
  const seen = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async (response: any) => {
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
    } catch { /* ignore */ }
  });

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: timeoutMs });
    await page.waitForTimeout(3000);
  } finally {
    await browser.close();
  }

  const RAW_DIR = path.resolve(process.cwd(), 'data/raw/lazq');
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rawFilePath = path.join(RAW_DIR, `lazq-${ts}.json`);
  fs.writeFileSync(rawFilePath, JSON.stringify(captured, null, 2), 'utf-8');

  return { responses: captured, rawFilePath };
}