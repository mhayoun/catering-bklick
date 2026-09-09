// One-off script: adds "איילה" as a new, pre-approved caterer, sourced from its directory
// listing at https://cateringisrael.co.il/catering-suppliers/איילה/ (no dedicated website).
// 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is written.
//
// Fields intentionally left blank/empty rather than guessed:
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city: not published on the listing.
// - website/email/instagram/facebook: none published (only the directory's own Facebook link).
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named,
//   and KASHRUT_LEVELS (lib/constants.js) requires a specific one - left [] rather than guessing.
// - cateringTypes: CATERING_TYPES only has dairy/meat; this listing's "סוג אוכל" tags are
//   טבעוני/צמחוני (vegan/vegetarian), which don't fit either - left [], vegetarian covered via
//   services below instead.
// - menuCategories: no dish-level detail is published (no "תפריט" content on the listing) -
//   left [] rather than guessing.
//
// Usage: node --env-file=.env.local scripts/add-ayala.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/ayala-photos';
const PHOTO_FILES = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];

async function uploadPhotos() {
  const urls = [];
  for (const file of PHOTO_FILES) {
    const buf = await readFile(path.join(SRC_DIR, file));
    const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
    const blob = await put(filename, buf, { access: 'public', contentType: 'image/jpeg' });
    urls.push(blob.url);
    console.log(`Uploaded ${file} -> ${blob.url}`);
  }
  return urls;
}

async function main() {
  const photos = await uploadPhotos();
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'איילה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'איילה מגיעה עם קייטרינג צבעוני ומרהיב עם שפע ירקות אורגניים. אירועי הגשה לשולחן, קוקטייל מסתובב ודוכנים משמחים עם טעמים שיכבשו את לבם של כל הנוכחים. איילה זו חגיגה, שמאפשרת הנאה צרופה לצד צריכה נבונה - מנות עשירות שמתאימות לכל חך, הגשה יוצאת דופן, תפריטים מגוונים ובשורה קולינרית חדשה.',
      en: 'Ayala brings colorful, striking catering with an abundance of organic vegetables. Table-service events, roaming cocktail service and delightful stations with flavors that win over every guest. Ayala is a celebration that lets you enjoy fully while eating mindfully - rich dishes for every palate, unusual presentation, varied menus and a fresh culinary approach.',
      fr: "Ayala propose un service traiteur coloré et spectaculaire, riche en légumes bio. Repas servis à table, cocktail dînatoire et stands gourmands aux saveurs qui conquièrent tous les invités. Ayala, c'est la fête qui permet un plaisir pur allié à une consommation raisonnée - des plats généreux adaptés à tous les palais, une présentation originale, des menus variés et une nouvelle approche culinaire."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: [],
    maxGuests: 1000,
    priceFrom: 275,
    packages: [],
    eventTypes: ['wedding', 'celebration'], // listing: אירוע עסקי, חתונה, אירוע קטן
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // בופה/פינגר פוד/עמדות שף + ללא גלוטן/טבעוני
    phone: '+972-50-6364205',
    whatsapp: '+972506364205',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    photos,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id} and ${photos.length} photos.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
