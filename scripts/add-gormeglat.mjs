// One-off script: adds "קייטרינג גורמה גלאט" (Gorme Glat Catering) as a new, pre-approved
// caterer, sourced from its own website https://www.gormeglat.co.il/ and its GetMood.io-powered
// storefront https://shop.gormeglat.co.il/ - a meat caterer with two branches (Netanya and Kfar
// Yona). Logo + 2 real product photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Every item has a REAL published price, scraped from the shop's two live order pages - "אוכל
// מוכן לשבת וסופ\"ש" (Shabbat/weekend ready-food, /shop/weekend - 117 items across Holiday Meal,
// Salads, Fish, Meat, Sides, Specials, Vegetarian, Wine and Desserts sections) and "הזמנות
// לעסקים" (weekday business orders, /shop/middle-week - 38 items across schnitzel-bread meals,
// plate meals, French baguette meals, desserts, soft drinks and beer). A handful of items share
// the same Hebrew name across the two pages at different prices (e.g. "חזה עוף על האש" at ₪30 as
// a weekend side vs. ₪60 as a full business plate meal) - both real listings are kept as separate
// catalog entries, same convention as scripts/add-tmarim-alacarte-trays.mjs. Modeled as one
// a_la_carte package.
//
// kashrutLevels is real, from the site's own homepage text and its linked kashrut badge image:
// "קייטרינג בשרי כשר למהדרין בד\"ץ יורה דעה, בהשגחת הרב מחפוד" (meat kosher mehadrin, Badatz
// "Yoreh Deah", under the supervision of Rabbi Shlomo Machpud) - maps directly onto the real
// `badatz_rav_machpud` KASHRUT_LEVELS entry, plus `mehadrin` per the explicit "כשר למהדרין" claim.
//
// Usage: node --env-file=.env.local scripts/add-gormeglat.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/gormeglat-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  // ארוחת חג (Holiday Meals)
  ['ארוחת ראש השנה', 130, 'hot_food'],
  // סלטים (Salads)
  ['כבד קצוץ', 20, 'deli_counter'], ['סלט אטריות שעועית', 20, 'salads'], ['סלט פטריות מוקפצות', 20, 'salads'],
  ['סלט וולדורף', 20, 'salads'], ['חציל סיני עם שומשום קלוי', 20, 'salads'], ['סלט פלפלים צבעוני קלוי', 20, 'salads'],
  ['סלט סלק חי, סלרי וחמוציות', 20, 'salads'], ['קוביות חציל בטחינה', 14, 'salads'], ['גזר מרוקאי', 14, 'salads'],
  ['מלפפון בשמיר', 14, 'salads'], ['כרוב צבעוני', 13, 'salads'], ['חומוס ביתי', 14, 'deli_counter'],
  ['טחינה לבנה', 14, 'deli_counter'], ['מטבוחה ביתית', 20, 'salads'], ['סלט ביצים', 16, 'salads'],
  ['מקלוני גזר', 14, 'fruit_veg'], ['חציל יווני', 14, 'salads'], ['כרוב לבן', 16, 'salads'], ['מסייר', 14, 'salads'],
  ['כרוב אסיאתי', 16, 'salads'], ['סלק מרוקאי', 14, 'salads'], ['משאוויה', 19, 'salads'], ['טאבולה', 14, 'salads'],
  ['כרוב אדום', 16, 'salads'],
  // דגים (Fish)
  ['ראש קרפיון', 25, 'deli_counter'], ['גפילטע ממולא', 10, 'deli_counter'], ["פילה לברק צ'רמלה", 37, 'hot_food'],
  ['גפילטע פיש (4 יח\')', 30, 'deli_counter'], ['קציצות דג ברוטב מרוקאי', 50, 'hot_food'],
  ['סטייק סלמון ברוטב ברביקיו', 40, 'hot_food'], ['סלמון ברוטב דבש ולימון', 38, 'hot_food'],
  ['סלמון ביין לבן וסילאן', 38, 'hot_food'], ['דג מרוקאי', 28, 'hot_food'], ['פילה מושט בעשבי תיבול', 31, 'hot_food'],
  ['פילה מרלוזה מטוגן', 16, 'hot_food'],
  // בשרים (Meat)
  ['לשון ברוטב פטריות וערמונים', 75, 'hot_food'], ["בריסקט ברוטב צ'ימיצ'ורי", 75, 'hot_food'], ['פסטיה', 22, 'hot_food'],
  ['כבד עוף עם בצל מקורמל', 52, 'deli_counter'], ['קציצות עוף עם ארטישוק, כוסברה ואפונה', 50, 'hot_food'],
  ['שיפודי פרגית בטריאקי (4 יח\')', 54, 'hot_food'], ['פרגית בדבש ורוזמרין (2 יח\')', 54, 'hot_food'],
  ['מוקפץ עוף בחלב קוקוס', 61, 'hot_food'], ['מוקפץ עוף בצ\'ילי ואננס', 61, 'hot_food'],
  ['כרעיים עוף בפירות יבשים', 31, 'hot_food'], ["שניצל צ'ונגו", 58, 'hot_food'], ['שניצל עוף XL', 28, 'hot_food'],
  ['כרעיים בצלייה ארוכה', 31, 'hot_food'], ['מאפה בשר', 22, 'quiches_pies_burekas'], ['חזה עוף על האש', 30, 'hot_food'],
  ['פרגית על האש (2 יח\')', 54, 'hot_food'], ['פרגית ממולאת', 42, 'hot_food'], ['ארטישוק ממולא', 40, 'hot_food'],
  ['מוסקה', 24, 'hot_food'], ['פלפל ממולא', 20, 'hot_food'], ['מפרום טריפוליטאי', 24, 'hot_food'],
  ['טביחה בסלק מקורית', 61, 'hot_food'], ['שווארמה פרגית', 85, 'hot_food'], ["צלי בקר מס' 6 ברוטב פטריות", 75, 'hot_food'],
  ["צלי כתף מס' 5 ברוטב פטריות", 106, 'hot_food'], ['אסאדו מתקתק בליווי בצלים', 106, 'hot_food'],
  ['בקר בסצ\'ואן', 61, 'hot_food'], ['קובה סלק', 42, 'hot_food'],
  // תוספת (Sides)
  ['ספגטי טוסקנה', 27, 'hot_food'], ['מרק בטטה', 25, 'hot_food'], ['תפוח אדמה שום שמיר', 27, 'hot_food'],
  ['פירה', 27, 'hot_food'], ['גזר צימעס', 27, 'hot_food'], ['רטטוי', 27, 'hot_food'], ['אור אשפלאו בשרי', 31, 'hot_food'],
  ['אורז אטריות', 27, 'hot_food'], ['אורז טנזיה', 28, 'hot_food'], ['מרק ירקות לקוסקוס', 23, 'hot_food'],
  ['קוסקוס', 30, 'hot_food'], ['זיתים מרוקאים ברוטב עגבניות', 34, 'fruit_veg'], ['תבשיל אפונה וארטישוק', 26, 'hot_food'],
  ['אנטיפסטי', 34, 'fruit_veg'], ['פסטה', 27, 'hot_food'], ['שעועית ירוקה עדינה', 27, 'hot_food'],
  ['קוביות בטטה צלויות', 27, 'hot_food'], ['תפו"א אפוי קוביות', 27, 'hot_food'], ['תפו"א אנה פרוס', 27, 'hot_food'],
  ['תפו"א פריזיאן', 27, 'hot_food'], ['אורז סיני', 27, 'hot_food'], ['אורז צהוב', 27, 'hot_food'],
  ['נודלס אסיאתי', 31, 'hot_food'], ['אורז לבן מאודה', 24, 'hot_food'], ['אורז פיצוחים בעשבי תיבול', 27, 'hot_food'],
  // מיוחדים (Specials)
  ['חלת כוסמין', 20, 'cheese_bread_savory'], ['רוזטה עם סוכר', 39, 'cheese_bread_savory'],
  ['רוזטה ללא סוכר', 38, 'cheese_bread_savory'], ['מיקס מטוגנים בשרי', 45, 'hot_food'],
  ['מיקס מטוגנים פרווה', 45, 'pareve_vegan_no_sugar'], ['מאפה בצק עלים במילוי בשר', 22, 'quiches_pies_burekas'],
  ['טורטיה במילוי בשר ועשבים', 20, 'sandwiches_trays'], ['סט 6 לחמניות קשר', 14, 'cheese_bread_savory'],
  ["חלת ויז'ניץ", 20, 'cheese_bread_savory'],
  // צמחוני (Vegetarian)
  ['רול פילו במילוי ירקות', 20, 'quiches_pies_burekas'], ['פלפל ממולא צמחוני', 20, 'pareve_vegan_no_sugar'],
  ['קיש בצלים', 36, 'quiches_pies_burekas'], ['קיש פטריות', 36, 'quiches_pies_burekas'], ['קיגל ירושלמי', 36, 'hot_food'],
  // יין (Wine)
  ['יין תירוש', 20, 'drinks'], ['רוזה אימפרסן', 60, 'drinks'], ["אינספייר דבוקי גוורצטמינר טפרברג", 70, 'drinks'],
  ['אסנס שרדונה טפרברג', 75, 'drinks'], ['אינספייר מלבק מרסלן טפרברג', 70, 'drinks'], ['אסנס קברנה טפרברג', 105, 'drinks'],
  ['פסגות קברנה סוביניון', 89, 'drinks'], ['פסגות שרדונה', 75, 'drinks'], ['פסגות גוורצטמינר', 65, 'drinks'],
  ['פסגות פיק', 155, 'drinks'], ['פסגות סיני', 75, 'drinks'], ['פסגות מרלו', 99, 'drinks'], ['פסגות אדום', 115, 'drinks'],
  // קינוחים (Desserts)
  ['עוגיות שוקולד מתפוצצות (10 יח\')', 25, 'cookies_pastries'], ['כדורי שוקולד (10 יח\')', 25, 'desserts_sweets'],
  ['בראוניז (8 יח\')', 25, 'desserts_sweets'], ['מקרונים (6 יח\')', 25, 'cookies_pastries'],
  // --- weekday business menu (shop.gormeglat.co.il/shop/middle-week) ---
  ['חלת שניצל עולמית', 45, 'sandwiches_trays'],
  ['חזה עוף על האש (מנה עסקית)', 60, 'hot_food'], ['דג מרוקאי (מנה עסקית)', 60, 'hot_food'],
  ['רצועות עוף מוקפצים', 60, 'hot_food'], ['הקבב שלנו', 60, 'hot_food'],
  ['אסאדו רך במיוחד מתקתק מהמעשנה', 75, 'hot_food'], ['פרגית אסייאתית על האש', 60, 'hot_food'],
  ['דג סלמון ברוטב עשבי תיבול', 60, 'hot_food'], ['צלי כתף (מנה עסקית)', 75, 'hot_food'], ['שניצל', 60, 'hot_food'],
  ['פרגית על האש (מנה עסקית)', 60, 'hot_food'], ['כרע עוף', 60, 'hot_food'], ['הקבב שלנו (2)', 60, 'hot_food'],
  ['שווארמה טורקית', 60, 'hot_food'],
  ['עוגיות שוקולד מתפוצצות (עסקית)', 25, 'cookies_pastries'], ['מקרונים צבעוניים (עסקית)', 25, 'cookies_pastries'],
  ['כדורי שוקולד (עסקית)', 30, 'desserts_sweets'], ['מיני בראוניז', 30, 'desserts_sweets'],
  ['אסאדו מהמעשנה (בגט)', 70, 'sandwiches_trays'], ['חזה עוף על הגריל (בגט)', 50, 'sandwiches_trays'],
  ['הקבב שלנו (בגט)', 50, 'sandwiches_trays'], ['שניצל קריספי (בגט)', 50, 'sandwiches_trays'],
  ['שווארמה טורקית (בגט)', 47, 'sandwiches_trays'], ['חלת שניצל עולמית (בגט)', 45, 'sandwiches_trays'],
  ['פרגית אסייאתית על האש (בגט)', 50, 'sandwiches_trays'],
  ['נביעות 500 מ"ל', 9, 'drinks'], ['פריגת אשכוליות', 10, 'drinks'], ['פריגת ענבים', 10, 'drinks'],
  ['דיאט ספרייט', 10, 'drinks'], ['קולה זירו', 10, 'drinks'], ['מאלטי בירה שחורה', 11, 'drinks'],
  ['סודה אישי', 9, 'drinks'], ['פריגת תפוזים', 10, 'drinks'], ['נסטי', 10, 'drinks'], ['ספרייט', 10, 'drinks'],
  ['קוקה קולה', 10, 'drinks'], ['טובורג רד 330 מ"ל', 15, 'drinks'], ['קרלסברג 330 מ"ל', 15, 'drinks']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'אוכל מוכן וקטלוג עסקיות (קטלוג חנות)', en: 'Ready Food & Business Meals (Shop Catalog)', fr: 'Plats Préparés et Menus Affaires (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://shop.gormeglat.co.il/shop/weekend',
  addons: PRODUCTS.map(([he, amount, categoryId]) => ({
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
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const photo2 = await uploadOne('photo2.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג גורמה גלאט',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג גורמה גלאט - חברת קייטרינג בשרי וותיקה עם סניפים בנתניה ובכפר יונה, כשר למהדרין בד"ץ יורה דעה בהשגחת הרב שלמה מחפוד. קטלוג עשיר של מאות מנות - סלטים, דגים, בשרים, תוספות, מאפים, יינות ומתוקים - וכן תפריט עסקיות ומנות ליום-יום, המתאים לשבתות, חגים, אירועים משפחתיים ועסקיים.',
      en: "Gorme Glat Catering - a veteran meat catering company with branches in Netanya and Kfar Yona, kosher mehadrin (Badatz Yoreh Deah, under the supervision of Rabbi Shlomo Machpud). A rich catalog of hundreds of dishes - salads, fish, meats, side dishes, pastries, wines and desserts - plus a weekday business-meal menu, suited to Shabbat, holidays, family celebrations and business events.",
      fr: "Gorme Glat Catering - une entreprise de traiteur carné établie de longue date, avec des succursales à Netanya et Kfar Yona, cacher mehadrin (Badatz Yoreh Deah, sous la supervision du Rabbin Shlomo Machpud). Un vaste catalogue de centaines de plats - salades, poissons, viandes, accompagnements, pâtisseries, vins et desserts - ainsi qu'un menu de repas d'affaires en semaine, adapté au Chabbat, aux fêtes, aux célébrations familiales et aux événements professionnels."
    },
    districts: ['center'], // both branches (Netanya, Kfar Yona) are in the Center/Sharon district - no wider delivery area evidenced
    city: { he: 'נתניה', en: 'Netanya', fr: 'Netanya' },
    address: 'אלון צבי 6, נתניה',
    kashrutLevels: ['badatz_rav_machpud', 'mehadrin'], // בד"ץ יורה דעה בהשגחת הרב שלמה מחפוד, כשר למהדרין - see homepage + kashrut badge
    cateringTypes: ['meat'],
    maxGuests: 400, // no figure published - plausible round estimate, unverified
    priceFrom: '', // no per-guest/per-event pricing published, only per-item shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['shabbat_chatan', 'engagement', 'henna', 'brit', 'memorial', 'celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-9-8337720',
    whatsapp: '+972509285999',
    email: 'gormeglat@gmail.com',
    website: 'https://www.gormeglat.co.il/',
    instagram: 'https://www.instagram.com/gormeglat/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
