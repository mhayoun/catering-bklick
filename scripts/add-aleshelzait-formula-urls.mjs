// One-off script: sets pkg.sourceUrl on each formula of "קייטרינג עלה של זית" (added by
// scripts/add-aleshelzait.mjs), pointing to the matching page on aleshelzait.co.il so the
// caterer profile page's "🔗 צפייה במקור" link (app/caterer/[id]/page.js) works per formula.
//
// Mapping: formulas with a dedicated page on the site get that page's URL; formulas with no
// matching dedicated page fall back to the homepage.
//
// Usage: node --env-file=.env.local scripts/add-aleshelzait-formula-urls.mjs

import { kv } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set - nothing to connect to.');
  process.exit(1);
}

const HOME = 'https://aleshelzait.co.il/';

const SOURCE_URLS = {
  bbq: 'https://aleshelzait.co.il/%d7%a2%d7%a8%d7%91-%d7%91%d7%a8%d7%91%d7%99%d7%a7%d7%99%d7%95/',
  weddings: 'https://aleshelzait.co.il/%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%9c%d7%97%d7%aa%d7%95%d7%a0%d7%94/',
  'shabbat-chatan-henna-bar-mitzvah':
    'https://aleshelzait.co.il/%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%9c%d7%a9%d7%91%d7%aa-%d7%97%d7%aa%d7%9f/',
  memorial: 'https://aleshelzait.co.il/glat-kosher-memorial-meat-catering/',
  'market-table': 'https://aleshelzait.co.il/glat-kosher-market-table-catering/',
  'israeli-breakfast': HOME,
  kiddush: HOME,
  'buffet-stations': HOME,
  'sandwich-bar': HOME
};

async function main() {
  const ids = await kv.smembers('caterers:index');
  let record = null;
  for (const id of ids) {
    const c = await kv.get(`caterer:${id}`);
    if (c?.businessName === 'קייטרינג עלה של זית') {
      record = c;
      break;
    }
  }

  if (!record) {
    console.error('Caterer "קייטרינג עלה של זית" not found in KV - run add-aleshelzait.mjs first.');
    process.exit(1);
  }

  record.packages = record.packages.map((pkg) => ({ ...pkg, sourceUrl: SOURCE_URLS[pkg.id] || HOME }));
  record.updatedAt = new Date().toISOString();

  await kv.set(`caterer:${record.id}`, record);

  console.log(`Updated caterer "${record.businessName}" (${record.id}) with sourceUrl on ${record.packages.length} formulas:`);
  record.packages.forEach((p) => console.log(`  - ${p.name.he} (${p.id}): ${p.sourceUrl}`));
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
