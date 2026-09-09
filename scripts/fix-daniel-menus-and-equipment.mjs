// One-off follow-up script for "דניאל קייטרינג" (added by scripts/add-daniel-catering.mjs +
// scripts/add-daniel-dairy-menu.mjs + scripts/add-daniel-dairy-breakfast-menu.mjs +
// scripts/add-daniel-equipment-rental.mjs). Per user request:
//
//   1. scripts/add-daniel-equipment-rental.mjs modeled the equipment/textile rental page as a
//      sentence appended to the description, with the raw page URL inline as plain text (ugly,
//      unclickable). That's now replaced by a real a_la_carte package ("כלים" - tableware/
//      equipment rental) whose items were read from the page's own category breakdown (textiles,
//      decorative items, tableware/serving, furniture); no prices are published anywhere on that
//      page, so every item is priceType 'flat' with an empty amount, which the caterer page
//      renders as "Price on request". The appended description sentence + raw URL is removed
//      (the original, shorter "כולל גם השכרת ציוד וטקסטיל לאירועים" mention stays).
//   2. The 3 meat formula menus (כסף/זהב/VIP) had sourceUrl pointing at hard-to-reach PDFs on a
//      third-party file host (sfilev2.f-static.com); switched to the site's own "קייטרינג
//      לאירועים" page, which lists and links all of them.
//   3. The Milkshake dairy formula menu had sourceUrl pointing at a PDF on the caterer's own
//      domain; switched to the site's own "תפריט חלבי" page (same page already used by
//      milkshake-breakfast-menu's sourceUrl).
//
// Usage: node --env-file=.env.local scripts/fix-daniel-menus-and-equipment.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'E0snlyvmF6';

const EQUIPMENT_URL = 'https://www.cateringbadatz.com/%D7%94%D7%A9%D7%9B%D7%A8%D7%AA%2D%D7%A6%D7%99%D7%95%D7%93%2D%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D.html';
const CATERING_MENUS_URL = 'https://www.cateringbadatz.com/%D7%A7%D7%99%D7%99%D7%98%D7%A8%D7%99%D7%A0%D7%92%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D.html';
const DAIRY_MENU_URL = 'https://www.cateringbadatz.com/%D7%AA%D7%A4%D7%A8%D7%99%D7%98%2D%D7%97%D7%9C%D7%91%D7%99.html';

const DESCRIPTION_SUFFIXES = {
  he: ' מציעים גם מחלקת השכרת ציוד וטקסטיל עשירה לאירועים (מפות, כיסויי כיסאות, מרכזי שולחן, כלי אוכל, ריהוט ועוד) - לפרטים: ' + EQUIPMENT_URL,
  en: ' They also offer a rich event equipment and textile rental department (tablecloths, chair covers, table centerpieces, tableware, furniture and more) - details: ' + EQUIPMENT_URL,
  fr: ' Ils proposent également un vaste service de location de matériel et de linge pour événements (nappes, housses de chaise, centres de table, vaisselle, mobilier, etc.) - détails : ' + EQUIPMENT_URL
};

const SOURCE_URL_FIXES = {
  'kesef-kb-events-menu': CATERING_MENUS_URL,
  'zahav-menu': CATERING_MENUS_URL,
  'vip-menu': CATERING_MENUS_URL,
  'milkshake-dairy-menu': DAIRY_MENU_URL
};

function section(he, en, fr) {
  return { he, en, fr };
}

const EQUIPMENT_SECTIONS = [
  {
    label: section('טקסטיל', 'Textiles', 'Textile'),
    items: ['מפות במגוון צבעים', 'מפיות בצבעים שונים', 'ראנרים', 'סקרטינג', 'כיסויים לכיסאות']
  },
  {
    label: section('כלים דקורטיביים', 'Decorative Items', 'Articles décoratifs'),
    items: ['קנדילברות', 'פמוטות', 'קריסטלים', 'כלים דקורטיביים מזכוכית', 'אנדרפלייט', 'עיצוב בארים']
  },
  {
    label: section('כלי אוכל והגשה', 'Tableware & Serving', 'Vaisselle et service'),
    items: [
      'צלחות', 'סכו"ם', 'כוסות לשתייה קלה', 'כוסות יין', 'כוסות לשתייה חמה', 'כלי הגשה',
      'סלטיות', 'רוטביות', 'סטנד למלצרים', 'מגשי חלוקה', 'מלחיות', 'לפתניות'
    ]
  },
  {
    label: section('ריהוט', 'Furniture', 'Mobilier'),
    items: ['מיטות', 'שולחנות', 'כיסאות', 'שמיכות', 'מזרנים']
  }
];

const equipmentPackage = {
  id: 'equipment-rental-catalog',
  type: 'a_la_carte',
  name: section('השכרת כלים וציוד לאירועים', 'Equipment & Tableware Rental', 'Location de Vaisselle et de Matériel'),
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: EQUIPMENT_URL,
  addons: EQUIPMENT_SECTIONS.flatMap(({ label, items }) =>
    items.map((he) => ({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: '',
      menuSection: label
    }))
  )
};

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  for (const [lang, suffix] of Object.entries(DESCRIPTION_SUFFIXES)) {
    if (record.description[lang]?.endsWith(suffix)) {
      record.description[lang] = record.description[lang].slice(0, -suffix.length);
    } else {
      console.warn(`Description[${lang}] did not end with the expected appended sentence - leaving as-is.`);
    }
  }

  for (const pkg of record.packages) {
    if (SOURCE_URL_FIXES[pkg.id]) {
      pkg.sourceUrl = SOURCE_URL_FIXES[pkg.id];
    }
  }

  if (record.packages.some((p) => p.id === equipmentPackage.id)) {
    console.warn(`Package "${equipmentPackage.id}" already exists - skipping add.`);
  } else {
    record.packages.push(equipmentPackage);
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): description cleaned, ${Object.keys(SOURCE_URL_FIXES).length} sourceUrl(s) fixed, equipment a_la_carte catalog ${record.packages.some((p) => p.id === equipmentPackage.id) ? 'present' : 'missing'} (${equipmentPackage.addons.length} items). Now ${record.packages.length} package(s) total.`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
