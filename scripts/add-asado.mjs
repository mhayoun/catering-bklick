// One-off script: adds "אסאדו" (Asado) as a new, pre-approved caterer. Unlike every other
// add-*.mjs script in this project (all sourced by web search), this one was requested directly
// by the user with two sources handed over explicitly:
//   1. https://asado-catering.vercel.app/ - the business's own live interactive ordering app
//      (a custom React/Vite SPA matching /home/moshe/mydev/catering/doc/asado/doc.txt's design
//      brief almost verbatim - "מתחילים להרכיב את התפריט שלכם" CTA cube, 8-salad checklist with
//      a "X/8 נבחרו" counter, a base/premium package toggle). Walked the live flow end to end
//      (Claude in Chrome) to read real, current data rather than summarize it:
//        - 24 real salads to choose 8 from (id list read off the live selection screen)
//        - 3 real main courses: Meatballs (קציצות בקר), Pargit (פרגית עסיסית), Asado (אסאדו
//          ברוטב מתוק), each with the site's own one-line description
//        - real pricing: base package ₪169/guest (salads + a main), premium toggle +₪20 ->
//          ₪189/guest ("כולל שתייה קלה, סכו"ם מהודר ומשלוח חינם" - soft drinks, upgraded
//          cutlery, free delivery)
//        - real event-type picker: שבת חתן, אירוסין, בר מצווה, ברית מילה, אזכרה/יארצייט,
//          הילולה, 7 ברכות - default guest count prefilled at 30
//        - real logo (asado-catering.vercel.app/logo.png) and hero/branding image (bgm-*.jpeg,
//          the site's own composite with its kashrut badge baked in) pulled via
//          `document.querySelectorAll('img')` since the Vite bundle ships no local asset paths
//        - the 3 main-course tiles render as plain text on a grey placeholder background (no
//          real photo per main) - one salad thumbnail (image_03.jpg) carries a third-party
//          "TaamTov.Net" watermark and was excluded; the other salad thumbnails used here are
//          unwatermarked.
//   2. Local docs in /home/moshe/mydev/catering/doc/asado/:
//        - doc.txt: a design brief (site UX spec) that also states the same ₪169/₪189 pricing,
//          phone 052-7977394, email asadok100@gmail.com, and kashrut "הרב רובין הרב מחפוד".
//        - "תפריט שבת חתן (2).pdf" (22 pages, identical to the "(1)" copy - checked by md5sum):
//          a much larger illustrated "Shabbat Chatan" menu - 24 salads (same repertoire as the
//          live app), a fish course (6 dishes), 4 meat soups, 4 "premium" meat mains beyond the
//          app's 3 base options, ~15 more meat-main variations, rice/potato/vegetable sides,
//          and a full סעודה שלישית (third meal) spread of breads, kishim, kugel, lasagna and
//          smoked fish. Business card page states kashrut "בד״ץ העדה החרדית / עטרה / רובין /
//          הרב אפרתי" and lists the site as www.asado-catering.com (a different, likely older,
//          domain than the live vercel.app one the user gave - not verified reachable, not used
//          here).
//        - "הזמנה עבור פרשת ראה.docx"/pdf: a REAL customer order (55 portions, 3 Shabbat meals)
//          confirming the pricing model in practice: ₪58/portion per meal (+₪7/portion for a
//          more mehudar kashrut) - very close to ₪169 over 3 meals - plus a real delivery
//          surcharge (₪200, discounted from ₪250) and drink quantities, corroborating doc.txt's
//          per-Shabbat aggregate pricing rather than contradicting it.
//
// kashrutLevels: the live site's own badge is 'בד"ץ העדה החרדית' (cert C-80-MK-16); doc.txt adds
// 'הרב רובין' and 'הרב מחפוד'; the PDF business card adds 'עטרה' and 'הרב אפרתי' (neither has a
// clean KASHRUT_LEVELS enum match, so left out rather than guessed) - and the real order
// document itself charges extra for "כשר מהודר יותר", confirming the business genuinely offers
// more than one kashrut tier depending on the client, similar to scripts/add-tavlin.mjs. Modeled
// as the three enum values that do exist: badatz_eda_chareidis, badatz_rav_rubin,
// badatz_rav_machpud.
//
// districts/address: no address or service-area is stated anywhere in either source (this is a
// delivery-only Shabbat catering operation) - the real order's "כותבת הזמנה: חשמונאים" field is
// an order-taker/office note, not a stated business address, so not used as one. Districts left
// at all seven (judgment call, same treatment as scripts/add-oogit.mjs-style delivery-anywhere
// listings already in this project, e.g. הקייטרינג החם, אסאדו באבוקדו, El Toro Events) - should
// be narrowed via the dashboard edit form if a real service area becomes known.
//
// maxGuests: not published (the real order was 55 portions; "שבתות גיבוש" implies group retreats
// which can run larger) - 300 is a judgment-call placeholder, see scripts/add-oogit.mjs for the
// same caveat.
//
// Two formula packages, mirroring the live app's own base/premium toggle exactly:
//   - חבילת בסיס: ₪169/guest, salads (choose 8 of 24) + 1 of the 3 live-app mains.
//   - חבילת פרימיום: ₪189/guest, same salads/mains plus the richer fish/soup/side/third-meal
//     repertoire from the PDF (not itemized as separate choosable slots in the live app, but
//     real dishes from the same business's own extended menu) folded into starters/hot_sides/
//     desserts, plus the site's own "כולל שתייה קלה, סכו"ם מהודר ומשלוח חינם" addon note.
//
// Usage: node --env-file=.env.local scripts/add-asado.mjs

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
const LOGO_PATH = `${SCRATCH}/asado-photos/logo.png`;
const PHOTO_PATHS = ['bg.jpeg', 'image_02.jpg', 'image_04.jpg'].map((f) => `${SCRATCH}/asado-photos/${f}`);

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}
function note(he) {
  return { id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' };
}

const SALADS = items([
  'חומוס ביתי',
  'סחוג בשמן זית',
  'חציל על האש עם שמן זית ורוטב הבית',
  'חציל יוני',
  'כרוב עם פיצוחים',
  'סלט קולרבי מוחמץ',
  'סלט ירקות חי',
  'טחינה',
  'סלט גזר מרוקאי',
  'חציל פיקנטי',
  'מטבוחה מרוקאית',
  'סלט ביצים',
  'סלט סלק אדום',
  'סלט תפו"א',
  'חציל במיונז',
  'סלט קולסלאו',
  'סלט ווסדורף',
  'כרוב סגול',
  'חציל בטעם כבד',
  'פלפלים קלויים',
  'זיתים מבושלים',
  'סלט קינואה',
  'חמוצי הבית',
  'סלט פסטה'
]);

const MAINS_BASE = [
  { he: 'קציצות בקר', desc: 'קציצות בשר בקר מובחר ברוטב עגבניות עשיר' },
  { he: 'פרגית עסיסית', desc: 'סטייק פרגית על האש בתיבול ביתי עדין' },
  { he: 'אסאדו ברוטב מתוק', desc: 'בשר אסאדו בבישול ארוך ברוטב ברביקיו דבש' }
].map(({ he, desc }) => ({ id: nanoid(8), he: `${he} - ${desc}`, en: '', fr: '' }));

const FISH_STARTERS = items([
  'סלמון ברוטב אדום כבוש עם גמבה ועלי תיבול',
  'סלמון ברוטב מתוק עם נגיעות פיסטוק ושקדים',
  'מושט ברוטב מרוקאי אוטנטי חריף (חריימה)',
  'מושט בגריל עם פסטו ושקדים',
  'דג נסיכה אסייתי עם מבחר עלים',
  'דג נסיכה ברוטב לימונים ופלפל אדום (ניתן לבקש חריף)',
  'מרק עוף עם קניידלך',
  "מרק פטריות פורצ'יני עם אצבעות אנטריקוט"
]);

const EXTRA_SIDES = items([
  'אורז לבן עם שקדים וצימוקים',
  'אורז עם עשבי תיבול טריים',
  'אורז מאלובה עם ירקות',
  'תפו"א אפוי בשום, שמן זית ורוזמרין',
  'קוסקוס אותנטי',
  'אפונה ברוטב צהוב עם שמן זית',
  'שעועית ברוטב עגבניות',
  'ירקות מוקפצים ברוטב סיני'
]);

const THIRD_MEAL = items([
  'לחם שום חתוך לפרוסות',
  'מגינה אותנטי',
  'קוגל תפוח אדמה',
  'לזניה בשרית',
  'קיש ברוקולי (פרווה)',
  'פלטת דגים מעושנים'
]);

function packageBase({ id, label, pricePerGuest, extraCategoryItems, extraIncluded, addons }) {
  return {
    id,
    type: 'formula',
    name: { he: label, en: '', fr: '' },
    pricePerGuest,
    minGuests: 30,
    includedCategories: ['salads', 'main_courses', ...extraIncluded],
    categoryLimits: { salads: 8 },
    categoryItems: { salads: SALADS, main_courses: MAINS_BASE, ...extraCategoryItems },
    eventTypes: ['shabbat_chatan', 'engagement', 'bar_mitzvah', 'brit', 'memorial', 'wedding'],
    addons,
    sourceUrl: 'https://asado-catering.vercel.app/'
  };
}

const packages = [
  packageBase({
    id: 'basic-package',
    label: 'חבילת בסיס',
    pricePerGuest: 169,
    extraCategoryItems: {},
    extraIncluded: [],
    addons: [note('בחרו 8 סלטים מתוך 24 + מנה עיקרית אחת')]
  }),
  packageBase({
    id: 'premium-package',
    label: 'חבילת פרימיום',
    pricePerGuest: 189,
    extraCategoryItems: { starters: FISH_STARTERS, hot_sides: EXTRA_SIDES, desserts: THIRD_MEAL },
    extraIncluded: ['starters', 'hot_sides', 'desserts'],
    addons: [
      note('כולל שתייה קלה, סכו"ם מהודר ומשלוח חינם'),
      note('תפריט שבת חתן מורחב: מנת דגים, מרקים, תוספות ומבחר לסעודה שלישית')
    ]
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
    businessName: 'אסאדו',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'אסאדו - קייטרינג בשרי איכותי בטעם ביתי, כשר (בד"ץ העדה החרדית / הרב רובין / הרב מחפוד), המתמחה בקייטרינג לאירועי שבת - שבת חתן, שבת בר מצווה ושבתות גיבוש. תפריט עשיר של 24 סלטים לבחירה, מנות עיקריות בשריות (קציצות בקר, פרגית ואסאדו ברוטב מתוק), ובחבילת הפרימיום גם מנת דגים, מרקים, תוספות ומבחר עשיר לסעודה שלישית. משגיח צמוד בכל זמן הבישול והאפייה.',
      en: "Asado - quality meat catering with a homemade taste, kosher (Badatz Eda Chareidis / Rav Rubin / Rav Machpud), specializing in Shabbat event catering - Shabbat Chatan, Shabbat Bar Mitzvah and team-building Shabbatot. A rich menu of 24 salads to choose from, meat mains (beef meatballs, pargit and sweet-sauce asado), and in the premium package also a fish course, soups, sides and a rich third-meal spread. A supervisor is present throughout all cooking and baking.",
      fr: "Asado - traiteur carné de qualité au goût maison, cacher (Badatz Eda Hareidith / Rav Rubin / Rav Machpoud), spécialisé dans le traiteur pour évènements de Shabbat - Shabbat Hatan, Shabbat Bar Mitsva et Shabbatot de cohésion de groupe. Un menu riche de 24 salades au choix, des plats principaux carnés (boulettes de bœuf, pargit et asado sauce sucrée), et dans la formule premium aussi un plat de poisson, des soupes, des accompagnements et un large choix pour le troisième repas. Un supervisant est présent tout au long de la cuisson et de la pâtisserie."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // not published - judgment-call placeholder, see header comment
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['badatz_eda_chareidis', 'badatz_rav_rubin', 'badatz_rav_machpud'],
    cateringTypes: ['meat'],
    maxGuests: 300, // not published - judgment-call placeholder, see header comment
    priceFrom: 169,
    packages,
    eventTypes: ['shabbat_chatan', 'engagement', 'bar_mitzvah', 'brit', 'memorial', 'wedding'],
    menuCategories: ['salads', 'main_courses', 'starters', 'hot_sides', 'desserts'],
    services: ['free_delivery', 'elegant_tableware'],
    phone: '+972-52-797-7394',
    whatsapp: '+972527977394',
    email: 'asadok100@gmail.com',
    website: 'https://asado-catering.vercel.app/',
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
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
