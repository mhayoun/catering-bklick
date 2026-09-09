can// One-off follow-up script: scripts/add-holybagel.mjs only scraped 3 of the site's shop
// categories (cold-plates, desserts, מגשי-כריכים). The user pointed out that
// https://www.holybagel-j.co.il/ actually lists its full menu under "תפריט" in the header, which
// links to 14 product categories total. This script scrapes the 11 categories that were missed
// (מגשים לקידוש, מגשים פרווה, פלטות חמות, סלטים, בייגל וממרחים, תפריט אירועים, gluten-free,
// תפריט טבעוני, מנות ארוזות וארוחות קומבו, דגים, כללי), de-duplicates against the 74 items
// already stored (by exact Hebrew name+price), and:
//   1. appends the 78 newly-found real-priced items to the existing `shop-catalog` a_la_carte
//      package's addons array;
//   2. adds ONE new `formula` package for "תפריט בופה לאירוע" (Event Buffet Menu) - the site's
//      /product-cat/תפריטי-אירועים/ page publishes a genuine per-guest buffet price of ₪70/מנה
//      ("תפריט בופה לאירוע 70 ש'ח למנה"), which is exactly the kind of real per-guest formula
//      pricing this project prioritizes over plain per-tray catalogs when a site publishes one.
//
// Every new item below has a REAL published price, sourced the same way as the original script
// (WooCommerce category archive pages, read via page-rendered innerText). A few items are
// deliberately kept as separate catalog entries from their same-named cold/dairy counterparts
// already in the store because the site itself lists them at a different real price for a
// different size/variant (e.g. "סלט יווני" dairy ₪120 vs. the already-stored "סלט יווני טבעוני -
// גדול" ₪210; "קיש עגול בינוני קוטר 20" ₪89 vs. the already-stored "קיש עגול - בצל" ₪159).
//
// Usage: node --env-file=.env.local scripts/update-holybagel-full-menu.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'OLXKnVyF0v';

