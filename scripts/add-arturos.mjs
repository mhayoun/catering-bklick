// One-off script: adds "ארטורוס" as a new, pre-approved caterer, sourced from its own website
// https://arturos.co.il/ - a boutique-event venue + meat catering + ready-to-heat Shabbat food
// business in Yavne, run by chef Arthur Benyaminov and Victor.
//
// The site is a single-page marketing site with no menu/pricing page (contact via WhatsApp for
// quotes) - unlike aleshelzait.co.il/protamar.com, no `packages` are seeded here (owner can add
// formulas later via the dashboard edit form), same treatment as scripts/add-libimarket.mjs.
//
// Real, explicitly published facts used below:
// - address: "האומן 1, יבנה" (footer)
// - kashrut: "כשר בהשגחת הרבנות יבנה" (local Yavne rabbinate - no badatz/mehadrin claimed)
// - cateringTypes: "קייטרינג בשרי" (meat) - no dairy offering mentioned anywhere on the site
// - maxGuests: 60 - explicit "אירוע פרטי עד 60 אורחים" / "אירוע קטן ואינטימי (30–60 איש)"
// - phone/whatsapp: 054-5913157 (primary, used for the WhatsApp contact flow); email from footer
// - eventTypes: mapped from the lead form's own event-type dropdown (יום הולדת, בר/בת מצווה,
//   ברית/בריתה, אירוע חברה) onto this project's EVENT_TYPES - יום הולדת/אירוע חברה have no direct
//   equivalent so both fall under the catch-all 'celebration'; בר/בת מצווה -> bar_mitzvah;
//   ברית/בריתה -> brit.
// - menuCategories: home page names the dish types on offer ("מנות פתיחה, סלטים, ראשונות,
//   עיקריות וקינוחים") - mapped to starters/salads/main_courses/desserts.
// - logo: real logo asset from the site's own header (logo-w-all-site-01.png).
// - photos: none seeded - the gallery on the site renders via a JS carousel with no plain <img>
//   src/data-src URLs that could be resolved without executing that carousel's own script.
//
// Usage: node --env-file=.env.local scripts/add-arturos.mjs

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
const LOGO_FILE = 'arturos-logo.png';

async function main() {
  const logoBuf = await readFile(path.join(SRC_DIR, LOGO_FILE));
  const logoUrl = (
    await put(`caterers/${OWNER_EMAIL}/${Date.now()}-${LOGO_FILE}`, logoBuf, { access: 'public', contentType: 'image/png' })
  ).url;
  console.log(`Uploaded logo -> ${logoUrl}`);

  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'ארטורוס',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'ארטורוס - אירועי בוטיק, קייטרינג בשרי ואוכל מוכן לשבת ביבנה, ממטבחו של השף ארתור בנימינוב. אירועים פרטיים אינטימיים (30-60 אורחים) בפטיו המסעדה, וקייטרינג בשרי להפקה חיצונית עם מבחר מנות פתיחה, סלטים, ראשונות, עיקריות וקינוחים. כשר בהשגחת הרבנות יבנה.',
      en: 'Arturos - boutique events, meat catering and ready-to-heat Shabbat food in Yavne, from the kitchen of chef Arthur Benyaminov. Intimate private events (30-60 guests) on the restaurant patio, plus off-site meat catering with a range of starters, salads, first courses, mains and desserts. Kosher under the supervision of the Yavne rabbinate.',
      fr: "Arturos - événements de charme, traiteur viande et plats prêts à réchauffer pour Chabbat à Yavné, de la cuisine du chef Arthur Benyaminov. Événements privés intimistes (30 à 60 invités) sur le patio du restaurant, et traiteur viande pour réceptions externes avec un choix d'entrées, salades, plats et desserts. Cacher sous la supervision du rabbinat de Yavné."
    },
    districts: ['center'],
    city: { he: 'יבנה', en: 'Yavne', fr: 'Yavné' },
    address: 'האומן 1, יבנה',
    kashrutLevels: ['local_rabbinate'], // "כשר בהשגחת הרבנות יבנה" - no badatz/mehadrin claimed
    cateringTypes: ['meat'], // "קייטרינג בשרי" - no dairy offering mentioned
    maxGuests: 60, // explicit: "אירוע פרטי עד 60 אורחים"
    priceFrom: '', // no per-guest/per-event pricing published (quote via WhatsApp only)
    packages: [],
    eventTypes: ['bar_mitzvah', 'brit', 'celebration'], // lead form: יום הולדת/בר-בת מצווה/ברית-בריתה/אירוע חברה
    menuCategories: ['starters', 'salads', 'main_courses', 'desserts'],
    services: [],
    phone: '+972-54-5913157',
    whatsapp: '+972-54-5913157',
    email: 'arturosresto@gmail.com',
    website: 'https://arturos.co.il/',
    instagram: '',
    facebook: '',
    logo: logoUrl,
    photos: [],
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id} and a logo.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
