// One-off script: adds "קייטרינג אוסישקין" (Ussishkin) as a new, pre-approved caterer, sourced
// directly from its own site, https://ussishkin.co.il/ (found via web search for kosher caterers
// in the Krayot/Haifa area - the North and Haifa districts are the 2nd/3rd-least-represented
// districts among existing listings, after Judea/Samaria; two Judea/Samaria candidates checked
// first this round - קייטרינג בית שמש-area "מיוחד מהמטבח", meyuchad.co.il, and "מטעמים",
// matamim.net - were skipped: the first has dedicated per-event-type menu pages but every one is
// generic marketing prose with zero real dish names or prices (just "מינימום 50 מנות"), and the
// second's copy/template ("כשר למהדרין... החל מ-XX ש"ח לסועד", per-city landing pages) closely
// matches the same lead-gen network pattern as teamimofmama.com/aaasada.com/nightkitchen.co.il
// already flagged in scripts/add-tavlin.mjs's header comment, too risky to treat as a distinct
// single business without stronger verification).
//
// Ussishkin is unambiguously a single real business: full JSON-LD Organization/LocalBusiness
// schema with a registered ח.פ. (515906303), a named kashrut supervisor with certificate number
// (רבנות קרית מוצקין, תעודה 480300269), separate dairy/meat kitchens, an event hall (עד 80
// סועדים), and professional photography throughout. Based in Kiryat Motzkin (Haifa Bay/Krayot),
// serving the Krayot, Haifa, and North (Nahariya, Akko, Karmiel, Safed, Kiryat Shmona, Tiberias,
// Beit Shean, Afula, Nazareth) per its own areaServed list.
//
// No overlap found with any existing caterer (distinct phone, address, and name).
//
// Pricing: this is a real Shopify storefront selling individually priced hospitality trays
// (מגשי אירוח) - NOT a per-guest event formula. Modeled as CatererForm.js's a_la_carte package
// type (see blankAlaCartePackage there and scripts/add-tmarim-alacarte-trays.mjs for precedent):
// 65 unique dairy tray products with real prices (₪60-₪280), scraped from the site's own
// homepage catalog listing (not summarized/estimated) and tagged with the closest
// ALACARTE_CATEGORIES id. The site also sells a separate meat tray catalog
// (/pages/מגשי-אירוח-בשריים) and full per-guest event catering - NOT itemized here since their
// prices weren't individually captured; cateringTypes is still set to both dairy+meat per the
// site's own "מטבחים נפרדים, חלבי ובשרי" (separate dairy/meat kitchens) copy and dual kashrut
// certificates, and this is noted in the description.
//
// kashrutLevels: 'רבנות קרית מוצקין' (Kiryat Motzkin local rabbinate, with a named certificate
// number) maps directly to the existing local_rabbinate enum value.
//
// maxGuests: the site's own event-hall copy states 'חדר אירועים עד 80 סועדים' - used directly
// rather than a placeholder guess.
//
// Usage: node --env-file=.env.local scripts/add-ussishkin.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set.');
  process.exit(1);
}

const OWNER_EMAIL = 'yelotag@gmail.com';
const SCRATCH = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/dd7c3c19-a0ef-43c3-892c-3b871e78b18b/scratchpad';
const LOGO_PATH = `${SCRATCH}/ussishkin-photos/logo2.webp`;
const PHOTO_PATHS = ['food1.jpg', 'food2.jpg', 'food3.jpg'].map((f) => `${SCRATCH}/ussishkin-photos/${f}`);

