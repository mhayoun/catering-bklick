// One-off script: adds "קייטרינג נשנש" (Nash-Nash) as a new, pre-approved caterer, sourced
// directly from its own site, https://nasnash-catering.co.il/ (found via web search for kosher
// caterers in the Jezreel Valley/Afula area - the North district is the 2nd-least-represented
// district among existing listings, after Judea/Samaria; two Judea/Samaria candidates checked
// first - מאור השמן, fat-maor.co.il, and רני קייטרינג, xcatering.co.il - were skipped: the first
// publishes no event pricing at all, the second is templated SEO-filler copy with no named
// kashrut agency and even a stray mention of pork, unlike this site's genuine, specific copy).
// Boutique dairy Italian-style catering, kosher mehadrin, operating 20+ years from a family
// restaurant kitchen in Afula, serving the Jezreel Valley and Gilboa area.
//
// No overlap found with any existing caterer (distinct phone, no address overlap, unique name).
//
// Pricing: this is a WooCommerce site whose catalogue/category pages render prices via
// client-side JS - a plain fetch of the static HTML returns no price text at all, so the two
// packages below were read from the site's own "תפריטים מומלצים" (recommended menus) page
// through an actual rendered browser session (Claude in Chrome), not summarized or estimated:
// - "תפריט בוקר" (breakfast/kiddush-style menu), 40-50 guests tier: total ₪4,240 (=> ~₪94/guest)
// - "תפריט ערב" (evening menu), 90-100 guests tier: total ₪9,200 (=> ~₪97/guest)
// Both are real per-order flat totals for a fixed guest-count bracket, not a linear per-guest
// rate - pricePerGuest below is that tier's total divided by its bracket midpoint, the closest
// fit to this schema's per-guest model. The site also sells several other guest-count brackets
// for each menu (morning: 50-60/60-70/70-80/90-100; evening: 60-70/70-80/90-100) whose exact
// totals were not individually captured - NOT modeled as separate packages/addons since their
// prices are unverified; only the two tiers actually read are represented here. Each package's
// itemized contents (salads/trays) are copied verbatim from that tier's own order-summary modal.
//
// kashrutLevels: site's own FAQ states 'כן, כשרות מהדרין עם תעודה בתוקף' with no named badatz -
// left as ['mehadrin'] only, same treatment as scripts/add-oogit.mjs.
//
// address: no street address is published (home-delivery/pickup catering business) - only the
// service area ('עפולה והסביבה, כולל עמק יזרעאל, הגלבוע מושבים וקיבוצים בסביבה'); city is set to
// Afula (its home base per the site's own "about" copy) with address left blank.
//
// maxGuests: not published (largest named recommended-menu bracket is 90-100, but the site takes
// custom quotes above that) - 200 is a judgment-call placeholder, should be corrected via the
// dashboard edit form once a real figure is known (same caveat as scripts/add-oogit.mjs).
//
// Usage: node --env-file=.env.local scripts/add-nasnash.mjs

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
const LOGO_PATH = `${SCRATCH}/nasnash-photos/logo2.png`;
const PHOTO_PATHS = ['food1.webp', 'food2.webp', 'food3.webp'].map((f) => `${SCRATCH}/nasnash-photos/${f}`);

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

const MORNING_SALADS = items(['סלט ים-תיכוני', 'סלט טונה', 'סלט בריאות', 'סלט נשנש', 'סלט כפרי']);
const MORNING_STARTERS = items([
  "מגש טורטיות (35 יח')",
  "מגש פריקסה (25 יח')",
  "מגש מיני גבטינוס סביח (20 יח')",
  "מגש מיני גבטינוס גבינות (20 יח')",
  "מגש עלי גפן (60 יח')",
  'מגש לחמים',
  '2 מגשי גבינות (קוטר 12)',
  "מגש קרואסון ממולא (20 יח')",
  'מגש שקשוקה (30 ביצים)',
  "מגש קישים (20 יח')",
  "מגש פוקצ'ות (20 יח')"
]);
const MORNING_DESSERTS = items(['מגש פירות (קוטר 14)', '2 מגשי קינוחים']);

const EVENING_SALADS = items(['2x סלט כפרי', '2x סלט נשנש', '2x סלט פסטה קר', '2x סלט ים-תיכוני', '2x סלט טונה']);
const EVENING_STARTERS = items([
  'מגשי אנטיפסטי (2)',
  'מגשי עלי גפן (2)',
  "מגשי מיני פיצה (2)",
  'מגשי פריקסה (2)',
  'מגשי מיני פיתה (2)',
  'מגש מיני המבורגר גבינה',
  'מגש מיני המבורגר פטריות',
  'מגשי קישים (2)',
  'מגשי טורטיות (2)',
  'מגש קרואסון ממולא'
]);
const EVENING_DESSERTS = items(['2 מגשי פירות', '3 מגשי קינוחים']);

