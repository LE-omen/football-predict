import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { scrapeLazqCalculator } from '../lib/data-providers/lazqScraper';
import { normalizeFromScraperData, persistNormalized } from '../lib/data-providers/lazqNormalize';

async function main() {
  console.log('Scraping lazq calculator page ...');
  const { responses, rawFilePath } = await scrapeLazqCalculator();
  console.log(`  Captured ${responses.length} JSON response(s)`);
  console.log(`  Raw file: ${rawFilePath}`);

  console.log('Normalizing match data ...');
  const matches = normalizeFromScraperData(responses);
  console.log(`  ${matches.length} World Cup match(es) after normalization`);
  
  if (matches.length > 0) {
    persistNormalized(matches);
    console.log('  Persisted to data/normalized/lazq-matches.json');
  }

  let upcoming = 0, finished = 0;
  for (const m of matches) {
    if (m.state === -1) finished++;
    else upcoming++;
  }

  console.log('\nSummary');
  console.log(`  Upcoming : ${upcoming}`);
  console.log(`  Finished : ${finished}`);
}

main().catch((err) => { console.error(err); process.exit(1); });