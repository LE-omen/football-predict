import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Only load .env.local if it exists (local dev), don't overwrite CI env vars
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

import { runSyncOdds } from '../lib/jobs/syncOdds';

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL not set');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  console.log('Starting sync-odds job...');
  try {
    const result = await runSyncOdds();
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
