// One-off script: adds "הולי בייגל ירושלים" (Holy Bagel Jerusalem) as a new, pre-approved
// caterer, sourced from its own WooCommerce website https://www.holybagel-j.co.il/ - a dairy
// caterer and cafe, Katamon branch, Jerusalem. 1 real photo is downloaded locally then uploaded
// to this project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's
// convention). No `logo` is set - no dedicated logo image asset was found anywhere on the site
// (the header uses a CSS/text logo, not an <img>).
//
// Every item has a REAL published price - a genuine WooCommerce catalog across the site's 3
// linked shop categories (פלטות קרות / cold platters - 19 items, קינוחים / desserts - 27 items,
// מגשי כריכים / sandwich trays - 13 items = 59 items), plus 18 further real-priced items surfaced
// in the site's "במיוחד עבורכם" (recommended for you) cart-sidebar widget that belong to
// unlinked/unbrowsed categories (soups, additional salads, spreads, a bagel, party platters) -
// each cross-checked for uniqueness against the 3 main categories before inclusion. Modeled as
// one a_la_carte package, same convention as scripts/add-munier.mjs.
//
// kashrutLevels and address are both real, read directly from the site's own linked kashrut
// certificate image ("תעודת כשרות מהדרין", הרבנות והמועצה הדתית ירושלים, valid until 31/01/2027):
// "חלבי - בישול לשישה מרכי השרע, דגים בחלב לנוהגים היתר - הולי בייגל קטמון" (dairy; fish-with-milk
// permitted per the lenient custom), "בכשרות הל"ה 26 ירושלים" (address). Rabbi הרב אליהו שריקי.
//
// Usage: node --env-file=.env.local scripts/add-holybagel.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/holybagel-site';

