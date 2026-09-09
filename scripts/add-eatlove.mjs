// One-off script: adds "Eat & Love" as a new, pre-approved caterer, sourced from its own website
// https://www.eat-love.co.il/ - a boutique dairy+meat caterer run by יאנה (Yana), based in Or
// Yehuda, serving private events up to 120 guests (real figure - "אירועים פרטיים עד 120 איש").
// 2 real photos are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention). No `logo` is set - the site's only
// logo asset renders as low-contrast white-on-white text when composited onto a white background,
// same issue as protamar's/mozzarela's/artaste's logos in earlier scripts.
//
// The site's two written formula menus ("תפריט בשרי" / "תפריט חלבי") list dish names only, no
// prices anywhere - not modeled as packages here. Its two "מגשי אירוח" (hosting tray) pages DO
// publish real per-tray prices though (36 unique priced meat-tray items + 37 unique priced
// dairy-tray items, after removing exact name+price duplicates shared by both pages, e.g. "פלטות
// ירקות מעוצבות + 2 מטבלים" at ₪95 on both). Modeled as two separate a_la_carte packages (one per
// cateringType), same convention as e.g. scripts/add-eventop.mjs uses cateringTypes:['meat',
// 'dairy'] for a caterer offering both. Prices are stated to exclude VAT ("המחירים באתר אינם
// כוללים מע\"מ") - kept as published, unmodified.
//
// No kashrut certification of any kind is published anywhere on the site (no linked certificate,
// no named supervising body/rabbi in any page text) - kashrutLevels is left empty per this
// directory's established policy of never inferring an unstated kashrut claim.
//
// Usage: node --env-file=.env.local scripts/add-eatlove.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/eatlove-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const MEAT_PRODUCTS = [
  ['פלטות ירקות מעוצבות + 2 מטבלים', 95, 'fruit_veg'], ["2 סוגי סלטים בכוסות אישיות (30 יח')", 195, 'salads'],
  ['דואט תפוחי אדמה ובטטה', 145, 'hot_food'], ['פלטת אנטיפסטי מירקות שורש', 145, 'fruit_veg'],
  ["לביבות ירק במגוון טעמים (20 יח')", 155, 'hot_food'], ['מגש שקשוקה אדומה / ירוקה (15 ביצים)', 200, 'hot_food'],
  ["כריכונים (24 יח')", 205, 'sandwiches_trays'], ["כריכונים (12 יח')", 125, 'sandwiches_trays'],
  ["מיני טורטיות במילויים שונים (24 יח')", 205, 'sandwiches_trays'], ["מיני טורטיות במילויים שונים (12 יח')", 125, 'sandwiches_trays'],
  ["סביח (24 יח')", 205, 'sandwiches_trays'], ["סביח (12 יח')", 125, 'sandwiches_trays'],
  ["חצאי טורטיות עם שוארמה ביתית (20 יח')", 285, 'sandwiches_trays'], ["נשנושי \"משה בתיבה\" (20 יח')", 145, 'hot_food'],
  ["פחזניות במילוי פטה כבד (20 יח')", 225, 'deli_counter'], ["טארטלטים במגוון מילויים (24 יח')", 205, 'quiches_pies_burekas'],
  ['פלטת נקניקים ופסטרמות מגוונים', 355, 'deli_counter'], ['פלטת דגים מכל טוב', 355, 'deli_counter'],
  ['סלסלת לחמים ביתיים עם מטבלים וממרחים', 145, 'cheese_bread_savory'], ["שיפודי פרגיות (20 יח')", 265, 'hot_food'],
  ["קבבוני טלה / עראיס בשר / עראיס דגים (20 יח')", 265, 'hot_food'], ["שיפודי סלומון (20 יח')", 325, 'hot_food'],
  ["לחמניות באן עם אסאדו מפורק / סלומון מפורק (20 יח')", 285, 'sandwiches_trays'], ['2 רולדות בשר ופטריות', 185, 'hot_food'],
  ['סלט קינואה / טבולה / עדשים שחורים (2 ליטר)', 155, 'salads'],
  ['עגבניות שרי עם צנוברים ובזיליקום / עגבניות שרי פיקנטי (2 ליטר)', 155, 'salads'],
  ['ירקות שורש / כרוב אסיאתי / כרוב עם סלרי וחמוציות (2 ליטר)', 155, 'salads'], ['סלט פסטה קר / ירקות פטוש (2 ליטר)', 155, 'salads'],
  ['עלי בייבי עם פירות ופיצוחים / חסות עם בצל ברוטב הבית (2 ליטר)', 155, 'salads'],
  ['קרפציו סלק / חציל קלוי עם טחינה גולמית וסילאן', 95, 'salads'], ["מטבעות תמרים ואגוזים (30 יח')", 135, 'desserts_sweets'],
  ['רולדות שמרים / עלים במגוון מילויים / עוגות בחושות (ליחידה)', 40, 'cakes'],
  ["מגש עוגיות שקדים כ-20 יח' (ללא גלוטן)", 135, 'cookies_pastries'], ['מגש פירות מעוצבים', 355, 'fruit_veg'],
  ["פרלינים שוקולד (20 יח')", 145, 'desserts_sweets']
];

