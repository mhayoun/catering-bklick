// One-off script: adds "מעדני אורי ובניו" (Madany Ori ve-Banav, "since 1975") as a new,
// pre-approved caterer, sourced from its own website https://www.madany-ori.co.il/ - a Jerusalem
// dairy-only caterer based in the Machane Yehuda market. Logo + 2 product photos are downloaded
// locally then uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention).
//
// Like scripts/add-pasha.mjs, every package here has a REAL published price:
// - 4 fixed-guest-count bundles ("תפריט 20/30/40/50 אורחים") each show an exact total ILS price
//   and a fixed, fully-itemized menu (WooCommerce "add to cart" product pages) - modeled as
//   formula packages with pricePerGuest = total/guests and minGuests = that exact guest count
//   (fixed composition, so categoryLimits is omitted).
// - The shop's 4 product categories (מגש כריכים, מגשי אירוח חלבי, בר חם, בר קר) are a genuine
//   per-tray/per-unit price catalog, ~60 unique items after de-duplicating items cross-listed in
//   multiple categories - modeled as one a_la_carte package, same convention as
//   scripts/add-tmarim-alacarte-trays.mjs and scripts/add-pasha.mjs's open-catering-menu package.
//
// kashrutLevels is left at just ['mehadrin'] - the homepage and every page footer state "כשר
// למהדרין" but the dedicated /תעודות-ואישורים/ (certificates) page is a lead-capture form with no
// certificate text/badatz name actually shown, so nothing more specific is claimed.
//
// Usage: node --env-file=.env.local scripts/add-madany-ori.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/madany-site';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function bundle({ id, name, totalPrice, guests, categories, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: Math.round((totalPrice / guests) * 100) / 100,
    minGuests: guests,
    includedCategories: Object.keys(categories),
    categoryLimits: {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: ['celebration'],
    addons: ['כולל הובלה למקום', 'ביטול האירוע 24 שעות לפני המועד יחויב במלוא הסכום'].map((he) => ({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'note',
      amount: ''
    })),
    sourceUrl
  };
}

