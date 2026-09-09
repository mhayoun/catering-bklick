// One-off script: adds "Munier" as a new, pre-approved caterer, sourced from its own Shopify
// storefront https://munier.co.il/ - a dairy-only hosting-tray caterer based near Rishon
// LeZion, with nationwide delivery (tiered delivery fee zones, see /pages/יעדי-משלוח). Logo +
// 1 photo are downloaded locally then uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention).
//
// Every item has a REAL published price - this is a genuine e-commerce catalog (43 unique
// products across the "מגשי אירוח" and "קינוחים אישיים" collections; the "כריכים" collection is
// entirely a subset of "מגשי אירוח" and contributes no new items). Modeled as one a_la_carte
// package, same convention as scripts/add-tmarim-alacarte-trays.mjs and scripts/add-pasha.mjs.
//
// kashrutLevels is real, from the site's own /כשרות/ page: "רבנות ראשון לציון ובד\"צ 'בית
// יוסף'" (Rishon LeZion Rabbinate + Badatz Beit Yosef) - both map onto real KASHRUT_LEVELS
// entries.
//
// districts covers all 7 - the delivery-zone page prices routes as far as Beer Sheva and the
// Golan (with a distance-based fee), i.e. de facto nationwide, same reasoning as
// scripts/add-ayala.mjs's "כל הארץ" listings.
//
// Usage: node --env-file=.env.local scripts/add-munier.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/munier-site';

const PRODUCTS = [
  ['מגש קרואסון פיקורינו (15 יח\')', 225, 'sandwiches_trays'],
  ['מגש קרואסון סלמון (15 יח\')', 225, 'sandwiches_trays'],
  ['מגש קאנאפס (24 יח\')', 240, 'cheese_bread_savory'],
  ['מגש מיני פרצעל אמנטל | גבינת עיזים (20 יח\')', 250, 'sandwiches_trays'],
  ['מגש כריכוני ביס סביח (15 יח\')', 225, 'sandwiches_trays'],
  ['מגש פחזניות מלוחות (24 יח\')', 240, 'quiches_pies_burekas'],
  ['מגש מיני פיתה מקושקשת (20 יח\')', 215, 'sandwiches_trays'],
  ["מגש מיני פיתה טבעוני כרובית צלויה / חציל (20 יח')", 215, 'pareve_vegan_no_sugar'],
  ['מגש בורקיטס יווני (12 יח\')', 170, 'quiches_pies_burekas'],
  ['מגש כריכי סלט ביצים ללא קמח חיטה (12 יח\')', 205, 'sandwiches_trays'],
  ['מגש כריכי סלט טונה ללא קמח חיטה (12 יח\')', 205, 'sandwiches_trays'],
  ['מגש כריכי ביס סלט טונה (9 יח\')', 130, 'sandwiches_trays'],
  ['מגש כריכי ביס סלט ביצים (9 יח\')', 130, 'sandwiches_trays'],
  ['מגש כריכי מיני פרנה טונה פועלים (15 יח\')', 225, 'sandwiches_trays'],
  ['מגש כריכי ביס דגנים פטה ופלפל קלוי (15 יח\')', 225, 'sandwiches_trays'],
  ['מגש ירקות גינה גדול', 190, 'fruit_veg'],
  ['מגש פירות העונה', 219, 'fruit_veg'],
  ['מגש עלי גפן (32 יח\')', 189, 'hot_food'],
  ['מגש מאפים מלוחים (30 יח\')', 180, 'quiches_pies_burekas'],
  ['מגש מיני קישים (18 יח\')', 250, 'quiches_pies_burekas'],
  ['מגש לביבות בטטה (20 יח\')', 161, 'hot_food'],
  ['מגש מטבלי בוקר (6 יח\')', 95, 'salads'],
  ['מגש מטבלים טבעוני (6 יח\')', 95, 'pareve_vegan_no_sugar'],
  ['מגש גבינות רכות', 195, 'cheese_bread_savory'],
  ['מגש פחזניות של מונייר (24 יח\')', 189, 'desserts_sweets'],
  ['מגש מאפים מתוקים (46 יח\')', 169, 'desserts_sweets'],
  ['מגש מיני פיננסייר (60 יח\')', 155, 'desserts_sweets'],
  ['מגש פרופיטרול שוקולד (20 יח\')', 179, 'desserts_sweets'],
  ['מגש מיקס קינוחים', 237, 'desserts_sweets'],
  ['מגש פטיפורים פרווה (24 יח\')', 189, 'pareve_vegan_no_sugar'],
  ['מגש מיני טארטלט פרלינה ושוקולד (15 יח\')', 210, 'desserts_sweets'],
  ['מגש מיני טארטלט סנט מונייר (15 יח\')', 210, 'desserts_sweets'],
  ['מגש מיני טארטלט לימון ומרנג צרפתי (15 יח\')', 210, 'desserts_sweets'],
  ['מגש מיני חיתוכיות עוגת גבינה (24 יח\')', 220, 'desserts_sweets'],
  ['מגש כוסיות מוס גבינה ופירות יער (12 יח\')', 190, 'desserts_sweets'],
  ['מגש כוסיות מוס פיסטוק ושוקולד לבן (12 יח\')', 190, 'desserts_sweets'],
  ['מגש כוסיות מוס שוקולד (12 יח\')', 190, 'desserts_sweets'],
  ['טראפלס שוקולד (9 יח\')', 49, 'desserts_sweets'],
  ['מגש בראוניז שוקולד (20 יח\')', 150, 'desserts_sweets'],
  ['מגש מיני עוגת שוקולד שילדים אוהבים (15 יח\')', 142, 'desserts_sweets'],
  ['מגש כדורי שוקולד קוקוס / סוכריות (30 יח\')', 175, 'desserts_sweets'],
  ['טראפלס תמרים טבעוני (12 יח\')', 70, 'pareve_vegan_no_sugar'],
  ['מגש מיני טארטלט פטיסייר ופירות העונה (15 יח\')', 280, 'desserts_sweets']
];

