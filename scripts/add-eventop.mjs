// One-off script: adds "קייטרינג איוונטופ" (Eventop Catering) as a new, pre-approved caterer,
// sourced from its own website https://eventop.co.il/ - a Jerusalem event-production and
// catering business ("הפקת אירועים"). Logo + 2 photos are downloaded locally then uploaded to
// this project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Unlike every other one-off script in this directory, packages is left EMPTY: the site is a
// portfolio/gallery site, not a menu site. Its /גלריות/ page lists 7 named service tiers
// (סטנדרט, בסט טופ, פירסט טופ, בר מתוק/משמחים, שולחן מתוק, חלבי, שבת) but each one links only to
// a photo gallery - no dish list, no "X לבחירה" structure, and no pricing anywhere on the site
// (same "no menu detail" situation scripts/add-libimarket.mjs originally documented, before that
// caterer's site was found separately - see scripts/update-tmarim-from-site.mjs for contrast).
// The owner can add formulas later via the dashboard edit form.
//
// kashrutLevels is real, from the site's own text: "קייטרינג בד''ץ העדה החרדית" (Badatz Eda
// Chareidis) - maps directly onto a real KASHRUT_LEVELS entry. cateringTypes is both meat and
// dairy - the site advertises "קייטרינג בשרי בירושלים" and has a dedicated "חלבי" gallery
// category.
//
// Usage: node --env-file=.env.local scripts/add-eventop.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/eventop-site';

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne('logo.jpg', 'image/jpeg');
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const photo2 = await uploadOne('photo2.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג איוונטופ',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'איוונטופ - מגישים כבוד. קייטרינג יוקרתי ובוטיק כשר למהדרין בד"ץ העדה החרדית, המתמחה בהפקת אירועים בירושלים. מציעים מגוון רמות שירות - סטנדרט, בסט טופ ופירסט טופ - וכן בר מתוק, שולחן מתוק, תפריט חלבי ותפריט לשבת.',
      en: "Eventop - serving with honor. Luxury boutique kosher mehadrin catering (Badatz Eda Chareidis), specializing in event production in Jerusalem. Offering a range of service levels - Standard, Best Top and First Top - as well as a sweet bar, sweet table, dairy menu and Shabbat menu.",
      fr: "Eventop - servir avec honneur. Traiteur boutique de luxe, cacher mehadrin (Badatz Eda Chareidis), spécialisé dans la production d'événements à Jérusalem. Propose plusieurs niveaux de service - Standard, Best Top et First Top - ainsi qu'un bar à sucreries, une table de desserts, un menu lacté et un menu de Chabbat."
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: '',
    kashrutLevels: ['badatz_eda_chareidis'],
    cateringTypes: ['meat', 'dairy'],
    maxGuests: 500,
    priceFrom: '', // no pricing published anywhere on the site
    packages: [], // no menu/dish content published anywhere on the site - see header comment
    eventTypes: ['wedding', 'bar_mitzvah', 'celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-2-3818600',
    whatsapp: '+972527682237',
    email: 'eventop6@gmail.com',
    website: 'https://eventop.co.il/',
    instagram: '',
    facebook: '',
    logo: logoUrl,
    photos: [photo1, photo2],
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, and 2 photos (no packages - no menu content published).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
