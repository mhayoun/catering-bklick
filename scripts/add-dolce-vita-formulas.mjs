// One-off follow-up script: scripts/add-dolce-vita.mjs concluded the site had no priced menu
// content, because its category archive pages (מגשי-אירוח-חלבי/בשרי/טבעוני) render 0 elements
// against the standard WooCommerce-style selectors (li.product, div.product.product-loop) used
// throughout this scripts directory. Re-checked with the site's own actual markup (a custom
// `.productItem` class, not WooCommerce) and found a large, fully real, priced catalog.
//
// מגשי-אירוח-חלבי (dairy) is the only fully-built, richly priced category - 127 unique items
// (each DOM-duplicated exactly twice, deduped by name) spanning trays, sandwiches, breads, hot
// dishes, salads, fish, desserts and soups; all with real ₪ prices, several with 2 real size
// variants (kept as separate addons, size folded into the name, same convention as
// scripts/add-holybagel.mjs). מגשי-אירוח-בשרי (meat) is mostly a stub - only 1 of its 7 listed
// dishes ("עלי גפן...") has a published price, so only that one is included here (unpublished-
// price items excluded, same reasoning as every other script in this directory).
// מגשי-אירוח-טבעוני (vegan) turned out to be almost entirely the same 127 dairy items re-listed
// (same names, same prices) - only 4 genuinely new items were found there and are included below;
// the rest were treated as duplicates and skipped.
//
// cateringTypes stays ['dairy'] only (unchanged from add-dolce-vita.mjs) since the "meat" line
// has essentially no real priced content - the one included item (stuffed grape leaves) is
// itself pareve, not meat.
//
// Usage: node --env-file=.env.local scripts/add-dolce-vita-formulas.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = '-nQObDT0jq';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // [name, price, ALACARTE_CATEGORIES categoryId]
  const ITEMS = JSON.parse(await readFile(path.join(__dirname, 'dolce-vita-items-data.json'), 'utf8'));

  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const alaCartePackage = {
    id: 'shop-catalog',
    type: 'a_la_carte',
    name: { he: 'מגשי אירוח (קטלוג חנות)', en: 'Hosting Trays (Shop Catalog)', fr: 'Plateaux de Réception (Catalogue Boutique)' },
    pricePerGuest: '',
    minGuests: '',
    includedCategories: [],
    categoryLimits: {},
    categoryItems: {},
    eventTypes: [],
    sourceUrl: 'https://www.dolche-vita.co.il/מגשי-אירוח-חלבי/',
    addons: ITEMS.map(([he, amount, categoryId]) => ({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId
    }))
  };

  if (record.packages.some((p) => p.id === 'shop-catalog')) {
    console.error('Caterer already has a "shop-catalog" package - refusing to overwrite. Remove it first if you want to re-run this script.');
    process.exit(1);
  }
  record.packages.push(alaCartePackage);

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): added a_la_carte catalog with ${alaCartePackage.addons.length} priced items.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
