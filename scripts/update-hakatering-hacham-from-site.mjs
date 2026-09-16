// One-off script: enriches the "הקייטרינג החם" caterer record (added by
// scripts/add-hakatering-hacham.mjs from its cateringisrael.co.il directory listing, which had
// no phone number, no menu, and no logo at all) with data from the business's own site,
// https://www.mohacham.co.il/ - a WordPress site with 7 dedicated priced package pages, a
// downloadable order-form menu image, a scanned kashrut certificate, and a real logo.
//
// All Hebrew item/package text below is copied verbatim from the site's raw HTML (fetched with
// curl + a plain-text extraction pass) or transcribed from the order-form menu image
// (menu2021-541x768-1.png, read directly) - not paraphrased from an AI summary of the page,
// to avoid mistranslation (an earlier automated summary of the Gold Plus page, for example,
// mangled "קובות מטוגנות" as "fried cubes" - corrected here by reading the raw text).
//
// Corrections/additions vs. the original directory-sourced record:
// - phone/whatsapp: were blank (directory listing had no tel: link at all) - now 050-9341170,
//   confirmed via tel: links AND the order-form menu image's own printed contact line.
// - email: was blank - now hacham.matanya@gmail.com (site footer + About page).
// - website: was blank - now https://www.mohacham.co.il/.
// - city: was blank - now פתח תקווה (Petach Tikva), the city the site itself publishes under
//   "כתובת:". NOTE: the scanned kashrut certificate lists a different address - הגפן 10, מושב
//   יגל - as the registered food-prep premises. That's the certified kitchen's legal address,
//   not what the business publicly markets as its city, so it is deliberately NOT used for the
//   `city`/`address` fields here (same reasoning as scripts/update-tmarim-from-site.mjs choosing
//   the certificate-confirmed address over a guessed one - here the site's own public-facing city
//   is kept instead of the certificate's premises address, since that's what a searching customer
//   would expect to see).
// - kashrutLevels: was ['mehadrin'] (guessed generically from the directory's "כשר למהדרין"
//   checkbox). The site links an actual scanned certificate from הרבנות והמועצה הדתית אזורית
//   שדות דן - צפריה (a *local* religious council, not the national Chief Rabbinate), explicitly
//   titled "MEHADRIN KOSHER CERTIFICATE", valid until 31/12/2026 but explicitly NOT valid for
//   Passover ("התעודה אינה תקפה לחג הפסח" - matching the site's separate "קייטרינג לפסח 2026"
//   page). Corrected to ['local_rabbinate', 'mehadrin'].
// - priceFrom: was 115 (a directory-listing guess) - now 70, the real floor price stated on 4 of
//   the 7 package pages (Gold/Memorial/Brit/Bar-Mitzvah all start at ₪70/person).
// - eventTypes: gains 'memorial' (the site has a dedicated Memorial/Azkarah package) and
//   'engagement' (footer nav link "קייטרינג לאירוסין"). 'henna' is kept from the original
//   directory-sourced guess since nothing on this site contradicts it.
// - services: gains 'waiter_staff' (offered as an add-on on every package page) and
//   'elegant_tableware'/'disposable_tableware' (both offered per the order-form's "שונות"
//   section, and porcelain dishes are explicitly included in the All-Inclusive package).
// - logo: was blank - now the site's own official logo, taken from its JSON-LD structured data
//   (`"logo":".../logo3.png"`), not a favicon crop. Small (183x142) but a clean vector-style
//   icon+wordmark with a transparent background.
//
// packages: each of the 7 promotional package pages becomes one formula. The app's
// MENU_CATEGORIES has no bucket for "reception", "soup", or "middle course" (unlike this
// business's own 4-5 course structure), so - same approximation approach as
// scripts/update-tmarim-from-site.mjs - soups and the fish/vegetarian "מנה ביניים" course are
// folded into `starters`, and the All-Inclusive package's "מנת ביניים" + "מנה עיקרית" courses
// are folded together into `main_courses`. The Shabbat Chatan package is inherently 3 separate
// meals (Friday dinner / Saturday lunch / Seuda Shlishit); rather than force that into one flat
// set of categoryItems, its per-meal breakdown is kept verbatim in `addons` and the categories
// hold the union of items across the 3 meals. Where a page states an explicit "X לבחירה" choice
// count, that becomes categoryLimits; where it doesn't (e.g. All-Inclusive's course items, which
// read as "this is what you get" rather than "choose N of these"), no limit is set. minGuests is
// not published anywhere on the site - 20 is a judgment-call placeholder (same caveat as
// scripts/add-aleshelzait.mjs and scripts/update-tmarim-from-site.mjs) and should be corrected
// via the dashboard edit form once a real figure is known.
//
// Usage: node --env-file=.env.local scripts/update-hakatering-hacham-from-site.mjs

