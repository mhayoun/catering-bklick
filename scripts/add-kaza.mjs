// One-off script: adds "קאזה - הבית לאירועי בוטיק" (Kaza) as a new, pre-approved caterer,
// sourced directly from its own site, https://www.catering1.co.il/ (found via web search for
// kosher caterers in Haifa/the North - the least-represented districts among existing listings,
// after מאור השמן קייטרינג ובישולים - fat-maor.co.il, a Kiryat Shmona restaurant found first -
// turned out to publish no event pricing at all, just a weekly Friday pre-made-food sale, too
// thin for this schema). Boutique Moroccan meat catering in Kiryat Yam (Haifa Bay), owned and
// run by Tzachi Dahan (site's own Haifa-area landing page names him), badatz beit yosef kosher.
//
// No real overlap found with any existing caterer: one existing listing (קייטרינג הבית,
// scripts/add-... not this one, phone +972-52-3498943) is also in Kiryat Yam (שד' ירושלים 3),
// but Kaza's own address (שד' וייצמן 15) and phone (052-629-2954) are both different - just two
// unrelated businesses in the same small town, not a shared-operator overlap like
// scripts/add-tavlin.mjs documented.
//
// Pricing: 7 real per-guest tiers read from the site's own raw HTML (home page + its Haifa-area
// landing page, not summarized) - קייטרינג בוטיק במשלוח (delivery only) ₪80/min 30, אירועי בוטיק
// ₪140/min 50, גריל בוטיק ₪170/min 50, בר מצווה ועלייה לתורה ₪170/min 50, שבת חתן ₪180/min 50,
// חינה מרוקאית ₪200/min 50, תחנות שוק ₪280/min 50. Modeled as 7 `formula` packages. The site's
// own interactive menu builder (/תפריט-אירועים) is the only place with itemized dish names -
// its 4 categories (17 salads/choose 8, 7 starters/choose 2 + 3 premium fish upgrades at +15
// ש"ח/guest, 10 hot sides/choose 3, 9 mains/choose 3 + 1 premium "ראש בשר" upgrade at +15
// ש"ח/guest) are reused verbatim as categoryItems/categoryLimits across all 7 packages, since
// the site does not publish separate itemized menus per tier - only prose describing each tier's
// concept (e.g. גריל בוטיק = live grill service, חינה/תחנות שוק = live market-style stations).
// Each package's addons note its own distinguishing service level plus the shared universal
// add-ons (bread included, delivery priced by location, disposable-ware+drinks upgrade,
// full-service-with-chef upgrade) rather than re-typing the whole item catalogue as prose.
//
// kashrutLevels: site's own FAQ states 'המטבח והתפריטים שלנו תחת השגחת בד"ץ בית יוסף' - maps
// directly to the existing badatz_beit_yosef enum value.
//
// districts: site's Haifa-area landing page explicitly targets Haifa; its own general FAQ says
// 'אנחנו פועלים בכל אזור הצפון והמרכז' (all of the North and Center) - mapped to
// ['haifa', 'north', 'center'].
//
// maxGuests: not published anywhere (all copy describes a boutique per-guest model with no upper
// cap) - 400 is a judgment-call placeholder given the ₪280 "market stations" tier is pitched for
// larger/showier events than the others, should be corrected via the dashboard edit form once a
// real figure is known (same caveat as scripts/add-oogit.mjs).
//
// Usage: node --env-file=.env.local scripts/add-kaza.mjs

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
const LOGO_PATH = `${SCRATCH}/kaza-photos/logo.png`;
const PHOTO_PATHS = ['2000_69a55a290cf2c.jpg', '2000_69c1350289b54.jpg', '2000_69a55b506546b.jpg'].map(
  (f) => `${SCRATCH}/kaza-photos/${f}`
);

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}
function note(he, priceType = 'note', amount = '') {
  return { id: nanoid(8), name: { he, en: '', fr: '' }, priceType, amount };
}

