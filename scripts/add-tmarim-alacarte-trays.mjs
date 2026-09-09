// One-off script: adds protamar.com's "מגשי אירוח" (hospitality trays) shop as a single
// a_la_carte package on the "קייטרינג תמרים" caterer record. Unlike the 13 formula menus and 11
// event bundles added by the earlier tmarim scripts, this section of the site is a real
// WooCommerce product catalog with an individually published price per tray - scraped from all
// 14 product-category pages under /מגשי-אירוח/ (מלוחים and its subcategories איטלקי, כריכים
// וטורטיות, לחמים ופוקאצ'ות, מאפים, קישים, גבינות, ירקות ואנטיפסטי, סלטים, מיוחדים; plus the
// top-level טבעוני, סושי ודגים, קינוחים, מתוקים ופירות). 93 unique products after de-duplicating
// items that are cross-listed in multiple categories (same name, same price everywhere).
//
// Modeled as CatererForm.js's a_la_carte package type (see blankAlaCartePackage there): a flat
// item catalog with no included-categories/choice-count logic, each item tagged with its own
// categoryId from ALACARTE_CATEGORIES (lib/constants.js) via addons - NOT a "choose N of M"
// formula like the other tmarim packages.
//
// Usage: node --env-file=.env.local scripts/add-tmarim-alacarte-trays.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  ['black magic radiatori', 202, 'hot_food'],
  ['מיני גחנון טבעוני', 177, 'pareve_vegan_no_sugar'],
  ['מיני קיש', 196, 'quiches_pies_burekas'],
  ['מגש אנטי פסטי', 153, 'fruit_veg'],
  ['מיני בייגלה', 142, 'sandwiches_trays'],
  ['סלט קפרזה', 195, 'salads'],
  ['שווארמה טבעונית בטורטייה', 175, 'sandwiches_trays'],
  ['טורטליני במילוי פטריות', 171, 'hot_food'],
  ['מגש גבינות בוטיק', 242, 'cheese_bread_savory'],
  ['בואיקוס חצילים', 136, 'quiches_pies_burekas'],
  ['פונגי בולז', 195, 'hot_food'],
  ['פטריות ממולאות', 190, 'hot_food'],
  ['פשטידת פרחי ברוקולי אישית', 212, 'quiches_pies_burekas'],
  ['פשטידת פטריות אישית', 212, 'quiches_pies_burekas'],
  ['קיש ברוקולי גדול משפחתי', 150, 'quiches_pies_burekas'],
  ['מלנזנה', 212, 'hot_food'],
  ['לזנית גבינות ברוטב עגבניות אישית', 212, 'hot_food'],
  ['פסטה ברוטב שמנת פטריות', 183, 'hot_food'],
  ['לזניה פטריות', 195, 'hot_food'],
  ['לזניה גבינה', 195, 'hot_food'],
  ['פסטה ברוטב עגבניות', 183, 'hot_food'],
  ['כריכי קרואסון', 170, 'sandwiches_trays'],
  ['טורטיה בחיתוך סושי', 159, 'sandwiches_trays'],
  ['סטייק פרגית טבעוני בלחמניית פרנה', 175, 'sandwiches_trays'],
  ['מיני המבורגר טבעוני בלחמנייה', 198, 'sandwiches_trays'],
  ['כריך טבעוני מלחם קסטן', 130, 'sandwiches_trays'],
  ['כריך לחם קסטן', 130, 'sandwiches_trays'],
  ['חצאי טורטיה טבעונית', 136, 'sandwiches_trays'],
  ['מיני קרואסון במילוי סלמון מעושן', 198, 'sandwiches_trays'],
  ['חצאי טורטיה מגולגלת', 136, 'sandwiches_trays'],
  ['כריך פרנה טבעוני', 150, 'sandwiches_trays'],
  ['כריך מיני פרנה במילוי', 169, 'sandwiches_trays'],
  ['כריך פרנה', 150, 'sandwiches_trays'],
  ['מיני בייגלה טבעוני', 142, 'sandwiches_trays'],
  ['מיני בייגלה במילוי סלמון מעושן', 170, 'sandwiches_trays'],
  ["פוקצ'ות במגש", 85, 'cheese_bread_savory'],
  ['לחמי מחמצת', 130, 'cheese_bread_savory'],
  ["פוקצ'ות טבעוניות במגש", 85, 'cheese_bread_savory'],
  ['גראטן תפוח אדמה ובטטה', 189, 'hot_food'],
  ['מיני פילו במילוי תרד', 113, 'quiches_pies_burekas'],
  ['מאפה גבינה וזית', 121, 'quiches_pies_burekas'],
  ['קיש גדול משפחתי', 150, 'quiches_pies_burekas'],
  ['קיש פטריות שמפניון', 150, 'quiches_pies_burekas'],
  ['קיש פטריות טבעוני', 150, 'quiches_pies_burekas'],
  ['קיש גדול טבעוני', 150, 'quiches_pies_burekas'],
  ['מגש ירקות', 118, 'fruit_veg'],
  ['חצילים מגולגלים בגבינות', 177, 'fruit_veg'],
  ['סלט בטטה', 165, 'salads'],
  ['סלט פד תאי', 190, 'salads'],
  ['סלט עדשים שחורות ובטטה', 165, 'salads'],
  ['סלט פסטה קר', 165, 'salads'],
  ['סלט כרוב אסיאתי', 165, 'salads'],
  ['סלט ירוק', 165, 'salads'],
  ['סלט ים תיכוני', 165, 'salads'],
  ['סלט קינואה', 177, 'salads'],
  ['סלט סלק חי', 165, 'salads'],
  ['סלט עגבניות שרי', 177, 'salads'],
  ['סלט בריאות', 165, 'salads'],
  ['קציצות דגים טבעוניות', 212, 'hot_food'],
  ['פלפל ממולא ריזוטו', 177, 'hot_food'],
  ['קובה סלק טבעונית', 236, 'hot_food'],
  ['לביבת תפו"א ובטטה', 170, 'hot_food'],
  ['vegan fire arais', 201, 'pareve_vegan_no_sugar'],
  ['באן במילוי אסאדו מפורק טבעוני', 189, 'pareve_vegan_no_sugar'],
  ['גונדי פרסי טבעוני', 236, 'pareve_vegan_no_sugar'],
  ['פטיפור בקלוואה טבעוני', 189, 'desserts_sweets'],
  ['קציצות קינואה טבעוניות', 201, 'pareve_vegan_no_sugar'],
  ['עלי גפן ממולאים', 130, 'fruit_veg'],
  ['מגש סושי – צמחוני או טבעוני', 454, 'sushi_specials'],
  ['מגש סושי – מעורב', 454, 'sushi_specials'],
  ['טראפלס שוקולד חלומיים', 142, 'desserts_sweets'],
  ['טראפלס שוקולד טבעוני', 142, 'desserts_sweets'],
  ['פרופיטרול', 125, 'desserts_sweets'],
  ['עוגת גבינה אישית', 184, 'desserts_sweets'],
  ['פופקייקס', 201, 'desserts_sweets'],
  ['עוגת מייפל ואגוזי מלך', 65, 'desserts_sweets'],
  ['קראנץ שוקולד', 65, 'desserts_sweets'],
  ['מקרון צבעוני', 71, 'desserts_sweets'],
  ['כוסות שוט מלאבי', 177, 'desserts_sweets'],
  ['כוסות שוט מלבי טבעוני', 177, 'desserts_sweets'],
  ['מגש כדורי תמרים', 124, 'desserts_sweets'],
  ['כדורי אוריאו', 182, 'desserts_sweets'],
  ['בראוניז שוקולד', 118, 'desserts_sweets'],
  ['טרטלט קרם לימון', 171, 'desserts_sweets'],
  ['טרטלט טבעוני פיצוחים בקרמל', 148, 'desserts_sweets'],
  ["סנדביץ' קדאיף", 142, 'desserts_sweets'],
  ['מגש מיני פילו מתוק', 113, 'desserts_sweets'],
  ['מאפים מתוקים', 163, 'desserts_sweets'],
  ['מוזלי בכוסות שוט', 250, 'desserts_sweets'],
  ['מעדן טפיוקה טבעונית בכוס שוט', 236, 'desserts_sweets'],
  ['מוסים בארבעה טעמים', 236, 'desserts_sweets'],
  ['מגש עוגיות מהודר', 148, 'desserts_sweets'],
  ['פלטת פירות עשירה ויוקרתית', 218, 'fruit_veg']
];

const alaCartePackage = {
  id: 'hospitality-trays',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח (קטלוג לפי מגש)', en: 'Hospitality Trays (Per-Tray Catalog)', fr: 'Plateaux de Réception (Catalogue par Plateau)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://protamar.com/%d7%9e%d7%92%d7%a9%d7%99-%d7%90%d7%99%d7%a8%d7%95%d7%97-%d7%9c%d7%90%d7%99%d7%a8%d7%95%d7%a2%d7%99%d7%9d/',
  addons: PRODUCTS.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  }))
};

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'קייטרינג תמרים') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "קייטרינג תמרים" not found in KV - run the previous tmarim scripts first.');
    process.exit(1);
  }

  const existing = await kv.get(`caterer:${id}`);

  const updated = {
    ...existing,
    packages: [...existing.packages, alaCartePackage],
    updatedAt: new Date().toISOString()
  };

  await kv.set(`caterer:${id}`, updated);
  console.log(`Updated caterer "קייטרינג תמרים" (${id}) with an a_la_carte tray catalog: ${alaCartePackage.addons.length} priced products.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
