// One-off follow-up script: the user asked to add formulas for all 5 of aaasada.com's event-type
// landing pages (שבת חתן, ברית מילה, בר מצווה, חינה, אזכרות) to "טעם מהודר" (added by
// scripts/add-taam-mehudar.mjs, which already modeled the site's base ₪58/guest DIY menu builder
// as the 'ready-made-meat-menu' formula - that exact same builder is reused verbatim on all 5
// event pages, and its eventTypes already covers all 5: shabbat_chatan/brit/bar_mitzvah/henna/
// memorial).
//
// Checking all 5 pages individually found that only 3 of them publish a SECOND, genuinely
// distinct paid tier beyond that shared base builder - בר מצווה and אזכרות have no second tier,
// so no new package is added for those (their event types were already on the base formula).
// The 3 new packages below are:
//
//   1. שבת חתן: a real ₪149/guest "3 Shabbat meals, all-inclusive" bundle (Friday night dinner:
//      7 salads + 3 hot sides + 2 מנות ביניים + 3 mains; Saturday lunch: 7 salads + 3 hot sides +
//      3 mains; Seuda Shlishit: 4 salads + a fixed fried mousht fish + a fixed hot kugel pie -
//      bread included in all 3). This project's formula schema has one category-limit tier per
//      package, not per-meal, so the 3 meals' real structure is preserved as an informational
//      addon (priceType 'note') rather than forced into 3 separate categoryLimits; the
//      categoryItems/categoryLimits below use the largest per-meal figures (7 salads / 3 hot
//      sides / 3 mains) from the same shared item pool as the base menu.
//   2 & 3. ברית מילה and חינה: both publish the same real ₪130/guest "שירות הפקה מלאה" (full
//      production service) tier for 100+ guests - waiters, table setup/decor, hot-food service,
//      and full post-event cleanup, replacing the DIY self-service model. No separate menu
//      builder is shown for this tier on either page (it's a service-layer upsell on the same
//      food), so the same salads/hot_sides/main_courses pool and limits as the base menu are
//      reused, with the added-service inclusions listed as informational addons.
//
// Source:
//   https://aaasada.com/shabbat-chatan
//   https://aaasada.com/brit
//   https://aaasada.com/hina
//
// Usage: node --env-file=.env.local scripts/add-taam-mehudar-event-formulas.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'HW2aCgfoIb';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

const SALADS_23 = [
  'חומוס הבית', 'טחינה', 'מסייר', 'טבולה', 'הום פרייז', 'סלט ישראלי', 'טריקולור פלפלים',
  'גזר חי בלימון', 'גזר מרוקאי', 'סלק אדום', 'מטבוחה מרוקאית', 'חציל מטוגן', 'חציל מיונז',
  'חציל בטחינה', 'זעלוק חציל', 'סלט השוק', 'קולסלאו', 'כרוב חמוציות', 'כרוב אדום במיונז',
  'תפו"א במיונז', 'פלפל חריף מטוגן', 'תירס צ\'יליאני', 'נלסון'
];
const HOT_SIDES_13 = [
  'אורז לבן / מג\'דרה / אורז אדום', 'אורז לנטריה', 'תפודים', 'תפו"א אפוי', 'קוסקוס מרוקאי אוורירי',
  'מרק ירקות עשיר לקוסקוס', 'זיתים מבושלים ברוטב', 'ארטישוק ופטריות', 'אפונה וסלרי',
  'שעועית ברוטב עגבניות', 'אפונה וגזר', 'ירקות מוקפצים תאילנדי', 'שעועית מוקפצת בסויה'
];
const MAINS_12 = [
  'צלי בקר ברוטב פטריות', 'רוסטביף', 'סטייק פרגית על האש', 'קבב הבית', 'חזה עוף בגריל',
  'עוף בגריל - כרעיים', 'שניצל ביתי', 'מוקפץ סיני עם ירקות', 'קציצות בשר ברוטב',
  'פלפל ממולא טבעוני', 'אסאדו ביין (+ 7 ש"ח למנה)', 'צלי בקר מס\' 5 (+ 7 ש"ח למנה)'
];

const shabbatChatanPackage = {
  id: 'shabbat-chatan-3-meals',
  type: 'formula',
  name: {
    he: 'שבת חתן - חבילת 3 סעודות (הכל כלול)',
    en: 'Shabbat Chatan - 3-Meal All-Inclusive Package',
    fr: 'Shabbat Hatan - Forfait 3 Repas Tout Inclus'
  },
  pricePerGuest: 149,
  minGuests: 30,
  includedCategories: ['salads', 'hot_sides', 'main_courses'],
  categoryLimits: { salads: 7, hot_sides: 3, main_courses: 3 },
  categoryItems: { salads: items(SALADS_23), hot_sides: items(HOT_SIDES_13), main_courses: items(MAINS_12) },
  eventTypes: ['shabbat_chatan'],
  addons: noteAddons([
    'סעודת ליל שבת: 7 סלטים + 3 תוספות חמות + 2 מנות ביניים לבחירה + 3 מנות עיקריות + לחמנייה טרייה',
    'סעודת יום שבת (צהריים): 7 סלטים + 3 תוספות חמות + 3 מנות עיקריות + לחמנייה טרייה',
    'סעודה שלישית: 4 סלטים + דג מושט מטוגן פריך (כלול) + פשטידה חמה - קוגל (כלול) + לחמנייה טרייה',
    'משלוח מקורר בשישי בצהריים לחימום על פלטת השבת'
  ]),
  sourceUrl: 'https://aaasada.com/shabbat-chatan'
};

function fullServicePackage({ id, name, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: 130,
    minGuests: 100,
    includedCategories: ['salads', 'hot_sides', 'main_courses'],
    categoryLimits: { salads: 7, hot_sides: 3, main_courses: 3 },
    categoryItems: { salads: items(SALADS_23), hot_sides: items(HOT_SIDES_13), main_courses: items(MAINS_12) },
    eventTypes: [name.he.includes('ברית') ? 'brit' : 'henna'],
    addons: noteAddons([
      'שירות הפקה מלאה - לא DIY: מלצרים מקצועיים, עריכה ועיצוב שולחנות בכלים נאים',
      'הגשת האוכל החם על ידי הצוות',
      'פינוי וניקיון מלא בסיום האירוע'
    ]),
    sourceUrl
  };
}

const britFullServicePackage = fullServicePackage({
  id: 'brit-full-service',
  name: { he: 'ברית מילה - שירות הפקה מלאה', en: 'Brit Milah - Full Production Service', fr: 'Brit Mila - Service de Production Complet' },
  sourceUrl: 'https://aaasada.com/brit'
});

const hinaFullServicePackage = fullServicePackage({
  id: 'hina-full-service',
  name: { he: 'חינה - שירות הפקה מלאה', en: 'Henna - Full Production Service', fr: 'Henné - Service de Production Complet' },
  sourceUrl: 'https://aaasada.com/hina'
});

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  let added = 0;
  for (const pkg of [shabbatChatanPackage, britFullServicePackage, hinaFullServicePackage]) {
    if (record.packages.some((p) => p.id === pkg.id)) {
      console.warn(`Package "${pkg.id}" already exists - skipping.`);
      continue;
    }
    record.packages.push(pkg);
    added++;
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): added ${added} formula package(s). Now has ${record.packages.length} package(s) total. (בר מצווה and אזכרות have no second tier beyond the base menu already on this caterer, so no new package was needed for those two.)`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