const alaCartePackage = {
  id: 'hosting-catalog',
  type: 'a_la_carte',
  name: { he: 'מגשי אירוח וקינוחים (קטלוג חנות)', en: 'Hosting Trays & Desserts (Shop Catalog)', fr: 'Plateaux de Réception et Desserts (Catalogue Boutique)' },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://munier.co.il/collections/%D7%9E%D7%92%D7%A9%D7%99-%D7%90%D7%99%D7%A8%D7%95%D7%97',
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
    businessName: 'Munier',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'Munier - מגשי אירוח וקייטרינג חלבי כשרים לאירועים, פועלים תחת השגחת כשרות קפדנית של רבנות ראשון לציון ובד"צ בית יוסף. מגוון עשיר של כריכים, מגשי אירוח, סלטים, קישים ופטיסרי איכותי המתאימים לכל סוג אירוע, עם משלוח ארצי.',
      en: "Munier - kosher dairy hosting trays and catering for events, operating under the strict kashrut supervision of the Rishon LeZion Rabbinate and Badatz Beit Yosef. A rich selection of sandwiches, hosting trays, salads, quiches and quality patisserie suited to any event, with nationwide delivery.",
      fr: "Munier - plateaux de réception et traiteur lacté cachers pour événements, opérant sous la supervision stricte du Rabbinat de Rishon LeZion et du Badatz Beit Yossef. Un large choix de sandwichs, plateaux de réception, salades, quiches et pâtisserie de qualité adaptés à tout événement, avec livraison dans tout le pays."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'],
    city: { he: 'ראשון לציון', en: 'Rishon LeZion', fr: 'Rishon LeZion' },
    address: '',
    kashrutLevels: ['badatz_beit_yosef', 'local_rabbinate'],
    cateringTypes: ['dairy'],
    maxGuests: 300,
    priceFrom: '', // no per-guest/per-event pricing published, only per-tray shop prices (see a_la_carte package)
    packages: [alaCartePackage],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options'],
    phone: '+972-77-9562994',
    whatsapp: '+972555072700',
    email: 'info@munier.co.il',
    website: 'https://munier.co.il/',
    instagram: 'https://www.instagram.com/munier.hosting/',
    facebook: 'https://www.facebook.com/munierfoodideas',
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
