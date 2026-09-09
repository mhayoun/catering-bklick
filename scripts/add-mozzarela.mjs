// One-off script: adds "קייטרינג מוצרלה" (Mozzarella Catering) as a new, pre-approved caterer,
// sourced from its own website https://mozzarela.co.il/ - a dairy hosting-tray caterer based in
// the Gilboa Industrial Zone (north). 1 real photo is downloaded locally then uploaded to this
// project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention). No
// `logo` is set - the site's only logo asset is a cream-on-white SVG that renders essentially
// invisible on a light background when test-rendered (same issue as protamar's logo in
// scripts/update-tmarim-from-site.mjs).
//
// Every item has a REAL published price - a genuine WooCommerce catalog, the largest found in
// this directory so far (119 unique products across the site's own 8 categories: מאפים ולחמים,
// גבינות ונישנושים, כריכונים, סלטים וירקות, דגים ותבשילים, פסטות, מתוקים, נלווים). Modeled as one
// a_la_carte package, same convention as scripts/add-tmarim-alacarte-trays.mjs and
// scripts/add-pasha.mjs. The site also offers an interactive "build a menu by guest count/service
// style" tool (/תפריטים-מומלצים/) that generates suggestions dynamically rather than publishing
// fixed bundle prices - not scraped here since it requires interactive form selections rather
// than a static page.
//
// kashrutLevels/address are both real, read directly from the site's own linked kashrut
// certificate image: "הרבנות גן-נר" certifies "קייטרינג 'מוצרלה' הממוקם באזור התעשייה גלבוע...
// כשר-חלבי" (Gan Ner Rabbinate, Gilboa Industrial Zone, kosher-dairy), valid until erev Rosh
// Hashana 5787 (11 Oct 2026).
//
// Usage: node --env-file=.env.local scripts/add-mozzarela.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/mozzarela-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  ['קישים', 230, 'quiches_pies_burekas'], ['לזניות', 260, 'hot_food'], ['מיקס לביבות', 220, 'hot_food'],
  ["פוקצות", 180, 'cheese_bread_savory'], ['פיציות', 180, 'quiches_pies_burekas'], ["לחמעג'ון", 220, 'quiches_pies_burekas'],
  ['פרחי פילו', 220, 'quiches_pies_burekas'], ['כדורי גבינה וזיתים', 190, 'cheese_bread_savory'],
  ['מיקס מאפה יווני', 200, 'quiches_pies_burekas'], ['"בורקס" פיצה', 190, 'quiches_pies_burekas'],
  ['כיסוני תרד וגבינות', 220, 'quiches_pies_burekas'], ['קוגל ירושלמי', 210, 'hot_food'],
  ['שניצל תירס', 190, 'hot_food'], ['לחמי מחמצת וממרחים', 160, 'cheese_bread_savory'],
  ['מאפים למביני עניין', 240, 'quiches_pies_burekas'], ["מארז ג'חנון", 280, 'quiches_pies_burekas'],
  ['מארז קובנה', 280, 'quiches_pies_burekas'], ['מאפה בצלים', 260, 'quiches_pies_burekas'],
  ['קרואסון מנצ\'גו', 180, 'cheese_bread_savory'], ['פשטידה מרוקאית (מחמר)', 220, 'quiches_pies_burekas'],
  ['מגש גבינות', 320, 'cheese_bread_savory'], ['דגים מעושנים/כבושים', 290, 'deli_counter'],
  ['מיקס חמוצים (מעדנייה)', 220, 'salads'], ['אנטיפסטי', 220, 'fruit_veg'], ["קרפצ'יו חציל", 180, 'fruit_veg'],
  ['סלק צלוי וגבינת קממבר', 180, 'salads'], ['מגש ירקות טריים', 180, 'fruit_veg'],
  ['כדורי עיזים בפרחים', 280, 'cheese_bread_savory'], ['פחזניות סלמון', 250, 'deli_counter'],
  ['גלילות חציל', 260, 'fruit_veg'], ['פלפל שרי ממולא', 220, 'salads'], ["מיני בוש'ס", 220, 'cheese_bread_savory'],
  ['שיפודי גבינות', 220, 'cheese_bread_savory'], ['שיפודי אנטיפסטי', 240, 'fruit_veg'],
  ['כוסות חציל קלוי', 180, 'salads'], ['כוסות סלק', 180, 'salads'], ['ברוסקטות', 200, 'cheese_bread_savory'],
  ['טארטלטים מלוחים', 280, 'quiches_pies_burekas'], ['לחמניות סלק', 240, 'cheese_bread_savory'],
  ['בריוש צרפתי', 240, 'cheese_bread_savory'], ['סביח', 260, 'sandwiches_trays'], ['כריך פועלים', 220, 'sandwiches_trays'],
  ['המבורגר פורטבלו', 220, 'sandwiches_trays'], ['כרובית בפיתה', 240, 'sandwiches_trays'],
  ['באן "אסאדו"', 250, 'sandwiches_trays'], ['כריך השחר', 180, 'sandwiches_trays'],
  ['המבורגר דגים', 290, 'sandwiches_trays'], ['משה בלחמנייה', 200, 'sandwiches_trays'], ['פריקסה', 220, 'sandwiches_trays'],
  ['טורטיות', 220, 'sandwiches_trays'], ['פרצל - סלט ביצים', 240, 'sandwiches_trays'], ['בורקיטוס', 220, 'sandwiches_trays'],
  ['כריך שישי (שניצל דג)', 260, 'sandwiches_trays'], ['כריך צפתית פטריות', 220, 'sandwiches_trays'],
  ['כריך חביתה', 220, 'sandwiches_trays'], ['שווארמה סלמון', 260, 'sandwiches_trays'],
  ['כריך קרואסון', 220, 'sandwiches_trays'], ["קרואסון צ'ילי", 240, 'sandwiches_trays'],
  ['שווארמה טבעונית', 250, 'pareve_vegan_no_sugar'], ['מיקס כריכונים - ללא גלוטן', 240, 'sandwiches_trays'],
  ['סלט פסטה ארטישוק', 210, 'salads'], ['סלט עגבניות (קפרזה)', 210, 'salads'], ['סלט קינואה', 220, 'salads'],
  ['סלט יווני', 200, 'salads'], ['סלט בטטה', 190, 'salads'], ['סלט שורשים אסייתי', 190, 'salads'],
  ['סלט פסטה', 190, 'salads'], ['סלט עדשים', 190, 'salads'], ['סלט תפוח אדמה מדורה', 220, 'salads'],
  ['סלט חסות', 190, 'salads'], ['סלט אטריות וייטנאמי', 190, 'salads'], ['סלט טאבולה', 190, 'salads'],
  ['סלט נבטים', 190, 'salads'], ['קיסר בצנצנת', 220, 'salads'], ['כרוב בלאדי צלוי', 220, 'salads'],
  ['סושי', 450, 'sushi_specials'], ['נאמס', 240, 'sushi_specials'], ['שקשוקה', 190, 'hot_food'],
  ['דים סאם', 240, 'hot_food'], ['בצלים ממולאים', 220, 'hot_food'], ['עלי גפן ממולאים', 220, 'hot_food'],
  ['רביולי גבינות', 210, 'hot_food'], ['רביולי בטטה ומסקרפונה', 210, 'hot_food'],
  ['רביולי פטריות וריקוטה', 210, 'hot_food'], ['מוקפץ נודלס וירקות', 210, 'hot_food'], ['פסטה בוסיאטה', 200, 'hot_food'],
  ['סופגניות ריבה', 270, 'desserts_sweets'], ['סופגניות שוקולד', 290, 'desserts_sweets'],
  ['סופגניות למתקדמים', 320, 'desserts_sweets'], ["מריטוצו", 240, 'desserts_sweets'], ["ספינג'", 210, 'desserts_sweets'],
  ['בריוש סברינה', 240, 'desserts_sweets'], ['טירמיסו', 260, 'desserts_sweets'], ['סינבון', 220, 'desserts_sweets'],
  ['קראפין מסקרפונה ותותים', 260, 'desserts_sweets'], ['קרם ברולה', 240, 'desserts_sweets'],
  ['הסוף של הטילון', 280, 'desserts_sweets'], ['גליליות פילו דובאי', 360, 'desserts_sweets'],
  ['מיקס עוגיות', 220, 'desserts_sweets'], ['מלבי', 240, 'desserts_sweets'], ['הגרסא שלנו למילקי', 240, 'desserts_sweets'],
  ['פאן סוויס', 250, 'desserts_sweets'], ['קרואסון שקדים', 250, 'desserts_sweets'],
  ['טארטלט לימון - ליים', 240, 'desserts_sweets'], ['טארטלט פירות וטופי', 220, 'desserts_sweets'],
  ['טארטלט שוקולד פרלינה', 240, 'desserts_sweets'], ['מיני פיננסייר', 200, 'desserts_sweets'],
  ['פטיפור גבינה', 250, 'desserts_sweets'], ['מיקס טראפלס', 250, 'desserts_sweets'], ['מגש שוקולדים', 280, 'desserts_sweets'],
  ['כדורי שוקולד', 220, 'desserts_sweets'], ['פחזניות', 240, 'desserts_sweets'], ['בריוש אוכמניות', 200, 'desserts_sweets'],
  ['פבלובה', 260, 'desserts_sweets'], ['מיקס מתוקים - טבעוני', 240, 'pareve_vegan_no_sugar'],
  ['פירות טריים', 320, 'fruit_veg'], ['שוקו/אייס קפה', 35, 'drinks'], ['שתייה טבעית', 25, 'drinks'],
  ['חד"פ מתכלה', 190, 'gifts_packages'], ['קיט ממרחים ועוגיות מלוחות', 360, 'gifts_packages']
];