const packages = [
  bundle({
    id: 'menu-20-guests',
    name: { he: 'תפריט 20 אורחים', en: 'Menu for 20 Guests', fr: 'Menu pour 20 Invités' },
    totalPrice: 2800,
    guests: 20,
    sourceUrl: 'https://www.madany-ori.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-20-%D7%90%D7%95%D7%A8%D7%97%D7%99%D7%9D/',
    categories: {
      main_courses: [
        'כדורי ארנצ\'יני בתוספת מטבלים עגבניות מיובשות ופסטו', 'שיפודי סלמון בציפוי קראסט עם כוסברה',
        'לזניה תרד גבינות וזיתים שחורים ברוטב עגבניות', 'מיני קישים במבחר טעמים: בטטה, ברוקולי, בצל, ים תיכוני'
      ],
      starters: ["סנדוויץ' טוניסאי בביצה קשה, טונה, אריסה וירקות"],
      salads: [
        'סלט בטטה עשיר: חסות, נבטי חמנייה, בולגרית ובטטה בשילוב מיקס פיצוחים',
        'סלט חסות ונבטי חמנייה עם עגבניות שרי, כדורי מוצרלה, אגוזי מלך קלויים',
        'סלט יווני עשיר: עגבניות, מלפפון, בצל סגול, פטרוזיליה, בולגרית, זיתים שחורים'
      ],
      desserts: ['מגש מעוצב של פירות העונה', 'קוביות עוגות מיוחדות: שוקולד, גבינה פירורים, טריקולד ועוד']
    }
  }),

  bundle({
    id: 'menu-30-guests',
    name: { he: 'תפריט 30 אורחים', en: 'Menu for 30 Guests', fr: 'Menu pour 30 Invités' },
    totalPrice: 3800,
    guests: 30,
    sourceUrl: 'https://www.madany-ori.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-30-%D7%90%D7%95%D7%A8%D7%97%D7%99%D7%9D/',
    categories: {
      main_courses: [
        'מיקס מטוגנים פרווה, קובה פטריות ופסטלים', 'נתחי פילה סלמון טרי ברוטב שף',
        'לזניה תרד גבינות וזיתים שחורים ברוטב עגבניות', 'מיני קישים במבחר טעמים: בטטה, ברוקולי, בצל, ים תיכוני',
        'פרחי ברוקולי בציפוי פריך אפוי בתנור'
      ],
      starters: ['קוראסונים במילוי אבוקדו וסלמון'],
      salads: [
        'סלט בטטה עשיר: חסות, נבטי חמנייה, בולגרית ובטטה בשילוב מיקס פיצוחים',
        'סלט חסות ונבטי חמנייה עם עגבניות שרי, כדורי מוצרלה, אגוזי מלך קלויים',
        'סלט יווני עשיר: עגבניות, מלפפון, בצל סגול, פטרוזיליה, בולגרית, זיתים שחורים'
      ],
      hot_sides: [
        'מיקס גבינות שמנת ומטבלים, טפנד זיתים, ממרח עגבניות ופסטו',
        'מיקס חמוצים מיוחדים (4 סוגים): זיתים סורים שבורים, קלמטה, זית מרוקאי, יווני'
      ],
      desserts: ['מגש מעוצב של פירות העונה', 'קוביות עוגות מיוחדות: שוקולד, גבינה פירורים, טריקולד ועוד']
    }
  }),

  bundle({
    id: 'menu-40-guests',
    name: { he: 'תפריט 40 אורחים', en: 'Menu for 40 Guests', fr: 'Menu pour 40 Invités' },
    totalPrice: 4500,
    guests: 40,
    sourceUrl: 'https://www.madany-ori.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-40-%D7%90%D7%95%D7%A8%D7%97%D7%99%D7%9D/',
    categories: {
      main_courses: [
        'פטריות פורטובלו במילוי גבינות פסטו וטחינה גולמית בתנור', 'מיקס ממולאים כרוב ובצל',
        'נתחי פילה סלמון טרי ברוטב שף', 'מיני קישים במבחר טעמים: בטטה, ברוקולי, בצל, ים תיכוני'
      ],
      starters: ['מיני לחמניות ביס במילוי: טונה וירקות / אבוקדו / סלמון'],
      salads: [
        'סלט בטטה עשיר: חסות, נבטי חמנייה, בולגרית ובטטה בשילוב מיקס פיצוחים',
        'סלט חסות ונבטי חמנייה עם עגבניות שרי, כדורי מוצרלה, אגוזי מלך קלויים',
        'סלט יווני עשיר: עגבניות, מלפפון, בצל סגול, פטרוזיליה, בולגרית, זיתים שחורים'
      ],
      hot_sides: [
        'אנטיפסטי מיוחד: פלפלים צבעוניים, בטטה, עגבניות שרי, גזר וקישואים',
        'מיקס גבינות שמנת ומטבלים, טפנד זיתים, ממרח עגבניות ופסטו'
      ],
      desserts: [
        'מגש מעוצב של פירות העונה', 'כוסות קינוח בטעמים מיוחדים',
        'קוביות עוגות מיוחדות: שוקולד, גבינה פירורים, טריקולד ועוד'
      ]
    }
  }),

  bundle({
    id: 'menu-50-guests',
    name: { he: 'תפריט 50 אורחים', en: 'Menu for 50 Guests', fr: 'Menu pour 50 Invités' },
    totalPrice: 5300,
    guests: 50,
    sourceUrl: 'https://www.madany-ori.co.il/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-50-%D7%90%D7%99%D7%A9/',
    categories: {
      main_courses: [
        'פטריות פורטובלו במילוי גבינות פסטו וטחינה גולמית בתנור', 'מיקס מטוגנים פרווה - קובה פטריות ופסטלים',
        'נתחי פילה סלמון טרי ברוטב שף', 'מיני קישים במבחר טעמים: בטטה, ברוקולי, בצל, ים תיכוני',
        'פרחי ברוקולי בציפוי פריך אפוי בתנור', 'לזניה תרד גבינות וזיתים שחורים ברוטב עגבניות'
      ],
      starters: [
        'ברוסקטות בזילוף שמנת וגבינת בוטיק', "סנדויץ' תוניסאי ביצה קשה טונה אריסה וירקות",
        'קוראסון במילוי אבוקדו וסלמון'
      ],
      salads: [
        'סלט בטטה עשיר: חסות, נבטי חמנייה, בולגרית ובטטה בשילוב מיקס פיצוחים',
        'סלט חסות ונבטי חמנייה עם עגבניות שרי, כדורי מוצרלה, אגוזי מלך קלויים',
        'סלט יווני עשיר: עגבניות, מלפפון, בצל סגול, פטרוזיליה, בולגרית, זיתים שחורים', 'סלט טאבולה בכוסות',
        'מיקס סלטים (7 סוגים): טונה, אבוקדו, פלפל קלוי, חציל תאילנדי, גזר מגורד, חציל יווני, קוביות סלק'
      ],
      hot_sides: [
        'אנטיפסטי מיוחד: פלפלים צבעוניים, בטטה, עגבניות שרי, גזר וקישואים',
        'מיקס גבינות שמנת ומטבלים, טפנד זיתים, ממרח עגבניות ופסטו',
        'מיקס חמוצים מיוחדים (4 סוגים): זית סורי שבור, קלמטה, זית מרוקאי וזית יווני'
      ],
      desserts: [
        'מגש מעוצב של פירות העונה', 'כוסות קינוח בטעמים מיוחדים',
        'קוביות עוגות מיוחדות: שוקולד, גבינה פירורים, טריקולד ועוד'
      ]
    }
  })
];

