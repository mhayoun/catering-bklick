// One-off follow-up script: adds the dairy formula menu to "דניאל קייטרינג" (added by
// scripts/add-daniel-catering.mjs, which only modeled the 3 meat tiers). The site's own
// /תפריט-חלבי.html page describes this as a separate branded sub-line, "Milk'Chic - אירוע חלבי",
// marketed under the same בד"ץ העדה החרדית ירושלים kashrut. Its full dish list was read from the
// page's own linked PDF (מילקשייק-1.pdf).
//
// No explicit "X לבחירה" count is printed anywhere on this menu (unlike the meat כסף/ק"ב תפריט,
// which states a number for every course) - just "לבחירה" (to choose from), so no categoryLimits
// entry is set on any category here (no limit = every listed item shown), same convention used
// for the meat תפריט זהב's uncounted courses.
//
// The menu's own "סלטים ושתיה" (salads & drinks) section names no specific dish (just "2 סוגי
// גבינות שמנת" / "2 סלטי הבית" without naming which cheeses/salads) - kept as an informational
// addon rather than inventing specific item names.
//
// No price is published for this menu either (same lead-gen/quote pattern as the meat tiers) -
// pricePerGuest left ''.
//
// Usage: node --env-file=.env.local scripts/add-daniel-dairy-menu.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'E0snlyvmF6';
const EVENT_TYPES = ['brit', 'engagement', 'bar_mitzvah', 'wedding', 'shabbat_chatan', 'celebration'];

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

const milkshakeMenu = {
  id: 'milkshake-dairy-menu',
  type: 'formula',
  name: { he: 'תפריט מילקשייק - חלבי', en: "Milk'Chic Dairy Menu", fr: 'Menu Lacté Milk\'Chic' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: ['main_courses', 'hot_sides', 'desserts'],
  categoryLimits: {},
  categoryItems: {
    main_courses: ['לזניה', 'פסטה ברוטב', 'קיש גבינה', 'פילה סלמון', 'פילה מושט', 'דג סול'],
    hot_sides: [
      'דואט פירה בטטה ותפו"א (מומלץ)', 'שעועית ירוקה', 'פשטידת בצל / ירקות / קיש / פטריות',
      'תפו"א אפוי', 'אנטיפסטי אפוי'
    ],
    desserts: [
      "בלינצ'ס גבינה ברוטב קרמל", 'גלידה חלבית', 'סופלה שוקולד חם', 'פאי בטעמים', 'עוגת טריקולד חלבי אישי'
    ]
  },
  eventTypes: EVENT_TYPES,
  addons: noteAddons([
    'כלול: 2 סוגי גבינות שמנת, 2 סלטי הבית, בר שתייה חמה וקרה, לחמניות קוקטייל/המוציא או מבחר לחמניות מזרחי - על חשבון הבית',
    'כשר למהדרין בהכשר בד"ץ העדה החרדית ירושלים (מותג "Milk\'Chic - אירוע חלבי")'
  ]),
  sourceUrl: 'https://www.cateringbadatz.com/image/users/273992/ftp/my_files/%D7%AA%D7%A4%D7%A8%D7%99%D7%98%20%D7%9E%D7%99%D7%9C%D7%A7%D7%A9%D7%99%D7%99%D7%A7-1.pdf'
};

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  if (record.packages.some((p) => p.id === milkshakeMenu.id)) {
    console.warn(`Package "${milkshakeMenu.id}" already exists - skipping.`);
  } else {
    record.packages.push(milkshakeMenu);
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): now has ${record.packages.length} package(s) total.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