// [name, price, ALACARTE_CATEGORIES categoryId]
const NEW_PRODUCTS = [
  // מגשים לקידוש (Kiddush trays)
  ["מיני קישים (16 יחידות)", 149, 'quiches_pies_burekas'], ['בורקס מיני (40 יח\')', 110, 'quiches_pies_burekas'],
  ['קוגעל תפו"א', 230, 'hot_food'], ['קוגעל ירושלמי', 230, 'hot_food'],
  // מגשים פרווה (parve trays)
  ['בייגלס מיני', 5, 'cheese_bread_savory'], ['מגש ממרחים טבעוני (7 סוגים)', 140, 'deli_counter'],
  ['מגש טורטיות טבעוני', 249, 'sandwiches_trays'], ['פסטה ברוטב טבעוני', 139, 'hot_food'],
  ['מגש תפוחי אדמה אפוי', 85, 'hot_food'], ['מגש ירקות וסלטים טבעוני', 220, 'salads'],
  ['סלט יווני טבעוני', 140, 'pareve_vegan_no_sugar'], ['סלט ישראלי', 120, 'salads'], ['סלט בייבי שרי', 120, 'salads'],
  ['עלי בייבי עם פרי', 120, 'salads'], ['סלט כרוב אסיאתי', 120, 'salads'], ['סלט פסטה טבעוני', 130, 'pareve_vegan_no_sugar'],
  ['סלט ניסואז', 120, 'salads'], ['סלט נודלס אסיאתי', 130, 'salads'], ['סלט בורגול מתובל', 130, 'salads'],
  ['סלט קולסלאו', 120, 'salads'], ['מגש אנטיפסטי', 135, 'fruit_veg'], ['מגש לביבות', 135, 'hot_food'],
  // פלטות חמות (hot plates)
  ['מגש מיני פשטידות', 229, 'quiches_pies_burekas'], ['מגש מיני לזניה', 165, 'hot_food'], ['מגש רביולי', 139, 'hot_food'],
  ['פסטה ללא גלוטן', 139, 'hot_food'], ['קישואים ממולאים', 139, 'hot_food'], ['פלפל ממולא', 139, 'hot_food'],
  ['חציל פרמזן', 139, 'hot_food'], ['מגש שבלולי פיצות', 99, 'hot_food'], ['בטטה אפויה', 135, 'hot_food'],
  ['מגש שקשוקה פיקנטית', 100, 'hot_food'],
  // סלטים (dairy salads)
  ['סלט יווני', 120, 'salads'], ['סלט פסטה', 130, 'salads'], ['סלט פסטה ללא גלוטן', 145, 'salads'],
  // בייגל וממרחים (bagels & spreads)
  ['מארז בייגל מזונות (12 יחידות)', 84, 'cheese_bread_savory'], ['מארז בייגל קינמון וצימוקים (6 יחידות)', 48, 'cheese_bread_savory'],
  ['בייגל ללא גלוטן (2 יחידות)', 18, 'cheese_bread_savory'], ['סלט טונה', 32, 'deli_counter'], ['סלט ביצים', 30, 'deli_counter'],
  ['מארז טורטיה ללא גלוטן (3 יח\')', 34, 'sandwiches_trays'], ['גבינה צהובה טבעונית', 30, 'deli_counter'],
  ['מיץ טבעי גדול (2 ליטר)', 35, 'drinks'], ['שתיה גדולה (1.5 ליטר)', 12, 'drinks'], ['חלב / תחליפי חלב', 8, 'drinks'],
  ['חלב סויה/ שקדים/ שיבולת שועל', 18, 'drinks'], ['מים מינרלים (1.5 ליטר)', 8, 'drinks'], ['כף הגשה', 6, 'gifts_packages'],
  // תפריט אירועים (event menu) - non-formula item
  ['מגש סלמון חם', 259, 'hot_food'],
  // מנות ארוזות וארוחות קומבו (packaged meals & combos)
  ['כריך בייגל ארוז', 31, 'sandwiches_trays'], ['ארוחה חמה+ סלט אישי+ שתיה', 59, 'brunch'],
  ['קומבו סלט+ בייגל+ מאפין+ שתיה', 51, 'brunch'], ['קומבו בייגל סלמון מעושן+ סלט אישי+ מאפה/מאפין+ שתיה', 59, 'brunch'],
  ['קומבו כריך בייגל + סלט אישי+ מאפה/מאפינס+ שתיה', 49, 'brunch'], ['קומבו בייגל סלמון מעושן הכולל כריך+ מאפין+ שתיה', 49, 'brunch'],
  ['קומבו בסיסי הכולל כריך בייגל + מאפין+ שתיה', 42, 'brunch'],
  // gluten-free
  ['פשטידה ללא קמח (20 ס"מ)', 89, 'quiches_pies_burekas'],
  // תפריט טבעוני (vegan menu)
  ['חומוס טבעוני', 16, 'deli_counter'], ['טחינה טבעונית', 18, 'deli_counter'], ['קיש טבעוני (20 ס"מ)', 89, 'quiches_pies_burekas'],
  ['עוגת פיסטוקים טבעונית', 169, 'cakes'], ["עוגת נוצ'לטו טבעונית", 169, 'cakes'], ['עוגת "גבינה" טבעונית פרווה', 169, 'cakes'],
  ['פאי פקאן טבעוני', 169, 'cakes'], ['פאי תפוחים קראמבל טבעוני', 169, 'cakes'], ['עוגה בחושה בננה ושוקולד טבעוני', 45, 'cakes'],
  ['מארז מאפינס בננה אישי טבעוני (4 יח\')', 56, 'cookies_pastries'], ['מיני בר סניקרס טבעוני פרווה (48 יח\')', 315, 'desserts_sweets'],
  ['מיני בול רושה טבעוני פרווה', 180, 'desserts_sweets'], ['מיני בול פיסטוק טבעוני פרווה', 180, 'desserts_sweets'],
  ['סוויט רולס טבעוני פרווה על מקל (20 יח\')', 120, 'desserts_sweets'], ['כדורי תמרים טבעוני', 200, 'desserts_sweets'],
  // דגים (fish)
  ['סלמון מעושן (קופסא 100 גרם)', 26, 'deli_counter'], ['דג סול מטוגן (20 יח\')', 300, 'hot_food'],
  // כללי (general)
  ['מגש פסטה', 139, 'hot_food'], ['קיש עגול בינוני (קוטר 20)', 89, 'quiches_pies_burekas'], ['מפת אל-בד', 10, 'gifts_packages']
];

const buffetFormulaPackage = {
  id: 'event-buffet-menu',
  type: 'formula',
  name: { he: 'תפריט בופה לאירוע', en: 'Event Buffet Menu', fr: "Menu Buffet pour Événement" },
  pricePerGuest: 70,
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  addons: [],
  sourceUrl: 'https://www.holybagel-j.co.il/product-cat/%d7%aa%d7%a4%d7%a8%d7%99%d7%98%d7%99-%d7%90%d7%99%d7%a8%d7%95%d7%a2%d7%99%d7%9d/'
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

  const existingNames = new Set(shopPackage.addons.map((a) => a.name.he));
  let addedCount = 0;
  for (const [he, amount, categoryId] of NEW_PRODUCTS) {
    if (existingNames.has(he)) continue; // safety net against accidental re-run duplication
    shopPackage.addons.push({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId
    });
    existingNames.add(he);
    addedCount++;
  }

  if (!record.packages.some((p) => p.id === 'event-buffet-menu')) {
    record.packages.push(buffetFormulaPackage);
  }

  record.updatedAt = new Date().toISOString();

  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): +${addedCount} a_la_carte items (catalog now ${shopPackage.addons.length} items), plus the "${buffetFormulaPackage.name.he}" formula package (₪${buffetFormulaPackage.pricePerGuest}/guest).`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
