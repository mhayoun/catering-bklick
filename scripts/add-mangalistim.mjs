// One-off script: adds "המנגליסטים" (HaMangalistim) as a new, pre-approved caterer, sourced
// from its own website https://mang.co.il/ - a meat/grill specialist ("קייטרינג בשרי ועל האש").
// Logo + 2 header images are downloaded locally then uploaded to this project's Vercel Blob
// store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is
// written. No real event photography was reachable (the /gallery/ page is behind a bot-check
// interstitial we didn't try to bypass), so `photos` only has the 2 menu-header banner images.
//
// Fields intentionally left blank/guessed conservatively:
// - kashrutLevels: multiple pages state "מהדרין" (mehadrin) - e.g. שולחן שוק בשרי's "כשרות
//   מהדרין מוקפדת" and the homepage's "ניתן לבחור מהשגחה רגילה ועד למהדרין" - but no specific
//   badatz/rabbi is named anywhere, so only 'mehadrin' is set.
// - cateringTypes is ['meat'] only: the footer links a "קייטרינג חלבי" (dairy) blog category,
//   but its posts are templated local-SEO content for a different-sounding brand ("החלביסטים" -
//   "the Dairy-ists" mirroring "HaMangalistim") in various cities, not this business's own menu -
//   not treated as evidence this brand serves dairy.
// - most of the 5 written formula menus (grill-classic, grill-premium, chef-buffet, shawarma-
//   buffet, market-table) gate their price behind a lead-capture form ("ממלאים פרטים ומקבלים את
//   המחירון") - no real number is published, so pricePerGuest is left at 0 (see
//   lib/pricing.js - a falsy pricePerGuest just omits the estimate rather than showing a
//   fabricated number, same reasoning as scripts/add-setti.mjs).
//
// TWO sections DO publish real prices, unlike the rest of the site, and are modeled with real
// pricePerGuest/minGuests:
// - "מגשי אירוח בשרי" (hospitality trays): minimum order 3,000 ILS +VAT for ~20 guests, for
//   either of two composition tiers - 150/guest, both packages below.
// - "דוכן שווארמה" (shawarma station): a full price table by guest bracket (up to 100/101-200/
//   201-300/300+) x season (winter/summer) x service style (professional machine vs. plancha),
//   plus regional delivery surcharges. This doesn't reduce to one clean pricePerGuest number, so
//   pricePerGuest below is the cheapest bracket's winter rate (entry-level estimate) and the full
//   table is preserved verbatim as note-type addons so nothing is lost.
//
// Usage: node --env-file=.env.local scripts/add-mangalistim.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/mang-site';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, eventTypes, addons, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: pricePerGuest || 0,
    minGuests: minGuests || 20, // the site's stated general minimum ("המינימום שלנו הוא 20 סועדים")
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || ['celebration'],
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl
  };
}

const SALADS_8 = [
  'סלט חומוס', 'סלט טחינה', 'סלט ירקות קצוץ', 'סלט כרוב לבן', 'סלט עגבניות פיקנטי', 'סלט טבולה',
  'חצילים על האש', 'סלט עלים ירוק'
];
const OPTIONAL_EXTRAS = [
  'שתייה קלה - 3 עמדות מזיגה: מים, לימונדה ותפוזים', 'קינוח ושתיה חמה - בקלוואה ופירות העונה, קפה ותה',
  'בירה ויין - בירה קרה, יין אדום ויין לבן', 'חבילת הושבה - כסא מרופד, שולחן ומפה קלאסית'
];

