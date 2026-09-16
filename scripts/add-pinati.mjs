// One-off script: adds "פינתי גוש עציון" (Pinati) as a new, pre-approved caterer, sourced
// directly from its own site, https://www.pinati-etzion.com/ (found via web search for kosher
// caterers in Gush Etzion/Judea-Samaria - the least-represented district among existing
// listings). Primarily a sit-down Eastern-Mediterranean/Israeli restaurant ("since 1975" per its
// own logo badge) in Kfar Etzion's commercial center, which also does deliveries, takeaway,
// catering for events, and pre-made Shabbat food - the "food-for-shabbat"/"events" side of the
// business is what makes it relevant to this directory.
//
// No overlap found with any existing caterer in this project.
//
// Modeled as an a_la_carte catalog (same convention as scripts/add-rivkin.mjs and
// scripts/add-tmarim-alacarte-trays.mjs) rather than per-guest formulas: the site's real,
// itemized delivery/takeaway menu (Wix Restaurants app, at /menu?menu=... - confirmed via the
// site's own restaurants-menu-sitemap.xml, not scraped from a blog or paraphrased) lists ~90
// individually priced dishes across 13 categories, with no per-guest event-package pricing
// published anywhere on the site. priceFrom is therefore left blank, same reasoning as Rivkin.
//
// kashrutLevels: site states "כשר למהדרין" (a header banner + a linked "קושר certificate" page)
// with no named badatz/rabbi anywhere, including on the certificate page itself, which only
// repeats "Kosher כשר למהדרין" as a text badge with no scanned certificate image - left as
// ['mehadrin'] only.
//
// whatsapp: the site only exposes a wa.link/... short link, not the raw number in its HTML;
// resolved via the short link's redirect target (curl -I) to +972522974080.
//
// Usage: node --env-file=.env.local scripts/add-pinati.mjs

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
const LOGO_PATH =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad/pinati-imgs/5ba039_e6c38ef906ba441c95649b73d394d0d6_mv2.png';

// [name, price, ALACARTE_CATEGORIES categoryId] - transcribed from the site's own delivery/
// takeaway menu at /menu?menu=תפריט-משלוחים-וטייקאווי.
const PRODUCTS = [
  ['פיתה חזה עוף בגריל', 49, 'sandwiches_trays'], ['פיתה קבב הבית', 49, 'sandwiches_trays'],
  ['פיתה מעורב ירושלמי', 55, 'sandwiches_trays'], ['פיתה שווארמה עגל', 55, 'sandwiches_trays'],
  ['פיתה שווארמה פרגית', 55, 'sandwiches_trays'], ['פיתה שווארמה מיקס', 55, 'sandwiches_trays'],
  ['פיתה שניצל קריספי', 49, 'sandwiches_trays'], ['פיתה קבב טבעוני', 51, 'sandwiches_trays'],
  ['לאפה חזה עוף בגריל', 54, 'sandwiches_trays'], ['לאפה קבב הבית', 54, 'sandwiches_trays'],
  ['לאפה מעורב ירושלמי', 61, 'sandwiches_trays'], ['לאפה שווארמה עגל', 61, 'sandwiches_trays'],
  ['לאפה שווארמה פרגית', 61, 'sandwiches_trays'], ['לאפה שווארמה מיקס', 61, 'sandwiches_trays'],
  ['לאפה שניצל קריספי', 54, 'sandwiches_trays'], ['לאפה קבב טבעוני', 56, 'sandwiches_trays'],
  ['טורטייה חזה עוף בגריל', 54, 'sandwiches_trays'], ['טורטייה קבב הבית', 54, 'sandwiches_trays'],
  ['טורטייה שווארמה עגל', 61, 'sandwiches_trays'], ['טורטייה שווארמה פרגית', 61, 'sandwiches_trays'],
  ['טורטייה שווארמה מיקס', 61, 'sandwiches_trays'], ['טורטייה שניצל קריספי', 54, 'sandwiches_trays'],
  ['טורטייה קבב טבעוני', 56, 'sandwiches_trays'],
  ['עסקית חזה עוף בגריל', 72, 'hot_food'], ['עסקית קבב הבית', 72, 'hot_food'],
  ['עסקית מעורב ירושלמי', 75, 'hot_food'], ['עסקית שווארמה עגל', 75, 'hot_food'],
  ['עסקית שווארמה פרגית', 75, 'hot_food'], ['עסקית שניצל קריספי', 72, 'hot_food'],
  ['עסקית קבב טבעוני', 75, 'hot_food'], ['עסקית מוסקה', 65, 'hot_food'],
  ['עסקית קציצות בקר', 65, 'hot_food'], ['עסקית שווארמה מיקס', 75, 'hot_food'],
  ['אורז לבן', 22, 'hot_food'], ['אורז שעועית', 32, 'hot_food'], ['קוסקוס וירקות', 35, 'hot_food'],
  ["צ'יפס", 22, 'hot_food'], ['תפו"א אפוי', 22, 'hot_food'], ['סלט ירקות', 29, 'salads'],
  ['סלט חזה עוף בגריל', 59, 'salads'], ['סלט שניצל', 59, 'salads'], ['סלט שווארמה עגל', 59, 'salads'],
  ['סלט קבב הבית', 59, 'salads'], ['סלט בריאות', 49, 'salads'], ['סלט שווארמה פרגית', 59, 'salads'],
  ['קובה חמוסתא', 45, 'hot_food'], ['קובה סלק', 45, 'hot_food'], ['מרק שעועית', 35, 'hot_food'],
  ['מרק ירקות', 39, 'hot_food'],
  ["המבורגר ילדים + צ'יפס + טרופית", 51, 'hot_food'], ["שניצלונים ילדים + צ'יפס + טרופית", 51, 'hot_food'],
  ["ארוחת ילדים כנפיים + צ'יפס + טרופית", 51, 'hot_food'],
  ['חומוס גרגירים', 33, 'deli_counter'], ['חומוס שווארמה', 49, 'deli_counter'],
  ['חומוס בשר', 49, 'deli_counter'], ['חומוס רצועות חזה עוף', 49, 'deli_counter'],
  ['חומוס מעורב ירושלמי', 49, 'deli_counter'], ['חומוס פטריות', 36, 'deli_counter'],
  ['המבורגר בקר 200 גרם', 49, 'hot_food'], ['עסקית המבורגר בקר', 68, 'hot_food'],
  ['המבורגר טבעוני', 49, 'hot_food'], ['עסקית המבורגר טבעוני', 68, 'hot_food'],
  ['סיגר מרוקאי במילוי בשר', 42, 'hot_food'], ['כרובית מצופה בפנקו', 49, 'hot_food'],
  ["כנפי עוף מוקפצות בצ'ילי מתוק", 45, 'hot_food'], ['קובה נבלוסיה במילוי בשר', 42, 'hot_food'],
  ['פסטל תפוח אדמה', 39, 'hot_food'], ['שניצלונים', 39, 'hot_food'],
  ['זוג אגרול ירקות', 29, 'hot_food'], ['חטיפי תפו"א במילוי תירס', 29, 'hot_food'],
  ['קולה', 12, 'drinks'], ['קולה זירו', 12, 'drinks'], ['ספרייט', 12, 'drinks'],
  ['ספרייט זירו', 12, 'drinks'], ['פאנטה', 12, 'drinks'], ['מים מינרלים', 11, 'drinks'],
  ['סודה', 11, 'drinks'], ['פריגת מנגו', 12, 'drinks'], ['פריגת תפוזים', 12, 'drinks'],
  ['פריגת ענבים', 12, 'drinks'], ['פריגת אשכוליות', 12, 'drinks'], ['פיוזטי אפרסק', 12, 'drinks'],
  ['מים בטעם אפרסק', 12, 'drinks'], ['מים בטעם ענבים', 12, 'drinks'], ['מים בטעם תפוח', 12, 'drinks'],
  ['בירה שחורה', 12, 'drinks'], ['טרופית', 5, 'drinks'], ['בירה אש בלונדינית', 24, 'drinks'],
  ['הבירה המכוערת', 24, 'drinks'], ['בירה טריפל בלגית', 24, 'drinks']
];

