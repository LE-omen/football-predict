import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runUpdateMatchesAndSettle } from '../lib/jobs/updateMatchesAndSettle';

async function main() {
  console.log('Starting update-matches job...');
  try {
    const result = await runUpdateMatchesAndSettle();
    console.log('\nResult:', JSON.stringify(result, null, 2));
    if (!result.ok) {
      console.error('\nJob completed with errors.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();