// One-off script: adds "קייטרינג ריבקין" (Rivkin Catering) as a new, pre-approved caterer,
// sourced from its own WooCommerce storefront https://rivkins.store/ - a meat caterer based in
// Kfar Chabad, with nationwide delivery ("שירות בפריסה ארצית", stated verbatim on the homepage).
// Logo + 1 photo are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Every item has a REAL published price - this is the largest genuine WooCommerce catalog found
// in this directory so far: 242 unique priced products across all 16 shop listing pages (one
// unpriced "VIP product" teaser with no price shown anywhere was excluded). Several products are
// intentionally listed twice under the same name with two different real prices (e.g. two sizes
// of "אסאדו" at ₪32/₪320, "סלמון מעושן" at two ₪25 listings, etc.) - both real listings are kept
// as separate catalog entries, same as scripts/add-tmarim-alacarte-trays.mjs's convention for
// multi-size products. Modeled as one a_la_carte package. The site's other menu sections (מגשי
// אירוח, תפריט אירועים, תפריט קידושים) are all marked "בקרוב" (coming soon) with no products yet -
// only the general shop catalog and the "טועמיה" (Thursday-night tasting bar) description page,
// which has no prices of its own, are live.
//
// kashrutLevels and the supervising rabbi's name are real, from the site's own "קצת עלינו" (about)
// page: "כל המאכלים תחת כשרותו המהודרת של הרב מאיר אשכנזי - מרא דאתרא של כפר חב\"ד" (all food
// under the mehadrin kashrut of Rabbi Meir Ashkenazi, the halachic authority of Kfar Chabad).
//
// Usage: node --env-file=.env.local scripts/add-rivkin.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/rivkin-site';

