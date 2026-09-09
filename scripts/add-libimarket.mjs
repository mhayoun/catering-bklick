// One-off script: adds "ליבי מרקט" as a new, pre-approved caterer.
//
// Unlike aleshelzait (which has its own site with a full menu gallery), this business has
// no dedicated website - the only source is its directory listing on cateringisrael.co.il,
// which gives spec fields but no free-text description or menu detail, so no `packages` are
// seeded here (owner can add formulas later via the dashboard edit form).
//
// Source: https://cateringisrael.co.il/catering-suppliers/ליבי-מרקט/
//
// Usage: node --env-file=.env.local scripts/add-libimarket.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set - nothing to connect to.');
  process.exit(1);
}

const now = new Date().toISOString();

const record = {
  id: nanoid(10),
  businessName: 'ליבי מרקט',
  ownerEmail: 'yelotag@gmail.com',
  description: {
    he: 'ליבי מרקט מציעים קייטרינג חלבי וצמחוני, כולל קייטרינג פיצות וקינוחים, עם אפשרויות ללא גלוטן וטבעוניות. מגישים על מגשי אירוח לאירועים קטנים עד בינוניים (10-100 אורחים) - בבית, במשרד או בכל מקום אירוע.',
    en: 'Libi Market offers dairy and vegetarian catering, including pizza and dessert catering, with gluten-free and vegan options. Served on hospitality trays for small to medium events (10-100 guests) - at home, at the office, or at any event venue.',
    fr: "Libi Market propose un service traiteur lacté et végétarien, incluant pizzas et desserts, avec des options sans gluten et végétaliennes. Servi sur plateaux de réception pour des événements petits à moyens (10 à 100 invités) - à domicile, au bureau ou sur tout lieu d'événement."
  },
  districts: ['north', 'haifa'],
  city: { he: '', en: '', fr: '' },
  address: '',
  kashrutLevels: [],
  cateringTypes: ['dairy'],
  maxGuests: 100,
  priceFrom: 108,
  packages: [],
  eventTypes: ['brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration'],
  menuCategories: ['main_courses', 'desserts'],
  services: ['vegetarian_food', 'gluten_free_options'],
  phone: '+972-50-5428755',
  whatsapp: '+972505428755',
  email: '',
  website: '',
  instagram: '',
  facebook: '',
  photos: [],
  videos: [],
  status: 'approved',
  reviewedBy: 'joetiger05@gmail.com',
  reviewedAt: now,
  rejectionReason: null,
  createdAt: now,
  updatedAt: now
};

async function main() {
  await kv.set(`caterer:${record.id}`, record);
  await kv.sadd('caterers:index', record.id);
  await kv.sadd(`owner:${record.ownerEmail}`, record.id);
  console.log(`Added caterer "${record.businessName}" with id ${record.id}.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
