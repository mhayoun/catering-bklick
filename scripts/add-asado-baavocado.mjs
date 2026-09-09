// One-off script: adds "אסאדו באבוקדו" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/אסאדו-באבוקדו/ (no
// dedicated website). 3 gallery photos (.avif format on the source site) are downloaded locally
// then uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention) before the record is written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address, website/email/instagram/facebook: none published on the listing.
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named -
//   left [] (same treatment as scripts/add-ayala.mjs, scripts/add-erez-vechanan.mjs, and
//   scripts/add-magi-vetuli.mjs).
//
// city IS filled in (unlike the other scripts here) because the listing's "about" text names a
// specific place - "מושב עמיקם שבהרי המנשה" (Moshav Amikam, in the Menashe hills) - rather than
// a vague regional description.
// cateringTypes only gets 'meat' (listing: קייטרינג אסאדו, קייטרינג בשרי - no dairy tag), and
// menuCategories gets main_courses for the same unambiguous אסאדו signal used in
// scripts/add-erez-vechanan.mjs and scripts/add-mashehu-meyuchad.mjs.
//
// Usage: node --env-file=.env.local scripts/add-asado-baavocado.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/asadobavocado-photos';
const PHOTO_FILES = ['photo1.avif', 'photo2.avif', 'photo3.avif'];

async function uploadPhotos() {
  const urls = [];
  for (const file of PHOTO_FILES) {
    const buf = await readFile(path.join(SRC_DIR, file));
    const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
    const blob = await put(filename, buf, { access: 'public', contentType: 'image/avif' });
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
    businessName: 'אסאדו באבוקדו',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'בטוסקנה הישראלית אשר במושב עמיקם שבהרי המנשה מתנהל קייטרינג אסאדו באבוקדו, בסמוך לשדות המרעה של משפחתנו ומתוך אהבה גדולה ודרך חיים לבשר איכותי, רך ומשובח. במיטב המסורת הדרום האמריקאית הבשר נבחר בקפידה רבה ועובר תהליך יישון מקצועי. אסאדו באבוקדו קייטרינג אסדו מקצועי איכותי וגמיש בעל יכולת תכנון וכל הפתרונות הנחוצים לאירוע שלכם - שירות מקצועי ואישי, צוות מנוסה איכותי ואכפתי שישמח לעשות לכם את האירוע המושלם. ניתן לקבל שירותים משלימים לכל אירוע: גנרטור, הגברה ותאורה, עיצוב, שירותים ניידים מפוארים, השכרת ציוד לאירועים ועוד...',
      en: "In the Israeli Tuscany of Moshav Amikam, in the Menashe hills, Asado BaAvocado catering operates near our family's grazing fields, born from a deep love and way of life devoted to quality, tender, exceptional meat. In the finest South American tradition, the meat is carefully selected and undergoes a professional aging process. Asado BaAvocado is a professional, high-quality and flexible asado catering service with full planning ability and every solution your event needs - personal, professional service and an experienced, caring team happy to make your event perfect. Complementary services are available for any event: generator, sound and lighting, design, luxury mobile restrooms, event equipment rental, and more...",
      fr: "Dans la Toscane israélienne du moshav Amikam, dans les collines de Menashe, le traiteur Asado BaAvocado opère près des pâturages de notre famille, né d'un grand amour et d'un mode de vie voué à une viande de qualité, tendre et raffinée. Dans la meilleure tradition sud-américaine, la viande est sélectionnée avec le plus grand soin et subit un processus de maturation professionnel. Asado BaAvocado est un service traiteur asado professionnel, de qualité et flexible, capable de toute la planification et de toutes les solutions nécessaires à votre événement - service personnel et professionnel, équipe expérimentée et attentionnée, ravie de faire de votre événement un moment parfait. Des services complémentaires sont disponibles pour chaque événement : générateur, sonorisation et éclairage, décoration, toilettes mobiles de luxe, location de matériel événementiel, et plus encore..."
    },
    districts: ['jerusalem', 'center', 'telaviv', 'north', 'haifa', 'south', 'judea_samaria'], // listing states אזור פעילות "כל הארץ" (nationwide)
    city: { he: 'עמיקם', en: 'Amikam', fr: 'Amikam' },
    address: '',
    kashrutLevels: [],
    cateringTypes: ['meat'], // listing: קייטרינג אסאדו, קייטרינג בשרי - no dairy tag
    maxGuests: 450,
    priceFrom: 390,
    packages: [],
    eventTypes: ['wedding', 'bar_mitzvah', 'celebration'], // listing: אירוע קטן, חתונה, יום הולדת, בר/בת מצווה, אירוע עסקי
    menuCategories: ['main_courses'], // אסאדו is an unambiguous main-course signal
    services: ['gluten_free_options', 'live_cooking_station'], // ללא גלוטן/ללא לקטוז + עמדות שף (no צמחוני tag, so no vegetarian_food)
    phone: '+972-52-5601818',
    whatsapp: '+972525601818',
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