// Shared menu, read verbatim from the site's own event-order builder (/תפריט-אירועים) - see
// header comment. Reused across all 7 tiers since no per-tier itemized menu is published.
const SALADS = items([
  "קרפצ'יו סלק",
  "קרפצ'יו חציל",
  'חומוס ביתי',
  'חציל זעלוק',
  'חציל פיקנטי',
  'חמוצי הבית',
  'סלט עלים',
  'סלט ירוקים',
  'מטבוחה מרוקאית',
  'פלפלים חריפים',
  'סלק אדום לימוני',
  'סלט כרוב חמצמץ',
  'פלחי גזר חרפרף',
  'עגבניות חריפות',
  'סלט משוואיה',
  'טחינת השף',
  'סלט ביצים'
]);
const STARTERS = items([
  'פסטייה עוף',
  'פרחי סינייה עוף',
  'מושט מרוקאי חריף',
  'מושט בעשבי תיבול',
  'סיגר מממולא בשר',
  'קציצות דגים פיקנטי',
  'פטריות פורטבלו במילוי בשר'
]);
const HOT_SIDES = items([
  'אורז קלאסי',
  'אורז אושפלו',
  'אורז בתיבול השף',
  'אנטי-פסטי',
  'פולנטה חמימה',
  'קוסקוס מרוקאי',
  'פטריות מוקפצות',
  'תפודי מדורה עם ירק',
  'שעועית ירוקה מוקפצת',
  'דואט תפוח אדמה ובטטה'
]);
const MAINS = items([
  'אסאדו מעושן',
  'ארטישוק ממולא',
  'פרגית בערמונים',
  'פרגית ממולאת בשר',
  'סיגר מממולא בשר',
  'קציצות עגל/עוף ברוטב',
  'קדירת בשר וירקות שורש',
  "פרגית בחמאת בוטנים וצ'ילי",
  'צלי בקר ברוטב יין ופטריות'
]);

const SHARED_CATEGORY_ITEMS = { salads: SALADS, starters: STARTERS, hot_sides: HOT_SIDES, main_courses: MAINS };
const SHARED_CATEGORY_LIMITS = { salads: 8, starters: 2, hot_sides: 3, main_courses: 3 };

const UNIVERSAL_ADDONS = [
  note('לחם הבית - כלול במחיר', 'included'),
  note('משלוח - משתנה לפי מיקום'),
  note('כלים חד"פ יוקרתיים + שתייה מוגזת וקלה', 'per_guest', '20'),
  note('שירות ותפעול מלא כולל שף אומן באירוע + חיתוכי פירות', 'per_guest', '20'),
  note('שדרוג מנת פתיחה לסלמון/לברק בעשבי תיבול/חמאת בוטנים', 'per_guest', '15'),
  note('שדרוג מנה עיקרית לבשר ראש וגרגרי חומוס', 'per_guest', '15')
];

function pkg({ id, label, pricePerGuest, minGuests, eventTypes, extraAddons = [] }) {
  return {
    id,
    type: 'formula',
    name: { he: label, en: '', fr: '' },
    pricePerGuest,
    minGuests,
    includedCategories: ['salads', 'starters', 'hot_sides', 'main_courses'],
    categoryLimits: SHARED_CATEGORY_LIMITS,
    categoryItems: SHARED_CATEGORY_ITEMS,
    eventTypes,
    addons: [...extraAddons.map((he) => note(he)), ...UNIVERSAL_ADDONS],
    sourceUrl: 'https://www.catering1.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D'
  };
}

