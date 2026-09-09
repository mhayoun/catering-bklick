// One-off script: adds "ארטייסט" (Artaste) as a new, pre-approved caterer, sourced from its own
// WooCommerce website https://www.artaste.co.il/ - a dairy hosting-tray caterer based in Kfar
// Saba, run by chef יניב שבח. 1 real photo is downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention). No `logo` is
// set - the site's only logo asset (logo-1.svg) renders as fully blank/invisible when
// test-rendered against a white background, same issue as protamar's and mozzarela's logos in
// earlier scripts.
//
// Every item has a REAL published price - a genuine WooCommerce catalog (66 unique priced
// products across the 2 pages of the site's own "מגשי אירוח" shop, spanning its מלוחים/סלטים/
// מתוקים/טבעוני/נלווים sub-categories, including a still-live Rosh Hashana תשפ"ז seasonal
// collection). 3 quote-only add-on services (אנשי שירות לאירוע, בר שתיה, ריהוט וכלים רב פעמים -
// all listed at "₪0" with "לקבלת הצעת מחיר") and 1 not-yet-released product ("בקרוב...", no
// price) are excluded, same reasoning as every other script in this directory that omits
// no-price/quote-only listings. Modeled as one a_la_carte package, same convention as
// scripts/add-munier.mjs.
//
// kashrutLevels and address are both real, read directly from the site's own linked kashrut
// certificate image (הרבנות והמועצה הדתית כפר סבא, valid until 11/09/2026): "תעודת כשרות - חלבי -
// ארטייסט אירועים בע\"מ, יניב שבח | קייטרינג חלבי אבקת חלב נכרי" (dairy kosher, non-Jewish milk
// powder) - i.e. a standard local-rabbinate dairy hechsher, not a mehadrin/chalav-Yisrael claim,
// so kashrutLevels is `local_rabbinate` only. "בכתובת: התע\"ש 24 כפר סבא".
//
// Usage: node --env-file=.env.local scripts/add-artaste.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/artaste-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  ['פטיפורים קולקציית חגי תשרי תשפ"ז', 239, 'desserts_sweets'], ["כוסיות מוס 'דבש ועוקץ' - חגי תשרי תשפ\"ז", 209, 'desserts_sweets'],
  ['טארטלטים חגיגיים קולקציית חגי תשרי תשפ"ז', 209, 'desserts_sweets'], ['מיני מאפינס דבש ושוקולד - חגי תשרי תשפ"ז', 152, 'cookies_pastries'],
  ['מגוון קוקטיילים - מהודרת ראש השנה תשפ"ז', 145, 'drinks'], ['צלחת חג - חגי תשרי תשפ"ז', 199, 'desserts_sweets'],
  ['עוגת דבש מהדורת ראש השנה תשפ"ז (פס)', 64, 'cakes'], ['בלונדיז', 159, 'cookies_pastries'],
  ['כריכוני לחמניות סלק - מהדורת ראש השנה תשפ"ז', 189, 'sandwiches_trays'], ['פטיפורים מלוחים', 252, 'cheese_bread_savory'],
  ["קרפצ'ו סלק", 159, 'salads'], ['טארטלטים פירות', 209, 'desserts_sweets'], ["קראנצ'יפנים וניל", 239, 'desserts_sweets'],
  ['מיני קיש', 199, 'quiches_pies_burekas'], ['פטיפורים חגיגיים', 239, 'desserts_sweets'], ['טארטלטים מלוחים', 189, 'quiches_pies_burekas'],
  ['הקאנאפס החדש', 225, 'cheese_bread_savory'], ['קאפקייקס מלוח במגוון עיטורים', 199, 'cheese_bread_savory'],
  ['מטעמי גבינות מלוחים', 228, 'cheese_bread_savory'], ['בייטס (bites)', 189, 'cookies_pastries'],
  ['מוס יוגורט ופירות העונה', 188, 'desserts_sweets'], ['בוקר טוב פריז!', 189, 'brunch'], ['מגש גבינות ארץ ישראלי', 289, 'cheese_bread_savory'],
  ['קינוח פלטינום', 219, 'desserts_sweets'], ['מיני קיש טבעוני', 209, 'pareve_vegan_no_sugar'], ['מקרונים מחופשים 2026', 299, 'cookies_pastries'],
  ['עוגיות מסיכה צבעוניות', 150, 'cookies_pastries'], ['פטיסרי של חורף', 209, 'cookies_pastries'],
  ['קציצות ירק טבעוני', 199, 'pareve_vegan_no_sugar'], ['פטיפורים מלוחים טבעוניים', 209, 'pareve_vegan_no_sugar'],
  ['מיני סביח', 189, 'sandwiches_trays'], ['סוכריות קייק פופס צבעוניות', 289, 'cookies_pastries'],
  ['קאפקייקס במיתוג אישי', 225, 'cookies_pastries'], ['לזניית גבינות ועגבניות', 210, 'hot_food'], ['לזניית גבינות וחצילים', 210, 'hot_food'],
  ['קונכיות בצק עלים במגוון מילויים', 189, 'quiches_pies_burekas'], ['מארז מאפים מלוחים', 189, 'cheese_bread_savory'],
  ['כריכוני הבית', 186, 'sandwiches_trays'], ['בראוניז', 85, 'cookies_pastries'], ['סלט עגבניות שרי ובייבי מוצרלה', 122, 'salads'],
  ['טראפלס שוקולד', 85, 'desserts_sweets'], ['כריכוני בריאות טבעוניים מלחם כוסמין', 189, 'pareve_vegan_no_sugar'],
  ['כריכוני לחמניית סלק', 189, 'sandwiches_trays'], ['כריכוני שווארמה טבעוניים', 189, 'pareve_vegan_no_sugar'],
  ['מגש ירקות בליווי שני מטבלים', 155, 'fruit_veg'], ['הטאפאסים שלנו', 259, 'cheese_bread_savory'],
  ['סלט עלים בוויניגרט בלסמי', 145, 'salads'], ['ירקות אנטיפסטי', 209, 'fruit_veg'], ['כריכוני המבורגר טבעוני', 169, 'pareve_vegan_no_sugar'],
  ['עוגת גבינה חגיגית (קוטר 20)', 229, 'cakes'], ['עוגת יום הולדת חגיגית (קוטר 24)', 199, 'cakes'], ['דאבל טראבל מוס', 189, 'desserts_sweets'],
  ['כוסיות מוס טבעוני', 199, 'pareve_vegan_no_sugar'], ['פטיפורים מתוקים טבעוניים', 229, 'pareve_vegan_no_sugar'],
  ["יין לבן מסדרת ויז'ן של טפרברג", 58, 'drinks'], ['לביבות טונה מפנקות', 199, 'deli_counter'],
  ['למברוסקו לבן/ ורדרד (חצי יבש)', 64, 'drinks'], ['מגש ירקות בליווי טחינה ירוקה', 155, 'fruit_veg'], ['סופלה מלוח', 179, 'cheese_bread_savory'],
  ['מגש מיני פיצות', 139, 'quiches_pies_burekas'],
  ['מגש עוגיות לצד הקפה', 179, 'cookies_pastries'], ['מגש עוגיות מלוחות', 198, 'cookies_pastries'], ["מגש פוקאצ'ינות", 139, 'cheese_bread_savory'],
  ['מיני מאפינס', 152, 'cookies_pastries'], ["מקרונים בצבעים (8 יח')", 69, 'cookies_pastries'], ['סט 3 ממרחים', 79, 'deli_counter'],
  ["'גפרורי' בצק עלים", 156, 'cheese_bread_savory'], ['מארז לחמניות טריות', 128, 'cheese_bread_savory'], ['לביבות בצבעים', 209, 'hot_food'],
  ['לביבות - ללא קמח חיטה', 219, 'hot_food'], ['סט מטבלים ללביבות', 89, 'deli_counter'], ['ממרחים לבוקר מפנק (6 ממרחים)', 149, 'deli_counter'],
  ['סלט אטריות וויאטנמי', 199, 'salads'], ['שווארמה טבעונית בצלחת - טעימה ועסיסית', 159, 'pareve_vegan_no_sugar'],
  ['סלט כרוב אסיאתי', 122, 'salads'], ['סלט עדשים שחורות וסלק', 122, 'salads'], ['סלט פסטה וורדה', 122, 'salads'],
  ['פסטה איטלקית ברוטב פומודורו עשיר', 198, 'hot_food'], ['פסטה איטלקית ברוטב רוזה', 198, 'hot_food'],
  ['פסטה איטלקית ברוטב פסטו ובזיליקום', 198, 'hot_food'], ['פסטה איטלקית ברוטב שמנת קטיפתי', 198, 'hot_food'],
  ['סלט קינואה בריאות', 122, 'salads'], ['סלט תפוחי אדמה מפנק', 122, 'salads'], ["קראנצ'יפנים שוקולד", 239, 'desserts_sweets'],
  ['קופסת כדורי שוקולד', 85, 'desserts_sweets'], ['טראפלס שוקולד טבעוני', 85, 'pareve_vegan_no_sugar'],
  ['מגש פירות העונה', 289, 'fruit_veg'], ['עוגת דואט מוס וניל קרמל (קוטר 20/24)', 192, 'cakes'], ['קיט קפה מהודר', 495, 'drinks'],
  ['מיץ סחוט טבעי - תפוזים/ לימונדה/ אשכולית אדומה (2 ליטר)', 55, 'drinks'], ["יין אדום מסדרת ויז'ן של טפרברג", 58, 'drinks'],
  ['בראוניז טבעוני', 85, 'pareve_vegan_no_sugar'], ['עוגת קרם שוקולד עם כיתוב אישי לבחירה (קוטר 20/24)', 192, 'cakes'],
  ['חד"פ מתכלה', 15, 'gifts_packages']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח (קטלוג חנות)', en: 'Hosting Trays (Shop Catalog)', fr: 'Plateaux de Réception (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.artaste.co.il/product-category/shop-all/',
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
    businessName: 'ארטייסט',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'ארטייסט - מגשי אירוח מרשימים. קייטרינג חלבי כשר (הרבנות כפר סבא) בניצוחו של השף יניב שבח, שמעצב את האוכל כמו יצירת אומנות. מגוון עשיר של מגשי אירוח מלוחים, סלטים, מתוקים ואפשרויות טבעוניות וללא גלוטן, לכל סוגי האירועים - מבר/בת מצווה ובריתות ועד אירועי חברה.',
      en: 'Artaste - impressive hosting trays. Kosher dairy catering (Kfar Saba Rabbinate) led by chef Yaniv Shevach, who designs food like a work of art. A rich selection of savory hosting trays, salads, desserts and vegan/gluten-free options, for every type of event - from bar/bat mitzvahs and brit milah to corporate events.',
      fr: "Artaste - des plateaux de réception impressionnants. Traiteur lacté cacher (Rabbinat de Kfar Saba) dirigé par le chef Yaniv Shevach, qui conçoit la nourriture comme une œuvre d'art. Un large choix de plateaux salés, de salades, de desserts et d'options végétaliennes/sans gluten, pour tous les types d'événements - des bar/bat mitsvot et brit milah aux événements d'entreprise."
    },
    districts: ['center', 'telaviv', 'jerusalem'],
    city: { he: 'כפר סבא', en: 'Kfar Saba', fr: 'Kfar Saba' },
    address: 'התע"ש 24, כפר סבא',
    kashrutLevels: ['local_rabbinate'], // תעודת כשרות חלבי, הרבנות והמועצה הדתית כפר סבא - see kashrut certificate
    cateringTypes: ['dairy'],
    maxGuests: 300, // no figure published - plausible round estimate, unverified
    priceFrom: '', // no per-guest/per-event pricing published, only per-tray shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['bar_mitzvah', 'brit', 'wedding', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'disposable_tableware', 'waiter_staff'],
    phone: '+972-9-7738388',
    whatsapp: '',
    email: 'info@artaste.co.il',
    website: 'https://www.artaste.co.il/',
    instagram: '',
    facebook: '',
    logo: '', // site's only logo asset renders fully blank/invisible - see header comment
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