// [name, price, ALACARTE_CATEGORIES categoryId] - read verbatim from ussishkin.co.il's own
// homepage dairy-tray catalog listing (65 unique products).
const PRODUCTS = [
  ['פסטה אלפרדו', 160, 'hot_food'],
  ['רביולי בטטה', 190, 'hot_food'],
  ['פסטה רוזה', 160, 'hot_food'],
  ['נודלס אסיאתי', 160, 'hot_food'],
  ['רביולי גבינות', 190, 'hot_food'],
  ['מיני לזניה', 250, 'hot_food'],
  ['תפוח אדמה מוקרם', 200, 'hot_food'],
  ['פסטה ברוטב עגבניות', 160, 'hot_food'],
  ['פסטה אולי אוליו', 180, 'hot_food'],
  ['קציצות דגים', 250, 'hot_food'],
  ['מיני שקשוקה', 200, 'hot_food'],
  ['בורקס פינוקים', 145, 'quiches_pies_burekas'],
  ['מיני בורקס תרד וגבינות', 160, 'quiches_pies_burekas'],
  ['מיני בורקס גבינה', 160, 'quiches_pies_burekas'],
  ['מיני קיש בטטה', 200, 'quiches_pies_burekas'],
  ['מיני פיצות', 140, 'cheese_bread_savory'],
  ["פוקאצ'ות", 160, 'cheese_bread_savory'],
  ['מיני בייגל', 120, 'cheese_bread_savory'],
  ['מקלות שום', 125, 'cheese_bread_savory'],
  ['מקלות פרמזן', 125, 'cheese_bread_savory'],
  ['סיגר גבינות', 220, 'cheese_bread_savory'],
  ['מיני רוגעלך', 140, 'cookies_pastries'],
  ['פחזניות בציפוי שוקלד', 175, 'cookies_pastries'],
  ['קראנץ שוקולד', 60, 'cookies_pastries'],
  ['קראנץ שקדים', 60, 'cookies_pastries'],
  ['מיקס עוגיות', 150, 'cookies_pastries'],
  ['כדורי שוקולד', 150, 'cookies_pastries'],
  ['בראוניז אישית', 200, 'desserts_sweets'],
  ['פטיפור גבינה', 160, 'desserts_sweets'],
  ['פטיפור אגוזים', 160, 'desserts_sweets'],
  ['כוס רד ולווט', 240, 'desserts_sweets'],
  ['כוס ביסקויטים', 240, 'desserts_sweets'],
  ['כוס טירמיסו', 240, 'desserts_sweets'],
  ['מיני סופלונים', 240, 'desserts_sweets'],
  ['סלט תפוח אדמה', 170, 'salads'],
  ['סלט שוק', 180, 'salads'],
  ['סלט קפרזה', 190, 'salads'],
  ['סלט בטטה', 170, 'salads'],
  ['סלט לבבות קיסר', 165, 'salads'],
  ['סלט ירוקים ופיצוחים', 170, 'salads'],
  ['סלט פסטה', 180, 'salads'],
  ['סלט כרוב אסיאתי', 160, 'salads'],
  ['סלט שורשים אסיאתי', 160, 'salads'],
  ['סלט טבולה', 170, 'salads'],
  ['טורטיות סלט ביצים', 195, 'sandwiches_trays'],
  ['טורטיות גבינות', 195, 'sandwiches_trays'],
  ['טורטיות טונה', 195, 'sandwiches_trays'],
  ["טורטיות מצופות במילוי סביח", 200, 'sandwiches_trays'],
  ['מיני סביח', 180, 'sandwiches_trays'],
  ['ביס גבינות', 160, 'sandwiches_trays'],
  ['ביס טונה', 160, 'sandwiches_trays'],
  ['ביס מקושקשת', 160, 'sandwiches_trays'],
  ['דגנים מקושקשת', 160, 'sandwiches_trays'],
  ['סושי טורטייה', 185, 'sandwiches_trays'],
  ['שווארמה פטריות', 180, 'sandwiches_trays'],
  ['שווארמה טבעונית', 195, 'pareve_vegan_no_sugar'],
  ['ירקות חתוכים', 120, 'fruit_veg'],
  ['מגש פירות', 250, 'fruit_veg'],
  ['ירקות אנטיפסטי', 150, 'fruit_veg'],
  ['עלי גפן ממולאים', 150, 'fruit_veg'],
  ['סירת פירות', 280, 'fruit_veg'],
  ['שיפודי אנטיפסטי', 180, 'fruit_veg'],
  ['יקיטורי סלומון', 220, 'deli_counter'],
  ['סיגר סלמון', 240, 'deli_counter'],
  ['פחזניות סלמון', 220, 'deli_counter']
];

