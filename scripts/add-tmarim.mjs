// One-off script: adds "קייטרינג תמרים" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/קייטרינג-תמרים/ (no
// dedicated website). 3 gallery photos are downloaded locally then uploaded to this project's
// Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the
// record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address, website/email/instagram/facebook: none published on the listing.
//
// city IS filled in (unlike most of the other scripts here) - this is the first listing so far
// to publish an actual city name ("ראשון לציון") rather than just a region.
// kashrutLevels gets both 'mehadrin' and 'glatt' - the listing lists all three
// "כשר, כשר למהדרין, כשרות גלאט", and unlike the generic "כשר"-only listings left empty
// elsewhere, two of these three map directly onto real KASHRUT_LEVELS entries.
// cateringTypes only gets 'dairy' (listing: חלבי, צמחוני, טבעוני - no meat tag at all).
//
// Usage: node --env-file=.env.local scripts/add-tmarim.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/tmarim-photos';
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
    businessName: 'קייטרינג תמרים',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'הקייטרינג שלנו יהפוך את האירוע שלכם לחוויה קולינרית ייחודית. אנו מספקים לווי קולינרי לכל אורך האירוע הכולל סידור מגשים על מזנון, ושירות הגשה. אתם, נשאר לכם רק לחגוג.',
      en: 'Our catering will turn your event into a unique culinary experience. We provide culinary support throughout the event, including arranging trays on the buffet and service. All that is left for you to do is celebrate.',
      fr: "Notre service traiteur transformera votre événement en une expérience culinaire unique. Nous assurons un accompagnement culinaire tout au long de l'événement, incluant la mise en place des plateaux sur le buffet et le service. Il ne vous reste plus qu'à célébrer."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: 'ראשון לציון', en: 'Rishon LeZion', fr: 'Rishon LeZion' },
    address: '',
    kashrutLevels: ['mehadrin', 'glatt'], // listing: כשר, כשר למהדרין, כשרות גלאט
    cateringTypes: ['dairy'], // listing: חלבי, צמחוני, טבעוני - no meat tag
    maxGuests: 250,
    priceFrom: 300,
    packages: [],
    eventTypes: ['wedding', 'bar_mitzvah', 'celebration'], // listing: אירוע קטן, יום הולדת, בר/בת מצווה, אירוע עסקי, חתונה
    menuCategories: [],
    services: ['vegetarian_food'], // צמחוני/טבעוני - no ללא גלוטן tag this time
    phone: '+972-52-4261212',
    whatsapp: '+972524261212',
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
