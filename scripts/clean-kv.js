// Wipes ALL keys from the Vercel/Upstash KV database configured via
// KV_REST_API_URL / KV_REST_API_TOKEN (the "upstash-kv-cordovan-plank-catering"
// database linked to this project). This deletes every caterer record, the
// caterers:index set, and every owner:{email} index - there is no undo.
//
// Usage:
//   node --env-file=.env.local scripts/clean-kv.js          # dry run (lists keys, deletes nothing)
//   node --env-file=.env.local scripts/clean-kv.js --confirm # actually deletes
//
// (Point --env-file at whichever .env file has the KV_REST_API_* vars for the
// database you want to target, e.g. .env.production.local for prod.)

import { kv } from '@vercel/kv';

const CONFIRMED = process.argv.includes('--confirm');

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set - nothing to connect to.');
  process.exit(1);
}

async function main() {
  const keys = await kv.keys('*');

  if (keys.length === 0) {
    console.log('Database is already empty.');
    return;
  }

  console.log(`Found ${keys.length} key(s):`);
  for (const key of keys) console.log(`  ${key}`);

  if (!CONFIRMED) {
    console.log(`\nDry run only - pass --confirm to delete all ${keys.length} key(s).`);
    return;
  }

  await kv.del(...keys);
  console.log(`\nDeleted ${keys.length} key(s). Database is now empty.`);
}

main().catch((err) => {
  console.error('Failed to clean KV database:', err);
  process.exit(1);
});