const alacartePackage = {
  id: 'dairy-trays',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח חלביים', en: '', fr: '' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  addons: PRODUCTS.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  })),
  sourceUrl: 'https://ussishkin.co.il/'
};

async function uploadOne(filePath, contentType) {
  const buf = await readFile(filePath);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${path.basename(filePath)}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${path.basename(filePath)} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logo = await uploadOne(LOGO_PATH, 'image/webp');
  const photos = [];
  for (const p of PHOTO_PATHS) photos.push(await uploadOne(p, 'image/jpeg'));
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג אוסישקין',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג אוסישקין - Art Food - קייטרינג חלבי ובשרי כשר (רבנות קרית מוצקין) בקרית מוצקין, משרת את הקריות, חיפה והצפון כולו - נהריה, עכו, כרמיאל, צפת, קרית שמונה, טבריה, בית שאן, עפולה ונצרת. מטבחים נפרדים לחלבי ולבשרי, מגשי אירוח מעוצבים, שולחנות שוק, בית קפה חלבי ואולם אירועים עד 80 סועדים. מגוון רחב של מגשי אירוח חלביים - פסטות, סלטים, כריכונים, גבינות, מתוקים וטבעוני - לכל סוג אירוע.',
      en: 'Ussishkin Catering - Art Food - kosher dairy and meat catering (under the Kiryat Motzkin local rabbinate) based in Kiryat Motzkin, serving the Krayot, Haifa and the whole North - Nahariya, Akko, Karmiel, Safed, Kiryat Shmona, Tiberias, Beit Shean, Afula and Nazareth. Separate dairy and meat kitchens, designed hospitality trays, market-style tables, a dairy café, and an event hall for up to 80 guests. A wide range of dairy hospitality trays - pastas, salads, sandwiches, cheeses, sweets and vegan options - for every kind of event.',
      fr: "Ussishkin Catering - Art Food - traiteur laitier et carné cacher (sous la rabbinat local de Kiryat Motzkin) basé à Kiryat Motzkin, desservant les Krayot, Haïfa et tout le Nord - Nahariya, Acre, Karmiel, Safed, Kiryat Shmona, Tibériade, Beit Shean, Afula et Nazareth. Cuisines laitière et carnée séparées, plateaux de réception soignés, tables façon marché, café laitier et salle de réception jusqu'à 80 convives. Un large choix de plateaux laitiers - pâtes, salades, sandwichs, fromages, sucreries et options végétaliennes - pour tout type d'évènement."
    },
    districts: ['haifa', 'north'],
    city: { he: 'קרית מוצקין', en: 'Kiryat Motzkin', fr: 'Kiryat Motzkin' },
    address: 'אוסישקין 30, קרית מוצקין',
    kashrutLevels: ['local_rabbinate'],
    cateringTypes: ['dairy', 'meat'],
    maxGuests: 80,
    priceFrom: 60,
    packages: [alacartePackage],
    eventTypes: ['bar_mitzvah', 'brit', 'wedding', 'celebration'],
    menuCategories: [],
    alaCarteCategories: ['sandwiches_trays', 'salads', 'cheese_bread_savory', 'quiches_pies_burekas', 'hot_food', 'cookies_pastries', 'desserts_sweets', 'pareve_vegan_no_sugar', 'fruit_veg', 'deli_counter'],
    services: ['elegant_tableware', 'free_delivery', 'vegetarian_food'],
    phone: '+972-4-610-0001',
    whatsapp: '',
    email: 'ussishkinn@gmail.com',
    website: 'https://ussishkin.co.il/',
    instagram: '',
    facebook: '',
    logo,
    photos,
    videos: [],
    status: 'approved',
    reviewedBy: 'yelotag@gmail.com',
    reviewedAt: now,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };

  await kv.set(`caterer:${record.id}`, record);
  await kv.sadd('caterers:index', record.id);
  await kv.sadd(`owner:${record.ownerEmail}`, record.id);
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, ${photos.length} photos, and ${alacartePackage.addons.length} à la carte items.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