import { readFile } from 'node:fs/promises';
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
const LOGO_PATH =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad/mohacham-logo3.png';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, eventTypes, addons, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest,
    minGuests,
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || [],
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl
  };
}

// Master item lists transcribed from the order-form menu image (menu2021-541x768-1.png).
// Items marked * on the source form carry an explicit extra charge ("*תוספת מחיר").
const SALADS = [
  'תפוח-אדמה במיונז', 'חציל במיונז', 'חציל מטוגן', 'חציל רומני', 'חומוס',
  'פלפל חריף מטוגן', 'מלפפון מתוק בחומץ', 'סלק מזרחי', 'סלט ירקות טרי',
  'גזר חי באננס', 'גזר מרוקאי', 'גזר טריפולטאי', 'מטבוחה', 'חמוצים', 'חמוצי הבית',
  'וולדורף', 'תירס', 'טחינה', 'כרוב בלימון', 'עגבניות שרי*', 'פלפל 3 צבעים*',
  'נבטים מוקפצים', 'טבולה סלט לבנוני'
];

const HOT_SIDES = [
  'תפוחי אדמה אפויים/בטטה', 'אורז לבן', 'אורז אדום', 'אורז סיני', 'אורז ירוק',
  'קוסקוס עם רוטב ירקות', 'גזר ואפונה', 'שעועית ירוקה', 'לקט ירקות רטטוי',
  'זיתים מרוקאים', 'ספגטי ברוטב עגבניות', 'פסטה מטוגנת בבצל', 'פסטה סינית מוקפצת',
  'ירקות מוקפצים', 'קיגל תפו"א', 'קיגל ירושלמי'
];

const MAINS = [
  'צלי בקר בפטריות', "עוף בתנור - מזרחי / צ'ילי מתוק / שום בדבש", 'שניצל וינאי',
  'קבב על פחמים', 'מדליוני עוף בדבש', 'גולש הונגרי', 'קציצות בשר ברוטב בצל/עגבניות',
  'עוף מוקפץ סיני', 'גונדי', 'קובה', "סטייק פרגית על האש - מזרחי / צ'ילי מתוק / שום בדבש",
  "חזה עוף על פחמים* - מזרחי / צ'ילי מתוק / שום בדבש"
];

// Folded here: the order form's "מבחר מרקי הבית" (soups) + "מנה ביניים" (fish/veg middle
// course) sections - MENU_CATEGORIES has no bucket for either, see header comment.
const SOUPS_AND_MIDCOURSE = [
  'מרק ירקות', 'מרק בצל', 'מרק עוף', 'מרק בקר', 'מרק תימני', 'מרק תימני עם עוף',
  'מרק תימני עם בקר', 'מרק פטריות*', 'חורשט סבזי', "חורשט בדינ'אן",
  'בורקס ברוטב פטריות', 'מוסקה', 'פלפל ממולא', 'פילה מרלוזה מטוגן', 'דג נילוס אפוי',
  'חריימה', 'דג סול מטוגן*', 'דג סלמון*', 'פילה מושט בעשבי תיבול',
  'טורטיה במילוי בשר/ירקות', 'חמין'
];