const alaCarteAddons = [
  // מגשי כריכים (sandwich trays)
  ['ברוסקטות בזילוף שמנת וגבינת בוטיק (35 יח\')', 220, 'sandwiches_trays'],
  ['כריך מלחם קסטן במילוי משתנה (12 יח\')', 220, 'sandwiches_trays'],
  ["פוקצות פסטו פלפל קלוי ובולגרית (18 יח')", 210, 'cheese_bread_savory'],
  ['פריקסה ביצה קשה טונה אריסה וירקות (15 יח\')', 280, 'sandwiches_trays'],
  ['מופלטות במילוי משתנה (24 יח\')', 260, 'sandwiches_trays'],
  ['מיני פיתה סביח (35 יח\')', 220, 'sandwiches_trays'],
  ['מיקס לחמניות ביס במילוי טונה וגבינות (25 יח\')', 300, 'sandwiches_trays'],
  ['טורטיות בטעם תרד במילוי משתנה (24 יח\')', 240, 'sandwiches_trays'],
  ['קוראסון במילוי משתנה (15 יח\')', 220, 'sandwiches_trays'],
  ['פחזניות בזילוף מוס טונה (36 יח\')', 240, 'sandwiches_trays'],
  ['טורטיות בטעם עגבניות במילוי משתנה (24 יח\')', 240, 'sandwiches_trays'],
  ['מבחר לחמים דגנים (מגש)', 25, 'cheese_bread_savory'],
  ['טורטיות חציל גבינה מלוחה וירקות (24 יח\')', 240, 'sandwiches_trays'],
  // סלטים / ירקות
  ['סלט קפרזה (מגש)', 200, 'salads'], ['סלט יווני (מגש)', 200, 'salads'],
  ['סלט קינואה פיצוחים עשיר (20 כוסות אישיות)', 200, 'salads'],
  ['סלט טאבולה רענן (20 כוסות אישיות)', 200, 'salads'], ['סלט חסות שרי (מגש)', 200, 'salads'],
  ['מגש ירקות הגינה', 170, 'fruit_veg'], ['מיקס מטבלים (מגש)', 200, 'salads'],
  ['מיקס סלטים (מגש)', 200, 'salads'], ['אנטיפסטי (מגש)', 200, 'fruit_veg'],
  ['מגש פירות העונה מעוצב', 320, 'fruit_veg'], ['סלט סלרי תפוז נענע ובצל ירוק (20 כוסות אישיות)', 200, 'salads'],
  ['סלט סלרי (מגש)', 200, 'salads'], ['מיקס חמוצים (מגש)', 90, 'salads'],
  // גבינות
  ['מיקס גבינות שמנת (מגש)', 200, 'cheese_bread_savory'], ['גבינות בוטיק מעוצב (מגש)', 260, 'cheese_bread_savory'],
  // דגים
  ['שושני סלמון מעוצב (מגש)', 380, 'deli_counter'], ['דגים מעושנים מעוצב (מגש)', 280, 'deli_counter'],
  ['פילה לברק ברוטב לימון שום שמן זית וכוסברה (12 יח\')', 380, 'hot_food'],
  ['נתחי סלמון ברוטב שף (18 יח\')', 400, 'hot_food'],
  ['פילה מושט ברוטב מזרחי (12 יח\')', 380, 'hot_food'],
  ['שיפודי סלמון בקראסט שומשום בשילוב טריאקי וסויה (24 יח\')', 450, 'hot_food'],
  // מאפים מלוחים / קישים
  ['מיקס בורקסים מיני בטעמים: פריך, עלים, תפו"א, פטריות (60 יח\')', 260, 'quiches_pies_burekas'],
  ['מגש סברינות מיני (24 יח\')', 300, 'quiches_pies_burekas'],
  ['מיני פיציות אישיות (30 יח\')', 220, 'quiches_pies_burekas'],
  ['מיקס מיני קיש בטעמים (34 יח\')', 320, 'quiches_pies_burekas'],
  // חמים
  ['פסטה ניוקי בתוספת שום עלי מנגולד ובזיליקום (מגש)', 380, 'hot_food'],
  ['לזניה ברוטב איטלקי עלי מנגולד וגבינות (מגש)', 380, 'hot_food'],
  ["כדורי ארנצ'יני - כדורי אורז וגבינה (38 יח')", 380, 'hot_food'],
  ['פסטה טורטליני במילוי גבינה ברוטב רוזה (מגש)', 380, 'hot_food'],
  ['פטריות פורטובלו בתנור במילוי גבינות ופסטו (20 יח\')', 380, 'hot_food'],
  ['פסטה פנה פסטו (מגש)', 300, 'hot_food'],
  ['פסטה פנה ברוטב עגבניות עשיר ובזיליקום (מגש)', 300, 'hot_food'],
  ['פסטה פנה ברוטב שמנת פטריות (מגש)', 300, 'hot_food'],
  ['חביתיות ירק עיגה (30 יח\')', 220, 'hot_food'], ['לביבות לטקס תפו"א (30 יח\')', 220, 'hot_food'],
  ['מיקס מטוגנים (40 יח\')', 200, 'hot_food'],
  ['מיני אגרול בצורת טיפות במילוי ירקות (60 יח\')', 300, 'hot_food'],
  ['פרחי כרובית בציפוי פריך אפוי בתנור (40 יח\')', 260, 'hot_food'],
  ['פרחי ברוקולי בציפוי פריך בתנור (40 יח\')', 260, 'hot_food'],
  ['שקשוקת הבית בתוספת פלפלים, ברוקלי וכדורי מוצרלה (מגש)', 220, 'hot_food'],
  ['מיקס ממולאים כרוב, בצל ועלי גפן (80-90 יח\')', 380, 'hot_food'],
  ['תפו"א מוקרם בתנור ברוטב שמנת פטריות (מגש)', 360, 'hot_food'],
  // מתוקים
  ['מגש מקרונים צבעוניים פרווה (50 יח\')', 320, 'desserts_sweets'],
  ['מגש מיני פאי שוקולד ולימון מרנג פרווה (36 יח\')', 280, 'desserts_sweets'],
  ['מגש מיני אקלרים (28 יח\')', 280, 'desserts_sweets'],
  ['מגש כוסות קינוח בטעמים (30 כוסות אישיות)', 300, 'desserts_sweets'],
  ['מגש מיקס מאפים מתוקים (30 יח\')', 280, 'desserts_sweets']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'קטלוג מגשי אירוח (לפי מגש/יחידה)', en: 'Hospitality Tray Catalog (Per-Tray/Unit)', fr: "Catalogue de Plateaux (à l'Unité)" },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.madany-ori.co.il/%D7%9E%D7%92%D7%A9%D7%99-%D7%90%D7%99%D7%A8%D7%95%D7%97-%D7%97%D7%9C%D7%91%D7%99/',
  addons: alaCarteAddons.map(([he, amount, categoryId]) => ({
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
  const photo1 = await uploadOne('photo1.png', 'image/png');
  const photo2 = await uploadOne('photo2.png', 'image/png');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'מעדני אורי ובניו',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'מעדני אורי ובניו - קייטרינג חלבי כשר למהדרין בירושלים, פועלים משנת 1975 משוק מחנה יהודה. תפריטים חלביים עשירים המבוססים על גבינות איכות, ירקות טריים, מאפים בעבודת יד וקינוחים מרהיבים, לכל סוגי האירועים - מאירוע משפחתי קטן ועד כנס גדול של עשרות ומאות משתתפים.',
      en: 'Madany Ori ve-Banav - kosher mehadrin dairy catering in Jerusalem, operating since 1975 out of the Machane Yehuda market. Rich dairy menus built on quality cheeses, fresh vegetables, handmade pastries and stunning desserts, for every type of event - from a small family gathering to a large conference of dozens or hundreds of participants.',
      fr: "Madany Ori ve-Banav - traiteur laitier cacher mehadrin à Jérusalem, en activité depuis 1975 depuis le marché Machané Yehouda. Des menus lactés riches, basés sur des fromages de qualité, des légumes frais, des pâtisseries artisanales et des desserts somptueux, pour tout type d'événement - d'une petite réunion de famille à une grande conférence de dizaines ou centaines de participants."
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'מחנה יהודה 18, ירושלים',
    kashrutLevels: ['mehadrin'],
    cateringTypes: ['dairy'],
    maxGuests: 300,
    priceFrom: 106, // real: cheapest published per-guest bundle rate (50-guest menu, 5,300/50)
    packages: [...packages, alaCartePackage],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'henna', 'celebration'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts'],
    services: ['vegetarian_food'],
    phone: '+972-53-9419440',
    whatsapp: '+972539419440',
    email: 'yosimiz69@gmail.com',
    website: 'https://www.madany-ori.co.il/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, ${packages.length} priced bundles, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