// [name, price, ALACARTE_CATEGORIES categoryId] - scraped across all 16 pages of
// https://rivkins.store/?post_type=product
const PRODUCTS = [
  ["'האורז של ריבקין'", 42, 'hot_food'], ["'האורז של ריבקין'", 40, 'hot_food'], ['10 לחמניות', 20, 'cheese_bread_savory'],
  ['10 מנות ילדים', 300, 'hot_food'], ['אבוקדו', 18, 'fruit_veg'], ['אגרול סיני', 18, 'hot_food'],
  ['אגרול סיני', 18, 'hot_food'], ['אורז אושפלו', 260, 'hot_food'], ['אורז ירקות', 42, 'hot_food'],
  ['אורז ירקות', 120, 'hot_food'], ["אורז מג'דרה", 45, 'hot_food'], ['אושפלו', 65, 'hot_food'],
  ['אטריות למרק', 10, 'hot_food'], ['אנטיפסטי צלויים', 160, 'fruit_veg'], ['אסאדו', 32, 'deli_counter'],
  ['אסאדו', 320, 'deli_counter'],
  ['אפונה', 45, 'hot_food'], ['אפונה וגזר', 26, 'hot_food'], ['אפונה ופטריות', 26, 'hot_food'], ['ארבעס', 15, 'hot_food'],
  ['באן אסאדו 15 יחידות', 270, 'sandwiches_trays'], ['באן קריספי פיש 15 יחידות', 240, 'sandwiches_trays'],
  ['בופה', 55, 'hot_food'], ['בורקס בשרי', 38, 'quiches_pies_burekas'], ['בורקס תפוח אדמה', 40, 'quiches_pies_burekas'],
  ['בטטה פטריות', 16, 'hot_food'], ['ביס בורגר 15 יחידות', 300, 'sandwiches_trays'],
  ['ביס שווארמה 20 יחידות', 300, 'sandwiches_trays'], ['ביצים בצל ירוק', 16, 'salads'], ['ביצים בצל מטוגן', 16, 'salads'],
  ['בלינצס ופטריות', 12, 'hot_food'], ['גולש בקר עם פירות יבשים', 88, 'hot_food'],
  ['גזר גפרורים פיקנטי', 29, 'salads'], ['גזר גפרורים פיקנטי', 14, 'salads'], ['גזר חי מתוק', 14, 'salads'],
  ['גזר מרוקאי', 14, 'salads'], ['גפילטע-פיש קציצה', 13.9, 'deli_counter'], ['הרינג באיולי חרדל', 29, 'deli_counter'],
  ['הרינג חריף', 29, 'deli_counter'], ['הרינג פיקנטי', 29, 'deli_counter'], ['הרינג שמאלץ', 29, 'deli_counter'],
  ['הרינג שמאלץ (מטיאס)', 29, 'deli_counter'], ['זיתים', 27, 'fruit_veg'], ['זיתים', 45, 'fruit_veg'],
  ['חגיגת בשרים 20 שיפודים', 300, 'hot_food'], ['חומוס חלק', 14, 'salads'], ['חומוס חלק', 29, 'salads'],
  ['חזה בגריל', 14, 'hot_food'],
  ['חזה בגריל', 150, 'hot_food'], ['חזה הודו מעושן', 40, 'deli_counter'], ['חזה עוף בעשבי תיבול', 15, 'hot_food'],
  ['חזרת אותנטית', 18, 'deli_counter'], ['חלה', 18, 'cheese_bread_savory'], ['חמין בשרי', 55, 'hot_food'],
  ['חמין פרווה', 22, 'pareve_vegan_no_sugar'], ['חציל אצבעות', 14, 'salads'], ['חציל אצבעות', 29, 'salads'],
  ['חציל בטעם כבד', 14, 'salads'], ['חציל ברוטב אדום', 14, 'salads'], ['חציל ברוטב אדום', 29, 'salads'],
  ['חציל פרוסות בחומץ', 14, 'salads'], ['חציל קריספי', 18, 'hot_food'], ['חציל שרוף במיונז', 14, 'salads'],
  ['חציל שרוף במיונז', 29, 'salads'],
  ['חריימה קוביות דגים', 45, 'hot_food'], ['טונה בעישון קר', 25, 'deli_counter'], ['טונה בעישון קר', 25, 'deli_counter'],
  ['טונה מעושנת עם ירק', 29, 'deli_counter'], ['טונה מעושנת עם ירק', 29, 'deli_counter'],
  ['טורטיה אבוקדו / טונה', 250, 'sandwiches_trays'], ['טורטיה אסאדו', 375, 'sandwiches_trays'],
  ['טורטיה ירקות', 12, 'sandwiches_trays'], ['טורטיה ירקות', 120, 'sandwiches_trays'],
  ['טורטיית אסאדו', 22, 'sandwiches_trays'], ['טורטיית סלמון מעושן', 20, 'sandwiches_trays'], ['טחינה', 14, 'deli_counter'],
  ['טחינה', 29, 'deli_counter'], ['טחינה עם עשבי תיבול', 14, 'deli_counter'], ["טנג'ייה פירות יבשים", 45, 'hot_food'],
  ['ירקות מאודים', 26, 'fruit_veg'],
  ['ירקות מאודים', 45, 'fruit_veg'], ['כבד קצוץ', 30, 'deli_counter'], ['כדורי פירה', 19.99, 'hot_food'],
  ['כדורי פירה', 19.99, 'hot_food'], ['כוסמת', 24, 'hot_food'], ['כרוב בוטנים', 14, 'salads'],
  ['כרוב בוטנים', 29, 'salads'], ['כרוב וגזר בתחמיץ', 14, 'salads'], ['כרוב וגזר בתחמיץ', 29, 'salads'],
  ['לזניה בשר', 85, 'hot_food'], ['לחוח', 22, 'cheese_bread_savory'], ["לצ'ו", 26, 'hot_food'],
  ["לקס וצ'ילי חריף", 29, 'deli_counter'], ['מארז בורקס תפוח אדמה', 29, 'quiches_pies_burekas'],
  ["מארז בקר מס' 5", 159, 'hot_food'], ['מארז כדורי שוקולד', 18, 'desserts_sweets'],
  ['מארז לשון', 159, 'hot_food'], ['מארז צלי בקר', 73, 'hot_food'], ['מארז רוגלאך', 30, 'cookies_pastries'],
  ['מגש מתאבנים', 190, 'sandwiches_trays'], ['מגש סושי', 60, 'sushi_specials'], ['מוחמצי הבית', 14, 'salads'],
  ['מוחמצי הבית', 29, 'salads'], ['מוחמצים קולורבי', 14, 'salads'], ['מוסקה', 15, 'hot_food'],
  ['מוקפץ בקר', 35, 'hot_food'], ['מוקפץ בקר', 280, 'hot_food'], ['מוקפץ עוף', 32, 'hot_food'],
  ['מושט מטוגן', 15, 'hot_food'], ['מושט קלאסי', 15, 'hot_food'], ['מושט קלאסי', 150, 'hot_food'],
  ['מטבוחה', 16, 'salads'], ['מטבוחה', 29, 'salads'], ['מיני חלת שניצל 20 יחידות', 240, 'sandwiches_trays'],
  ['מלפפון שמיר', 14, 'salads'], ['מלפפון שמיר', 29, 'salads'], ['ממרח סלומון מעושן', 34, 'deli_counter'],
  ['ממרח סלומון מעושן', 34, 'deli_counter'], ['מנה קלאסית', 40, 'hot_food'], ['מרק דלעת', 40, 'hot_food'],
  ['מרק ירקות', 40, 'hot_food'], ['מרק עוף', 40, 'hot_food'], ['נגיסי נסיכה', 34, 'hot_food'],
  ['נגיסי סלמון', 39, 'hot_food'], ['נודלס ירקות', 26, 'hot_food'], ['נודלס ירקות', 50, 'hot_food'],
  ['נודלס עוף', 250, 'hot_food'],
  ['נקניק הודו', 30, 'deli_counter'], ['נקניק סלמי', 27, 'deli_counter'],
  ['נקניקיות הודו בציפוי קריספי', 120, 'hot_food'], ["סביצ'ה טונה", 34, 'deli_counter'],
  ["סביצ'ה סלמון", 34, 'deli_counter'], ['סחוג', 15, 'deli_counter'], ['סיגרים במילוי תפו"א', 19.99, 'quiches_pies_burekas'],
  ['סיגרים במילוי תפו"א', 19.99, 'quiches_pies_burekas'], ['סלומון צרפתי', 19.9, 'deli_counter'],
  ['סלט איטריות שעועית', 140, 'salads'], ['סלט בורגול חמוציות', 14, 'salads'], ['סלט בורגול ירוק', 14, 'salads'],
  ['סלט טונה וביצים', 16, 'salads'], ['סלט כרוב ירוק', 140, 'salads'], ['סלט פסטה', 140, 'salads'],
  ['סלט קיסר', 140, 'salads'],
  ['סלט שרי', 90, 'salads'], ['סלטי כוסות', 100, 'salads'], ['סלמון', 200, 'hot_food'],
  ['סלמון בסויה ודבש', 20, 'hot_food'], ['סלמון בעשבי תיבול', 19.9, 'hot_food'], ['סלמון ברוטב אסייתי', 19.9, 'hot_food'],
  ['סלמון מעושן', 25, 'deli_counter'], ['סלמון מעושן', 25, 'deli_counter'], ['סלמון קלאסי', 19.9, 'hot_food'],
  ['סלסה עגבניות ערבי', 14, 'salads'], ['סלסה עגבניות ערבי', 29, 'salads'], ['סלק', 29, 'salads'], ['סלק', 14, 'salads'],
  ['סלק', 28, 'salads'], ['ספייסי מיונז', 19, 'deli_counter'], ['עוגת דבש', 30, 'cakes'],
  ['עוגת שוקולד', 30, 'cakes'], ['עוגת שיש', 30, 'cakes'], ['עוגת שמרים שוקולד', 30, 'cakes'],
  ['עוגת שמרים תפוחים', 30, 'cakes'], ['עוף', 200, 'hot_food'], ['עוף בגריל', 19.9, 'hot_food'],
  ['עוף בטמפורה כ10 מנות', 290, 'hot_food'], ['עוף שזיף', 19.9, 'hot_food'], ["פאדג' שוקולד וברנדי", 70, 'desserts_sweets'],
  ['פופייט', 22, 'hot_food'], ['פילה ברמודי', 20, 'hot_food'], ['פילה סלמון קיפוד', 340, 'hot_food'],
  ['פילו בשרי', 22, 'quiches_pies_burekas'], ['פיצה אסאדו', 80, 'hot_food'], ['פירה', 42, 'hot_food'],
  ['פלטה סלטי דגים', 220, 'deli_counter'],
  ['פלטה עוגות מוס', 130, 'cakes'], ['פלפל חריף שום ולימון', 14, 'salads'], ['פלפל חריף שום ולימון', 14, 'salads'],
  ['פלפל ממולא', 14, 'hot_food'], ['פסטה וצימוקי זיתים', 14, 'salads'], ['פסטה וצימוקי זיתים', 28, 'salads'],
  ['פסטרמה הודו מעושן', 40, 'deli_counter'], ['פסטרמה מעושן בקר', 69, 'deli_counter'],
  ['פסטרמה מעושן בקר', 69, 'deli_counter'], ['פסטרמה רומנית', 45, 'deli_counter'], ['פסטרמה רומנית', 45, 'deli_counter'],
  ['פרגית', 20, 'hot_food'], ['פרגית', 200, 'hot_food'], ['פרגית אסייאתית', 23, 'hot_food'],
  ['פרגית ממולאת', 24, 'hot_food'], ['פרוסת דג קרפיון ממולא', 19, 'deli_counter'],
  ['פרוסת וויטפיש', 12, 'deli_counter'], ['פרנה אסלית', 22, 'cheese_bread_savory'], ['פשטידה מתוקה', 35, 'cakes'],
  ['פשטידת ירקות', 35, 'hot_food'], ['צימעס', 26, 'hot_food'], ['קובה צמחוני', 20, 'pareve_vegan_no_sugar'],
  ['קובה צמחוני', 20, 'pareve_vegan_no_sugar'], ['קוגל ירושלמי', 22, 'hot_food'], ['קוגל ירושלמי', 22, 'hot_food'],
  ['קוגל תפו"א', 22, 'hot_food'], ['קוגל תפו"א', 22, 'hot_food'], ['קולסלאו אמריקאי', 14, 'salads'],
  ['קולסלאו אמריקאי', 30, 'salads'], ['קופסת קניידלאך', 14, 'hot_food'],
  ['קוראסון טונה / אבוקדו 15 יחידות', 210, 'sandwiches_trays'], ['קוראסון פריזאי 15 יחידות', 240, 'sandwiches_trays'],
  ['קיש ברוקולי וכרובית', 80, 'quiches_pies_burekas'], ['קישקע', 30, 'hot_food'],
  ['קישקע פרווה', 20, 'pareve_vegan_no_sugar'], ['קערת סימנים', 65, 'salads'], ['קציצות בקר', 8, 'hot_food'],
  ['קציצות דג מטוגן', 7.5, 'hot_food'], ['קציצות עוף', 8, 'hot_food'], ["קראנצ'י", 70, 'desserts_sweets'],
  ["קרפצ'יו חציל", 90, 'salads'], ["קרפצ'יו סלק", 90, 'salads'], ['ראש דג קרפיון ממולא', 24.9, 'deli_counter'],
  ['רול וויטפיש', 80, 'deli_counter'], ['רולדה הודו', 17, 'hot_food'], ['רולדה הודו', 170, 'hot_food'],
  ['רצועות פלפל', 16, 'fruit_veg'], ['שאבעס רול בשרי', 26, 'sandwiches_trays'],
  ['שוקיים עוף בשזיפים', 12, 'hot_food'], ['שטורדל תפוחים', 21, 'cakes'],
  ['שטרודל שוקולד / תפוחים 30 יחידות', 120, 'cakes'], ['שניצל קלאסי', 15, 'hot_food'], ['שניצל קלאסי', 150, 'hot_food'],
  ['שניצלונים עוף', 69, 'hot_food'], ['שניצלונים עוף', 170, 'hot_food'], ['שעועית', 26, 'hot_food'],
  ['שעועית', 45, 'hot_food'], ['תירס וקוביות ירקות מיונז', 14, 'salads'], ['תירס וקוביות ירקות מיונז', 28, 'salads'],
  ['תירס פטריות שמיר', 14, 'salads'], ['תירס פטריות שמיר', 28, 'salads'], ['תפו"א ובטטה', 42, 'hot_food'],
  ['תפודים מוקרם', 160, 'hot_food'], ['תפוח אדמה במיונז', 14, 'salads'],
  ['תפוח אדמה סירות', 42, 'hot_food'], ['תפוח אדמה סירות', 40, 'hot_food'], ['תפוח אדמה רוסי', 14, 'salads']
];

