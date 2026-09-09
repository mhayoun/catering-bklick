// One-off script: adds "קייטרינג משהו מיוחד" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/קייטרינג-משהו-מיוחד/ (no
// dedicated website). 3 gallery photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the
// record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
//
// kashrutLevels gets 'mehadrin' (listing states "כשר למהדרין" explicitly, same treatment as
// scripts/add-mooza.mjs and scripts/add-louiza.mjs), no specific rabbi/badatz named though.
// districts covers all 7 - the listing's own "אזורי פעילות" list explicitly leads with
// "כל הארץ" (nationwide), same reasoning as scripts/add-ayala.mjs.
// menuCategories gets main_courses because "קייטרינג אסאדו" is an unambiguous main-course
// signal, same reasoning as scripts/add-erez-vechanan.mjs ("קייטרינג סושי" has no
// MENU_CATEGORIES equivalent, so it isn't reflected).
//
// Usage: node --env-file=.env.local scripts/add-mashehu-meyuchad.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/mashehu-photos';
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
    businessName: 'קייטרינג משהו מיוחד',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג משהו מיוחד הוא מותג וותיק בתחום הקייטרינג לאירועים, אנו דוגלים ביצירת חוויה קולינרית כשרה למהדרין, איכותית וטעימה במיוחד כדי להפוך את האירוע שלכם לחוויה בלתי נשכחת - זמינים בפריסה ארצית!',
      en: 'Mashehu Meyuchad Catering is a veteran brand in event catering. We champion creating a kosher mehadrin culinary experience, of exceptional quality and taste, to turn your event into an unforgettable experience - available nationwide!',
      fr: "Mashehu Meyuchad Catering est une marque vétérante dans le domaine du traiteur événementiel. Nous nous engageons à créer une expérience culinaire cacher mehadrin, d'une qualité et d'un goût exceptionnels, pour transformer votre événement en une expérience inoubliable - disponible dans tout le pays !"
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['mehadrin'], // listing: כשר למהדרין
    cateringTypes: ['dairy', 'meat'], // listing: קייטרינג בשרי, חלבי
    maxGuests: 1000,
    priceFrom: 200,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'], // listing: אירוע עסקי, חתונה, ברית/ה, יום הולדת, בר/בת מצווה
    menuCategories: ['main_courses'], // listing: קייטרינג אסאדו (unambiguous main-course signal)
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // צמחוני/טבעוני + ללא גלוטן + עמדות שף
    phone: '+972-77-8051907',
    whatsapp: '',
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
