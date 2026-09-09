// One-off script: adds "טעם מהודר" as a new, pre-approved caterer, sourced from its own website
// https://aaasada.com/ - a meat-only "DIY self-service" hot ready-made-food caterer (no waiters,
// no on-site production - food is cooked, packed hot in insulated crates, and delivered), serving
// a wide area (מרכז, שרון, שפלה, דרום, שומרון - explicit city list in the footer spans from
// Jerusalem/Beitar Illit to Beer Sheva to Netanya/Herzliya). Managed by אלי גולדמן ("פיקוח מקצועי
// לניהול מטבחים וכשרות מהודרת").
//
// Kashrut is explicit and specific: "בד"ץ יורה דעה בהשגחת שלמה מחפוד" (Badatz Yoreh De'ah, under
// Rabbi Shlomo Machpud) - maps to badatz_rav_machpud, same mapping used for the same rabbi's name
// in scripts/add-mooza.mjs.
//
// Unlike every other script in this directory, the site's own home page IS a live build-a-menu
// price calculator with real, fully transparent per-guest pricing: ₪58/guest base (7 salads + 3
// hot sides + 3 main courses, minimum 30 guests), plus a long list of real priced upgrades (extra
// "מנות ביניים" fish/meat courses at +15 or +25/guest, breads/drinks/disposables at +2 to +12/
// guest, a flat +180 dessert tray). Modeled as one `formula` package with real priceType:
// 'per_guest' addons for every one of those upgrades (not folded into item names as inline notes,
// since this schema's addon field supports per-guest pricing directly and the site publishes an
// exact number for each one).
//
// 2 real photos (a table-setting shot and a plated dish shot) downloaded from the site's own
// gallery, re-uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention). No dedicated logo image found (header is
// text-only).
//
// Usage: node --env-file=.env.local scripts/add-taam-mehudar.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/755d4ccb-8017-43db-87b5-73224b4601e9/scratchpad/aaasada';
const PHOTO_FILES = ['taam-mehudar-photo1.webp', 'taam-mehudar-photo2.webp'];

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

// [name, priceType, amount]
const ADDONS = [
  ['פילה מושט מרוקאי', 'per_guest', 15], ['נסיכת הנילוס בחריימה', 'per_guest', 15],
  ['טונה מבושל בנוסח מרוקאי', 'per_guest', 15], ['דג סול מטוגן', 'per_guest', 15],
  ['מפרום - תפוד ממולא', 'per_guest', 15], ['מוסקה - חציל ממולא', 'per_guest', 15],
  ['רול טלה', 'per_guest', 15], ['רול צ\'יקן', 'per_guest', 15], ['רול טבעוני', 'per_guest', 15],
  ['בורקס ברוטב פטריות', 'per_guest', 15],
  ['פילה סלמון נורבגי', 'per_guest', 25], ['פילה סלמון מרוקאי', 'per_guest', 25],
  ['פאסטיה עוף ופירות יבשים', 'per_guest', 25],
  ['לחמניות רגילות', 'per_guest', 2], ['לחמניות מתוקות', 'per_guest', 2.5], ['לחמניות פרנה', 'per_guest', 3.5],
  ['כלים חד-פעמיים רויאל', 'per_guest', 10], ['שתייה קלה', 'per_guest', 10],
  ['מגש קינוחים (60 יחידות)', 'flat', 180], ['מוס שוקולד / טירמיסו / קינוח הבית', 'per_guest', 12]
];

