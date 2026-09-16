// One-off script: adds "עוגית" (Oogit) as a new, pre-approved caterer, sourced directly from its
// own site, https://oogit.co.il/ (found via web search for kosher caterers in Gush Etzion -
// Judea/Samaria is the least-represented district among existing listings). A boutique dairy
// catering business operating since 2010 in the Jerusalem/Gush Etzion area, founded by Anabel.
//
// No overlap found with any existing caterer in this project (distinct phone, address region,
// site, and menu wording) - unlike scripts/add-tavlin.mjs added alongside this one, see that
// file's header comment for a documented address/phone overlap with two other existing listings.
//
// Pricing is a full matrix (event type x tier), read from https://oogit.co.il/pricing/ - 8 event
// categories each with 3 tiers (min guests + a ₪ range per tier + what's included), not itemized
// dish names. Modeled here as one `formula` package per EVENT_TYPES-matching event, using each
// event's cheapest ("classic") tier as the bookable pricePerGuest/categoryItems, with the two
// richer tiers kept verbatim as `addons` notes (name + price range + inclusions) rather than
// invented as separate packages - keeps the 24 real tiers intact without exploding into 24
// separate formula objects. קידוש (a synagogue reception, no EVENT_TYPES match) and general
// אירועי חברות/כנסים are both folded into 'celebration'. The site's cheese-platter-only tier
// (מגשי גבינות, not tied to any event type) and the à-la-carte add-on price list (designer cakes,
// cookies, Moroccan bar top-up, dessert table, coffee station) are NOT modeled as separate
// packages - captured instead in this record's own addons/description where relevant.
//
// kashrutLevels: site states generically "כשר למהדרין" with no named badatz/rabbi - left as
// ['mehadrin'] only, same treatment as every other generically-mehadrin listing in this
// directory (e.g. scripts/add-hakatering-hacham.mjs before its kashrut certificate was found).
//
// city: no single home address is published (this is a delivery-based catering business across
// several towns) - the pricing page states deliveries are free within "אזור ירושלים והסביבה"
// (Jerusalem and surrounding area) with a travel surcharge outside it, so Jerusalem is used as
// the closest thing to a home city; address left blank.
//
// maxGuests: not published anywhere (minimums range 10-40 across event types, positioned as
// "boutique" catering) - 300 is a judgment-call placeholder, should be corrected via the
// dashboard edit form once a real figure is known (same caveat as scripts/add-aleshelzait.mjs).
//
// Usage: node --env-file=.env.local scripts/add-oogit.mjs

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
const LOGO_PATH = `${SCRATCH}/oogit-logo.png`;
const PHOTO_PATHS = ['catering-1.jpg', 'catering-2.jpg', 'catering-3.jpg'].map((f) => `${SCRATCH}/oogit-photos/${f}`);

function tier(he, priceType = 'note') {
  return { id: nanoid(8), name: { he, en: '', fr: '' }, priceType, amount: '' };
}

function eventPkg({ id, label, minGuests, basePrice, baseItems, upgrades, eventTypes }) {
  return {
    id,
    type: 'formula',
    name: { he: label, en: '', fr: '' },
    pricePerGuest: basePrice,
    minGuests,
    includedCategories: ['starters'],
    categoryLimits: {},
    categoryItems: { starters: baseItems.map((he) => ({ id: nanoid(8), he, en: '', fr: '' })) },
    eventTypes,
    addons: upgrades.map((he) => tier(he)),
    sourceUrl: 'https://oogit.co.il/pricing/'
  };
}

