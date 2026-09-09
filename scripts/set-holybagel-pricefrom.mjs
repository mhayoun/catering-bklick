// Small follow-up to scripts/update-holybagel-full-menu.mjs: now that a real per-guest formula
// price (₪70/guest, "תפריט בופה לאירוע") exists on this caterer, set the top-level `priceFrom`
// field to match, so CatererCard.js's "from ₪X per guest" badge reflects it.
// Usage: node --env-file=.env.local scripts/set-holybagel-pricefrom.mjs

import { kv } from '@vercel/kv';

const CATERER_ID = 'OLXKnVyF0v';

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }
  record.priceFrom = 70;
  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Set priceFrom=${record.priceFrom} for "${record.businessName}" (${CATERER_ID}).`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
