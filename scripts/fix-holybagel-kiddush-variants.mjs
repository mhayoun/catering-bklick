// One-off follow-up script: the user asked to see the full "מגשים לקידוש" (Kiddush trays)
// category with all size options, using מגש ירקות עם מטבל-דיפ and מגש גבינות קשות as examples.
// Opening each of the category's 13 product pages (reading WooCommerce's own
// data-product_variations JSON) showed that 6 of them are real variable products with a קטן/גדול
// (small/large) size option at two different real prices - but the original add-holybagel.mjs
// only ever stored the single lower ("starting from") price, and missed "מגש פיצות אישיות"
// (₪129/₪160) entirely.
//
// Per the user's explicit choice (price-only, no description field - the addon schema has none),
// this script: removes the 5 existing single-price entries below and replaces each with two
// separate (קטן)/(גדול) [or (רגיל)/(עם תוספות מגוונות) for the pizza tray] addons at their real
// prices, and adds the previously-missing מגש פיצות אישיות as a new two-variant entry.
//
// Source: product pages under https://www.holybagel-j.co.il/product-cat/%d7%9e%d7%92%d7%a9%d7%99%d7%9d-%d7%9c%d7%a7%d7%99%d7%93%d7%95%d7%a9/
//   מגש ירקות עם מטבל-דיפ: קטן ₪115 / גדול ₪210
//   מגש גבינות קשות: קטן ₪199 / גדול ₪295
//   מגש סלמון מעושן: קטן ₪210 / גדול ₪360
//   מגש דגים מעושנים: קטן ₪220 / גדול ₪375
//   מגש בורקסים מגוון: קטן ₪99 / גדול ₪159
//   מגש פיצות אישיות (missing until now): רגיל ₪129 / עם תוספות מגוונות ₪160
//
// Usage: node --env-file=.env.local scripts/fix-holybagel-kiddush-variants.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'OLXKnVyF0v';

// [old single-price name, old price] -> used to find-and-remove the stale single entry
const REPLACEMENTS = [
  {
    oldName: 'מגש ירקות עם מטבל-דיפ',
    oldAmount: '115',
    categoryId: 'fruit_veg',
    variants: [
      ['מגש ירקות עם מטבל-דיפ (קטן)', 115],
      ['מגש ירקות עם מטבל-דיפ (גדול)', 210]
    ]
  },
  {
    oldName: 'מגש גבינות קשות',
    oldAmount: '199',
    categoryId: 'cheese_bread_savory',
    variants: [
      ['מגש גבינות קשות (קטן)', 199],
      ['מגש גבינות קשות (גדול)', 295]
    ]
  },
  {
    oldName: 'מגש סלמון מעושן',
    oldAmount: '210',
    categoryId: 'deli_counter',
    variants: [
      ['מגש סלמון מעושן (קטן)', 210],
      ['מגש סלמון מעושן (גדול)', 360]
    ]
  },
  {
    oldName: 'מגש דגים מעושנים',
    oldAmount: '220',
    categoryId: 'deli_counter',
    variants: [
      ['מגש דגים מעושנים (קטן)', 220],
      ['מגש דגים מעושנים (גדול)', 375]
    ]
  },
  {
    oldName: 'מגש בורקסים מגוון',
    oldAmount: '99',
    categoryId: 'quiches_pies_burekas',
    variants: [
      ['מגש בורקסים מגוון (קטן)', 99],
      ['מגש בורקסים מגוון (גדול)', 159]
    ]
  }
];

// This one never existed in the store before - add both variants fresh.
const NEW_ITEM = {
  categoryId: 'quiches_pies_burekas',
  variants: [
    ['מגש פיצות אישיות (רגיל)', 129],
    ['מגש פיצות אישיות (עם תוספות מגוונות)', 160]
  ]
};

async function main() {
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

  let removed = 0;
  let added = 0;

  for (const { oldName, oldAmount, categoryId, variants } of REPLACEMENTS) {
    const idx = shopPackage.addons.findIndex((a) => a.name.he === oldName && a.amount === oldAmount);
    if (idx !== -1) {
      shopPackage.addons.splice(idx, 1);
      removed++;
    } else {
      console.warn(`Warning: could not find existing entry "${oldName}" @ ₪${oldAmount} to remove - adding variants anyway.`);
    }
    for (const [he, amount] of variants) {
      shopPackage.addons.push({
        id: nanoid(8),
        name: { he, en: '', fr: '' },
        priceType: 'flat',
        amount: String(amount),
        categoryId
      });
      added++;
    }
  }

  for (const [he, amount] of NEW_ITEM.variants) {
    shopPackage.addons.push({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId: NEW_ITEM.categoryId
    });
    added++;
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): removed ${removed} single-price entries, added ${added} size-variant entries. Catalog now has ${shopPackage.addons.length} items.`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
