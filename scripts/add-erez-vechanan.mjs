// One-off script: adds "ארז וחנן" as a new, pre-approved caterer, sourced from its directory
// listing at https://cateringisrael.co.il/catering-suppliers/ארז-וחנן/ (no dedicated website).
// 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as
// scripts/add-ayala.mjs):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named,
//   and KASHRUT_LEVELS (lib/constants.js) requires a specific one - left [] rather than guessing.
//
// menuCategories gets one entry (main_courses) because the listing's "קייטרינג אסאדו" tag is an
// unambiguous main-course signal - unlike ayala's listing, which had no such signal.
//
// Usage: node --env-file=.env.local scripts/add-erez-vechanan.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/erezvechanan-photos';
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
    businessName: 'ארז וחנן',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג ארז וחנן מבשלים אופים והופכים את החוויה לצבעונית ומרגשת, עשירה בטעמים וריחות. חומרי הגלם עונתיים ואיכותיים, בשר ודגים משובחים ועד מאפייה עם טעמים וריחות יחממו את ליבכם וישמחו את האורחים שלכם. הקייטרינג מתמחה בתפריטים ייחודיים בעלי נופך אישי לכל אירוע.',
      en: 'Erez VeChanan cook, bake, and turn the experience colorful and moving, rich in flavors and aromas. Seasonal, quality ingredients - from fine meat and fish to a bakery full of warmth - will delight your guests. The caterer specializes in unique menus with a personal touch for every event.',
      fr: "Erez VeChanan cuisinent et pâtissent pour transformer l'expérience en un moment coloré et émouvant, riche en saveurs et en arômes. Des ingrédients de saison et de qualité - de la viande et du poisson raffinés jusqu'à une pâtisserie pleine de chaleur - raviront vos invités. Ce traiteur est spécialisé dans des menus uniques avec une touche personnelle pour chaque événement."
    },
    districts: ['north', 'haifa', 'center', 'telaviv'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: ['dairy', 'meat'], // listing: קייטרינג בשרי, חלבי
    maxGuests: 700,
    priceFrom: 325,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'], // listing: אירוע עסקי, חתונה, ברית/ה, יום הולדת, בר/בת מצווה, אירוע קטן
    menuCategories: ['main_courses'], // listing: קייטרינג אסאדו (unambiguous main-course signal)
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // צמחוני + ללא גלוטן/טבעוני + עמדות שף
    phone: '+972-52-9011201',
    whatsapp: '+972529011201',
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