const packages = [
  pkg({
    id: 'delivery-boutique',
    label: 'קייטרינג בוטיק במשלוח',
    pricePerGuest: 80,
    minGuests: 30,
    eventTypes: ['celebration'],
    extraAddons: ['משלוח בלבד ללא צוות הגשה - המגשים מגיעים ארוזים ומוכנים']
  }),
  pkg({
    id: 'boutique-event',
    label: 'אירועי בוטיק',
    pricePerGuest: 140,
    minGuests: 50,
    eventTypes: ['celebration'],
    extraAddons: ['תפריט עשיר כולל הגשה מלאה, מנהל אירוע וצוות מלצרים']
  }),
  pkg({
    id: 'boutique-grill',
    label: 'גריל בוטיק',
    pricePerGuest: 170,
    minGuests: 50,
    eventTypes: ['celebration'],
    extraAddons: ['תפריט גריל כולל הגשה - בשרים נצלים על האש מול האורחים']
  }),
  pkg({
    id: 'bar-mitzvah',
    label: 'בר מצווה ועלייה לתורה',
    pricePerGuest: 170,
    minGuests: 50,
    eventTypes: ['bar_mitzvah']
  }),
  pkg({
    id: 'shabbat-chatan',
    label: 'שבת חתן',
    pricePerGuest: 180,
    minGuests: 50,
    eventTypes: ['shabbat_chatan'],
    extraAddons: ['יש לוודא מראש אילו ארוחות כלולות, שעות השירות ואופן ההקמה לפני כניסת השבת']
  }),
  pkg({
    id: 'henna',
    label: 'חינה מרוקאית',
    pricePerGuest: 200,
    minGuests: 50,
    eventTypes: ['henna'],
    extraAddons: ['עמדות מעוצבות בסגנון מרוקאי, צוות מקצועי ומעטפת אירוח מלאה']
  }),
  pkg({
    id: 'market-stations',
    label: 'תחנות שוק',
    pricePerGuest: 280,
    minGuests: 50,
    eventTypes: ['celebration'],
    extraAddons: ['עמדות שוק חיות - האוכל מוכן ומוגש מול האורחים, כולל צוות וציוד']
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
    businessName: 'קאזה - הבית לאירועי בוטיק',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קאזה - הבית לאירועי בוטיק, קייטרינג בשרי כשר למהדרין בד"ץ בית יוסף, בבעלותו ובניהולו של צחי דהן, פועל מקרית ים ומשרת את כל אזור חיפה, הצפון והמרכז. מטבח מרוקאי מודרני עם עומק מסורתי - חוויית שוק מעוצבת, חומרי גלם טריים, שף שמוביל כל אירוע וצוות מלא שמעניק חוויית אירוח אמיתית. מגוון מסלולים: קייטרינג בוטיק במשלוח, אירועי בוטיק, גריל בוטיק, שבת חתן, בר מצווה, חינה מרוקאית ותחנות שוק חיות - לאירועים מ-30 סועדים ומעלה.',
      en: 'Kaza - The Home for Boutique Events, meat catering kosher mehadrin under Badatz Beit Yosef, owned and run by Tzachi Dahan, based in Kiryat Yam and serving the Haifa, North and Center regions. Modern Moroccan cuisine with traditional depth - a styled market experience, fresh ingredients, a chef who leads every event, and a full hosting team. Tracks include delivery-only boutique catering, full boutique events, boutique grill, Shabbat Chatan, Bar Mitzvah, Moroccan henna and live market stations - for events of 30 guests and up.',
      fr: "Kaza - La Maison des évènements boutique, traiteur carné cacher mehadrin sous la supervision du Beit Din Beit Yossef, dirigé par Tzachi Dahan, basé à Kiryat Yam et actif dans les régions de Haïfa, du Nord et du Centre. Cuisine marocaine moderne à la profondeur traditionnelle - une expérience de marché soignée, des ingrédients frais, un chef qui dirige chaque évènement et une équipe d'accueil complète. Formules : traiteur boutique en livraison, évènement boutique complet, grill boutique, Shabbat Hatan, Bar Mitzvah, henné marocain et stations de marché en direct - pour des évènements à partir de 30 convives."
    },
    districts: ['haifa', 'north', 'center'],
    city: { he: 'קרית ים', en: 'Kiryat Yam', fr: 'Kiryat Yam' },
    address: 'שדרות וייצמן 15, קרית ים',
    kashrutLevels: ['badatz_beit_yosef'],
    cateringTypes: ['meat'],
    maxGuests: 400, // not published - judgment-call placeholder, see header comment
    priceFrom: 80,
    packages,
    eventTypes: ['bar_mitzvah', 'shabbat_chatan', 'henna', 'celebration'],
    menuCategories: ['salads', 'starters', 'hot_sides', 'main_courses'],
    services: ['live_cooking_station', 'waiter_staff', 'setup_teardown', 'disposable_tableware'],
    phone: '+972-52-629-2954',
    whatsapp: '+972526292954',
    email: '',
    website: 'https://www.catering1.co.il/',
    instagram: '',
    facebook: 'https://www.facebook.com/people/%D7%A7%D7%99%D7%99%D7%98%D7%A8%D7%99%D7%A0%D7%92-%D7%A7%D7%90%D7%96%D7%94/61583724901432/',
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
