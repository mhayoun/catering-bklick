// One-off script: adds "סקופ קייטרינג" (Scoop Catering) as a new, pre-approved caterer, sourced
// directly from its own site, https://www.scoopcatering.com/ (found via web search for kosher
// caterers in Gush Etzion - Judea/Samaria is the least-represented district among existing
// listings; several other Judea/Samaria leads checked first this round were dead ends -
// shifoncatering.co.il's domain no longer resolves, "קרמוסו" (Modiin Illit) has no findable own
// website (only directory listings), cordero.co.il's phone number is the exact one already
// flagged in scripts/add-tavlin.mjs's header comment as shared with an existing listing
// (אלדברי קייטרינג) - a known multi-storefront network, and marvad.com turned out to be the
// same "מרבד הקסמים" business already in this project under www.marvad-rest.co.il, just a
// second branch/domain, not a distinct caterer).
//
// Scoop is a real business: started as a small café in Beit Shemesh (founders Gerry Shikman and
// Arye Ben Chamo per the site's own "about" copy), expanded to a second branch in Efrat (Gush
// Etzion) within a year, and now operates as a nationwide online ready-food/catering shop from
// the settlement of Mitzad (Gush Etzion) with separate dairy and meat kitchens plus its own
// bakery department ("הבייקרי של תמרה"). No overlap found with any existing caterer (distinct
// phone, WhatsApp number, and site).
//
// Pricing: real per-container/per-portion prices (not per-guest formulas), read from the site's
// own product catalog (client-side rendered - a plain HTML fetch returns no prices, so this was
// read through an actual rendered browser session, not summarized or estimated) across its
// salads (id=9), starters (id=4) and mains (id=5) categories - 91 unique priced products, ₪27-
// ₪149. Modeled as CatererForm.js's a_la_carte package type (see blankAlaCartePackage there and
// scripts/add-tmarim-alacarte-trays.mjs / scripts/add-ussishkin.mjs for precedent), each item
// tagged with the closest ALACARTE_CATEGORIES id. The site also sells soup, side-dish, dairy-
// kitchen and bakery categories, plus holiday-specific menus (Rosh Hashana, Sukkot, Passover,
// Shavuot) - NOT itemized here since only the three core categories were captured.
//
// kashrutLevels: a homepage popup states 'Certified Kosher Mehadrin, Moetza Datit Gush Etzion' /
// 'כשר למהדרין, מועצה דתית גוש עציון' (Gush Etzion religious council) - mapped to the existing
// mehadrin enum value, same treatment as every other generically-mehadrin listing (no separate
// enum value exists for a specific local religious council). Note: the site's own dedicated
// "/Cosher" page ironically shows the About-us story instead, and "/About" shows an unfinished
// placeholder ("כאן יכתב תוכן הכשרות" - kashrut content goes here) - the two page templates are
// swapped/broken; the real kashrut claim only appears in the homepage order-deadline popup.
//
// logo: no real logo asset was found - the site's <img alt="logo"> is a purely decorative SVG
// flourish graphic with no wordmark, and its favicon.ico is the theme's generic default document
// icon rather than a brand mark - left blank rather than uploading a non-logo image.
//
// address/maxGuests: no street address is published (home-delivery/pickup business from a small
// settlement) - city set to the settlement itself, address left blank. The site explicitly says
// it serves everything "from a few guests to thousands" with no stated cap, so maxGuests is left
// at a generic placeholder (500) rather than inventing a specific real figure - should be
// corrected via the dashboard edit form once a real figure is known (same caveat as
// scripts/add-oogit.mjs).
//
// Usage: node --env-file=.env.local scripts/add-scoop.mjs

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
const SCRATCH = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/dd7c3c19-a0ef-43c3-892c-3b871e78b18b/scratchpad';
const PHOTO_PATHS = ['cat1.jpeg', 'cat2.jpg', 'cat3.jpg'].map((f) => `${SCRATCH}/scoop-photos/${f}`);

