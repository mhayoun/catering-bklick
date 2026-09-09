// One-off script: adds "הזן את הכל" (Hazen Et HaKol) as a new, pre-approved caterer, sourced
// from its own website https://www.hazen.co.il/ - a meat caterer with 20+ years of experience,
// serving Jerusalem and the wider region. Found via a general web search for other Jerusalem-area
// caterers not yet in this project.
//
// Kashrut is explicit: "בהשגחת הרב מחפוד ובד״צ יורה דעה" - maps to badatz_rav_machpud (same
// mapping used for the same rabbi's name in scripts/add-mooza.mjs and
// scripts/add-taam-mehudar.mjs).
//
// The site's own /תפריט/ page has no dish list or pricing (generic "how catering pricing works"
// filler text) - the real menu is a downloadable order-form image (menu2.jpg), a dense small-font
// checklist across ~6 categories with no prices printed on it either. Given the image's small,
// closely-packed text, transcribing every individual dish name with confidence wasn't possible
// (unlike scripts/add-arturos-formulas.mjs's clean PNG menus or scripts/add-daniel-catering.mjs's
// clean PDF text) - no `packages` are seeded here rather than risk inaccurate dish names; the
// owner can add real formulas later via the dashboard edit form, same treatment as
// scripts/add-libimarket.mjs and scripts/add-merlo.mjs (before its own follow-up script).
//
// No address was found published anywhere on the site. No logo/photo asset was confidently
// identified as usable.
//
// Usage: node --env-file=.env.local scripts/add-hazen.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const OWNER_EMAIL = 'yelotag@gmail.com';

async function main() {
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'הזן את הכל',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'הזן את הכל - קייטרינג בשרי כשר למהדרין (בהשגחת הרב מחפוד ובד"ץ יורה דעה) עם למעלה מ-20 שנות ניסיון, המתאים לשבת חתן, ברית, בר מצווה, חתונה, חינה, אזכרה ואירועים משפחתיים בירושלים והסביבה.',
      en: "Hazen Et HaKol - kosher mehadrin meat catering (under Rabbi Machpud and Badatz Yoreh De'ah), with over 20 years of experience, suited to Shabbat Chatan, brit, bar mitzvah, weddings, henna, memorial gatherings and family events in the Jerusalem area.",
      fr: "Hazen Et HaKol - traiteur viande cacher mehadrin (sous le rabbin Machpud et le Badatz Yoré Déa), avec plus de 20 ans d'expérience, adapté aux Shabbat Hatan, brit mila, bar-mitsva, mariages, henné, réunions commémoratives et événements familiaux dans la région de Jérusalem."
    },
    districts: ['jerusalem'],
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: ['badatz_rav_machpud'],
    cateringTypes: ['meat'],
    maxGuests: 300, // no figure published - plausible round estimate, unverified
    priceFrom: '',
    packages: [],
    eventTypes: ['shabbat_chatan', 'brit', 'bar_mitzvah', 'wedding', 'henna', 'memorial', 'celebration'],
    menuCategories: [],
    services: [],
    phone: '+972-3-7794828',
    whatsapp: '+972-52-2641388',
    email: 'papadu100@gmail.com',
    website: 'https://www.hazen.co.il/',
    instagram: '',
    facebook: '',
    logo: '',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
