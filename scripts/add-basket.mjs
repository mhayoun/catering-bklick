// One-off script: adds "קייטרינג בסקט" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/basket/ (no dedicated
// website). 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob
// store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is
// written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - menuCategories: no dish-category signal on the listing - left [].
//
// kashrutLevels is left [] for a DIFFERENT reason than the generic-"כשר" listings elsewhere in
// this directory: this listing states "לא כשר" (not kosher) - same treatment as
// scripts/add-libimarket-details.mjs, since there is no "not kosher" option in KASHRUT_LEVELS
// (lib/constants.js).
// cateringTypes only gets 'meat' (listing: קייטרינג בשרי only). districts covers all 7 -
// "אזורי פעילות" leads with "כל הארץ" (nationwide), same reasoning as scripts/add-ayala.mjs.
//
// Usage: node --env-file=.env.local scripts/add-basket.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/basket-photos';
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
    businessName: 'קייטרינג בסקט',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'אנחנו מאמינים שאוכל טרי ומדויק, עם האווירה הנכונה, אסתטיקה מעוררת תיאבון, חיוך גדול ומקצועיות בלתי מתפשרת – הוא טעים יותר! התפריט שלנו נבנה יחד אתכם, בהתאם לאופי האירוע, עונות השנה וחומרי הגלם האיכותיים ביותר שיש לשוק להציע; ירקות מהשדה, דגים טריים הישר מהדייג והבשר מהאטליזים הטובים בארץ. הגישה שלנו דינאמית ומודולרית – כך אנחנו יכולים להבטיח ללקוחות שלנו אירוע בלתי נשכח בהתאמה אישית, קולינריה משובחת ואווירה מיוחדת. הכל נעשה ביום ובמקום האירוע. כמה שטרי – ככה טעים!',
      en: "We believe that precise, fresh food, with the right atmosphere, appetizing aesthetics, a big smile and uncompromising professionalism, simply tastes better! Our menu is built together with you, according to the nature of the event, the season, and the finest ingredients the market has to offer - vegetables from the field, fish fresh from the fisherman, and meat from the best butchers in the country. Our approach is dynamic and modular - so we can guarantee our clients an unforgettable, personalized event, superb cuisine and a special atmosphere. Everything is done on the day and at the venue of your event. The fresher, the tastier!",
      fr: "Nous croyons qu'une cuisine précise et fraîche, avec la bonne ambiance, une esthétique qui ouvre l'appétit, un grand sourire et un professionnalisme sans compromis, est tout simplement meilleure ! Notre menu est construit avec vous, selon la nature de l'événement, la saison et les meilleurs ingrédients que le marché a à offrir - légumes du champ, poisson frais tout droit du pêcheur et viande des meilleures boucheries du pays. Notre approche est dynamique et modulaire - nous pouvons ainsi garantir à nos clients un événement inoubliable et personnalisé, une cuisine raffinée et une atmosphère particulière. Tout est préparé le jour même, sur le lieu de votre événement. Plus c'est frais, meilleur c'est !"
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [], // listing: לא כשר (not kosher) - no matching KASHRUT_LEVELS option
    cateringTypes: ['meat'], // listing: קייטרינג בשרי only
    maxGuests: 1000,
    priceFrom: 310,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'celebration'], // listing: יום הולדת, ברית/ה, בר/בת מצווה, אירוע עסקי, חתונה
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options', 'live_cooking_station'], // ללא גלוטן/טבעוני/ללא לקטוז + עמדות שף
    phone: '+972-50-9177119',
    whatsapp: '+972509177119',
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