const alaCartePackage = {
  id: 'delivery-menu',
  type: 'a_la_carte',
  name: { he: 'תפריט משלוחים וטייקאווי', en: 'Delivery & Takeaway Menu', fr: 'Menu Livraison et à Emporter' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.pinati-etzion.com/menu?menu=%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%9E%D7%A9%D7%9C%D7%95%D7%97%D7%99%D7%9D-%D7%95%D7%98%D7%99%D7%99%D7%A7%D7%90%D7%95%D7%95%D7%99',
  addons: PRODUCTS.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  }))
};

async function main() {
  const buf = await readFile(LOGO_PATH);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-pinati-logo.png`;
  const blob = await put(filename, buf, { access: 'public', contentType: 'image/png' });
  console.log(`Uploaded logo -> ${blob.url}`);
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'פינתי גוש עציון',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'פינתי גוש עציון - מסעדה כשרה למהדרין הפועלת מאז 1975, ממוקמת במרכז המסחרי "חצר הכפר" בכפר עציון. מטבח מזרחי אותנטי בשילוב גריל בשרים, פיתות, לאפות, חומוסים וסלטים, עם תפריט צהריים עסקי ותפריט ערב חגיגי. לצד הישיבה במקום - משלוחים, טייקאווי, אוכל מוכן לשבת וקייטרינג לאירועים באזור גוש עציון והסביבה.',
      en: 'Pinati Gush Etzion - a kosher mehadrin restaurant operating since 1975, located in the "Chatzer HaKfar" commercial center in Kfar Etzion. Authentic Eastern-Mediterranean cuisine combined with meat grilling, pitas, laffa wraps, hummus dishes and salads, with a business lunch menu and a festive dinner menu. Alongside dine-in seating - delivery, takeaway, ready-made Shabbat food and event catering across Gush Etzion and the surrounding area.',
      fr: "Pinati Gush Etzion - un restaurant cacher mehadrin actif depuis 1975, situé dans le centre commercial \"Chatzer HaKfar\" à Kfar Etzion. Cuisine orientale authentique combinée à des grillades de viande, pitas, laffas, houmous et salades, avec un menu déjeuner d'affaires et un menu dîner festif. En plus du service sur place - livraison, à emporter, plats prêts pour Shabbat et traiteur pour événements dans la région de Gush Etzion."
    },
    districts: ['judea_samaria'],
    city: { he: 'כפר עציון', en: 'Kfar Etzion', fr: 'Kfar Etzion' },
    address: 'מרכז מסחרי "חצר הכפר", כפר עציון',
    kashrutLevels: ['mehadrin'], // "כשר למהדרין" - no named badatz/rabbi, see header comment
    cateringTypes: ['meat'],
    maxGuests: '', // not published
    priceFrom: '', // no per-guest pricing - a_la_carte catalog only, see header comment
    packages: [alaCartePackage],
    eventTypes: ['celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-73-3322202',
    whatsapp: '+972522974080',
    email: '',
    website: 'https://www.pinati-etzion.com/',
    instagram: '',
    facebook: '',
    logo: blob.url,
    photos: [],
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, and ${alaCartePackage.addons.length} menu items.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
