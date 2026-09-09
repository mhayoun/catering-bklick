// One-off script: adds "הקייטרינג החם" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/הקייטרינג-החם/ (no
// dedicated website). 3 gallery photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the
// record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - phone/whatsapp: unlike every other listing scraped so far, this one has no phone number
//   published at all (no tel: link anywhere on the page) - left blank rather than guessed.
// - menuCategories: no dish-category signal on the listing - left [].
//
// kashrutLevels gets 'mehadrin' (listing states "כשר למהדרין" explicitly), no specific
// rabbi/badatz named. districts covers all 7 - "אזורי פעילות" explicitly leads with
// "כל הארץ" (nationwide), same reasoning as scripts/add-ayala.mjs and
// scripts/add-mashehu-meyuchad.mjs. cateringTypes only gets 'meat' - unlike every other listing
// scraped so far, this one's "סוג אוכל" names only קייטרינג בשרי, no dairy tag.
//
// Usage: node --env-file=.env.local scripts/add-hakatering-hacham.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/hakateringhaham-photos';
const PHOTO_FILES = ['photo1.jpeg', 'photo2.jpeg', 'photo3.jpeg'];

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
    businessName: 'הקייטרינג החם',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'הקייטרינג החם הוא קייטרינג כשר למהדרין אשר הוקם ע"י מתניה אורלינסקי ומספק חוויה ואירוע קולינרי ללקוחותיו בכל הארץ. אנו מקפידים להשתמש בחומרי הגלם האיכותיים ביותר, לתבל את האוכל ביד נדיבה, לערוך ולסדר לכם שולחנות כך שכל עין תוכל להבחין ביד מקצועית העוסקת במלאכה. באפשרותנו לספק לכם שרות מכל סוג שאתם חפצים בו - אוכל לכל אירוע ארוז ומוכן או שרות מלא הכולל כלים ומלצרים.',
      en: 'HaCatering HaCham is a kosher mehadrin caterer founded by Matanya Orlinsky, providing a culinary experience and event service to clients nationwide. We insist on using the finest ingredients, seasoning food generously, and arranging your tables so every eye can spot the professional hand at work. We can provide any type of service you want - packaged, ready-to-go food for any event, or full service including tableware and waitstaff.',
      fr: "HaCatering HaCham est un traiteur cacher mehadrin fondé par Matanya Orlinsky, offrant une expérience culinaire et un service événementiel à ses clients dans tout le pays. Nous tenons à utiliser les meilleurs ingrédients, à assaisonner généreusement, et à dresser vos tables de façon à ce que chaque regard puisse reconnaître une main professionnelle à l'oeuvre. Nous pouvons fournir tout type de service souhaité - nourriture emballée et prête pour n'importe quel événement, ou service complet incluant vaisselle et personnel de salle."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['mehadrin'], // listing: כשר למהדרין
    cateringTypes: ['meat'], // listing: קייטרינג בשרי only, no dairy tag
    maxGuests: 2000,
    priceFrom: 115,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration'], // listing: אירוע עסקי, מגשי אירוח, חתונה, ברית/ה, יום הולדת, בר/בת מצווה, חינה, שבת חתן, אירוע קטן
    menuCategories: [],
    services: ['gluten_free_options'], // ללא גלוטן/ללא לקטוז/טבעוני - no live_cooking_station this time (no עמדות שף on this listing)
    phone: '',
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
