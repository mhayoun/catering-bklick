// One-off script: adds "קייטרינג תבלין" (Tavlin) as a new, pre-approved caterer, sourced
// directly from its own site, https://tavlinbagan.co.il/ (found via web search for kosher
// caterers in Judea/Samaria and the North - the least-represented districts among existing
// listings). Meat catering, kosher mehadrin under בד"ץ יורה דעה / Rabbi Shlomo Machpud, with a
// full 9-tier priced package menu and 22 Google reviews at a 5.0 rating.
//
// *** IMPORTANT - documented overlap with two existing caterers in this project, added at the
// user's explicit instruction (asked, and told to include it flagged rather than skip it) ***
// - Address: this site's own JSON-LD gives "רחוב הגפן 10, מושב יגל" - the exact same street
//   address that scripts/update-hakatering-hacham-from-site.mjs found on "הקייטרינג החם"'s
//   scanned kashrut certificate (that caterer's registered food-prep premises, though its public
//   city is Petach Tikva).
// - Contact: this site's JSON-LD lists a second sales ContactPoint, "054-6272421" - identical to
//   the +972546272421 already on file as "אלדברי קייטרינג"'s WhatsApp number.
// - Menu wording: this site's ₪170 and ₪300 tiers use near-verbatim phrasing from "הקייטרינג
//   החם"'s own מבצע אירוע הכל כלול package (e.g. "פיש אנד צ'יפס או צ'יקן אנד צ'יפס", "מרק קובה
//   או מרק כתום" - see scripts/update-hakatering-hacham-from-site.mjs).
// Taken together this strongly suggests a shared commissary kitchen and/or shared
// marketing/lead-gen operator behind multiple branded storefronts, rather than three fully
// independent businesses. Tavlin nonetheless has its own domain, phone, branding, and a real,
// substantial Google review history distinct from the other two, so it is kept as its own
// listing - but this comment exists so anyone reviewing pending/duplicate listings later has the
// full picture.
//
// Pricing: 9 real priced tiers read from the site's raw HTML (not summarized) - ₪50 to ₪300 per
// serving. The two richest tiers (₪170 wedding/bar-mitzvah, ₪300 VIP) list specific course
// items, matching mohacham's schema-mapping approach (update-hakatering-hacham-from-site.mjs):
// reception + soup + "מנה ביניים" folded into `starters`, mains into `main_courses`. The other 7
// tiers only give category item *counts* on the site (e.g. "5 סוגי סלטים"), never specific dish
// names - rather than inventing fake dish names to fill categoryItems, each such category holds
// one honest descriptive line stating the count, and categoryLimits is left empty since a single
// placeholder line can't represent a real "pick N of these" choice.
//
// kashrutLevels: 'בד״ץ יורה דעה בפיקוח הרב שלמה מחפוד שליט״א' maps directly to the existing
// badatz_rav_machpud enum value - no need to fall back to a generic 'mehadrin'-only guess.
//
// Usage: node --env-file=.env.local scripts/add-tavlin.mjs

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
const SCRATCH = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad';
const LOGO_PATH = `${SCRATCH}/tavlin-logo.webp`;
const PHOTO_PATHS = ['g-10111.jpg', 'g-9697.jpg', 'g-9700.jpg'].map((f) => `${SCRATCH}/tavlin-photos/${f}`);

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}
function note(he) {
  return { id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' };
}

// Simple tiers (₪50-₪135): only category item *counts* are published, no dish names - see
// header comment. One descriptive line per category instead of invented dish names.
function simplePkg({ id, name, pricePerGuest, minGuests, categories, addons, eventTypes }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest,
    minGuests,
    includedCategories: Object.keys(categories),
    categoryLimits: {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, line]) => [cat, items([line])])),
    eventTypes,
    addons: (addons || []).map(note),
    sourceUrl: 'https://tavlinbagan.co.il/'
  };
}