const packages = [
  eventPkg({
    id: 'brit',
    label: 'ברית מילה - קלאסי',
    minGuests: 35,
    basePrice: 65,
    baseItems: ['מגשי אירוח', 'סלטים', 'גבינות', 'מאפים', 'עמדת קפה'],
    upgrades: [
      'פרימיום: 90-110 ₪ לאורח - כולל מגש דגים, 2 מנות חמות, קינוחים',
      'VIP: 120-145 ₪ לאורח - תפריט מלא + הגשה מקצועית + שולחן מתוקים'
    ],
    eventTypes: ['brit']
  }),
  eventPkg({
    id: 'kiddush',
    label: 'קידוש - קל',
    minGuests: 30,
    basePrice: 55,
    baseItems: ['כיבוד', 'מאפים', 'גבינות', 'שתייה'],
    upgrades: [
      'קידוש מלא: 75-95 ₪ לאורח - מגשי אירוח מלאים, מגש דגים, קינוחים',
      'קידוש VIP: 100-130 ₪ לאורח - תפריט עשיר + מנות חמות + הגשה מלאה'
    ],
    eventTypes: ['celebration']
  }),
  eventPkg({
    id: 'shabbat_chatan',
    label: 'שבת חתן - קידוש קל',
    minGuests: 40,
    basePrice: 55,
    baseItems: ['כיבוד ומאפים'],
    upgrades: [
      'קידוש מלא: 80-100 ₪ לאורח - גבינות, דגים, קינוחים',
      'VIP: 110-140 ₪ לאורח - תפריט מלא + הגשה'
    ],
    eventTypes: ['shabbat_chatan']
  }),
  eventPkg({
    id: 'bar_mitzvah',
    label: 'בר/בת מצווה - קידוש',
    minGuests: 40,
    basePrice: 65,
    baseItems: ['מגשים', 'גבינות', 'מאפים', 'מגש דגים'],
    upgrades: [
      'ארוחה חגיגית: 100-130 ₪ לאורח - תפריט מלא, מנות חמות, קינוחים',
      'כולל עוגה מעוצבת: לפי הצעה - קייטרינג מלא + עוגת בר/בת מצווה מעוצבת (מ-350 ₪)'
    ],
    eventTypes: ['bar_mitzvah']
  }),
  eventPkg({
    id: 'birthday',
    label: 'יום הולדת - כיבוד',
    minGuests: 20,
    basePrice: 45,
    baseItems: ['מגשי אירוח', 'מתוקים', 'קפה'],
    upgrades: [
      'ארוחה: 80-100 ₪ לאורח - תפריט מלא כולל מנות חמות',
      'כולל עוגה מעוצבת: לפי הצעה - קייטרינג + עוגה מעוצבת'
    ],
    eventTypes: ['celebration']
  }),
  eventPkg({
    id: 'corporate',
    label: 'אירועי חברות / כנסים - ארוחת בוקר עסקית',
    minGuests: 20,
    basePrice: 55,
    baseItems: ['גבינות', 'ביצים', 'מאפים', 'בר קפה'],
    upgrades: [
      'כנס / יום עיון: 65-90 ₪ לאורח - כיבוד בין הרצאות + ארוחת צהריים',
      'יום גיבוש: 85-120 ₪ לאורח - בופה מלא + תחנות הגשה + מתוקים'
    ],
    eventTypes: ['celebration']
  }),
  eventPkg({
    id: 'henna',
    label: 'חינה - בר מרוקאי קל',
    minGuests: 25,
    basePrice: 55,
    baseItems: ['עוגיות מרוקאיות', 'תה', 'קפה'],
    upgrades: [
      'בר מרוקאי מלא: 75-95 ₪ לאורח - בר + מגשים + שתייה חמה',
      'חבילה מלאה: 95-120 ₪ לאורח - בר + מגשים + קינוחים + הגשה'
    ],
    eventTypes: ['henna']
  })
];

async function uploadOne(filePath, contentType) {
  const buf = await readFile(filePath);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${path.basename(filePath)}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${path.basename(filePath)} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logo = await uploadOne(LOGO_PATH, 'image/png');
  const photos = [];
  for (const p of PHOTO_PATHS) photos.push(await uploadOne(p, 'image/jpeg'));
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'עוגית - קייטרינג חלבי בוטיק',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'עוגית - קייטרינג חלבי בוטיק, כשר למהדרין, הפועל מאז 2010 באזור ירושלים, מעלה אדומים, מודיעין, בית שמש, מבשרת ציון וגוש עציון. הוקם על ידי אנבל שהחלה מאפייה ביתית והפכה אותה לעסק קייטרינג מקצועי המתמחה ב"אוכל שנראה כמו אמנות". מגוון שירותים: קייטרינג חלבי, מגשי אירוח, עוגות ועוגיות מעוצבות, קינוחי בוטיק, בר מרוקאי ומגשי גבינות - לכל סוגי האירועים, מברית ועד אירועי חברה.',
      en: 'Oogit - boutique dairy catering, kosher mehadrin, operating since 2010 across Jerusalem, Maale Adumim, Modiin, Beit Shemesh, Mevaseret Zion and Gush Etzion. Founded by Anabel, who grew a home bakery into a professional catering business specializing in "food that looks like art". Services include dairy catering, hosting platters, designed cakes and cookies, boutique desserts, a Moroccan dessert bar and cheese boards - for every event type, from brit milah to corporate events.',
      fr: "Oogit - traiteur laitier boutique, cacher mehadrin, actif depuis 2010 à Jérusalem, Maalé Adoumim, Modiin, Beit Shemesh, Mevasseret Zion et Gush Etzion. Fondé par Anabel, partie d'une pâtisserie maison devenue un service traiteur professionnel spécialisé dans une \"nourriture qui ressemble à de l'art\". Services : traiteur laitier, plateaux de réception, gâteaux et biscuits sur mesure, desserts boutique, bar marocain et plateaux de fromages - pour tout type d'événement, du brit mila à l'événement d'entreprise."
    },
    districts: ['jerusalem', 'center', 'judea_samaria'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: '',
    kashrutLevels: ['mehadrin'], // listing/site: "כשר למהדרין", no named badatz/rabbi
    cateringTypes: ['dairy'],
    maxGuests: 300, // not published - judgment-call placeholder, see header comment
    priceFrom: 45,
    packages,
    eventTypes: ['brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration'],
    menuCategories: ['starters'],
    services: ['live_cooking_station'], // Moroccan bar / coffee station live-service elements
    phone: '+972-52-3450072',
    whatsapp: '+972523450072',
    email: '',
    website: 'https://oogit.co.il/',
    instagram: 'https://www.instagram.com/ugit_boutiquecatering/',
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
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
