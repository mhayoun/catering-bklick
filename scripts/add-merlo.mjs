// One-off script: adds "מרלו" (Merlo) as a new, pre-approved caterer, sourced from its own
// website https://www.merlo-c.co.il/ - a premium event caterer run by chef יוסי שבת (and שף משה
// משה), with over 20 years of experience and a signature "freestyle" live-cooking-station menu.
//
// This is a lead-gen-style single-page site (no menu/pricing page at all - "בחרנו שלא להציג
// באתר את כל האפשרויות אלא נבחרים לדוגמא" is the site's own explicit statement) - no `packages`
// are seeded here, same treatment as scripts/add-libimarket.mjs. No address, city, or email is
// published anywhere on the site either - only a phone number.
//
// kashrutLevels is left empty: the site repeatedly claims "כשר למהדרין" but never names a
// certifying body or supervising rabbi anywhere in its content - a generic unstated claim, same
// treatment as scripts/add-ayala.mjs.
//
// 1 real photo (chef יוסי שבת plating a dish at a live "freestyle" station, from the site's own
// gallery) downloaded and re-uploaded to this project's Vercel Blob store (mirroring
// scripts/add-aleshelzait-photos.mjs's convention). No logo: the site's own logo SVG is drawn
// entirely in fill="white" (invisible against this project's light background), same issue
// documented for protamar/mozzarela/artaste/eat-love in earlier scripts.
//
// Usage: node --env-file=.env.local scripts/add-merlo.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/755d4ccb-8017-43db-87b5-73224b4601e9/scratchpad/merlo';
const PHOTO_FILE = 'dish1.webp';

async function main() {
  const buf = await readFile(path.join(SRC_DIR, PHOTO_FILE));
  const photoUrl = (
    await put(`caterers/${OWNER_EMAIL}/${Date.now()}-${PHOTO_FILE}`, buf, { access: 'public', contentType: 'image/jpeg' })
  ).url;
  console.log(`Uploaded photo -> ${photoUrl}`);

  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'מרלו',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג מרלו - קייטרינג יוקרתי כשר למהדרין ממטבחם של השף יוסי שבת והשף משה משה, עם למעלה מעשרים שנות ניסיון בהפקת אירועי פרימיום. מתמחים בין היתר בתפריט "freestyle" - הכנת מנות חיה מול העיניים. מתאים לחתונות, בר/בת מצווה, ברית, אירועים פרטיים ועסקיים.',
      en: "Merlo Catering - premium kosher mehadrin catering from chefs Yossi Shabbat and Moshe Moshe, with over 20 years of experience producing premium events. Known among other things for a \"freestyle\" menu - dishes prepared live in front of guests. Suited to weddings, bar/bat mitzvah, brit milah, and private and business events.",
      fr: "Traiteur Merlo - traiteur cacher mehadrin haut de gamme des chefs Yossi Shabbat et Moshe Moshe, avec plus de vingt ans d'expérience dans la production d'événements premium. Réputé notamment pour son menu \"freestyle\" - des plats préparés en direct devant les invités. Adapté aux mariages, bar/bat-mitsva, brit mila, et événements privés et professionnels."
    },
    districts: [],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: [],
    maxGuests: 300, // no figure published - plausible round estimate, unverified
    priceFrom: '',
    packages: [],
    eventTypes: ['wedding', 'bar_mitzvah', 'brit', 'celebration'],
    menuCategories: [],
    services: ['live_cooking_station'],
    phone: '+972-54-7672422',
    whatsapp: '+972-54-7672422',
    email: '',
    website: 'https://www.merlo-c.co.il/',
    instagram: '',
    facebook: '',
    logo: '',
    photos: [photoUrl],
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id} and 1 photo.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