const packages = [
  simplePkg({
    id: 'fish-basic',
    name: { he: 'מנת דגים - בסיס', en: '', fr: '' },
    pricePerGuest: 50,
    minGuests: 10,
    eventTypes: ['celebration', 'memorial', 'shabbat_chatan'],
    categories: { salads: '5 סוגי סלטים לבחירה', main_courses: '2 מנות דגים', hot_sides: '3 תוספות חמות', breads: 'לחמניה / המוציא / מזונות' }
  }),
  simplePkg({
    id: 'meat-basic',
    name: { he: 'מנה בשרית', en: '', fr: '' },
    pricePerGuest: 55,
    minGuests: 10,
    eventTypes: ['celebration', 'memorial', 'shabbat_chatan'],
    categories: { salads: '6 סוגי סלטים לבחירה', main_courses: '3 מנות בשר', hot_sides: '3 תוספות חמות', breads: 'לחמניה / המוציא / מזונות' }
  }),
  simplePkg({
    id: 'meat-full',
    name: { he: 'מנה בשרית מלאה', en: '', fr: '' },
    pricePerGuest: 65,
    minGuests: 10,
    eventTypes: ['celebration', 'memorial', 'shabbat_chatan'],
    categories: {
      salads: '7 סוגי סלטים לבחירה',
      starters: '2 מנות ראשונות',
      main_courses: '3 מנות בשר',
      hot_sides: '3 תוספות חמות',
      breads: 'לחמניה / המוציא / מזונות'
    }
  }),
  simplePkg({
    id: 'meat-drinks-disposable',
    name: { he: 'מנה מלאה כולל שתייה וכלים חד"פ מהודרים', en: '', fr: '' },
    pricePerGuest: 80,
    minGuests: 10,
    eventTypes: ['celebration', 'memorial'],
    categories: {
      salads: '7 סלטים',
      main_courses: '3 מנות בשר',
      hot_sides: '3 תוספות',
      beverages_non_alcoholic: 'שתייה קלה מבית קוקה קולה ופריגת',
      breads: 'לחמניה / המוציא / מזונות'
    },
    addons: ['כלים חד-פעמיים מהודרים בצבעים כלול', 'מלצרים ושירות החל מ-300 ₪ (תוספת)']
  }),
  simplePkg({
    id: 'meat-full-drinks-disposable',
    name: { he: 'מנה מלאה כולל שתייה וכלים חד"פ', en: '', fr: '' },
    pricePerGuest: 90,
    minGuests: 10,
    eventTypes: ['celebration', 'memorial'],
    categories: {
      salads: '8 סלטים',
      starters: '2 סוגי מנה ראשונה',
      main_courses: '3 מנות בשר',
      hot_sides: '3 תוספות חמות',
      beverages_non_alcoholic: 'שתייה קלה מבית קוקה קולה ופריגת',
      breads: 'לחמניה / המוציא / מזונות'
    },
    addons: ['כלים חד-פעמיים מהודרים בצבעים כלול']
  }),
  simplePkg({
    id: 'meat-full-porcelain',
    name: { he: 'מנה מלאה כולל כלי פורצלן', en: '', fr: '' },
    pricePerGuest: 120,
    minGuests: 10,
    eventTypes: ['celebration', 'wedding'],
    categories: {
      salads: '8 סלטים',
      starters: '2 סוגי מנה ראשונה',
      main_courses: '3 מנות בשר',
      hot_sides: '3 תוספות חמות',
      beverages_non_alcoholic: 'שתייה קלה מבית קוקה קולה ופריגת',
      breads: 'לחמניה / המוציא / מזונות'
    },
    addons: ['כלי חרסינה מהודרים כלול']
  }),
  simplePkg({
    id: 'shabbat_chatan',
    name: { he: 'חבילת שבת חתן - 3 סעודות', en: '', fr: '' },
    pricePerGuest: 135,
    minGuests: 10,
    eventTypes: ['shabbat_chatan'],
    categories: { salads: '8 סלטים (בכל סעודה)', starters: '2 ראשונות (ערב שבת)', hot_sides: '3 תוספות (בכל סעודה)', main_courses: '3 בשרים (בכל סעודה)' },
    addons: [
      'ערב שבת: 8 סלטים, 2 ראשונות, 3 תוספות, 3 בשרים',
      'שבת בוקר: 8 סלטים, 3 תוספות, 3 בשרים',
      'סעודה שלישית: 8 סלטים, דג מטוגן, פשטידת השף',
      'חמין בשרי: בתוספת 35 ₪ למנה',
      'חמין פרווה: בתוספת 8 ₪ לאדם'
    ]
  }),
  {
    id: 'wedding-vip',
    type: 'formula',
    name: { he: 'תפריט יוקרה לחתונות ובר/בת מצווה', en: '', fr: '' },
    pricePerGuest: 170,
    minGuests: 100,
    includedCategories: ['starters', 'salads', 'main_courses', 'desserts', 'beverages_non_alcoholic'],
    categoryLimits: {},
    categoryItems: {
      starters: items(['לחוח/קרואסון עם אסאדו', "פיש אנד צ'יפס או צ'יקן אנד צ'יפס", 'מרק קובה או מרק כתום', 'מטוגנים']),
      salads: items(['חומוס פטריות', 'מטבוחה', 'חציל בטחינה', 'סלט חסה', 'עגבניות שרי', 'פקאנים מקורמלים', 'טבולה']),
      main_courses: items(['אסאדו עסיסי', 'פרגית ים תיכונית', 'סטייק כרובית או פילה פורטבלו', 'סלמון קראסט עם פירה בטטה', 'סיגר בשר וצנוברים', 'טורטייה פטריות יער']),
      desserts: items(['פירות העונה', 'פטיפורים צרפתיים']),
      beverages_non_alcoholic: items(['שתייה חמה', 'שתייה קלה (קוקה קולה ופריגת)'])
    },
    eventTypes: ['wedding', 'bar_mitzvah'],
    addons: [
      'כלים פורצלן וכלי הגשה, מפות, מפיות וצוות מלצרים כלול',
      'תוספת תשלום: טיפים ומשלוח',
      'מגשי סושי בתוספת תשלום'
    ].map(note),
    sourceUrl: 'https://tavlinbagan.co.il/'
  },
  {
    id: 'premium-vip',
    type: 'formula',
    name: { he: 'תפריט VIP פרימיום - על האש בשרים מובחרים', en: '', fr: '' },
    pricePerGuest: 300,
    minGuests: 100,
    includedCategories: ['starters', 'salads', 'hot_sides', 'main_courses', 'desserts', 'beverages_non_alcoholic'],
    categoryLimits: {},
    categoryItems: {
      starters: items(['באן/קרואסון עם אסאדו', "פיש אנד צ'יפס או צ'יקן אנד צ'יפס", 'מרק קובה או מרק כתום', 'סיגרים/קובה']),
      salads: items(['חומוס פטריות', 'מטבוחה', 'חציל בטחינה', 'סלט חסה', 'עגבניות שרי', 'פקאנים מקורמלים', 'טבולה', 'קרפצ׳יו סלק']),
      hot_sides: items(['מיני תפו"א ברוזמרין', 'קרם בטטה', "ניוקי תפו\"א מוקפץ"]),
      main_courses: items(['סטייק אנטריקוט', 'צלעות טלה', 'קבב כבש על קינמון', 'סטייק פרגית', 'סלמון/דניס']),
      desserts: items(['פירות העונה', 'פטיפורים צרפתיים']),
      beverages_non_alcoholic: items(['שתייה חמה', 'שתייה קלה'])
    },
    eventTypes: ['wedding', 'bar_mitzvah'],
    addons: [
      'כלים פורצלן וכלי הגשה, מפות, מפיות וצוות מלצרים כלול',
      'תוספת תשלום: טיפים, משלוח, סושי, כרובית מטוגנת, עראייס'
    ].map(note),
    sourceUrl: 'https://tavlinbagan.co.il/'
  }
];

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
    businessName: 'קייטרינג תבלין',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג תבלין - קייטרינג בשרי כשר למהדרין, בד״ץ יורה דעה בפיקוח הרב שלמה מחפוד שליט״א, ירק מגוש קטיף. משלוחים לכל הארץ, ממנה בודדת (החל מ-50 ש״ח) ועד אירועי יוקרה של מאות מנות - חתונה, חינה, ברית מילה, בר/בת מצווה, שבת חתן, ימי הולדת, אזכרה ושבעה. 9 חבילות לכל תקציב, דירוג 5.0 מתוך 22 ביקורות בגוגל.',
      en: 'Tavlin Catering - meat catering, kosher mehadrin, Badatz Yoreh Deah under the supervision of Rabbi Shlomo Machpud, vegetables from Gush Katif. Nationwide delivery, from a single serving (from ₪50) up to luxury events of hundreds of servings - weddings, henna, brit milah, bar/bat mitzvah, shabbat chatan, birthdays, memorials and shiva. 9 packages for every budget, rated 5.0 from 22 Google reviews.',
      fr: "Traiteur Tavlin - traiteur carné, cacher mehadrin, Badatz Yoreh Deah sous la supervision du Rabbin Shlomo Machpud, légumes de Gush Katif. Livraison dans tout le pays, d'une simple portion (dès 50 ₪) à des événements de luxe de centaines de portions - mariages, henné, brit mila, bar/bat mitsva, shabbat chatan, anniversaires, azkara et chiva. 9 formules pour tous les budgets, noté 5.0 sur 22 avis Google."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // site: משלוחים לכל הארץ; JSON-LD areaServed lists צפון/מרכז/ירושלים explicitly
    city: { he: 'מושב יגל', en: 'Moshav Yagel', fr: 'Moshav Yagel' },
    address: 'רחוב הגפן 10, מושב יגל',
    kashrutLevels: ['badatz_rav_machpud'], // בד"ץ יורה דעה בפיקוח הרב שלמה מחפוד שליט"א
    cateringTypes: ['meat'],
    maxGuests: 1000, // site: "ניתן להזמין החל מ-10 מנות ועד 1,000 מנות"
    priceFrom: 50,
    packages,
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration', 'memorial'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts', 'beverages_non_alcoholic'],
    services: ['waiter_staff', 'elegant_tableware', 'disposable_tableware'],
    phone: '+972-72-3310061',
    whatsapp: '+972723310061',
    email: '',
    website: 'https://tavlinbagan.co.il/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, ${photos.length} photos, and ${packages.length} formulas.`);
  console.log('NOTE: this listing has a documented address/contact overlap with existing caterers - see header comment.');
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