// [name, price, ALACARTE_CATEGORIES categoryId]
const PRODUCTS = [
  // פלטות קרות (cold platters)
  ['מגש ירקות (סטנדרט)', 149, 'fruit_veg'], ['מגש ירקות עם מטבל-דיפ', 115, 'fruit_veg'],
  ['מגש ירקות וסלטים', 220, 'salads'], ['מגש ים תיכוני', 199, 'salads'], ['מגש סלמון מעושן', 210, 'deli_counter'],
  ['מגש ממרחים מגוון (7 סוגים)', 140, 'deli_counter'], ['מגש גבינות קשות', 199, 'cheese_bread_savory'],
  ['מגש קפריזה', 155, 'cheese_bread_savory'], ['מגש דגים מעושנים', 220, 'deli_counter'], ['סלמון אפוי שלם', 359, 'hot_food'],
  ['מגש עלי גפן', 170, 'hot_food'], ['מגש קרואסון', 240, 'sandwiches_trays'], ['בורקס פינוקים', 210, 'quiches_pies_burekas'],
  ['מגש בורקסים מגוון', 99, 'quiches_pies_burekas'], ['מגש לחם שום עם מטבלים', 160, 'cheese_bread_savory'],
  ['מגש סביח גדול', 320, 'sandwiches_trays'], ['מגש פירות', 210, 'fruit_veg'],
  // קינוחים (desserts)
  ['עוגת שמרים קרנץ חלבי', 50, 'cakes'], ['כוסיות עוגה פרווה (25 יח\')', 210, 'desserts_sweets'],
  ['מגש מיני מאפינס', 90, 'cookies_pastries'], ['מגש ריבועים', 90, 'cookies_pastries'], ['מגש קוקיס', 90, 'cookies_pastries'],
  ['מגש בראוניז', 90, 'desserts_sweets'], ['פטיפור גבינה', 95, 'cakes'], ['מגש פחזניות שמנת', 169, 'desserts_sweets'],
  ['פרנז\'יפאן (24 יח\')', 159, 'cookies_pastries'], ['מגש פטיפורים מיוחדים', 160, 'desserts_sweets'],
  ['מגש מאפי שמרים מגוון', 95, 'cookies_pastries'], ['מיני פאי חלבי (16 יח\')', 145, 'desserts_sweets'],
  ['מגש כדורי שוקולד (45 יח\')', 145, 'desserts_sweets'], ['מגש שוקולדים', 195, 'desserts_sweets'],
  ['מגש מיני אקלר מגוון חלבי (16 יח\')', 135, 'desserts_sweets'], ['מגש קינוחים מעורב', 195, 'desserts_sweets'],
  ['מגש ביס פטיפור גבינה אפויה', 195, 'cakes'], ['עוגת גבינה ניו-יורק', 180, 'cakes'], ['טארט שוקולד קרמל', 150, 'cakes'],
  ['עוגת שוקולד שכבות', 180, 'cakes'], ['פס גבינה פירורים', 69, 'cakes'], ['מגש טראפלס על מקל גדול', 200, 'desserts_sweets'],
  ['וופל בלגי (20 יח\')', 140, 'desserts_sweets'], ['כוסיות עוגה (25 יח\')', 210, 'desserts_sweets'],
  ['סלט פירות', 199, 'fruit_veg'], ['כוסיות מוזלי (25 יח\')', 210, 'desserts_sweets'],
  ['שטרודל תמרים ללא גלוטן', 12, 'desserts_sweets'], ['עוגה ללא גלוטן (עוגת שיש אישית)', 12, 'cakes'],
  // מגשי כריכים (sandwich trays)
  ['מגש מסיבה (כריכים)', 265, 'sandwiches_trays'], ['מגש טורטייה', 269, 'sandwiches_trays'],
  ['טוניסאי (20 יח\')', 240, 'sandwiches_trays'], ['מגש פיתות סביח (28 יח\')', 240, 'sandwiches_trays'],
  ['מגש כריכונים (20 יח\')', 265, 'sandwiches_trays'], ['כריכי ביס (20 יח\')', 240, 'sandwiches_trays'],
  ['מגש כריכי מזונות (20 יח\')', 240, 'sandwiches_trays'], ['מגש מיני בייגל סלמון (12 יח\')', 185, 'sandwiches_trays'],
  ['מגש מסיבה טבעוני', 260, 'pareve_vegan_no_sugar'], ['מגש מסיבה ללא גלוטן (10 חצאי בייגל)', 159, 'sandwiches_trays'],
  ['טורטייה ללא גלוטן (6 חצאים)', 100, 'sandwiches_trays'],
  // additional real-priced items surfaced in the site's cart-sidebar recommendations (unlinked categories)
  ['קיש עגול - בצל', 159, 'quiches_pies_burekas'], ['פשטידה ללא קמח - בצל', 89, 'quiches_pies_burekas'],
  ['מגש לביבות - סלק (15 יח\')', 135, 'hot_food'], ['דג אמנון', 189, 'hot_food'],
  ['סלט בטטות ומוצרלה - קטן', 130, 'salads'], ['פס עוגת גבינה ללא סוכר', 69, 'cakes'], ['סלט יווני - קטן', 120, 'salads'],
  ['סלט יווני טבעוני - גדול', 210, 'salads'], ['סלט נודלס אסיאתי - גדול', 230, 'salads'],
  ['מגש מסיבה (כריכים) - גדול', 485, 'sandwiches_trays'], ['מגש מסיבה טבעוני - גדול (40 חצאים)', 485, 'pareve_vegan_no_sugar'],
  ['סלט פסטה ללא גלוטן טבעוני', 145, 'pareve_vegan_no_sugar'], ['כדור שוקולד על מקל', 140, 'desserts_sweets'],
  ['עוגת קרמשניט טבעוני', 69, 'pareve_vegan_no_sugar'], ['מרק של בית (4 ליטר)', 199, 'hot_food'], ['בייגל', 8, 'cheese_bread_savory'],
  ['גבינות שמנת - טבעי (250 גרם)', 30, 'deli_counter'], ['גבינות שמנת - זיתים (250 גרם)', 30, 'deli_counter']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח וקינוחים (קטלוג חנות)', en: 'Hosting Trays & Desserts (Shop Catalog)', fr: 'Plateaux de Réception et Desserts (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.holybagel-j.co.il/product-cat/cold-plates/',
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
    businessName: 'הולי בייגל ירושלים',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'הולי בייגל ירושלים - בית קפה ושירותי קייטרינג חלבי לאירועים, סניף קטמון. כשר למהדרין (הרבנות והמועצה הדתית ירושלים), עם מגוון עשיר של פלטות קרות, מגשי כריכים וקינוחים, המתאימים לבריתות, בר/בת מצווה, אירוסין, פדיון הבן, ימי הולדת, כנסים ואירועים עסקיים ופרטיים. משלוחים לכל חלקי הארץ.',
      en: "Holy Bagel Jerusalem - a cafe and dairy event catering service, Katamon branch. Kosher mehadrin (Jerusalem Rabbinate and Religious Council), with a rich selection of cold platters, sandwich trays and desserts, suited to brit milah, bar/bat mitzvah, engagement parties, pidyon haben, birthdays, conferences and business and private events. Delivery across the country.",
      fr: "Holy Bagel Jérusalem - un café et service de traiteur lacté pour événements, succursale de Katamon. Cacher mehadrin (Rabbinat et Conseil Religieux de Jérusalem), avec un large choix de plateaux froids, de plateaux de sandwichs et de desserts, adaptés aux brit mila, bar/bat mitsva, fiançailles, pidyon haben, anniversaires, congrès et événements professionnels et privés. Livraison dans tout le pays."
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'הל"ה 26, קטמון, ירושלים',
    kashrutLevels: ['local_rabbinate', 'mehadrin'], // תעודת כשרות מהדרין, הרבנות והמועצה הדתית ירושלים - see kashrut certificate
    cateringTypes: ['dairy'],
    maxGuests: 200, // no figure published - plausible round estimate, unverified
    priceFrom: '', // no per-guest/per-event pricing published, only per-tray shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['brit', 'bar_mitzvah', 'engagement', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options'],
    phone: '+972-72-3921450',
    whatsapp: '+972545619694',
    email: 'holybagelj@gmail.com',
    website: 'https://www.holybagel-j.co.il/',
    instagram: '',
    facebook: '',
    logo: '', // no dedicated logo image asset found anywhere on the site
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
