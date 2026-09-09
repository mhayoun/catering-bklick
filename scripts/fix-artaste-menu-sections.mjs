// One-off follow-up script: the user asked to add 5 real menu sections from artaste.co.il's own
// nav to the "ארטייסט" caterer's shop-catalog a_la_carte package - חבילות מומלצות (recommended
// bundles), מלוחים (savory), סלטים (salads), מתוקים (sweets) and טבעוני (vegan) - same treatment
// as scripts/fix-holybagel-menu-sections.mjs: tag every existing addon with its real site menu
// section (addon.menuSection) so the caterer profile page groups the catalog by the site's own
// nav instead of one flat list, and append any real items the earlier scrape (add-artaste.mjs)
// missed.
//
// The (name, price) -> real site category mapping was built by visiting all 4 requested category
// pages plus the 2 unrequested-but-necessary ones that the remaining 11 items actually turned out
// to live under (https://www.artaste.co.il/product-category/holidays/ - "תפריט חגים ומועדים",
// the Rosh Hashana seasonal collection; and .../%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%A0%D7%9C%D7%95%D7%95%D7%99%D7%9D/
// - "נלווים", wine/coffee/juice/disposables) - every one of the 94 already-stored items matched
// a real site category this way, so every addon ends up with a menuSection (a package with even
// one untagged addon would fall back to the old flat/categoryId grouping - see
// app/caterer/[id]/page.js's groupField logic).
//
// New items found on the site but missing from the existing 94: the 8 חבילות מומלצות bundles
// below (each a fixed multi-tray spread at one flat total price for a guest-count range, same
// shape as this schema's existing flat-price addons - the guest range is folded into the item
// name, same convention as every other quantity-bearing item in this catalog). A 9th item
// ("מבית סבתא - קציצות דגים ברוטב אדום", under מלוחים) was excluded for having no published price
// (quote-only), same reasoning as the exclusions already documented in add-artaste.mjs.
//
// Usage: node --env-file=.env.local scripts/fix-artaste-menu-sections.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'WrgGOQAxTg';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SECTION_ORDER = ['חבילות מומלצות', 'תפריט חגים ומועדים', 'מלוחים', 'סלטים', 'מתוקים', 'טבעוני', 'נלווים'];

// [name, price, ALACARTE_CATEGORIES categoryId]
const NEW_ITEMS = [
  ['הנבחרת (10-15 מתכבדים)', 1099, 'gifts_packages'],
  ['ארוחת בוקר למי שרעב (15-20 מתכבדים)', 1895, 'brunch'],
  ['הטבעונית המפנקת (20-25 סועדים)', 2223, 'pareve_vegan_no_sugar'],
  ['בוקר אדריכלים (20-25 איש)', 2489, 'brunch'],
  ['הנבחרת המורחבת (20-25 מתכבדים)', 2224, 'gifts_packages'],
  ['תפריט שבת מושלם (כ-30 איש)', 3738, 'gifts_packages'],
  ['חגיגת Happy hour מתוקה (כ-40 מתכבדים)', 1878, 'desserts_sweets'],
  ["בראנץ' / צהרים עשירה (עבור כ-50 איש)", 5730, 'brunch']
];
const NEW_ITEMS_SECTION = 'חבילות מומלצות';

async function main() {
  const assignments = JSON.parse(await readFile(path.join(__dirname, 'artaste-menu-sections-data.json'), 'utf8'));
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
  for (const [he, amount, categoryId] of NEW_ITEMS) {
    if (existingNames.has(he)) continue; // safety net against accidental re-run duplication
    shopPackage.addons.push({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId,
      menuSection: { he: NEW_ITEMS_SECTION, en: '', fr: '' }
    });
    added++;
  }

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
