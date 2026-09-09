// One-off script: adds "ביסקוטי" (Biscotti) as a new, pre-approved caterer, sourced from its own
// website https://www.biscotti.co.il/ - a dairy/parve patisserie-and-catering chain with 9
// storefronts across central Israel (Bnei Brak, Noe Oz, Netanya, Or Akiva, Carmei Gat, Rosh
// HaAyin, Beer Yaakov, Tel Mond, Kfar Saba). Logo + 2 photos are downloaded locally then uploaded
// to this project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's
// convention).
//
// The /catering page itself is a lead-capture landing page with no menu or pricing (same pattern
// as scripts/add-setti.mjs and scripts/add-mangalistim.mjs's written formulas) - but the site's
// shop (embedded via a GetMood.io storefront widget) publishes real per-tray prices. The shop's
// product grid doesn't render into document.body.innerText/querySelectorAll from a page-context
// script for this site (still same-origin, cause unclear), so items below were read via the
// Chrome accessibility tree instead (mcp__claude-in-chrome__read_page) - the "מגשי אירוח"
// (hosting trays) category only; the site has ~10 more shop categories (סלטים, כריכים, מאפים
// ולחמים, פסטות, עוגות, טבעוני, etc.) not scraped here for time. Modeled as one a_la_carte
// package, same convention as scripts/add-tmarim-alacarte-trays.mjs and scripts/add-pasha.mjs.
//
// kashrutLevels and address are both real, read directly from the site's own linked kashrut
// certificate PDF (בד"ץ בית יוסף, valid until 20 Apr 2027): "כשר למהדרין-פרווה/חלבי" under
// Badatz Beit Yosef, produced at "רחוב הירקון 67 בבני ברק" (the HQ/production address, distinct
// from the 9 retail storefronts).
//
// Usage: node --env-file=.env.local scripts/add-biscotti.mjs

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
const SRC_DIR =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/biscotti-site';

// [name, price (smaller size where multiple are shown), categoryId]
const HOSTING_PRODUCTS = [
  ['מגש מיני שיפודי מוצרלה', 142, 'cheese_bread_savory'],
  ['מיני קדאיף (מלוח)', 113, 'hot_food'],
  ["מגש פאו דה קז'ו", 128, 'quiches_pies_burekas'],
  ['מגש מיני טארטאלט', 128, 'quiches_pies_burekas'],
  ["מגש מיני חצאי ג'חנון", 118, 'hot_food'],
  ['מגש סלטים אישיים', 90, 'salads'],
  ['מגש גבינות משובחות (176 ₪ / 274 ₪ לפי גודל)', 176, 'cheese_bread_savory'],
  ['מגש גבינות רכות (140 ₪ / 220 ₪ לפי גודל)', 140, 'cheese_bread_savory'],
  ['מגש ירקות אנטיפסטי', 117, 'fruit_veg'],
  ['מגש סלטי קיסר אישי', 120, 'salads'],
  ['פלטת ירקות טריים', 81, 'fruit_veg'],
  ['מגש פחזניות מלוחות', 104, 'quiches_pies_burekas'],
  ['מגש קרוסטיני', 107, 'cheese_bread_savory'],
  ['מגש קרקרים תוצרת בית - גדול', 118, 'cheese_bread_savory'],
  ['מגש קרקרים תוצרת בית - קטן', 64, 'cheese_bread_savory'],
  ['מגש קנאפסים', 140, 'hot_food'],
  ['מגש טורטייה סושי', 118, 'sushi_specials'],
  ['מגש מיני פיצות', 142, 'quiches_pies_burekas'],
  ['מגש פחזניות פלחי סלמון וגבינת שמנת', 113, 'deli_counter'],
  ['פלטת סלמון מעושן', 229, 'deli_counter'],
  ['מגש שיפודי סלמון בפנקו', 267, 'hot_food'],
  ['פלטת דגים מעושנים (285 ₪ / 409 ₪ / 651 ₪ לפי גודל)', 285, 'deli_counter'],
  ['סלמון אפוי - יחידה', 42, 'hot_food'],
  ['פילה סלמון שלם אפוי', 318, 'hot_food'],
  ['סושי (360 ₪ - 655 ₪ לפי גודל)', 360, 'sushi_specials'],
  ['לביבות בטטה', 138, 'hot_food'],
  ['לביבות זוקיני', 138, 'hot_food'],
  ['מגש עלי גפן', 170, 'hot_food']
];

const alaCartePackage = {
  id: 'hosting-trays',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח (קטלוג חנות)', en: 'Hosting Trays (Shop Catalog)', fr: "Plateaux de Réception (Catalogue Boutique)" },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.biscotti.co.il/shop/plate/hosting',
  addons: HOSTING_PRODUCTS.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  }))
};

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne('logo.png', 'image/png');
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const photo2 = await uploadOne('photo2.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'ביסקוטי',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'ביסקוטי - בית יוצר טעמים. קונדיטוריה וקייטרינג חלבי/פרווה כשר למהדרין (בד"ץ בית יוסף), עם 9 סניפים במרכז הארץ. שירותי קייטרינג לבזכות ליווי אישי ומקצועי, מגשי אירוח ומגדנות ביתיות המתאימים לכל אירוע - פרטי או עסקי, קטן או גדול.',
      en: 'Biscotti - a house of creating flavors. Dairy/parve kosher mehadrin patisserie and catering (Badatz Beit Yosef), with 9 branches across central Israel. Personal, professional catering service, hosting trays and homemade delicacies suited to any event - private or corporate, small or large.',
      fr: "Biscotti - une maison qui crée des saveurs. Pâtisserie et traiteur lacté/parve cacher mehadrin (Badatz Beit Yossef), avec 9 succursales au centre d'Israël. Un service traiteur personnel et professionnel, des plateaux de réception et des douceurs maison adaptés à tout événement - privé ou professionnel, petit ou grand."
    },
    districts: ['center', 'telaviv', 'north'],
    city: { he: 'בני ברק', en: 'Bnei Brak', fr: 'Bnei Brak' },
    address: 'רחוב הירקון 67, בני ברק',
    kashrutLevels: ['badatz_beit_yosef', 'mehadrin'],
    cateringTypes: ['dairy'],
    maxGuests: 300,
    priceFrom: '', // no per-guest/per-event pricing published, only per-tray shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food'],
    phone: '+972-3-3730025',
    whatsapp: '',
    email: 'Bar_e@biscotti.co.il',
    website: 'https://www.biscotti.co.il/',
    instagram: 'https://www.instagram.com/biscotti_il',
    facebook: 'https://www.facebook.com/BiscottiTastes',
    logo: logoUrl,
    photos: [photo1, photo2],
    videos: [],
    status: 'approved',
    reviewedBy: 'joetiger05@gmail.com',
    reviewedAt: now,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };

  await kv.set(`caterer:${record.id}`, record);
  await kv.sadd('caterers:index', record.id);
  await kv.sadd(`owner:${record.ownerEmail}`, record.id);
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