// [name, price, ALACARTE_CATEGORIES categoryId] - read verbatim from scoopcatering.com's own
// rendered product catalog (salads/starters/mains categories, 91 unique products).
const PRODUCTS = [
  ['סלט חצילים על האש', 35, 'salads'],
  ['סלט מלפפונים', 35, 'salads'],
  ['חציל שלם אפוי', 45, 'salads'],
  ['סלט חציל בטעם כבד', 35, 'salads'],
  ['חציל מטוגן', 45, 'salads'],
  ['סלט סלק אדום', 35, 'salads'],
  ['סלט קולורבי', 35, 'salads'],
  ['סלט גרין דיפ', 40, 'salads'],
  ['קונפי שום', 35, 'salads'],
  ['סלט באבא גנוש', 35, 'salads'],
  ['סלט פטריות אסיאתי', 40, 'salads'],
  ['סלט כרוב', 50, 'salads'],
  ['סלט ישראלי', 50, 'salads'],
  ['מיקס חמוצים וזיתים', 30, 'salads'],
  ['חציל שלם אפוי עם טחינה', 35, 'salads'],
  ["סלט בטטה בצ'ילי", 35, 'salads'],
  ['סלט טונה', 35, 'salads'],
  ['סלט טפנד זיתים', 35, 'salads'],
  ['מטבל עגבניות ערבי', 35, 'salads'],
  ['סלט קולסלאו', 35, 'salads'],
  ['סלט זיתים מרוקאי', 35, 'salads'],
  ['כבד קצוץ', 40, 'deli_counter'],
  ['סלט ביצים', 30, 'salads'],
  ['סלט גזר שוק', 40, 'salads'],
  ['סלט מטבוחה מסורתית', 40, 'salads'],
  ['סלט סיזר', 45, 'salads'],
  ['סלט קינואה', 50, 'salads'],
  ['טאבולה', 30, 'salads'],
  ['טחינה', 35, 'salads'],
  ['חומוס', 35, 'salads'],
  ['גבינת שמנת', 30, 'cheese_bread_savory'],
  ['גבינת שמנת בצל ירוק', 30, 'cheese_bread_savory'],
  ['גבינת שמנת שום ושמיר', 30, 'cheese_bread_savory'],
  ['גבינת שמנת זיתים ירוקים', 30, 'cheese_bread_savory'],
  ['גבינת שמנת עם סלמון מעושן', 40, 'cheese_bread_savory'],
  ['סלמון מעושן', 27, 'deli_counter'],
  ['שיפודי פרגית', 100, 'hot_food'],
  ['קציצות גפילטע פיש', 39, 'deli_counter'],
  ['פילה סלומון ברוטב עדין', 100, 'hot_food'],
  ['מיטבולס', 90, 'hot_food'],
  ['סליידרס', 90, 'hot_food'],
  ['כבד עוף', 120, 'hot_food'],
  ['גפילטע פיש מסורתי', 120, 'deli_counter'],
  ['גלילות חצילים ממולאים - מוסקה', 90, 'hot_food'],
  ["סלמון טריאקי וג'ינג'ר", 100, 'hot_food'],
  ['פילה סלומון מרוקאי', 100, 'hot_food'],
  ['פילה סלומון דבש וטימין', 100, 'hot_food'],
  ['פילה אמנון פסטו', 90, 'hot_food'],
  ['דג מטוגן ללא גלוטן', 129, 'hot_food'],
  ['פטריות פורטובלו ממולא בחציל', 90, 'hot_food'],
  ['פטריות פורטובלו ממולאות בבשר', 90, 'hot_food'],
  ['פילה אמנון מרוקאי', 90, 'hot_food'],
  ['סלמון ברוטב חרדל דבש', 100, 'hot_food'],
  ['בריסקט רול עם בצל מטוגן', 95, 'hot_food'],
  ['כנפיים, ברביקיו', 45, 'hot_food'],
  ["כנפיים, צ'ילי מתוק", 45, 'hot_food'],
  ['חזה עוף צרוב על האש', 85, 'hot_food'],
  ['קדירת פאט רוסט', 100, 'hot_food'],
  ['שניצל כרובית', 100, 'hot_food'],
  ['ריב רוסטביף', 100, 'hot_food'],
  ["ג'נרל צוז צ'יקן", 90, 'hot_food'],
  ['חזה עוף מעושן', 100, 'hot_food'],
  ['פרגית ברוטב שום ודבש', 100, 'hot_food'],
  ['אסאדו בבישול איטי', 120, 'hot_food'],
  ['ביף אנד ברוקלי', 100, 'hot_food'],
  ['פופרס חריף ללא גלוטן', 90, 'hot_food'],
  ['שניצל ללא גלוטן', 80, 'hot_food'],
  ['פרוסות צלי בקר', 100, 'hot_food'],
  ['קורנדביף', 100, 'hot_food'],
  ['עוף משמש', 149, 'hot_food'],
  ['KFC', 149, 'hot_food'],
  ['כרעיים ברוטב דבש וטימין', 129, 'hot_food'],
  ['בריסקט', 100, 'hot_food'],
  ['פרוסות לשון', 120, 'hot_food'],
  ['אסאדו מעושן', 100, 'hot_food'],
  ['בריסקט מעושן', 100, 'hot_food'],
  ['שניצלונים ללא גלוטן', 80, 'hot_food'],
  ['עוף לימון', 90, 'hot_food'],
  ['פרגיות ממולאות', 130, 'hot_food'],
  ['עוף מרסלה', 90, 'hot_food'],
  ['פרוסות חזה הודו', 90, 'hot_food'],
  ['עוף מוקפץ', 85, 'hot_food'],
  ['עוף מעושן', 139, 'hot_food'],
  ['צלי עוף קלאסי', 139, 'hot_food'],
  ['סטייק פרגית קלאסי', 100, 'hot_food'],
  ['מוקפץ טופו עם ברוקולי בצל ופטריות', 90, 'pareve_vegan_no_sugar'],
  ['שניצל פרצל', 90, 'hot_food'],
  ['שניצל', 80, 'hot_food'],
  ['שניצלונים', 80, 'hot_food'],
  ['פופרס חריף', 90, 'hot_food'],
  ['פרגיות ברוטב טריאקי', 100, 'hot_food'],
  ["סטיקי צ'יקן", 139, 'hot_food'],
  ['כרעיים ברוטב פירות יבשים', 139, 'hot_food'],
  ['צלי עוף ברוטב חרדל דבש', 139, 'hot_food']
];

