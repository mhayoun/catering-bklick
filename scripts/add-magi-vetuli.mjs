// One-off script: adds "מגי ותולי" as a new, pre-approved caterer, sourced from its directory
// listing at https://cateringisrael.co.il/catering-suppliers/מגי-ותולי/ (no dedicated website).
// 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob store
// (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named
//   (unlike scripts/add-mooza.mjs, whose "about" text named a specific rabbi) - left [].
// - menuCategories: no unambiguous dish-category signal on the listing - left [].
//
// Usage: node --env-file=.env.local scripts/add-magi-vetuli.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/magivetuli-photos';
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
    businessName: 'מגי ותולי',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'מענג לתת שירות ולפנק אנשים שבאים לשמוח ולהנות. מענג עוד יותר לעשות זאת עם צוות כמו שלנו - אנשי מטבח ושירות מוכשרים ומקצועיים, שעובדים עימנו לאורך שנים. התברכנו בזכות לייצר עבורכם מנות אירוח מגוונות ובכל פעם שאנחנו רואים את החיוך אחרי הביס הראשון, מרגישים שעשינו את שלנו.',
      en: "It's a delight to serve and pamper people who come to celebrate and enjoy themselves. It's even more of a delight to do it with a team like ours - skilled, professional kitchen and service staff who have worked with us for years. We're fortunate to create varied hospitality dishes for you, and every time we see the smile after the first bite, we feel we've done our job.",
      fr: "C'est un plaisir de servir et de choyer des personnes venues célébrer et profiter. C'est encore plus agréable de le faire avec une équipe comme la nôtre - des cuisiniers et un personnel de service qualifiés et professionnels qui travaillent avec nous depuis des années. Nous avons la chance de créer pour vous des plats de réception variés, et chaque fois que nous voyons le sourire après la première bouchée, nous sentons que nous avons rempli notre mission."
    },
    districts: ['center', 'telaviv'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: ['dairy', 'meat'], // listing: קייטרינג בשרי, חלבי
    maxGuests: 350,
    priceFrom: 325,
    packages: [],
    eventTypes: ['wedding', 'celebration'], // listing: אירוע עסקי, חתונה, יום הולדת, אירוע קטן
    menuCategories: [],
    services: ['vegetarian_food', 'gluten_free_options'], // צמחוני + ללא גלוטן/טבעוני
    phone: '+972-9-7449996',
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
