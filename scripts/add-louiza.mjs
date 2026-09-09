// One-off script: adds "קייטרינג לואיזה" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/קייטרינג-לואיזה/ (no
// dedicated website). 3 gallery photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the
// record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing (the "about"
//   blurb mentions a kitchen "in the rural area of the Judean hills, among ancient olive trees",
//   but no street address).
// - menuCategories: no dish-category signal on the listing - left [].
//
// kashrutLevels gets 'mehadrin' (listing states "כשר למהדרין" explicitly), same treatment as
// scripts/add-mooza.mjs and unlike the generic "כשר"-only listings left empty elsewhere.
//
// Usage: node --env-file=.env.local scripts/add-louiza.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/louiza-photos';
const PHOTO_FILES = ['photo1.jpeg', 'photo2.jpg', 'photo3.jpg'];

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
    businessName: 'קייטרינג לואיזה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'אנחנו בלואיזה יוצרים קולינריה ישראלית ייחודית במטבח הממוקם באיזור הכפרי של הרי יהודה, בין עצי זית עתיקים וגן ירק שופע עשבי תיבול וצמחייה מקומית. אהבת האדם, הקהילה המקומית, התשוקה לקולינריה וההנאה שבאירוח מכתיבים את הערכים מהם אנחנו פועלים, לצד תפיסת ה-slow food, הדוגלת ביצירה 100% מקומית, שמירה על איכות הסביבה, צרכנות מוסרית ושימוש בחומרי גלם אורגניים, טריים ומקומיים.',
      en: "At Louiza we create unique Israeli cuisine in a kitchen located in the rural area of the Judean hills, among ancient olive trees and a vegetable garden full of herbs and local plants. Love of people, the local community, a passion for cuisine and the joy of hosting guide the values we act by, alongside a slow-food philosophy that champions 100% local creation, environmental stewardship, ethical consumption, and organic, fresh, local ingredients.",
      fr: "Chez Louiza, nous créons une cuisine israélienne unique dans une cuisine située dans la zone rurale des collines de Judée, parmi des oliviers centenaires et un potager riche en herbes et plantes locales. L'amour des gens, de la communauté locale, la passion de la cuisine et le plaisir de recevoir guident nos valeurs, aux côtés d'une philosophie slow food prônant une création 100% locale, le respect de l'environnement, une consommation responsable et des ingrédients bio, frais et locaux."
    },
    districts: ['jerusalem', 'center', 'judea_samaria'], // listing: ירושלים, מרכז, יישובי יהודה
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['mehadrin'], // listing: כשר למהדרין
    cateringTypes: ['dairy', 'meat'], // listing: קייטרינג בשרי, חלבי
    maxGuests: 600,
    priceFrom: 285,
    packages: [],
    eventTypes: ['wedding', 'celebration'], // listing: אירוע עסקי, חתונה, יום הולדת
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // ללא גלוטן/טבעוני + עמדות שף
    phone: '+972-2-5337120',
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
