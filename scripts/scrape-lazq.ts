import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { scrapeLazqCalculator } from '../lib/data-providers/lazqScraper';
import { normalizeLazqData } from '../lib/data-providers/lazqNormalize';
import { lazqStateToStatus } from '../lib/match-status';

async function main() {
  console.log('Scraping lazq calculator page ...');
  const { responses, rawFilePath } = await scrapeLazqCalculator();
  console.log(`  Captured ${responses.length} JSON response(s)`);
  console.log(`  Raw file: ${rawFilePath}`);

  console.log('Normalizing match data ...');
  const matches = normalizeLazqData(responses);
  console.log(`  ${matches.length} World Cup match(es) after normalization`);

  let upcoming = 0, live = 0, finished = 0;
  for (const m of matches) {
    const st = lazqStateToStatus(m.state, m.startTime);
    if (st === 'upcoming' || st === 'locked') upcoming++;
    else if (st === 'live') live++;
    else if (st === 'finished' || st === 'settled') finished++;
  }

  console.log('\nSummary');
  console.log(`  Upcoming : ${upcoming}`);
  console.log(`  Live     : ${live}`);
  console.log(`  Finished : ${finished}`);
}

main().catch((err) => { console.error(err); process.exit(1); });