const alacartePackage = {
  id: 'ready-food-catalog',
  type: 'a_la_carte',
  name: { he: 'אוכל מוכן - סלטים, מנות פתיחה ועיקריות', en: '', fr: '' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  addons: PRODUCTS.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  })),
  sourceUrl: 'https://www.scoopcatering.com/OurMenu?HolMenue=%D7%A9%D7%91%D7%AA'
};

async function uploadOne(filePath, contentType) {
  const buf = await readFile(filePath);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${path.basename(filePath)}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${path.basename(filePath)} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const photos = [];
  for (const p of PHOTO_PATHS) photos.push(await uploadOne(p, 'image/jpeg'));
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'סקופ קייטרינג',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'סקופ קייטרינג - קייטרינג אונליין כשר למהדרין (מועצה דתית גוש עציון), שהתחיל כבית קפה קטן בבית שמש בידי גרי שיקמן ואריה בן חמו ותוך שנה פתח סניף נוסף באפרת, גוש עציון. פועל היום מהיישוב מיצד ומספק אוכל מוכן ושירותי קייטרינג לכל רחבי הארץ - מטבח חלבי, מטבח בשרי ומחלקת אפייה (הבייקרי של תמרה). מגוון ענק של סלטים, מנות פתיחה ועיקריות בשריות, ללא חומרים משמרים, צבעי מאכל וחומרי טעם וריח מלאכותיים, כולל אפשרויות ללא גלוטן, צמחוני וטבעוני.',
      en: "Scoop Catering - kosher mehadrin (Gush Etzion religious council) online catering that started as a small café in Beit Shemesh, founded by Gerry Shikman and Arye Ben Chamo, and within a year opened a second branch in Efrat, Gush Etzion. Today it operates from the settlement of Mitzad and delivers ready-made food and catering services nationwide - a dairy kitchen, a meat kitchen, and its own bakery department (Tamara's Bakery). A huge range of salads, starters and meat mains, free of preservatives, food coloring and artificial flavors, including gluten-free, vegetarian and vegan options.",
      fr: "Scoop Catering - traiteur en ligne cacher mehadrin (conseil religieux du Goush Etzion), né comme un petit café à Beit Shemesh fondé par Gerry Shikman et Arye Ben Chamo, qui a ouvert une seconde succursale à Efrat, dans le Goush Etzion, en moins d'un an. Aujourd'hui basé dans la localité de Mitzad, il livre des plats préparés et des services de traiteur dans tout le pays - une cuisine laitière, une cuisine carnée et son propre département boulangerie (la Boulangerie de Tamara). Un immense choix de salades, d'entrées et de plats carnés, sans conservateurs, colorants ni arômes artificiels, avec des options sans gluten, végétariennes et véganes."
    },
    districts: ['judea_samaria', 'jerusalem', 'center'],
    city: { he: 'מיצד', en: 'Mitzad', fr: 'Mitzad' },
    address: '',
    kashrutLevels: ['mehadrin'],
    cateringTypes: ['dairy', 'meat'],
    maxGuests: 500, // not published - judgment-call placeholder, see header comment
    priceFrom: 27,
    packages: [alacartePackage],
    eventTypes: ['shabbat_chatan', 'celebration', 'rosh_hashana'],
    menuCategories: [],
    alaCarteCategories: ['salads', 'hot_food', 'deli_counter', 'cheese_bread_savory', 'pareve_vegan_no_sugar'],
    services: ['free_delivery', 'gluten_free_options', 'vegetarian_food'],
    phone: '+972-54-290-2590',
    whatsapp: '+972539526558',
    email: 'service@scoopcatering.com',
    website: 'https://www.scoopcatering.com/',
    instagram: '',
    facebook: '',
    logo: '', // no real brand logo asset found - see header comment
    photos,
    videos: [],
    status: 'approved',
    reviewedBy: 'yelotag@gmail.com',
    reviewedAt: now,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };

  await kv.set(`caterer:${record.id}`, record);
  await kv.sadd('caterers:index', record.id);
  await kv.sadd(`owner:${record.ownerEmail}`, record.id);
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, ${photos.length} photos, and ${alacartePackage.addons.length} à la carte items.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