const DAIRY_PRODUCTS = [
  ['פלטות ירקות מעוצבות + 2 מטבלים', 95, 'fruit_veg'], ["מגש חצילים ופלפלים קלוים עם גבינות (24 יח')", 155, 'cheese_bread_savory'],
  ["2 סוגי סלטים בכוסות אישיות (30 יח')", 195, 'salads'], ["כריכונים חלביים / חצאי בייגלה (24 יח')", 205, 'sandwiches_trays'],
  ["כריכונים חלביים / חצאי בייגלה (12 יח')", 125, 'sandwiches_trays'], ["מיני טורטיות במילויים שונים (24 יח')", 205, 'sandwiches_trays'],
  ["מיני טורטיות במילויים שונים (12 יח')", 125, 'sandwiches_trays'], ["טארטלטים במגוון מילויים (24 יח')", 205, 'quiches_pies_burekas'],
  ["סביח (24 יח')", 205, 'sandwiches_trays'], ["סביח (12 יח')", 125, 'sandwiches_trays'],
  ["מיני קישים במילויים שונים (24 יח')", 205, 'quiches_pies_burekas'], ["מיני קישים במילויים שונים (12 יח')", 125, 'quiches_pies_burekas'],
  ["מאפה פילו עם בטטה וגבינה (24 יח')", 205, 'quiches_pies_burekas'], ["מאפה פילו עם בטטה וגבינה (12 יח')", 125, 'quiches_pies_burekas'],
  ["שבלולי בצק עלים במגוון מילויים (24 יח')", 215, 'quiches_pies_burekas'], ["מגש מיני פיצות כ-20 יח'", 145, 'quiches_pies_burekas'],
  ['פלטת אנטיפסטי מירקות שורש', 145, 'fruit_veg'], ['דואט תפוחי אדמה ובטטה', 145, 'hot_food'],
  ["לביבות ירק במגוון טעמים (20 יח')", 155, 'hot_food'], ['שקשוקה אדומה / ירוקה (15 ביצים)', 200, 'hot_food'],
  ['פלטת גבינות קשות ורכות', 355, 'cheese_bread_savory'], ['פלטת דגים מכל טוב', 355, 'deli_counter'],
  ['סלסלת לחמים ביתיים עם מטבלים וממרחים', 145, 'cheese_bread_savory'], ["שיפודי סלמון (20 יח')", 325, 'hot_food'],
  ["סביצ'ה דג על מצע ברוסקטה (20 יח')", 295, 'deli_counter'], ['סלט קינואה / טבולה / עדשים שחורים (2 ליטר)', 155, 'salads'],
  ['עגבניות שרי עם צנוברים ובזיליקום / סלט קפרזה (2 ליטר)', 155, 'salads'],
  ['ירקות שורש / כרוב אסיאתי / כרוב עם סלרי וחמוציות (2 ליטר) (חלבי)', 155, 'salads'],
  ['סלט פסטה קר / סלט יווני (2 ליטר)', 155, 'salads'], ['עלי בייבי עם פירות ופיצוחים / חסות עם בצל ברוטב הבית (2 ליטר) (חלבי)', 155, 'salads'],
  ['קרפציו סלק עם גבינת רוקפור ואגוזי מלך / חציל קלוי עם טחינה גולמית וסילאן', 95, 'salads'],
  ["מגש כוסיות מוזלי עם סלט פירות וגרנולה ביתית (20 יח')", 145, 'desserts_sweets'], ["קרמשניט (20 יח')", 135, 'cakes'],
  ["פחזניות (20 יח')", 135, 'desserts_sweets'], ["מטבעות תמרים ואגוזים (30 יח')", 135, 'desserts_sweets'],
  ["מגש קינוחי כוסות (20 יח')", 155, 'desserts_sweets'], ["מגש קינוחי כוסות (30 יח')", 225, 'desserts_sweets'],
  ['רולדות שמרים / עלים במגוון מילויים / עוגות בחושות (ליחידה)', 40, 'cakes'],
  ["מגש עוגיות שקדים כ-20 יח' (ללא גלוטן)", 135, 'cookies_pastries'], ["מגש ריבועי בראוניז כ-20 יח'", 135, 'desserts_sweets'],
  ['מגש פירות מעוצבים', 355, 'fruit_veg'], ["פרלינים שוקולד (20 יח')", 145, 'desserts_sweets']
];