const packages = [
  pkg({
    id: 'grill-classic',
    name: { he: 'תפריט בופה גריל קלאסי', en: 'Classic Grill Buffet', fr: 'Buffet Grill Classique' },
    sourceUrl: 'https://mang.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%91%D7%95%D7%A4%D7%94-7-%D7%91%D7%A9%D7%A8%D7%99%D7%9D/',
    categories: {
      main_courses: ['סטייק אנטריקוט', 'סטייק פרגית', 'קבב טלה', "נקניקיות צו'ריסוס"],
      hot_sides: ['תפו"א בייבי', 'אורז שקדים וצימוקים', 'ירקות צלויים על האש'],
      breads: ['מיני פיתות'],
      salads: SALADS_8
    },
    addons: OPTIONAL_EXTRAS
  }),

  pkg({
    id: 'grill-premium',
    name: { he: 'תפריט בופה גריל פרימיום', en: 'Premium Grill Buffet', fr: 'Buffet Grill Premium' },
    sourceUrl: 'https://mang.co.il/catering-on-fire/',
    categories: {
      starters: ["מיני צו'ריסוס", 'עראיס'],
      main_courses: ['סטייק אנטריקוט', 'פיקנייה', 'דנוור קאט', 'סטייק פרגית', 'קבב טלה'],
      hot_sides: ['תפו"א בייבי', 'אורז שקדים וצימוקים', 'ירקות צלויים על האש'],
      breads: ['מיני פיתות'],
      salads: SALADS_8
    },
    addons: OPTIONAL_EXTRAS
  }),

  pkg({
    id: 'meat-chef-buffet',
    name: { he: 'בופה תבשילי בשר', en: 'Meat Chef Buffet', fr: 'Buffet du Chef (Viande)' },
    sourceUrl: 'https://mang.co.il/meat-chef-menu/',
    categories: {
      main_courses: [
        'סטייק אסאדו', 'עוף בתנור', 'אושפלו', 'המבורגר אנטריקוט', 'צוריסוס', 'שניצלונים', 'שווארמה', 'דג מושט'
      ],
      hot_sides: ['תפו"א ובטטה', 'אורז בסמטי', 'אנטי פסטי'],
      breads: ['פיתות טריות'],
      salads: SALADS_8
    },
    categoryLimits: { main_courses: 4 }, // listing: "עיקריות לבחירה (4)"
    addons: OPTIONAL_EXTRAS
  }),

  pkg({
    id: 'shawarma-buffet',
    name: { he: 'בופה שווארמה', en: 'Shawarma Buffet', fr: 'Buffet Chawarma' },
    sourceUrl: 'https://mang.co.il/%D7%93%D7%95%D7%9B%D7%9F-%D7%A9%D7%95%D7%95%D7%90%D7%A8%D7%9E%D7%94-%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/',
    categories: {
      main_courses: ['שווארמה פרגית', 'פלאפל'],
      hot_sides: ["צ'יפס פריך", 'תפו"א מדורה'],
      breads: ['פיתות חמות'],
      salads: [
        'סלט חומוס', 'סלט טחינה', 'סלט ירקות קצוץ', 'סלט כרוב לבן', 'סלט טבולה', 'סלט עגבניות שרי',
        'פלפלים וחמוצים'
      ],
      beverages_non_alcoholic: ['מים קרים', 'לימונדה', 'שתייה חמה'],
      desserts: ['קינוחים מפנקים']
    }
  }),

  pkg({
    id: 'meat-market-table',
    name: { he: 'שולחן שוק בשרי', en: 'Meat Market Table', fr: 'Table du Marché (Viande)' },
    sourceUrl: 'https://mang.co.il/%D7%A9%D7%95%D7%9C%D7%97%D7%9F-%D7%A9%D7%95%D7%A7/%D7%91%D7%A9%D7%A8%D7%99/',
    categories: {
      main_courses: [
        'אנטריקוט מיושן על הגריל', 'פרגיות במרינדה ביתית', 'כבד עוף צלוי בבצל מקורמל', 'קבב טלה משובח',
        'כנפיים ברוטב צ\'ילי מתוק', 'נקניקיות מרגז חריפות'
      ],
      salads: [
        'סלט ירקות קצוץ דק דק', 'חציל על האש עם טחינה', 'מטבוחה ביתית חריפה', 'כרוב אדום ולבן',
        'חומוס עם גרגירים', 'טחינה ירוקה'
      ],
      hot_sides: ['אורז פרסי עם צימוקים ושקדים', 'תפוחי אדמה בעשבי תיבול', 'ירקות על הגריל', 'שעועית ברוטב עגבניות']
    },
    addons: ['כשרות מהדרין מוקפדת', 'עגלת שוק מעוצבת נעה על גלגלים - עד 50 סועדים לכל עגלה']
  }),

  pkg({
    id: 'hospitality-trays-full',
    name: { he: 'מגשי אירוח בשרי - חבילה מלאה', en: 'Meat Hospitality Trays - Full Package', fr: 'Plateaux de Réception Viande - Formule Complète' },
    sourceUrl: 'https://mang.co.il/%D7%9E%D7%92%D7%A9%D7%99-%D7%90%D7%99%D7%A8%D7%95%D7%97-%D7%91%D7%A9%D7%A8%D7%99-%D7%95%D7%90%D7%95%D7%9B%D7%9C-%D7%9E%D7%95%D7%9B%D7%9F-%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/',
    pricePerGuest: 150, // real: minimum order 3,000 ILS (+VAT) for ~20 guests
    minGuests: 20,
    categories: {
      main_courses: [
        'אסאדו', 'בריסקט', 'המבורגר אנטריקוט', 'גולש הונגרי', 'צוריסוס', 'פרגיות בגריל', 'כרעיים מעושנות',
        'שווארמה', 'שניצלונים', 'צלי כתף טלה', 'דג פיקנטי'
      ],
      hot_sides: ['תפו״א ובטטה אפויים', 'אורז בסמטי', 'אושפלוב', 'קוסקוס מרוקאי'],
      salads: ['סלט ירוק', 'סלט שוק', 'טבולה', 'עגבניות פיקנטי', 'חומוס', 'חציל צרוב בטחינה', 'כרובית קלויה', 'כרוב לבן'],
      breads: ['לחמניות ופיתות']
    },
    categoryLimits: { main_courses: 4, hot_sides: 3 }, // "חבילה מלאה - 4 מנות עיקריות לבחירה + 3 תוספות חמות"
    addons: [
      'מחיר לפני מע"מ; ככל שמספר הסועדים גדל - המחיר לסועד יורד',
      'משלוח כלול באזור המרכז; לאזורים נוספים בתיאום',
      'כלי חימום על פתיליות וכלי הגשה חד"פ כלולים',
      'ניתן להוסיף קינוחים, שתייה, ציוד הושבה, מזנוני הגשה מעץ וצוות שירות בתיאום מראש'
    ]
  }),

  pkg({
    id: 'hospitality-trays-economy',
    name: { he: 'מגשי אירוח בשרי - חבילה חסכונית', en: 'Meat Hospitality Trays - Economy Package', fr: 'Plateaux de Réception Viande - Formule Économique' },
    sourceUrl: 'https://mang.co.il/%D7%9E%D7%92%D7%A9%D7%99-%D7%90%D7%99%D7%A8%D7%95%D7%97-%D7%91%D7%A9%D7%A8%D7%99-%D7%95%D7%90%D7%95%D7%9B%D7%9C-%D7%9E%D7%95%D7%9B%D7%9F-%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/',
    pricePerGuest: 150, // real: site states the same 3,000 ILS (+VAT) / ~20-guest minimum for both tiers
    minGuests: 20,
    categories: {
      main_courses: [
        'אסאדו', 'בריסקט', 'המבורגר אנטריקוט', 'גולש הונגרי', 'צוריסוס', 'פרגיות בגריל', 'כרעיים מעושנות',
        'שווארמה', 'שניצלונים', 'צלי כתף טלה', 'דג פיקנטי'
      ],
      hot_sides: ['תפו״א ובטטה אפויים', 'אורז בסמטי', 'אושפלוב', 'קוסקוס מרוקאי'],
      salads: ['סלט ירוק', 'סלט שוק', 'טבולה', 'עגבניות פיקנטי', 'חומוס', 'חציל צרוב בטחינה', 'כרובית קלויה', 'כרוב לבן'],
      breads: ['לחמניות ופיתות']
    },
    categoryLimits: { main_courses: 3, hot_sides: 2 }, // "חבילה חסכונית - 3 מנות עיקריות לבחירה + 2 תוספות חמות"
    addons: [
      'מחיר לפני מע"מ; ככל שמספר הסועדים גדל - המחיר לסועד יורד',
      'משלוח כלול באזור המרכז; לאזורים נוספים בתיאום',
      'כלי חימום על פתיליות וכלי הגשה חד"פ כלולים'
    ]
  }),

  pkg({
    id: 'shawarma-station-machine',
    name: { he: 'דוכן שווארמה - מכונה מקצועית', en: 'Shawarma Station - Professional Machine', fr: 'Stand Chawarma - Machine Professionnelle' },
    sourceUrl: 'https://mang.co.il/%D7%93%D7%95%D7%9B%D7%9F-%D7%A9%D7%95%D7%95%D7%90%D7%A8%D7%9E%D7%94-%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/',
    pricePerGuest: 100, // real: cheapest published bracket - up to 100 guests, winter, 10,000 ILS
    minGuests: 20,
    categories: {
      main_courses: ['שווארמה פרגית על גלגל - חיתוך פרונטלי, מכונה מקצועית']
    },
    addons: [
      'רטבים וסלטים כלולים: חומוס ביתי, סלט ירקות טרי, כרוב לבן, כרוב סגול, חמוצים, טחינה',
      'עד 100 איש: 10,000₪ (חורף) / 12,000₪ (קיץ) - זמן הגשה כשעתיים',
      '101-200 איש: 16,000₪ (חורף) / 17,900₪ (קיץ) - כ-3 שעות',
      '201-300 איש: 25,000₪ (חורף) / 28,900₪ (קיץ) - כ-4 שעות',
      'מעל 300 איש: בהתאמה אישית',
      'תוספת אזור הגשה: מרכז הארץ ללא תוספת, צפון/דרום +500₪, ירושלים והסביבה +300₪',
      'המחירים משתנים מעונה לעונה - יש לפנות לקבלת הצעת מחיר מדויקת'
    ]
  }),

  pkg({
    id: 'shawarma-station-plancha',
    name: { he: "דוכן שווארמה - הכנה על פלאנצ'ה", en: 'Shawarma Station - Plancha-Prepared', fr: 'Stand Chawarma - Cuisson à la Plancha' },
    sourceUrl: 'https://mang.co.il/%D7%93%D7%95%D7%9B%D7%9F-%D7%A9%D7%95%D7%95%D7%90%D7%A8%D7%9E%D7%94-%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/',
    pricePerGuest: 70, // real: cheapest published bracket - up to 100 guests, winter, 7,000 ILS
    minGuests: 20,
    categories: {
      main_courses: ["שווארמה פרגית - הכנה על פלאנצ'ה"]
    },
    addons: [
      'רטבים וסלטים כלולים: חומוס ביתי, סלט ירקות טרי, כרוב לבן, כרוב סגול, חמוצים, טחינה',
      'עד 100 איש: 7,000₪ (חורף) / 7,500₪ (קיץ) - זמן הגשה כשעתיים',
      '101-200 איש: 13,000₪ (חורף) / 15,000₪ (קיץ) - כ-3 שעות',
      '201-300 איש: 24,800₪ (חורף) / 26,200₪ (קיץ) - כ-4 שעות',
      'מעל 300 איש: בהתאמה אישית',
      'תוספת אזור הגשה: מרכז הארץ ללא תוספת, צפון/דרום +500₪, ירושלים והסביבה +300₪',
      'המחירים משתנים מעונה לעונה - יש לפנות לקבלת הצעת מחיר מדויקת'
    ]
  })
];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne('logo.png', 'image/png');
  const photo1 = await uploadOne('photo1.png', 'image/png');
  const photo2 = await uploadOne('photo2.png', 'image/png');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'המנגליסטים',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'המנגליסטים - קייטרינג בשרי כשר ועל האש לאירועים, עם ניסיון של מעל 15 שנה ויותר מ-1,800 אירועים. אנחנו מציעים מגוון תפריטי בופה בשרים (גריל קלאסי, גריל פרימיום, תבשילי שף, שווארמה), שולחן שוק בשרי, מגשי אירוח בשרי ודוכן שווארמה עם גלגל מקצועי - הכל בהכנה ביום האירוע, בהגשה דקורטיבית ובכשרות מהדרין.',
      en: 'HaMangalistim - kosher meat and grill catering for events, with over 15 years of experience and more than 1,800 events. We offer a range of meat buffet menus (classic grill, premium grill, chef dishes, shawarma), a meat market table, meat hospitality trays, and a professional shawarma wheel station - everything prepared fresh on the day of the event, served decoratively, and mehadrin kosher.',
      fr: "HaMangalistim - traiteur de viande et grillades cachères pour événements, avec plus de 15 ans d'expérience et plus de 1 800 événements réalisés. Nous proposons une gamme de buffets de viande (grill classique, grill premium, plats du chef, chawarma), une table de marché à la viande, des plateaux de réception à la viande et un stand chawarma avec broche professionnelle - tout est préparé frais le jour même, servi avec soin, et cacher mehadrin."
    },
    districts: ['center', 'telaviv', 'jerusalem', 'north', 'south', 'haifa'],
    city: { he: 'רמת גן', en: 'Ramat Gan', fr: 'Ramat Gan' },
    address: 'רחוב הירדן 69, רמת גן',
    kashrutLevels: ['mehadrin'],
    cateringTypes: ['meat'],
    maxGuests: 500,
    priceFrom: 100, // real: cheapest published rate (shawarma station, plancha, winter, ≤100 guests) is 70/guest but 100 reflects the more common machine-station entry rate
    packages,
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts', 'beverages_non_alcoholic'],
    services: ['live_cooking_station', 'waiter_staff', 'disposable_tableware', 'kids_meals'],
    phone: '+972-54-6786343',
    whatsapp: '+972546786343',
    email: 'mangalistim4u@gmail.com',
    website: 'https://mang.co.il/',
    instagram: '',
    facebook: '',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, and ${packages.length} formulas.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
