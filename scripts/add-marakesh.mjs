// One-off script: adds "קייטרינג מרקש" (Catering Marakesh) as a new, pre-approved caterer.
// Sourced from its own website https://catering-marakesh.co.il/ (found via web search for
// "Jerusalem kosher catering" - its SEO landing pages target Jerusalem-area search terms, e.g.
// /קייטרינג-בירושלים/, /קייטרינג-לחתונה-בירושלים/).
//
// IMPORTANT correction to that framing: the site's own /אודות/ and /צור-קשר/ pages state the real
// address as "בלטימור 7, פתח תקווה" (Baltimore St 7, Petah Tikva) and describe the service area as
// "אזור פתח תקווה והמרכז" (Petah Tikva and the Center region) - not Jerusalem. The menu poster
// itself is even headed "קייטרינג מרקש - פתח תקווה". So districts is set to the real, stated base
// (`center`), not `jerusalem`, despite the Jerusalem-targeted SEO copy on the landing pages. Same
// phone-prefix pattern (03-77948xx) and identical kashrut supervision (Badatz Yoreh De'ah, Rav
// Shlomo Machpud) as scripts/add-hazen.mjs's "הזן את הכל" strongly suggests these are run by the
// same marketing operator/vendor network, though they're kept as two separate caterer records
// since they have distinct business names, contact details and menus.
//
// Real menu found as a single clean poster image (/wp-content/uploads/2025/06/תפריט-מרקש-מעודכן.jpg,
// legible at full resolution, no OCR/guessing needed) with 4 free-choice categories (salads, a
// pareve/fish "middle course", meat mains, hot sides) plus a separately-priced desserts/breads/
// Shabbat-food price list. Modeled as two packages: one `formula` (the free-choice categories) and
// one `a_la_carte` (the individually priced items) - same split convention used for
// scripts/add-hazen-formulas-logo-photos.mjs's soup/cholent notes, but here the desserts/breads
// really do have real ₪ prices per the poster, so they're real `flat` addons instead of just notes.
// A few items inside the free-choice categories also carry an explicit upsell price on the poster
// (e.g. "אסאדו - 10 ₪") - kept verbatim in the item text rather than modeled as separate pricing,
// consistent with scripts/add-daniel-catering.mjs's "מנת דג בתוספת מחיר" treatment.
//
// Logo and 6 real event/food photos (Sony ILCE-7M3/7M4 RAW-derived, Lightroom-edited, EXIF-dated
// 2023 and 2025 - genuine studio photography, not stock) pulled from the site's own uploads and
// re-hosted on this project's Vercel Blob store.
//
// Usage: node --env-file=.env.local scripts/add-marakesh.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';
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
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/1f9923fd-0c01-4535-b016-8cf13ab8d766/scratchpad/marakesh/images';
const MENU_SOURCE_URL = 'https://catering-marakesh.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98/';

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

function flatAddons(list) {
  return list.map(([he, amount]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount)
  }));
}

