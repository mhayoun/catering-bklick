// One-off script: adds "קייטרינג הדרי" as a new, pre-approved caterer, sourced from its own
// website https://www.hadary.co.il/ - a dairy + meat event catering business serving northern
// Israel (no single branch address published; the site markets itself simply as "קייטרינג
// בצפון").
//
// The site has no menu/pricing page (WhatsApp-quote model) - no `packages` are seeded here, same
// treatment as scripts/add-libimarket.mjs and scripts/add-arturos.mjs.
//
// Real, explicitly published facts used below:
// - cateringTypes: site has separate "תפריט חלבי" and "תפריט בשרי" sections -> dairy + meat.
// - kashrutLevels left [] - the site's own kashrut badge image reads "קייטרינג בשרי וחלבי כשר,
//   רשיון יצרן של משרד הבריאות" (kosher + Ministry of Health manufacturer license), a generic
//   "כשר" claim with no certifying body/level named - same treatment as scripts/add-ayala.mjs.
// - address/city left blank - no specific branch address published anywhere on the site, only
//   "קייטרינג בצפון" (serves the north region generally).
// - eventTypes: mapped from the site's own service list (קייטרינג לחתונות, קייטרינג לבר/בת
//   מצווה, קייטרינג לברית/בריתה, קייטרינג לאירועי חברה וכנסים) onto EVENT_TYPES - "אירועי חברה
//   וכנסים" has no direct business-event equivalent, so it falls under the catch-all
//   'celebration'.
// - maxGuests: no figure published anywhere on the site - 300 below is a plausible round
//   estimate (unverified) reflecting a full-scale wedding/bar-mitzvah caterer, not a boutique
//   one; adjust via the dashboard edit form once real capacity is known (same approach as
//   scripts/add-holybagel.mjs's maxGuests).
// - phone/whatsapp/email: 050-6705518 / Info.hadari.kt@gmail.com (site footer + WhatsApp link).
// - logo + 3 real event photos downloaded from the site's own image CDN, then re-uploaded to
//   this project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Usage: node --env-file=.env.local scripts/add-hadary.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/755d4ccb-8017-43db-87b5-73224b4601e9/scratchpad/photos';
const LOGO_FILE = 'hadary-logo.png';
const PHOTO_FILES = ['hadary-a.jpg', 'hadary-c.jpg', 'hadary-d.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const blob = await put(`caterers/${OWNER_EMAIL}/${Date.now()}-${file}`, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne(LOGO_FILE, 'image/png');
  const photos = [];
  for (const file of PHOTO_FILES) {
    photos.push(await uploadOne(file, 'image/jpeg'));
  }

  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג הדרי',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג הדרי מציע פתרונות קולינריים חלביים ובשריים לאירועים פרטיים ועסקיים באזור הצפון - חתונות, בר/בת מצווה, ברית/בריתה, אירועי חברה וכנסים, וכן מגשי אירוח לאירוח ביתי ואירועי בוטיק. דגש על התאמה אישית לאופי האירוע, איכות ועמידה בזמנים.',
      en: 'Hadary Catering offers dairy and meat culinary solutions for private and business events across northern Israel - weddings, bar/bat mitzvahs, brit milah/brita, corporate events and conferences, as well as hosting trays for home entertaining and boutique events. Emphasis on personalizing each event and on quality and punctuality.',
      fr: "Hadary Traiteur propose des solutions culinaires lactées et carnées pour les événements privés et professionnels dans le nord d'Israël - mariages, bar/bat-mitsva, brit mila, événements d'entreprise et conférences, ainsi que des plateaux de réception pour la maison et les événements de charme. Accent mis sur la personnalisation, la qualité et la ponctualité."
    },
    districts: ['north'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [], // generic "כשר" badge, no certifying body/level named
    cateringTypes: ['dairy', 'meat'],
    maxGuests: 300, // no figure published - plausible round estimate, unverified
    priceFrom: '',
    packages: [],
    eventTypes: ['wedding', 'bar_mitzvah', 'brit', 'celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-50-6705518',
    whatsapp: '+972-50-6705518',
    email: 'Info.hadari.kt@gmail.com',
    website: 'https://www.hadary.co.il/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, a logo, and ${photos.length} photos.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
