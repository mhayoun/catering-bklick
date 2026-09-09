// One-off script: adds "קייטרינג Franco" as a new, pre-approved caterer, sourced from its
// directory listing at https://cateringisrael.co.il/catering-suppliers/franco/ (no dedicated
// website). 3 gallery photos are downloaded locally then uploaded to this project's Vercel Blob
// store (mirroring scripts/add-aleshelzait-photos.mjs's convention) before the record is
// written.
//
// Fields intentionally left blank/empty rather than guessed (same reasoning as the other
// cateringisrael.co.il one-off scripts in this directory):
// - logo: no business-specific logo image on the listing (only the directory site's own logo).
// - address/city, website/email/instagram/facebook: none published on the listing.
// - kashrutLevels: listing says generically "כשר" (kosher) with no certifying body/level named -
//   left [] (same treatment as scripts/add-ayala.mjs, scripts/add-erez-vechanan.mjs,
//   scripts/add-magi-vetuli.mjs, and scripts/add-asado-baavocado.mjs).
// - menuCategories: no dish-category signal on the listing - left [].
//
// districts maps אשדוד אשקלון והסביבה + באר שבע והסביבה to 'south' and שפלה to 'center' - the
// only listing so far whose "אזורי פעילות" doesn't include "כל הארץ" or the Tel Aviv/Center/
// Sharon/Jerusalem cluster common to the others.
// cateringTypes only gets 'dairy' (listing: חלבי, צמחוני - no meat tag).
//
// Usage: node --env-file=.env.local scripts/add-franco.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/franco-photos';
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
    businessName: 'קייטרינג Franco',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'לאחר למעלה מ-20 שנים של ניסיון, מאות אירועים ואלפי אורחים אנחנו משוכנעים שמצאנו את המתכון להצלחה! זה מתחיל בבחירת חומרי הגלם האיכותיים והטריים ביותר, ממשיך לצוות והשפים המקצועיים ומסתיים באסתטיקה הבלתי מתפשרת, שירות אישי ויחס חם שהופכים כל אירוע לטעים ומושלם! אנו מציעים מגוון רחב של אירועים בפריסה ארצית. החל ממסיבות בר-בת מצווה, עליה לתורה, חינה, מקווה, ימי הולדת, חגיגות אירוסין-נישואין ועד אירועי חברה וכנסים לכל מטרה. הכל בהתאם לרצונות, לצרכים ובעיקר לחלומות שלכם!',
      en: "After over 20 years of experience, hundreds of events and thousands of guests, we're confident we've found the recipe for success! It starts with choosing the finest and freshest ingredients, continues with a professional kitchen and service team, and ends with uncompromising aesthetics, personal service and warm attention that make every event delicious and perfect! We offer a wide range of events nationwide - from bar/bat mitzvah parties, aliyah la'Torah, henna, mikveh, birthdays, engagement/wedding celebrations to corporate events and conferences for any purpose. All tailored to your wishes, needs and, above all, your dreams!",
      fr: "Après plus de 20 ans d'expérience, des centaines d'événements et des milliers d'invités, nous sommes convaincus d'avoir trouvé la recette du succès ! Cela commence par le choix des ingrédients les plus frais et les plus qualitatifs, se poursuit avec une équipe de cuisine et de service professionnelle, et se termine par une esthétique sans compromis, un service personnalisé et une attention chaleureuse qui rendent chaque événement délicieux et parfait ! Nous proposons une large gamme d'événements dans tout le pays - des bar-mitsva, alya laTorah, henné, mikvé, anniversaires, célébrations de fiançailles-mariage jusqu'aux événements d'entreprise et conférences, pour toute occasion. Le tout adapté à vos souhaits, vos besoins et surtout vos rêves !"
    },
    districts: ['south', 'center'], // listing: אשדוד אשקלון והסביבה, שפלה, באר שבע והסביבה
    city: { he: '', en: '', fr: '' },
    address: '',
    kashrutLevels: [],
    cateringTypes: ['dairy'], // listing: חלבי, צמחוני - no meat tag
    maxGuests: 500,
    priceFrom: 310,
    packages: [],
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration'], // listing: אירוע עסקי, חתונה, ברית/ה, יום הולדת, בר/בת מצווה, חינה, שבת חתן, אירוע קטן
    menuCategories: [],
    services: ['vegetarian_food'], // אופציה לטבעונים only
    phone: '+972-72-3318991',
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
