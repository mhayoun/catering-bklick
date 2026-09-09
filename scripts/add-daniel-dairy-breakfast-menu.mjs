// One-off follow-up script: the /תפריט-חלבי.html page actually has TWO distinct dairy menus, not
// one - scripts/add-daniel-dairy-menu.mjs only captured the seated multi-course menu (from the
// page's linked PDF). This script adds the second one: a fixed breakfast/brit-style spread
// (bagels, cream cheeses, tuna/egg salad, a vegetable platter, cakes, a coffee/tea station), read
// directly from the page's own text (not a separate PDF) and explicitly labeled there as "מתאים
// לבריתות/ארוחות בוקר" (suited to brit milah / breakfast events) - narrower than the other 3
// formulas' general event-type list, so eventTypes here is just ['brit'].
//
// Note: a heading reading "תפריט זהב - קייטרינג דניאל" also appears on this same page, right
// after this breakfast menu's content - but nothing but generic Milk'Chic brand-story text
// follows it (no dish list), so it isn't a real third menu and nothing is modeled for it.
//
// This is a fixed included spread, not a "choose N of M" formula - every base item is included
// (no categoryLimits), and the page's own "בתוספת מחיר" (extra cost) upgrades are kept as
// informational addons since no prices are published for them.
//
// Usage: node --env-file=.env.local scripts/add-daniel-dairy-breakfast-menu.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'E0snlyvmF6';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

const breakfastMenu = {
  id: 'milkshake-breakfast-menu',
  type: 'formula',
  name: { he: 'תפריט חלבי - ארוחת בוקר / ברית', en: 'Dairy Menu - Breakfast / Brit', fr: 'Menu Lacté - Petit-déjeuner / Brit' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: ['breads', 'starters', 'desserts', 'beverages_non_alcoholic'],
  categoryLimits: {},
  categoryItems: {
    breads: ['מבחר בייגלס / לחמניות קמח מלא'],
    starters: [
      '2 סוגי גבינות שמנת', 'סלט טונה', 'סלט ביצים', 'פלטת ירקות + מטבל', 'סלט חי (חסה קיסר / ישראלי קצוץ)'
    ],
    desserts: ['מבחר עוגות מרכזי'],
    beverages_non_alcoholic: ['שתייה קרה - נקטר תפוזים, מים מינרלים', 'תחנת קפה ותה']
  },
  eventTypes: ['brit'],
  addons: noteAddons([
    'בתוספת מחיר: גבינות קשות (צהובה, חרמון, הולנדי, בטעמים)',
    'בתוספת מחיר: גבינות רכות (קוטג\' 9%, לבנה)',
    'בתוספת מחיר: פלטות לקס',
    'בתוספת מחיר: פלטות דגים מעושנים ומלוחים, מקרל, הרינג',
    'בתוספת מחיר: בורקס גבינה / פיצה / תרד',
    'בתוספת מחיר: ביצים מקושקשות (מרכזי)',
    'כשר למהדרין בהכשר בד"ץ העדה החרדית ירושלים'
  ]),
  sourceUrl: 'https://www.cateringbadatz.com/%D7%AA%D7%A4%D7%A8%D7%99%D7%98%2D%D7%97%D7%9C%D7%91%D7%99.html'
};

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  if (record.packages.some((p) => p.id === breakfastMenu.id)) {
    console.warn(`Package "${breakfastMenu.id}" already exists - skipping.`);
  } else {
    record.packages.push(breakfastMenu);
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): now has ${record.packages.length} package(s) total.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