const packages = [
  {
    id: 'morning-menu',
    type: 'formula',
    name: { he: 'תפריט בוקר - 40-50 איש', en: '', fr: '' },
    pricePerGuest: 94,
    minGuests: 40,
    includedCategories: ['salads', 'starters', 'desserts'],
    categoryLimits: {},
    categoryItems: { salads: MORNING_SALADS, starters: MORNING_STARTERS, desserts: MORNING_DESSERTS },
    eventTypes: ['celebration'],
    addons: [
      { id: nanoid(8), name: { he: 'חבילה מלאה בגודל זה: סה"כ ₪4,240 (עד 50 סועדים)', en: '', fr: '' }, priceType: 'flat', amount: '4240' },
      { id: nanoid(8), name: { he: 'זמינות גם בגדלים 50-60 / 60-70 / 70-80 / 90-100 איש - הצעת מחיר בהתאמה', en: '', fr: '' }, priceType: 'note', amount: '' },
      { id: nanoid(8), name: { he: 'משלוח לא כלול - ניתן להוסיף בתיאום מראש בעלות נוספת', en: '', fr: '' }, priceType: 'note', amount: '' }
    ],
    sourceUrl: 'https://nasnash-catering.co.il/recommended-menus/'
  },
  {
    id: 'evening-menu',
    type: 'formula',
    name: { he: 'תפריט ערב - 90-100 איש', en: '', fr: '' },
    pricePerGuest: 97,
    minGuests: 90,
    includedCategories: ['salads', 'starters', 'desserts'],
    categoryLimits: {},
    categoryItems: { salads: EVENING_SALADS, starters: EVENING_STARTERS, desserts: EVENING_DESSERTS },
    eventTypes: ['celebration'],
    addons: [
      { id: nanoid(8), name: { he: 'חבילה מלאה בגודל זה: סה"כ ₪9,200 (90-100 סועדים)', en: '', fr: '' }, priceType: 'flat', amount: '9200' },
      { id: nanoid(8), name: { he: 'זמינות גם בגדלים 40-50 / 60-70 / 70-80 איש - הצעת מחיר בהתאמה', en: '', fr: '' }, priceType: 'note', amount: '' },
      { id: nanoid(8), name: { he: 'משלוח לא כלול - ניתן להוסיף בתיאום מראש בעלות נוספת', en: '', fr: '' }, priceType: 'note', amount: '' }
    ],
    sourceUrl: 'https://nasnash-catering.co.il/recommended-menus/'
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
  const logo = await uploadOne(LOGO_PATH, 'image/png');
  const photos = [];
  for (const p of PHOTO_PATHS) photos.push(await uploadOne(p, 'image/webp'));
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג נשנש',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג נשנש - קייטרינג בוטיק חלבי איטלקי, כשר למהדרין, הפועל מעפולה כבר למעלה מ-20 שנה ומשרת את עמק יזרעאל, הגלבוע והמושבים והקיבוצים בסביבה. התחיל במטבח של מסעדה משפחתית קטנה בעפולה, והיום מספק תפריטי בוקר וערב עשירים - סלטים טריים, מגשי טורטיות, פריקסה, קישים, פוקצ\'ות, גבינות, עלי גפן וקינוחים - לאירועים פרטיים, כנסים, הרמות כוסית ואירועי חברות.',
      en: "Nash-Nash Catering - boutique dairy Italian-style catering, kosher mehadrin, operating from Afula for over 20 years and serving the Jezreel Valley, Gilboa and surrounding moshavim and kibbutzim. Started in the kitchen of a small family restaurant in Afula, today offering rich breakfast and evening menus - fresh salads, tortilla and frikaseh trays, quiches, focaccias, cheeses, stuffed grape leaves and desserts - for private events, conferences, toasts and company events.",
      fr: "Nash-Nash Catering - traiteur laitier boutique de style italien, cacher mehadrin, actif depuis Afula depuis plus de 20 ans et desservant la vallée de Jezreel, le Gilboa et les moshavim et kibboutzim environnants. Né dans la cuisine d'un petit restaurant familial d'Afula, il propose aujourd'hui des menus matin et soir riches - salades fraîches, plateaux de tortillas et de frikaseh, quiches, focaccias, fromages, feuilles de vigne farcies et desserts - pour évènements privés, conférences, pots et évènements d'entreprise."
    },
    districts: ['north'],
    city: { he: 'עפולה', en: 'Afula', fr: 'Afula' },
    address: '',
    kashrutLevels: ['mehadrin'],
    cateringTypes: ['dairy'],
    maxGuests: 200, // not published - judgment-call placeholder, see header comment
    priceFrom: 94,
    packages,
    eventTypes: ['celebration'],
    menuCategories: ['salads', 'starters', 'desserts'],
    services: ['kids_meals', 'vegetarian_food'],
    phone: '+972-54-497-1435',
    whatsapp: '+972544971435',
    email: '',
    website: 'https://nasnash-catering.co.il/',
    instagram: 'https://www.instagram.com/nashnash.afula/',
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
