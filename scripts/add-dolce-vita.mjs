// One-off script: adds "דולצ'ה ויטה" (Dolce Vita) as a new, pre-approved caterer, sourced from
// its own website https://www.dolche-vita.co.il/ - a dairy hosting-tray caterer in Or Yehuda.
//
// Unlike scripts/add-taam-mehudar.mjs (same city, Or Yehuda), this site's product pages
// (מגשי אירוח חלבי/בשרי/טבעוני, קינוחים) and its own "תפריטים לדוגמא" page carry no actual
// product grid, prices, or dish names anywhere - every one of them renders as generic SEO body
// text plus the same nav/footer. No `packages` are seeded here as a result (owner can add
// formulas later via the dashboard edit form), same treatment as scripts/add-libimarket.mjs.
//
// kashrutLevels is left empty: the site's own title tag claims "כשר למהדרין" but its dedicated
// /כשרות/ page names no certifying body or supervising rabbi anywhere in its content - a generic
// unstated claim, same treatment as scripts/add-ayala.mjs.
//
// Real, explicitly published facts used below (site footer, present on every page):
// - address: "דוד אלעזר 107, אור יהודה 6031207"
// - phone: 055-4543966 ("מספר זה לשיחות בלבד" - calls only, no WhatsApp claimed)
// - email: dolche-vita@live.com
// - hours: א'-ה' 9:00-18:00, ו' 9:00-13:00
// - cateringTypes: nav lists מגשי אירוח חלבי/בשרי/טבעוני separately - real dairy+meat+vegan offer
//   (cateringTypes only has dairy/meat in this schema; vegan covered via services below)
// - eventTypes: nav's own "קייטרינג לאירועים" submenu (כנסים, מוסדות, מסיבות, ברית/בריתה, בר
//   מצווה, שבת חתן, ימי הולדת, אירועים קטנים) mapped onto EVENT_TYPES - כנסים/מוסדות/מסיבות/ימי
//   הולדת/אירועים קטנים have no direct equivalent so all fall under the catch-all 'celebration'.
//
// No logo or photo asset was found - the site's header logo renders as low-contrast white-on-
// white text against a white background (same issue documented for protamar/mozzarela/artaste/
// eat-love in earlier scripts), and its "גלריה" page uses a JS lightbox with no plain <img> src
// URLs resolvable without executing that gallery's own script.
//
// Usage: node --env-file=.env.local scripts/add-dolce-vita.mjs

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
    businessName: "דולצ'ה ויטה",
    ownerEmail: OWNER_EMAIL,
    description: {
      he: "דולצ'ה ויטה - קייטרינג חלבי ומגשי אירוח באור יהודה, כשר למהדרין. מגוון מגשי אירוח חלביים, בשריים וטבעוניים, כריכים, קינוחים ומשקאות, לקייטרינג לכנסים, מוסדות, מסיבות, ברית/ה, בר/בת מצווה, שבת חתן וימי הולדת. משלוחים לכל הארץ בתיאום טלפוני.",
      en: "Dolce Vita - dairy catering and hosting trays in Or Yehuda, kosher mehadrin. A range of dairy, meat and vegan hosting trays, sandwiches, desserts and drinks, for conferences, institutions, parties, brit milah, bar/bat mitzvah, Shabbat Chatan and birthdays. Nationwide delivery by phone arrangement.",
      fr: "Dolce Vita - traiteur lacté et plateaux de réception à Or Yehuda, cacher mehadrin. Un large choix de plateaux lactés, carnés et végétaliens, sandwichs, desserts et boissons, pour conférences, institutions, fêtes, brit mila, bar/bat-mitsva, Shabbat Hatan et anniversaires. Livraison dans tout le pays sur coordination téléphonique."
    },
    districts: ['center', 'telaviv'],
    city: { he: 'אור יהודה', en: 'Or Yehuda', fr: 'Or Yehouda' },
    address: 'דוד אלעזר 107, אור יהודה',
    kashrutLevels: [],
    cateringTypes: ['dairy'],
    maxGuests: 200, // no figure published - plausible round estimate, unverified
    priceFrom: '',
    packages: [],
    eventTypes: ['brit', 'bar_mitzvah', 'shabbat_chatan', 'celebration'],
    menuCategories: [],
    services: ['vegetarian_food'],
    phone: '+972-55-4543966',
    whatsapp: '',
    email: 'dolche-vita@live.com',
    website: 'https://www.dolche-vita.co.il/',
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