function buildPackage(id, nameHe, nameEn, nameFr, sourceUrl, products) {
  return {
    id,
    type: 'a_la_carte',
    name: { he: nameHe, en: nameEn, fr: nameFr },
    pricePerGuest: '',
    minGuests: '',
    includedCategories: [],
    categoryLimits: {},
    categoryItems: {},
    eventTypes: [],
    sourceUrl,
    addons: products.map(([he, amount, categoryId]) => ({
      id: nanoid(8),
      name: { he, en: '', fr: '' },
      priceType: 'flat',
      amount: String(amount),
      categoryId
    }))
  };
}

const meatPackage = buildPackage(
  'meat-hosting-trays',
  'מגשי אירוח בשרי (קטלוג)',
  'Meat Hosting Trays (Catalog)',
  'Plateaux de Réception Carnés (Catalogue)',
  'https://www.eat-love.co.il/%d7%9e%d7%92%d7%a9%d7%99-%d7%90%d7%99%d7%a8%d7%95%d7%97/',
  MEAT_PRODUCTS
);
const dairyPackage = buildPackage(
  'dairy-hosting-trays',
  'מגשי אירוח חלביים (קטלוג)',
  'Dairy Hosting Trays (Catalog)',
  'Plateaux de Réception Lactés (Catalogue)',
  'https://www.eat-love.co.il/%d7%9e%d7%92%d7%a9%d7%99-%d7%90%d7%99%d7%a8%d7%95%d7%97-2/',
  DAIRY_PRODUCTS
);

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const photo2 = await uploadOne('photo2.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'Eat & Love',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'Eat & Love - קייטרינג בוטיק בתפירה אישית, בניהולה של יאנה, המתמחה באירועים פרטיים עד 120 איש - מסיבות רווקים/ות, חתונות קטנות, שבת חתן, אירועי חינה, ברית/ה וימי הולדת עגולים. מציעים תפריטי קייטרינג חלביים ובשריים וכן מגשי אירוח לאירועים עסקיים, עם דגש על איכות חומרי הגלם ויחס אישי.',
      en: "Eat & Love - boutique, personally-tailored catering run by Yana, specializing in private events for up to 120 guests - bachelor/bachelorette parties, small weddings, groom's Shabbat, henna ceremonies, brit milah and milestone birthdays. Offers both dairy and meat catering menus as well as hosting trays for business events, with an emphasis on ingredient quality and personal attention.",
      fr: "Eat & Love - traiteur boutique sur mesure, dirigé par Yana, spécialisé dans les événements privés jusqu'à 120 invités - enterrements de vie de garçon/jeune fille, petits mariages, Chabbat Hatan, cérémonies de henné, brit mila et anniversaires marquants. Propose des menus traiteur lactés et carnés ainsi que des plateaux de réception pour événements professionnels, avec un accent sur la qualité des ingrédients et un service personnalisé."
    },
    districts: ['center', 'telaviv'],
    city: { he: 'אור יהודה', en: 'Or Yehuda', fr: 'Or Yehuda' },
    address: 'חרמון, אור יהודה',
    kashrutLevels: [], // no kashrut certification published anywhere on the site - see header comment
    cateringTypes: ['dairy', 'meat'],
    maxGuests: 120, // real, explicit: "אירועים פרטיים עד 120 איש"
    priceFrom: '', // no per-guest/per-event pricing published, only per-tray shop prices (see a_la_carte packages)
    packages: [meatPackage, dairyPackage],
    eventTypes: ['wedding', 'shabbat_chatan', 'henna', 'brit', 'celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-54-5582181',
    whatsapp: '+972545582181',
    email: 'info@eat-love.co.il',
    website: 'https://www.eat-love.co.il/',
    instagram: '',
    facebook: '',
    logo: '', // site's only logo asset renders low-contrast white-on-white - see header comment
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, 2 photos, and 2 a_la_carte catalogs (${meatPackage.addons.length + dairyPackage.addons.length} items total).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