const packages = [
  pkg({
    id: 'gold',
    name: { he: 'מבצע מנה זהב', en: 'Gold Portion Package', fr: 'Formule Portion Or' },
    pricePerGuest: 70,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%9e%d7%a0%d7%94-%d7%96%d7%94%d7%91/',
    eventTypes: ['celebration'],
    categories: {
      breads: ['מבחר לחמים'],
      starters: ['קובות מטוגנות'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS,
      desserts: ['עוגת מוס', 'בקלוואה']
    },
    categoryLimits: { salads: 10, hot_sides: 3, main_courses: 3, desserts: 1 },
    addons: ['תוספות מפנקות על חשבון הבית', 'ניתן להוסיף מלצרים לסידור והגשה בתוספת תשלום']
  }),

  pkg({
    id: 'gold_plus',
    name: { he: 'מבצע מנה זהב פלוס', en: 'Gold Plus Package', fr: 'Formule Or Plus' },
    pricePerGuest: 99,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%9e%d7%a0%d7%94-%d7%96%d7%94%d7%91-%d7%a4%d7%9c%d7%95%d7%a1/',
    eventTypes: ['celebration'],
    categories: {
      breads: ['מבחר לחמי הבית'],
      starters: ['קובות', 'טורטיה בשר', 'קרואסון אסאדו', 'דג מושט', 'דג סלמון', 'דג לברק', 'דג נסיכה'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS
    },
    // starters limit approximates "2 סוגי מנות ביניים לבחירה" - קובות is always-included on top
    // of the 2 chosen middle-course items, but categoryLimits only supports one number per
    // bucket (see header comment).
    categoryLimits: { salads: 10, starters: 2, hot_sides: 3, main_courses: 3 },
    addons: [
      'תוספות מפנקות על חשבון הבית',
      'ניתן להוסיף מלצרים לסידור והגשה בתוספת תשלום',
      '3 סוגי הבשרים כוללים בקר מספר 5, אסאדו ופרגית XL'
    ]
  }),

  pkg({
    id: 'all_inclusive',
    name: { he: 'מבצע אירוע הכל כלול', en: 'All-Inclusive Event Package', fr: 'Formule Événement Tout Compris' },
    pricePerGuest: 170,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%90%d7%99%d7%a8%d7%95%d7%a2-%d7%94%d7%9b%d7%9c-%d7%9b%d7%9c%d7%95%d7%9c/',
    eventTypes: ['celebration'],
    categories: {
      // קבלת פנים (reception course) - folded into starters, no separate bucket exists.
      starters: [
        'קרואסון או מיני לחוח עם אסאדו מפורק', "פיש אנד צ'יפס או צ'יקן אנד צ'יפס",
        'מרק קובה או מרק כתום', 'מטוגנים, סיגרים עם בשר או קובה', 'מגשי סושי בתוספת תשלום'
      ],
      // מנה ראשונה (first course)
      salads: [
        'חומוס עם פטריות', 'מטבוחה חריפה', 'חציל שלם בטחינה',
        'סלט חסה, עגבניות שרי ופקאנים מקורמלים', 'טבולה לבנוני, סלט ירוקים, סלט בטטה',
        "קרפצ'יו סלק וסלט כרוב עם חמוציות"
      ],
      // מנת ביניים + מנה עיקרית folded together - see header comment.
      main_courses: [
        'דג סלמון קראסט עשבי תיבול על מצע פירה בטטה',
        'סיגר פריך במילוי בשר עם צנוברים וסלט ירוקים קטן בצד',
        'טורטייה עסיסית במילוי פטריות יער בזילוף טחינה וסילאן',
        'אסאדו עסיסי עם קרם תפו"א וברוקולי', 'פרגית ים תיכונית עם טחינה בתוספת קרעי תפו"א',
        'סטייק כרובית או פילה פורטבלו'
      ],
      desserts: ['פירות העונה', 'פטיפורים צרפתיים'],
      beverages_non_alcoholic: ['שתייה חמה', 'שתייה קלה']
    },
    categoryLimits: {},
    addons: [
      'מגשי סושי בתוספת תשלום',
      'כלול במחיר: כלים פורצלן וכלי הגשה, מפות, מפיות וצוות מלצרים',
      'בתוספת תשלום: טיפים ומשלוח'
    ]
  }),

  pkg({
    id: 'shabbat_chatan',
    name: { he: 'מבצע שבת חתן', en: 'Shabbat Chatan Package', fr: 'Formule Shabbat Chatan' },
    pricePerGuest: 199,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%a9%d7%91%d7%aa-%d7%97%d7%aa%d7%9f/',
    eventTypes: ['shabbat_chatan'],
    categories: {
      breads: ['מבחר לחמי הבית'],
      starters: ['קובות מטוגנות'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS,
      desserts: ['עוגת מוס פרווה', 'בקלוואה', 'מבחר פטיפורים פרווה']
    },
    categoryLimits: { salads: 10, starters: 2, hot_sides: 3, main_courses: 3, desserts: 1 },
    // The package is really 3 separate meals - kept verbatim here rather than forced into the
    // flat category structure above (see header comment).
    addons: [
      'ארוחת שישי בערב: 10 סוגי סלטים, מבחר לחמי הבית, 3 תוספות חמות, 2 סוגי מנות ביניים לבחירה, 3 סוגי בשרים (כולל בקר מספר 5, אסאדו ופרגית XL), עוגת מוס פרווה/בקלוואה/פטיפורים פרווה על חשבון הבית',
      'ארוחת שבת בבוקר: 10 סוגי סלטים, מבחר לחמי הבית, קובות מטוגנות, 3 תוספות חמות, 3 סוגי בשרים (כולל בקר מספר 5, אסאדו ופרגית XL), חמין בטעם בשר/פרווה מתנה על חשבון הבית',
      "סעודה שלישית: סלטים עשירים ומבחר לחמי הבית, ג'חנון עם רסק ביצים וחריף, אפשרויות נוספות: דג סלמון, דג מושט מטוגן ברוטב, טורטיה ירקות, קוגל או בורקס תפוחי אדמה",
      'תוספות ביניים ניתן להוסיף בתוספת תשלום'
    ]
  }),

  pkg({
    id: 'memorial',
    name: { he: 'מבצע קייטרינג לאזכרה', en: 'Memorial Catering Package', fr: 'Formule Traiteur Azkara' },
    pricePerGuest: 70,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%9c%d7%90%d7%96%d7%9b%d7%a8%d7%94/',
    eventTypes: ['memorial'],
    categories: {
      breads: ['מבחר לחמים'],
      starters: ['קובות מטוגנות'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS,
      desserts: ['עוגת מוס פרווה', 'בקלוואה']
    },
    categoryLimits: { salads: 10, hot_sides: 3, main_courses: 3, desserts: 1 },
    addons: ['תוספות מפנקות על חשבון הבית', 'ניתן להוסיף מלצרים לסידור והגשה בתוספת תשלום']
  }),

  pkg({
    id: 'brit',
    name: { he: 'מבצע קייטרינג לברית/ה', en: 'Brit Milah Catering Package', fr: 'Formule Traiteur Brit Mila' },
    pricePerGuest: 70,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%9c%d7%91%d7%a8%d7%99%d7%aa/',
    eventTypes: ['brit'],
    categories: {
      breads: ['מבחר לחמים'],
      starters: ['קובות מטוגנות'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS,
      desserts: ['עוגת מוס פרווה', 'בקלוואה']
    },
    categoryLimits: { salads: 10, hot_sides: 3, main_courses: 3, desserts: 1 },
    addons: ['תוספות מפנקות על חשבון הבית', 'ניתן להוסיף מלצרים לסידור והגשה בתוספת תשלום']
  }),

  pkg({
    id: 'bar_mitzvah',
    name: { he: 'מבצע קייטרינג לבר / בת מצווה', en: 'Bar/Bat Mitzvah Catering Package', fr: 'Formule Traiteur Bar/Bat Mitsva' },
    pricePerGuest: 70,
    minGuests: 20,
    sourceUrl: 'https://www.mohacham.co.il/%d7%9e%d7%91%d7%a6%d7%a2-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%9c%d7%91%d7%a8-%d7%91%d7%aa-%d7%9e%d7%a6%d7%95%d7%95%d7%94/',
    eventTypes: ['bar_mitzvah'],
    categories: {
      breads: ['מבחר לחמים'],
      starters: ['קובות מטוגנות'],
      salads: SALADS,
      hot_sides: HOT_SIDES,
      main_courses: MAINS,
      desserts: ['עוגת מוס פרווה', 'בקלוואה']
    },
    categoryLimits: { salads: 10, hot_sides: 3, main_courses: 3, desserts: 1 },
    addons: ['תוספות מפנקות על חשבון הבית', 'ניתן להוסיף מלצרים לסידור והגשה בתוספת תשלום']
  })
];

async function uploadLogo() {
  const buf = await readFile(LOGO_PATH);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-hakatering-hacham-logo.png`;
  const blob = await put(filename, buf, { access: 'public', contentType: 'image/png' });
  console.log(`Uploaded logo -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'הקייטרינג החם') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "הקייטרינג החם" not found in KV - run add-hakatering-hacham.mjs first.');
    process.exit(1);
  }

  const logoUrl = await uploadLogo();
  const existing = await kv.get(`caterer:${id}`);

  const updated = {
    ...existing,
    phone: '+972-50-9341170',
    whatsapp: '+972509341170',
    email: 'hacham.matanya@gmail.com',
    website: 'https://www.mohacham.co.il/',
    city: { he: 'פתח תקווה', en: 'Petach Tikva', fr: 'Petah Tikva' },
    kashrutLevels: ['local_rabbinate', 'mehadrin'], // corrected per the site's own kashrut certificate scan - see header comment
    priceFrom: 70,
    eventTypes: [...new Set([...(existing.eventTypes || []), 'memorial', 'engagement'])],
    menuCategories: ['breads', 'starters', 'salads', 'hot_sides', 'main_courses', 'desserts', 'beverages_non_alcoholic'],
    services: [...new Set([...(existing.services || []), 'waiter_staff', 'elegant_tableware', 'disposable_tableware'])],
    logo: logoUrl,
    packages,
    updatedAt: new Date().toISOString()
  };

  await kv.set(`caterer:${id}`, updated);
  console.log(`\nUpdated caterer "הקייטרינג החם" (${id}) with ${packages.length} formulas from mohacham.co.il.`);
  packages.forEach((p) =>
    console.log(
      `  - ${p.name.he} (${p.id}): ₪${p.pricePerGuest}/guest, ${Object.values(p.categoryItems).reduce((n, l) => n + l.length, 0)} items`
    )
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
