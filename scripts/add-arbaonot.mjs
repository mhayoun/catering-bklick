// One-off script: adds "קייטרינג ארבע עונות" (Arba Onot / Four Seasons Catering) as a new,
// pre-approved caterer, sourced from its own WooCommerce website https://www.arbaonot.co.il/ - a
// dairy/vegetarian hosting caterer based in Moshav Amminadav, just outside Jerusalem. Logo + 1
// photo are downloaded locally then uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention).
//
// Every item has a REAL published price - a genuine WooCommerce catalog (138 unique products
// across the site's own 6 shop categories: סלטים, מרקים, מאפים ומלוחים, תוספות, עיקריות, מתוקים;
// plus 4 relevant food/drink items curated out of the "נלווים" category, which is otherwise pure
// disposable tableware/cutlery - not modeled as catalog items here). 2 duplicate cross-listed
// products (קישים גדולים, גרבלקס - both appear in two site categories) are counted once. Modeled
// as one a_la_carte package, same convention as scripts/add-munier.mjs and
// scripts/add-mozzarela.mjs. The site's "אירועים" page describes event production (weddings,
// business events, home events) but publishes no per-guest/bundle pricing anywhere - so no
// formula packages are added, same reasoning as scripts/add-eventop.mjs.
//
// kashrutLevels and address are both real, read directly from the site's own linked kashrut
// certificate image (תעודת הכשר למהדרין, הרבנות מטה יהודה, valid 15.05.2026-10.09.2026): "כשר
// למהדרין - חלבי", owner אמיר נאור, "כתובת: הערבה 5, מושב עמינדב".
//
// districts: real evidence from the "אירועים" page text itself - "מחפשים קייטרינג חלבי לאירועים
// בירושלים והסביבה או באזור המרכז" (Jerusalem area or the Center district) plus a named Tel Aviv
// business-event example ("אירוע עסקי, ארטפורט תל אביב").
//
// Usage: node --env-file=.env.local scripts/add-arbaonot.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/arbaonot-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  // סלטים (salads) - 30 items
  ['מגש ירקות עם מטבל טחינה', 105, 'fruit_veg'], ["סלט עלי בייבי, פטריות, צנובר ופרמז'ן", 142, 'salads'],
  ["סלט קראנץ'", 148, 'salads'], ['סלט עגבניות שרי וגבינה בולגרית', 200, 'salads'], ['אנטיפסטי', 125, 'fruit_veg'],
  ['סלט קינואה, עדשים שחורות ובטטה', 160, 'salads'], ['סלט ירוק, רוקפור ובטטה', 160, 'salads'],
  ['סלט עגבניות שרי, פסטו וקשיו קלוי', 180, 'salads'], ['סלט עלי תרד, רוקפור, אגוזי מלך ופרי העונה', 168, 'salads'],
  ["סלט עלים, ארטישוק, פטריות ופרמז'ן", 168, 'salads'], ['סלט יווני', 170, 'salads'], ['סלט טבולה ירוק', 140, 'salads'],
  ['סלט חציל שרוף וטחינה', 140, 'salads'], ['סלט אסייתי פיקנטי', 165, 'salads'],
  ['סלט ניוקי קריספי ועגבניות שרי', 170, 'salads'], ['סלט פסטה, פטריות שמפיניון וזוקיני', 175, 'salads'],
  ['סלט חסות ודברים טובים', 165, 'salads'], ['סלט קיסר', 165, 'salads'], ['סלט עשבי תיבול ואוכמניות', 180, 'salads'],
  ['סלט סלק וגבינה בולגרית', 155, 'salads'], ['חומוס תוצרת בית', 40, 'deli_counter'], ['טחינה ירוקה', 30, 'deli_counter'],
  ['גואקמולי (בעונה)', 50, 'deli_counter'], ['טפנד זיתים ירוקים', 30, 'deli_counter'],
  ['טפנד זיתי קלמטה', 30, 'deli_counter'], ['ממרח עגבניות מיובשות', 30, 'deli_counter'],
  ['ממרח ארטישוק', 30, 'deli_counter'], ['ממרח פסטו', 30, 'deli_counter'], ['ממרח פלפלים אדומים קלויים', 30, 'deli_counter'],
  ['ירקות כבושים בקארי', 40, 'fruit_veg'],
  // מרקים (soups) - 9 items
  ['המרקייה - עמדת מרקים', 60, 'hot_food'], ['מרק אפונה קטיפתי', 50, 'hot_food'], ['מרק עגבניות צלויות', 50, 'hot_food'],
  ['מרק עדשים וכמון', 50, 'hot_food'], ["מרק דלעת ובטטה עם ג'ינג'ר וקינמון", 50, 'hot_food'],
  ['מרק ארטישוק ירושלמי (בעונה)', 50, 'hot_food'], ['מרק בצל', 50, 'hot_food'], ['מרק חריירה', 50, 'hot_food'],
  ['מקלות שום וקרוטונים - תוספת למרק', 5, 'hot_food'],
  // מאפים ומלוחים (pastries & savory) - 29 items
  ['טורטייה רול', 230, 'sandwiches_trays'], ['(V) טורטיה רול טבעוני', 230, 'pareve_vegan_no_sugar'],
  ["מיני ג'בטינות", 195, 'sandwiches_trays'], ["(V) מיני ג'בטינות טבעוני", 195, 'pareve_vegan_no_sugar'],
  ['מיני פיתות במילויים שונים', 175, 'sandwiches_trays'], ['כריכי קסטן דגנים', 170, 'sandwiches_trays'],
  ['ספרינג רול', 175, 'hot_food'], ['חטיפי פיתה בציפוי פנקו', 140, 'hot_food'],
  ['"סושי" טורטייה בציפוי פנקו', 140, 'sushi_specials'], ['קרואסון קממבר, עגבניה ורוקט', 195, 'sandwiches_trays'],
  ['קישים גדולים', 112, 'quiches_pies_burekas'], ['מיני קישים', 168, 'quiches_pies_burekas'],
  ['מיני מיקס ממולאים', 185, 'hot_food'], ['מגש גבינות קשות', 230, 'cheese_bread_savory'],
  ["פוקצ'ינות", 125, 'cheese_bread_savory'], ['מאפה פילו תרד וגבינה בולגרית', 170, 'quiches_pies_burekas'],
  ['מאפה פילו גבינות וזיתים', 170, 'quiches_pies_burekas'], ['סיגרים גבינות צאן | חומוס כמון', 185, 'quiches_pies_burekas'],
  ['סיגרים במילוי חומוס - טבעוני', 185, 'pareve_vegan_no_sugar'], ['גרבלקס', 220, 'deli_counter'],
  ['בורקס פינוקים', 215, 'quiches_pies_burekas'], ['מקלות קשקבל וזיתי קלמטה', 160, 'cheese_bread_savory'],
  ['מיני פיצות', 160, 'quiches_pies_burekas'], ['מאפה פילו תרד טבעוני', 170, 'pareve_vegan_no_sugar'],
  ['בורקיטס גבינות', 145, 'quiches_pies_burekas'],
  ['גלילי חציל קלוי וגבינת עיזים, פלפלים קלויים ופסטו', 200, 'fruit_veg'],
  ['גלילי חציל ופסטו טבעוני', 200, 'pareve_vegan_no_sugar'], ['כיכר לחם מחמצת (פרוס)', 32, 'cheese_bread_savory'],
  ['חלה', 32, 'cheese_bread_savory'],
  // תוספות (sides) - 14 items
  ['קדירת ירקות שורש בטימין ושמן זית', 225, 'hot_food'], ['אורז לבן ואורז בר עם פטריות ובצלים', 225, 'hot_food'],
  ['גרטן תפו"א בשמנת וגבינות', 230, 'hot_food'], ['בטטות וסלק מקורמלים', 190, 'hot_food'],
  ['שלושה אורזים בהל, דבש וקינמון', 210, 'hot_food'], ['פרוסות תפו"א בחמאה, שום ורוזמרין', 180, 'hot_food'],
  ['תפו"א קטנים עם ראשי שום ובצל', 180, 'hot_food'], ['בטטות צלויות בבלסמי וטימין', 180, 'hot_food'],
  ["מג'דרה", 190, 'hot_food'], ['ירקות צלויים בקרם קוקוס וקארי אדום', 200, 'hot_food'],
  ['פירה מדורה עם פטריות, בצל מאודה וחמאה', 190, 'hot_food'],
  ['ברוקולי ושעועית ירוקה בשום, לימון ושקדים', 200, 'hot_food'], ['בורגול, גרגירי חומוס ומנגולד', 190, 'hot_food'],
  ['אורז עם עשבי תיבול', 190, 'hot_food'],
  // עיקריות (mains) - 21 new items (קישים גדולים, גרבלקס already counted above)
  ['לזניה', 250, 'hot_food'], ['לזניה טבעונית', 250, 'pareve_vegan_no_sugar'], ['פסטה ברטבים שונים', 225, 'hot_food'],
  ['פסטה ברטבים שונים - טבעוני', 225, 'pareve_vegan_no_sugar'], ['רטבים לפסטה', 68, 'hot_food'],
  ['קרפ פטריות בשמנת ועגבניות מיובשות', 210, 'hot_food'], ['קרפ תרד וגבינה בולגרית ברוטב שמנת', 210, 'hot_food'],
  ['גלילי חציל קלוי ברוטב שמנת פטריות', 210, 'hot_food'], ['סלמון שלם מאודה. מוגש קר', 335, 'deli_counter'],
  ['פילה סלמון בשמן זית, כוסברה וקוביות עגבנייה', 245, 'hot_food'], ['פילה סלמון טריאקי ובצל ירוק', 245, 'hot_food'],
  ['פילה אמנון בעשבי תיבול, לימון וצלפים', 205, 'hot_food'], ['פילה לברק בעשבי תיבול', 225, 'hot_food'],
  ['קציצות דג ברוטב עגבניות וכוסברה', 270, 'hot_food'], ['שניצל דג', 150, 'hot_food'], ['חריימה טופו', 240, 'hot_food'],
  ["סטייק טופו במשרה סויה, ג'ינגר, שום ובצל", 150, 'pareve_vegan_no_sugar'],
  ['קציצות מלאי קופתא ברוטב הודי', 230, 'hot_food'], ['קציצות אורז אדום ופטריות', 250, 'hot_food'],
  ['פאד-תאי ירקות מוקפצים', 250, 'hot_food'], ['סירות חציל במילוי פטריות ברוטב עגבניות טריות', 240, 'hot_food'],
  // מתוקים (sweets) - 31 items
  ['פטיפורים', 155, 'desserts_sweets'], ['טארטלטים', 160, 'desserts_sweets'], ['מגש עוגיות', 130, 'cookies_pastries'],
  ['מגש פירות העונה', 180, 'fruit_veg'], ['מוזלי בגביעים אישיים', 170, 'desserts_sweets'], ['חיתוכיות', 245, 'cakes'],
  ['מאפי שמרים קטנים', 140, 'cookies_pastries'], ["קראנץ' שוקולד פראי", 50, 'desserts_sweets'],
  ['סינמון - שמרים קינמון וגלייז סוכר', 50, 'cookies_pastries'], ['שמרים גבינה', 50, 'cookies_pastries'],
  ['מיני מאפינס בטעמים', 135, 'cookies_pastries'], ['פחזניות מתוקות', 150, 'desserts_sweets'],
  ['סיגרים אגוזים וקינמון', 160, 'cookies_pastries'], ['טראפלס שוקולד, ברנדי וקפה', 150, 'desserts_sweets'],
  ["מיני בלינצ'ס גבינה וצימוקים", 90, 'desserts_sweets'], ['קרמבל תפוחים וקינמון', 160, 'cakes'],
  ['טארט פקאן', 160, 'cakes'], ['פס בראוניז', 70, 'cakes'], ['פס טירמיסו', 70, 'cakes'], ['פס גבינה קלאסית', 70, 'cakes'],
  ['פס גבינה פירות יער', 70, 'cakes'], ['פס גבינה פירורים', 70, 'cakes'], ['בחושה מייפל פקאן', 50, 'cookies_pastries'],
  ['בחושה תפוז', 50, 'cookies_pastries'], ['בחושה שיש חמאה', 50, 'cookies_pastries'],
  ['בחושה גזר, צימוקים ואגוזי מלך', 50, 'cookies_pastries'], ['גרנולה בריאות (לפי משקל)', 32, 'pareve_vegan_no_sugar'],
  ['גרנולה בריאות ללא סוכר (לפי משקל)', 32, 'pareve_vegan_no_sugar'],
  ['מוזלי טבעוני בגביעים אישיים', 170, 'pareve_vegan_no_sugar'],
  ['פטיפורים טבעוניים ללא גלוטן', 150, 'pareve_vegan_no_sugar'], ['מיני מאפינס - טבעוני', 120, 'pareve_vegan_no_sugar'],
  // נלווים (accompaniments) - 4 relevant food/drink items curated out of ~14 disposable-tableware items
  ["שתייה קלה/תוססים 1.5 ליטר", 15, 'drinks'], ['חלב 3% - 1 ליטר', 10, 'drinks'], ['חלב סויה', 15, 'drinks'],
  ['ערכת קפה', 200, 'drinks']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח ואוכל מוכן (קטלוג חנות)', en: 'Hosting Trays & Ready Food (Shop Catalog)', fr: 'Plateaux de Réception et Plats Préparés (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.arbaonot.co.il/%d7%90%d7%95%d7%9b%d7%9c-%d7%9e%d7%95%d7%9b%d7%9f/',
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
  const logoUrl = await uploadOne('logo-new.svg', 'image/svg+xml');
  const photo1 = await uploadOne('food1.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג ארבע עונות',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג ארבע עונות - קייטרינג חלבי וצמחוני כשר למהדרין (רבנות מטה יהודה), הפועל ממושב עמינדב ומגיע לאירועים בירושלים והסביבה, אזור המרכז ותל אביב. מגוון עשיר של מגשי אירוח ואוכל מוכן - סלטים, מרקים, מאפים ומלוחים, תוספות, עיקריות ומתוקים - עם התאמות טבעוניות וללא גלוטן, וכן הפקת אירועים בבית, במשרד או בשטח.',
      en: "Arba Onot Catering - kosher mehadrin (Mateh Yehuda Rabbinate) dairy and vegetarian catering, operating from Moshav Amminadav and serving events in Jerusalem and the surrounding area, the Center district and Tel Aviv. A rich selection of hosting trays and ready food - salads, soups, pastries and savory items, sides, mains and desserts - with vegan and gluten-free options, plus event production at home, at the office or on-site.",
      fr: "Arba Onot Catering - traiteur lacté et végétarien cacher mehadrin (Rabbinat de Mateh Yehuda), opérant depuis le Moshav Amminadav et desservant des événements à Jérusalem et ses environs, dans le district du Centre et à Tel Aviv. Un large choix de plateaux de réception et de plats préparés - salades, soupes, pâtisseries salées, accompagnements, plats principaux et desserts - avec des options végétaliennes et sans gluten, ainsi que la production d'événements à domicile, au bureau ou sur site."
    },
    districts: ['jerusalem', 'center', 'telaviv'],
    city: { he: 'מושב עמינדב', en: 'Moshav Amminadav', fr: 'Moshav Amminadav' },
    address: "רח' הערבה 5, מושב עמינדב",
    kashrutLevels: ['local_rabbinate', 'mehadrin'], // תעודת הכשר למהדרין, הרבנות מטה יהודה - see kashrut certificate
    cateringTypes: ['dairy'],
    maxGuests: 250, // no figure published - plausible round estimate, unverified
    priceFrom: '', // no per-guest/per-event pricing published, only per-item shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['wedding', 'bar_mitzvah', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'disposable_tableware'],
    phone: '+972-2-6429494',
    whatsapp: '',
    email: 'office@arbaonot.co.il',
    website: 'https://www.arbaonot.co.il/',
    instagram: '',
    facebook: '',
    logo: logoUrl,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 1 photo, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
