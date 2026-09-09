// One-off script: adds "Food Craft" as a new, pre-approved caterer, sourced from its directory
// listing at https://cateringisrael.co.il/catering-suppliers/food-craft/ (no dedicated
// website). Logo + 3 gallery photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the
// record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - address/city, website/email/instagram/facebook: none published on the listing (two extra
//   external links on the page - enable.co.il, upress.co.il - are an accessibility-widget vendor
//   and a press credit, not this business's own site, so not used as `website`).
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named -
//   left [] (same treatment as scripts/add-ayala.mjs and others in this directory).
// - menuCategories: no dish-category signal on the listing - left [].
//
// Unlike every other listing scraped from this directory so far, this one DOES have its own
// logo image ("פודקראפט-לוגו.png") distinct from the directory site's generic logo - so `logo`
// is filled in here.
//
// Usage: node --env-file=.env.local scripts/add-food-craft.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/foodcraft-photos';
const LOGO_FILE = 'logo.png';
const PHOTO_FILES = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne(LOGO_FILE, 'image/png');
  const photos = [];
  for (const f of PHOTO_FILES) {
    photos.push(await uploadOne(f, 'image/jpeg'));
  }
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'Food Craft',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'בין אם מדובר באירוע פרטי או עסקי, אנחנו כאן להעצים את החוויה. באמצעות התאמת תפריט שף המביא את הקולינריה הבינלאומית והבוטיקית אליכם לצלחת. תוך שימוש בחומרי גלם משובחים וטריים, תשומת לב לכל שלב בהכנה והקפדה מיוחדת על האווירה, העיצוב והתפאורה. אף אירוע שלנו לא נראה כמו זה שקדם לו או זה שיבוא אחריו – היצירה מותאמת לצרכים והחלומות שלכם.',
      en: "Whether it's a private or corporate event, we're here to elevate the experience. Through a tailored chef's menu bringing international, boutique cuisine to your plate. Using fine, fresh ingredients, attention to every stage of preparation, and special care for atmosphere, design and decor. No two of our events look alike - each creation is tailored to your needs and dreams.",
      fr: "Qu'il s'agisse d'un événement privé ou professionnel, nous sommes là pour sublimer l'expérience. Grâce à un menu de chef sur mesure, qui apporte à votre assiette une cuisine internationale et raffinée. En utilisant des ingrédients frais et de qualité, une attention portée à chaque étape de la préparation, et un soin particulier pour l'ambiance, le design et le décor. Aucun de nos événements ne ressemble au précédent ou au suivant - chaque création est adaptée à vos besoins et à vos rêves."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: ['meat'], // listing: קייטרינג בשרי, קייטרינג ארוחת בוקר - no dairy tag
    maxGuests: 600,
    priceFrom: 305,
    packages: [],
    eventTypes: ['wedding', 'celebration'], // listing: חתונה, יום הולדת, אירוע עסקי, אירוע קטן
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // ללא גלוטן/טבעוני + עמדות שף
    phone: '+972-55-4310398',
    whatsapp: '+972554310398',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    logo: logoUrl,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, and ${photos.length} photos.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