const alaCartePackage = {
  id: 'hosting-catalog',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח (קטלוג חנות)', en: 'Hosting Trays (Shop Catalog)', fr: 'Plateaux de Réception (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://mozzarela.co.il/%d7%9e%d7%92%d7%a9%d7%99-%d7%90%d7%99%d7%a8%d7%95%d7%97/',
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
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג מוצרלה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג מוצרלה - מגשי אירוח חלביים כשרים, הממוקם באזור התעשייה גלבוע ובבעלות משה כהן. תפריט עשיר של מעל 100 מנות במגוון קטגוריות - מאפים ולחמים, גבינות ונישנושים, כריכונים, סלטים וירקות, דגים ותבשילים, פסטות ומתוקים - עם אפשרויות טבעוניות וללא גלוטן, ומשלוחים לאזורים רבים בארץ.',
      en: 'Mozzarella Catering - kosher dairy hosting trays, located in the Gilboa Industrial Zone and owned by Moshe Cohen. A rich menu of over 100 dishes across many categories - pastries and breads, cheeses and snacks, sandwiches, salads and vegetables, fish and hot dishes, pasta and desserts - with vegan and gluten-free options, and delivery to many regions across the country.',
      fr: "Mozzarella Catering - plateaux de réception lactés cachers, situé dans la zone industrielle de Gilboa et dirigé par Moshe Cohen. Un menu riche de plus de 100 plats dans de nombreuses catégories - pâtisseries et pains, fromages et collations, sandwichs, salades et légumes, poissons et plats chauds, pâtes et desserts - avec des options végétaliennes et sans gluten, et livraison dans de nombreuses régions du pays."
    },
    districts: ['jerusalem', 'center', 'haifa', 'north', 'south'],
    city: { he: 'אזור התעשייה גלבוע', en: 'Gilboa Industrial Zone', fr: 'Zone Industrielle de Gilboa' },
    address: 'אזור התעשייה גלבוע',
    kashrutLevels: ['local_rabbinate'], // הרבנות גן-נר (Gan Ner local rabbinate) - see kashrut certificate
    cateringTypes: ['dairy'],
    maxGuests: 300,
    priceFrom: '', // no per-guest pricing published, only per-tray shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options'],
    phone: '+972-52-6528265',
    whatsapp: '+972526528265',
    email: 'mutzrela@gmail.com',
    website: 'https://mozzarela.co.il/',
    instagram: '',
    facebook: '',
    logo: '', // site's only logo asset renders near-invisible (cream-on-white) - see header comment
    photos: [photo1],
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, 1 photo, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
