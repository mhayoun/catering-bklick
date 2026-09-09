// One-off script: adds "מוזה" as a new, pre-approved caterer, sourced from its directory
// listing at https://cateringisrael.co.il/catering-suppliers/mooza/ (no dedicated website).
// 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as
// scripts/add-ayala.mjs and scripts/add-erez-vechanan.mjs):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - menuCategories: no unambiguous dish-category signal on the listing (unlike erez-vechanan's
//   "קייטרינג אסאדו") - left [].
//
// Unlike the other listings so far, this one gives a specific kashrut level: "כשר למהדרין" plus
// the listing's own "about" blurb naming "הרב מחפוד" (Rav Machpud) as a supervising authority -
// both map onto real KASHRUT_LEVELS entries (lib/constants.js), so kashrutLevels isn't left empty
// here.
//
// Usage: node --env-file=.env.local scripts/add-mooza.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/mooza-photos';
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
    businessName: 'מוזה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג לאירועים איכותי טעים וטרי, המציע שירות מקצועי ומעולה לכל אירוע. הקייטרינג שלנו כשר למהדרין, בכשרויות המהודרות ביותר - הרב מחפוד, בג"ץ יורה דעה, רבנות מהדרין מטה בנימין ומומלצי "כושרות". אנו מציעים קייטרינג לאירועים קטנים וגדולים ומנות המתאימות לכל לקוח, תוך דגש על איכות ויחס אישי.',
      en: 'Quality, delicious and fresh event catering, offering professional and excellent service for every event. Kosher mehadrin, under the most stringent kashrut supervisions - Rabbi Machpud, the Yoreh Deah Beit Din, the Mateh Binyamin Mehadrin rabbinate, and recommended by "Kashrut". We offer catering for small and large events with dishes suited to every client, with an emphasis on quality and personal attention.',
      fr: "Traiteur événementiel de qualité, savoureux et frais, offrant un service professionnel et excellent pour chaque événement. Cacher mehadrin, sous les supervisions de cacherout les plus strictes - le rabbin Machpud, le beit din Yoré Déa, le rabbinat mehadrin de Mateh Binyamin, et recommandé par \"Kashrout\". Nous proposons un service traiteur pour petits et grands événements, avec des plats adaptés à chaque client, dans un souci de qualité et d'attention personnelle."
    },
    districts: ['jerusalem', 'center', 'telaviv'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['badatz_rav_machpud', 'mehadrin'], // listing: כשר למהדרין + "הרב מחפוד" named in the about text
    cateringTypes: ['dairy', 'meat'], // listing: קייטרינג בשרי, חלבי
    maxGuests: 600,
    priceFrom: 145,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'], // listing: אירוע עסקי, ברית/ה, יום הולדת, בר/בת מצווה, אירוע קטן, חתונה
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options'], // צמחוני + ללא גלוטן/טבעוני
    phone: '+972-77-8047409',
    whatsapp: '+972778047409',
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
