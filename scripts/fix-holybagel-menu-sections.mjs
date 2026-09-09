// One-off follow-up script: the user pointed out that the "shop-catalog" a_la_carte package
// (158 items, from scripts/add-holybagel.mjs + update-holybagel-full-menu.mjs +
// fix-holybagel-kiddush-variants.mjs) displays as one flat "כל המוצרים" list on the caterer
// profile page, and asked instead to see it broken down the way the real site's own תפריט
// (menu) nav breaks it down - by menu tab (מגשים לקידוש, מגשים פרווה, פלטות קרות, פלטות חמות,
// סלטים, מגשי כריכים, קינוחים, בייגל וממרחים, תפריט ללא גלוטן, תפריט טבעוני, מנות ארוזות
// וארוחות קומבו, דגים) rather than by our own generic ALACARTE_CATEGORIES dish-type taxonomy
// (categoryId, which stays untouched - it still drives site-wide search filtering).
//
// The (name, price) -> real site category mapping below was built by visiting all 14 category
// pages live at https://www.holybagel-j.co.il/product-cat/... (2 categories, plus 12 read via
// Wayback Machine snapshots since the live site was returning a Cloudflare 522 at the time),
// extracting each page's real product grid, and matching it against the 158 already-stored
// items by name (ignoring parenthetical qty/size suffixes and קטן/גדול/רגיל variant suffixes,
// which don't appear in the site's grid listing text). Every item ended up with a confident,
// single "primary" menu section - a handful that appear on multiple category pages on the real
// site (e.g. "מגש ירקות עם מטבל-דיפ" is listed under both מגשים לקידוש and מגשים פרווה) were
// assigned to the more specific menu (kiddush/parve before the generic cold/hot-plates ones),
// since our addon schema groups a catalog by one section per item, not multi-membership.
//
// The scrape also surfaced 10 real items that were never captured by the earlier scripts -
// these get appended below with their real prices and both categoryId (best-fit dish type,
// same taxonomy as every other item) and menuSection (their real site category).
//
// Usage: node --env-file=.env.local scripts/fix-holybagel-menu-sections.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'OLXKnVyF0v';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The real site's own תפריט nav order (see app/menu/ header submenu) - groups on the caterer
// profile page render in this order since addons are sorted to match before saving.
const SECTION_ORDER = [
  'מגשים לקידוש', 'מגשים פרווה', 'פלטות קרות', 'פלטות חמות', 'סלטים', 'מגשי כריכים', 'קינוחים',
  'בייגל וממרחים', 'תפריט ללא גלוטן', 'תפריט טבעוני', 'מנות ארוזות וארוחות קומבו', 'דגים', 'שונות'
];

// [name, price, ALACARTE_CATEGORIES categoryId, real site menu section]
const NEW_ITEMS = [
  ['מגש תפוחי אדמה מוקרם', 130, 'hot_food', 'פלטות חמות'],
  ['לזניה', 139, 'hot_food', 'פלטות חמות'],
  ['לזניה שמנת פטריות', 190, 'hot_food', 'פלטות חמות'],
  ['גלילי חצילים', 139, 'hot_food', 'פלטות חמות'],
  ['סלט קיסר', 120, 'salads', 'סלטים'],
  ['מגש דונאטס', 49.9, 'desserts_sweets', 'קינוחים'],
  ['סלט אבוקדו', 32, 'deli_counter', 'בייגל וממרחים'],
  ['ממרח פסטו', 32, 'deli_counter', 'בייגל וממרחים'],
  ['טפנד עגבניות מיובשות', 32, 'deli_counter', 'בייגל וממרחים'],
  ['גבינה בולגרית', 30, 'deli_counter', 'בייגל וממרחים']
];

async function main() {
  const assignments = JSON.parse(await readFile(path.join(__dirname, 'holybagel-menu-sections-data.json'), 'utf8'));
  const sectionById = new Map(assignments.map((a) => [a.id, a.menuSection]));

  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const shopPackage = record.packages.find((p) => p.id === 'shop-catalog');
  if (!shopPackage) {
    console.error('Could not find the existing shop-catalog package on this record.');
    process.exit(1);
  }

  let tagged = 0;
  for (const addon of shopPackage.addons) {
    const section = sectionById.get(addon.id);
    if (!section) {
      console.warn(`Warning: no menuSection assignment found for addon "${addon.name.he}" (${addon.id}) - leaving untagged.`);
      continue;
    }
    addon.menuSection = { he: section, en: '', fr: '' };
    tagged++;
  }

  const existingNames = new Set(shopPackage.addons.map((a) => a.name.he));
  let added = 0;
  for (const [he, amount, categoryId, section] of NEW_ITEMS) {
    if (existingNames.has(he)) continue; // safety net against accidental re-run duplication
    shopPackage.addons.push({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId,
      menuSection: { he: section, en: '', fr: '' }
    });
    added++;
  }

  // Sort by real site menu-tab order so the profile page's first-seen-order grouping renders
  // in the same order as the site's own תפריט nav, instead of original scrape-insertion order.
  shopPackage.addons.sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a.menuSection?.he ?? '');
    const ib = SECTION_ORDER.indexOf(b.menuSection?.he ?? '');
    return (ia === -1 ? SECTION_ORDER.length : ia) - (ib === -1 ? SECTION_ORDER.length : ib);
  });

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): tagged ${tagged} existing items with menuSection, added ${added} new real items. Catalog now has ${shopPackage.addons.length} items across ${new Set(shopPackage.addons.map((a) => a.menuSection?.he)).size} menu sections.`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
