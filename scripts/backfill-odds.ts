// scripts/backfill-odds.ts
// 从 lazq API 拉取最新数据，更新所有已有比赛的 option_odds
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { fetchWorldCupFixtures } from '../lib/lazq';
import { normalizeFromApiResponse } from '../lib/data-providers/lazqNormalize';
import { createAdminClient } from '../lib/supabase/admin';
import type { ExtractedOdds } from '../lib/data-providers/lazqOddsExtractor';
import type { MarketType } from '../types/database';

function getOptionOddsForMarket(marketType: MarketType, odds: ExtractedOdds): Record<string, string> {
  switch (marketType) {
    case '1x2': return odds['1x2'];
    case 'exact_score': return odds.exact_score;
    case 'total_goals': return odds.total_goals;
    case 'btts': return odds.btts;
    case 'ht_1x2': return odds['ht_1x2'];
    default: return {};
  }
}

async function main() {
  console.log('Fetching lazq data...');
  const resp = await fetchWorldCupFixtures(2026);
  const matches = normalizeFromApiResponse(resp as any);
  console.log(`Got ${matches.length} matches from lazq`);

  const admin = createAdminClient();

  // Build lookup by externalId
  const lazqMap = new Map(matches.map(m => [m.externalId, m]));

  // Get all DB matches
  const { data: dbMatches } = await admin.from('matches').select('id, external_id, home_team').eq('external_provider', 'lazq');
  if (!dbMatches) { console.log('No matches in DB'); return; }

  let updated = 0, skipped = 0;
  for (const dbm of dbMatches) {
    const nm = lazqMap.get(dbm.external_id!);
    if (!nm) { skipped++; continue; }

    // Update markets
    const { data: markets } = await admin.from('markets').select('id, market_type').eq('match_id', dbm.id);
    if (!markets) continue;
    
    for (const mkt of markets) {
      const optOdds = getOptionOddsForMarket(mkt.market_type as MarketType, nm.odds);
      if (Object.keys(optOdds).length > 0) {
        const { error } = await admin.from('markets').update({ option_odds: optOdds }).eq('id', mkt.id);
        if (error) console.error(`  Error updating ${dbm.home_team} ${mkt.market_type}: ${error.message}`);
      }
    }
    updated++;
    console.log(`  Updated: ${dbm.home_team} (${markets.length} markets)`);
  }

  console.log(`\nDone: updated ${updated}, skipped ${skipped}`);
}

main().catch(e => { console.error(e); process.exit(1); });