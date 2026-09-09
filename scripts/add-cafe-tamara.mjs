// One-off script: adds "קייטרינג מלכה" (Malka Catering) as a new, pre-approved caterer - the
// meat/event-catering line of קפה תמרה (Cafe Tamara), a well-known dairy Italian restaurant in
// Malha, Jerusalem. The meat line is branded two ways on the same site: the original catering
// landing page (/קייטרינג-בשרי-כשר-בירושלים/) calls it "קייטרינג מלכה, מבית קפה תמרה"; the
// current, actively-built product page (/תמרה-הבשרי/) rebrands it "תמרה הבשרי" - a small,
// intimate event hall in Talpiot, not a delivery-catering operation. Both describe the same
// kitchen/brand, so "קייטרינג מלכה" (the more catering-generic name) is used as businessName,
// with "תמרה הבשרי" mentioned in the description, and the current /תמרה-הבשרי/ page used as the
// website link since it's the live, maintained one.
//
// Kashrut is explicit on both pages: "בד"ץ יורה דעה בהשגחת הרב מחפוד" - maps to
// badatz_rav_machpud (same mapping used for the same rabbi in scripts/add-hazen.mjs and
// scripts/add-mooza.mjs).
//
// Real facts found on /תמרה-הבשרי/: an intimate hall in Talpiot (רחוב התעשייה 4) seating up to
// 180, one event at a time, free parking, chef Noa Cohen, events manager תמר (058-793-7707).
// The /קייטרינג-בשרי-כשר-בירושלים/ landing page adds a second, more delivery-catering-flavored
// contact number (058-557-7507) and a a generic description of dish categories (Moroccan red
// fish, Moroccan couscous, matbucha, "15+ salad types", meats, breads, parve desserts) - but no
// named dishes, no fixed tiers, and no prices; both pages are explicit that the menu is
// custom-built per event ("כל תפריט נתפר לאירוע"), not a fixed formula/catalog, so - same
// reasoning as scripts/add-hazen.mjs's original no-packages call - no `packages` are seeded here.
//
// Logo: no standalone logo file for the meat brand was found (its own page only has a small
// kashrut-seal badge image); reused the shared "café tamara / קפה תמרה" circular wordmark favicon,
// since both brands are explicitly the same kitchen/company. 6 real event photos came from the
// /תמרה-הבשרי/ page's own venue gallery (hall, chef/grill, decor, entrance corridor).
//
// Usage: node --env-file=.env.local scripts/add-cafe-tamara.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';
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
const SRC_DIR = '/tmp/tamara-scratch/images';
const PHOTO_FILES = ['02-hall.jpg', '03-flowers.jpg', '04-chef.jpg', '05-brass.jpg', '06-vitrine.jpg', '08-corridor.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  return blob.url;
}

async function main() {
  const now = new Date().toISOString();

  const logoUrl = await uploadOne('favicon.png', 'image/png');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file, 'image/jpeg');
    photoUrls.push(url);
    console.log(`Uploaded photo: ${url}`);
  }

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג מלכה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג מלכה - הקו הבשרי של קפה תמרה, כשר למהדרין (בד"ץ יורה דעה בהשגחת הרב מחפוד). כולל את "תמרה הבשרי", אולם אירוע שף אינטימי בתלפיות, ירושלים, לעד 180 סועדים, בניהול השפית נועה כהן. מתאים לבר/בת מצווה, בריתות, אירועים משפחתיים, אירוסין וחתונות אינטימיות - כל תפריט נתפר אישית לאירוע.',
      en: 'Malka Catering - the meat line of Cafe Tamara, kosher mehadrin (Badatz Yoreh De\'ah under Rabbi Machpud). Includes "Tamara HaBasari", an intimate chef-style event hall in Talpiot, Jerusalem, for up to 180 guests, run by chef Noa Cohen. Suited to bar/bat mitzvah, brit, family events, engagements and intimate weddings - every menu is custom-built for the event.',
      fr: 'Traiteur Malka - la ligne viande de Café Tamara, casher mehadrin (Badatz Yoré Déa sous le rabbin Machpud). Comprend "Tamara HaBasari", une salle de réception de chef intime à Talpiot, Jérusalem, pour jusqu\'à 180 convives, dirigée par la cheffe Noa Cohen. Adapté aux bar/bat-mitsva, brit mila, événements familiaux, fiançailles et mariages intimes - chaque menu est composé sur mesure.'
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'רחוב התעשייה 4, תלפיות, ירושלים',
    kashrutLevels: ['badatz_rav_machpud'],
    cateringTypes: ['meat'],
    maxGuests: 180,
    priceFrom: '',
    packages: [],
    eventTypes: ['brit', 'bar_mitzvah', 'engagement', 'wedding', 'celebration', 'memorial'],
    menuCategories: [],
    services: [],
    phone: '+972-58-557-7507',
    whatsapp: '+972-58-793-7707',
    email: '',
    website: 'https://cafetamara.co.il/תמרה-הבשרי/',
    instagram: '',
    facebook: '',
    logo: logoUrl,
    photos: photoUrls,
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, and ${photoUrls.length} photos (no packages - menu is fully custom per event, not fixed).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