const mainMenu = {
  id: 'ready-made-meat-menu',
  type: 'formula',
  name: { he: 'תפריט אוכל מוכן בשרי', en: 'Ready-Made Meat Menu', fr: 'Menu Traiteur Viande Prêt-à-Servir' },
  pricePerGuest: 58,
  minGuests: 30,
  includedCategories: ['salads', 'hot_sides', 'main_courses'],
  categoryLimits: { salads: 7, hot_sides: 3, main_courses: 3 },
  categoryItems: {
    salads: items([
      'חומוס הבית', 'טחינה', 'מסייר', 'טבולה', 'הום פרייז', 'סלט ישראלי', 'טריקולור פלפלים',
      'גזר חי בלימון', 'גזר מרוקאי', 'סלק אדום', 'מטבוחה מרוקאית', 'חציל מטוגן', 'חציל מיונז',
      'חציל בטחינה', 'זעלוק חציל', 'סלט השוק', 'קולסלאו', 'כרוב חמוציות', 'כרוב אדום במיונז',
      'תפו"א במיונז', 'פלפל חריף מטוגן', 'תירס צ\'יליאני', 'נלסון'
    ]),
    hot_sides: items([
      'אורז לבן / מג\'דרה / אורז אדום', 'אורז לנטריה', 'תפודים', 'תפו"א אפוי', 'קוסקוס מרוקאי אוורירי',
      'מרק ירקות עשיר לקוסקוס', 'זיתים מבושלים ברוטב', 'ארטישוק ופטריות', 'אפונה וסלרי',
      'שעועית ברוטב עגבניות', 'אפונה וגזר', 'ירקות מוקפצים תאילנדי', 'שעועית מוקפצת בסויה'
    ]),
    main_courses: items([
      'צלי בקר ברוטב פטריות', 'רוסטביף', 'סטייק פרגית על האש', 'קבב הבית', 'חזה עוף בגריל',
      'עוף בגריל - כרעיים', 'שניצל ביתי', 'מוקפץ סיני עם ירקות', 'קציצות בשר ברוטב',
      'פלפל ממולא טבעוני', 'אסאדו ביין (+ 7 ש"ח למנה)', 'צלי בקר מס\' 5 (+ 7 ש"ח למנה)'
    ])
  },
  eventTypes: ['shabbat_chatan', 'memorial', 'brit', 'bar_mitzvah', 'henna', 'celebration'],
  addons: ADDONS.map(([he, priceType, amount]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType,
    amount: String(amount)
  })),
  sourceUrl: 'https://aaasada.com/'
};

async function main() {
  const photos = [];
  for (const file of PHOTO_FILES) {
    const buf = await readFile(path.join(SRC_DIR, file));
    const blob = await put(`caterers/${OWNER_EMAIL}/${Date.now()}-${file}`, buf, { access: 'public', contentType: 'image/webp' });
    photos.push(blob.url);
    console.log(`Uploaded ${file} -> ${blob.url}`);
  }

  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'טעם מהודר',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'טעם מהודר - קייטרינג בשרי לאוכל מוכן חם בהפקה עצמית: תפריט נדיב ב-58 ₪ למנה (מינימום 30 מנות), מגיע חם וארוז במארזים שומרי חום ישירות לאירוע - ללא מלצרים ועלויות הפקה מיותרות. כשר למהדרין בד"ץ יורה דעה בהשגחת הרב שלמה מחפוד. מתאים לשבת חתן, ברית, בר/בת מצווה, אזכרה וחינה. משלוחים למרכז, השרון, השפלה, הדרום והשומרון.',
      en: "Ta'am Mehudar - meat catering for hot, self-service ready-made food: a generous menu at ₪58/guest (30-guest minimum), delivered hot and packed in heat-retaining crates directly to the event - no waiters or extra production costs. Kosher mehadrin, Badatz Yoreh De'ah under Rabbi Shlomo Machpud. Suited to Shabbat Chatan, brit, bar/bat mitzvah, memorial gatherings and henna. Delivers across central Israel, the Sharon, the Shfela, the south and Samaria.",
      fr: "Ta'am Mehudar - traiteur viande pour repas chauds prêts-à-servir en autoservice : un menu généreux à 58 ₪ par convive (minimum 30 convives), livré chaud dans des caisses isothermes directement sur le lieu de l'événement - sans serveurs ni frais de production superflus. Cacher mehadrin, Badatz Yoré Déa sous la supervision du rabbin Shlomo Machpud. Adapté aux Shabbat Hatan, brit mila, bar/bat-mitsva, réunions commémoratives et henné. Livraisons dans le centre, le Sharon, la Shfela, le sud et la Samarie."
    },
    districts: ['center', 'telaviv', 'jerusalem', 'south', 'judea_samaria'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['badatz_rav_machpud'],
    cateringTypes: ['meat'],
    maxGuests: 200, // no explicit cap published - plausible round estimate, unverified
    priceFrom: 58,
    packages: [mainMenu],
    eventTypes: ['shabbat_chatan', 'memorial', 'brit', 'bar_mitzvah', 'henna', 'celebration'],
    menuCategories: ['salads', 'hot_sides', 'main_courses'],
    services: ['disposable_tableware'],
    phone: '+972-52-6090930',
    whatsapp: '+972-52-6090930',
    email: '',
    website: 'https://aaasada.com/',
    instagram: '',
    facebook: '',
    logo: '',
    photos,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, ${photos.length} photos, and 1 formula package (${mainMenu.addons.length} priced add-ons).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