const eventMenu = {
  id: 'event-choice-menu',
  type: 'formula',
  name: { he: 'תפריט אירועים - בחירה חופשית', en: 'Event Menu - Free Choice', fr: 'Menu Événementiel - Choix Libre' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: ['salads', 'starters', 'main_courses', 'hot_sides'],
  categoryLimits: {},
  categoryItems: {
    salads: [
      'חציל קלוי בטחינה / חציל שלם', 'חציל קלוי במיונז', 'חציל מטוגן פיקנטי', 'סלק אדום',
      'מטבוחה פיקנטית', 'גזר מגורד בלימון', 'גזר מרוקאי', 'טבולה לבנוני', 'חומוס מסעדות',
      'טחינת הבית', 'עגבניות שרי בזיליקום', 'סחוג אדום', 'פלפל קלוי בצבעים', 'פלפל חריף מטוגן',
      'תירס מקסיקני', 'סלט ירקות טרי', 'תפוח אדמה במיונז', 'מלפפון בשמיר',
      'חמוצי הבית בנוסח מרקש', 'מלפפונים חמוצים עם זיתים', 'עגבניות חריף עם שום',
      'סלט כרוב בלימון ושמיר', 'קולסלאו', 'סלט ירוקים - 2 ₪', 'סלט טונה - 2 ₪'
    ].map((he) => ({ id: nanoid(8), he, en: '', fr: '' })),
    starters: [
      'מאפה בשר עם כבש בצנובר - 10 ₪', 'בורקס תפוח אדמה', 'פילה מושט מטוגן',
      'פילה מושט בנוסח מרקש', 'פילה מושט בעשבי תיבול', 'דג נסיכה ברוטב חריימה / מרקש',
      'טורטיה במילוי ירקות מוקפצים', 'טורטיה במילוי בשר טחון', 'פילה סלמון ברוטב מרוקאי - 10 ₪',
      'פילה סלמון ברוטב פסטו - 10 ₪', 'פלפל ממולא', 'מוסקה חצילים עם בשר'
    ].map((he) => ({ id: nanoid(8), he, en: '', fr: '' })),
    main_courses: [
      'מוקפץ בקר', 'מוקפץ עוף', 'צלי בקר ברוטב פטריות', 'עוף צלוי בגריל',
      'שניצל עוף בשומשום / שניצלונים', 'סטייק פרגית על האש', 'קציצות בשר כבש',
      'פרגית במילוי השף', 'חזה עוף על האש', 'אסאדו - 10 ₪', 'בשר ראש עם גרגירי חומוס - 10 ₪'
    ].map((he) => ({ id: nanoid(8), he, en: '', fr: '' })),
    hot_sides: [
      'אורז לבן', 'אורז אדום פיקנטי', 'אורז צהוב אשפלו עם גזר', 'אורז שמיר ואפונה',
      'זיתים מרוקאים בנוסח מרקש', 'תפוחי אדמה אפויים', 'דואט תפוח אדמה ובטטה',
      'שעועית ירוקה מוקפצת בשומשום', 'קוסקוס מרוקאי', 'מרק ירקות לקוסקוס',
      'ירקות מוקפצים בנוסח סיני', 'אפונה ברוטב', 'ספגטי ברוטב עגבניות',
      'תבשיל אפונה וארטישוק', 'אנטיפסטי', 'שעועית ירוקה ברוטב'
    ].map((he) => ({ id: nanoid(8), he, en: '', fr: '' }))
  },
  eventTypes: ['celebration', 'shabbat_chatan', 'henna', 'bar_mitzvah', 'wedding', 'engagement', 'rosh_hashana', 'memorial'],
  addons: [],
  sourceUrl: MENU_SOURCE_URL
};

const extrasMenu = {
  id: 'desserts-breads-shabbat',
  type: 'a_la_carte',
  name: { he: 'קינוחים, לחמים ומנות שבת', en: 'Desserts, Breads & Shabbat Dishes', fr: 'Desserts, Pains et Plats de Chabbat' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: MENU_SOURCE_URL,
  addons: [
    ...flatAddons([
      ['סופלה אישי', 8],
      ['מגש בקלוואה', 150],
      ['מגש פירות העונה', 380],
      ["מגש עוגות מוס (60 יח')", 150],
      ["מגש קינוחי כוסות (40 יח')", 290],
      ['לחמניות המוציא', 1],
      ['לחמניות מזונות', 2],
      ['פרנות', 6],
      ['קיגל תפו"א', 180],
      ['קיגל ירושלמי', 180]
    ]),
    ...noteAddons(['חמין בשרי', 'פשטידה מרוקאית', 'פשטידת פטריות'])
  ]
};

const PHOTO_FILES = ['DSC00154-scaled.jpg', 'DSC00170-scaled.jpg', 'DSC00181-scaled.jpg', 'DSC02138-1.jpg', 'DSC02174-1.jpg', 'DSC02200-1.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  return blob.url;
}

async function main() {
  const now = new Date().toISOString();

  const logoUrl = await uploadOne('logo.png', 'image/png');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file, 'image/jpeg');
    photoUrls.push(url);
    console.log(`Uploaded photo: ${url}`);
  }

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג מרקש',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג מרקש - קייטרינג בשרי כשר למהדרין (בד"ץ יורה דעה, בפיקוח הרב שלמה מחפוד) הפועל מפתח תקווה עבור אירועים באזור פתח תקווה והמרכז. עסק משפחתי המציע תפריט בחירה חופשית (סלטים, מנה ראשונה, עיקריות ותוספות), לצד קינוחים, לחמים ומנות שבת בתמחור פריט.',
      en: 'Catering Marakesh - kosher mehadrin meat catering (Badatz Yoreh De\'ah, under Rabbi Shlomo Machpud) operating from Petah Tikva for events across the Petah Tikva and central Israel area. A family business offering a free-choice menu (salads, starters, mains and sides), alongside individually priced desserts, breads and Shabbat dishes.',
      fr: "Traiteur Marakesh - traiteur viande cacher mehadrin (Badatz Yoré Déa, sous le rabbin Shlomo Machpud) opérant depuis Petah Tikva pour des événements dans la région de Petah Tikva et du centre d'Israël. Une entreprise familiale proposant un menu à choix libre (salades, entrées, plats principaux et accompagnements), ainsi que des desserts, pains et plats de Chabbat au prix unitaire."
    },
    districts: ['center'],
    city: { he: 'פתח תקווה', en: 'Petah Tikva', fr: 'Petah Tikva' },
    address: 'בלטימור 7, פתח תקווה',
    kashrutLevels: ['badatz_rav_machpud'],
    cateringTypes: ['meat'],
    maxGuests: '',
    priceFrom: '',
    packages: [eventMenu, extrasMenu],
    eventTypes: ['celebration', 'shabbat_chatan', 'henna', 'bar_mitzvah', 'wedding', 'engagement', 'rosh_hashana', 'memorial'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts'],
    services: [],
    phone: '+972-3-7794813',
    whatsapp: '+972-50-444-0827',
    email: 'marrakesh2108@gmail.com',
    website: 'https://catering-marakesh.co.il/',
    instagram: '',
    facebook: '',
    logo: logoUrl,
    photos: photoUrls,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}: 2 packages, logo, ${photoUrls.length} photos.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