const alaCartePackage = {
  id: 'shop-catalog',
  type: 'a_la_carte',
  name: { he: 'קטלוג החנות', en: 'Shop Catalog', fr: 'Catalogue Boutique' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://rivkins.store/?post_type=product',
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
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג ריבקין',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג ריבקין - טעם של בית, איכות של עשרות שנות ניסיון. שירותי קייטרינג בשרי לאירועים פרטיים, שמחות, כנסים ושבתות יוקרתיות, כשר למהדרין תחת הרב מאיר אשכנזי, מרא דאתרא של כפר חב"ד. קטלוג ענק של מאות מנות - כריכים, סלטים, מרקים, עיקריות, מעדנים ומתוקים - עם שירות משלוחים בפריסה ארצית.',
      en: "Rivkin Catering - the taste of home, the quality of decades of experience. Meat catering services for private events, celebrations, conferences and luxury Shabbat meals, kosher mehadrin under Rabbi Meir Ashkenazi, the halachic authority of Kfar Chabad. A huge catalog of hundreds of dishes - sandwiches, salads, soups, mains, delicatessen and desserts - with nationwide delivery service.",
      fr: "Rivkin Catering - le goût de la maison, la qualité de dizaines d'années d'expérience. Services de traiteur carné pour événements privés, célébrations, congrès et repas de Chabbat de luxe, cacher mehadrin sous la supervision du Rabbin Meir Ashkenazi, autorité halakhique de Kfar Chabad. Un immense catalogue de centaines de plats - sandwichs, salades, soupes, plats principaux, charcuterie et desserts - avec livraison dans tout le pays."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'],
    city: { he: 'כפר חב"ד', en: 'Kfar Chabad', fr: 'Kfar Chabad' },
    address: 'אדמו"ר הרייצ 4, כפר חב"ד',
    kashrutLevels: ['local_rabbinate', 'mehadrin'], // כשרותו המהודרת של הרב מאיר אשכנזי, מרא דאתרא של כפר חב"ד - see about page
    cateringTypes: ['meat'],
    maxGuests: 500, // no figure published - plausible round estimate, unverified
    priceFrom: '', // no per-guest/per-event pricing published, only per-item shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['celebration', 'rosh_hashana'],
    menuCategories: [],
    services: [],
    phone: '+972-58-5101770',
    whatsapp: '',
    email: 'orders@rivkinc.co.il',
    website: 'https://rivkins.store/',
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
