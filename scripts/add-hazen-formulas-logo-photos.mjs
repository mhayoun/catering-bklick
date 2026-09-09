// One-off follow-up script for "הזן את הכל" (scripts/add-hazen.mjs), which seeded no packages
// and no logo/photos: its own /תפריט/ page has only a dense order-form checklist image
// (menu2021.jpg) as the real menu, judged too risky to transcribe from text-scraping alone at the
// time. Read directly as an image instead (cropped/zoomed section by section), which made every
// line legible. Findings:
//   - "מנה ראשונה" (no stated choice limit) is really a cold salad/dip bar (eggplant salads,
//     hummus, pickles, matbucha, coleslaw, tabbouleh, etc.) - mapped to `salads`.
//   - "מנה ביניים" ("2 סוגים לבחירה") is a pareve/fish course (burekas, fried fish, meat rolls,
//     tuna) - mapped to `starters`.
//   - "מנה עיקרית" ("3 סוגים לבחירה") is the real meat main course (roast beef, chicken, kebab,
//     goulash, meatballs, asado, etc.) - mapped to `main_courses`.
//   - "תוספות חמות" ("3 סוגים לבחירה") + a second untitled "תוספות" list (potatoes/rice/couscous/
//     pasta/kugels/stir-fries) were merged into one `hot_sides` category (schema has one slot;
//     same merge convention as scripts/add-daniel-catering.mjs's starters merge). The second
//     list's own header word was illegible even zoomed - its content is unambiguous so the items
//     are kept, the ambiguous label just isn't used anywhere.
//   - "מבחר מרקי הבית" (6 soup flavors) and "חמין בשרי / חמין לא בשרי" don't fit any
//     MENU_CATEGORIES slot (no `soups` category exists) - kept as informational `note` addons
//     instead of forcing them into a real category, same treatment as Daniel Catering's bar
//     סיום/משמחים addons.
//   - No dessert list appears anywhere on the order form, so no `desserts` category is set - not
//     invented.
//   - Items marked with `*` on the source sheet carry an extra charge per its own footer note
//     ("תוספת מחיר*") - kept in the item text as printed rather than modeled as separate pricing,
//     same treatment as the asterisk items in scripts/add-daniel-catering.mjs's addons.
//   - No per-guest or per-package price is printed anywhere on the sheet (same conclusion as the
//     original script reached about the site's "החל מ-XX ₪" landing pages, which are SEO headlines
//     with no real backing pricing table) - pricePerGuest stays ''.
//
// Also adds a real logo (the site's own oval "הזן את הכל" wordmark/leaf icon, favicon-quality but
// the only one on the site) and 6 real event photos - 4 clearly own-branded (filename carries the
// business name, 2025-dated) plus 2 clearly food/venue shots from its homepage slider. Skipped two
// homepage-slider photos that looked like they contained shellfish/melted-cheese garnish, which
// would be inconsistent with this caterer's meat kashrut, rather than include them uncritically.
//
// Usage: node --env-file=.env.local scripts/add-hazen-formulas-logo-photos.mjs

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

const CATERER_ID = 'iSJLOKh58c';
const OWNER_EMAIL = 'yelotag@gmail.com';
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/1f9923fd-0c01-4535-b016-8cf13ab8d766/scratchpad/hazen-images';
const MENU_SOURCE_URL = 'https://www.hazen.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98/';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

const eventMenu = {
  id: 'event-order-menu',
  type: 'formula',
  name: {
    he: 'תפריט אירועים - בחירה אישית',
    en: 'Event Menu - Build Your Own',
    fr: 'Menu Événementiel - Composez Votre Menu'
  },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: ['salads', 'starters', 'main_courses', 'hot_sides'],
  categoryLimits: { starters: 2, main_courses: 3, hot_sides: 3 },
  categoryItems: {
    salads: [
      'תפוח אדמה במיונז', 'חציל בטחינה', 'חציל במיונז', 'קוביות חציל מטוגן - פיקנטי', 'חציל רומני',
      'חומוס טחון עם טחינה', 'טחינה בשום ולימון', 'פלפל חריף מטוגן ברוטב שום ולימון',
      'מלפפון מתוק בחומץ', 'רצועות סלק בלימון ופטרוזיליה', 'סלט ירקות טרי',
      'רצועות גזר עם פלפל חריף', 'גזר מרוקאי מבושל בנוסח המזרח', 'סחוג תימני', 'מטבוחה פיקנטית',
      'חמוצים', 'חמוצים מעורבים-טורשי', 'וולדרוף', 'תירס בוינגריט ורצועות גמבה', 'טונה *',
      'פטריות *', 'עגבניות שרי', 'רצועות פלפל 3 צבעים-קלוי', 'עגבניות חריף/שום',
      'טבולה לבנונית', 'כרוב טרי ונגיעות לימון וגזר', 'כרוב עם גזר ומיונז'
    ],
    starters: [
      'בורקס+רוטב פטריות', 'מוסקה', 'פלפל ממולא', 'דג מטוגן מלרוזה', 'דג נילוס אפוי',
      'בורקס בשר עם רוטב', 'דג סול מטוגן', 'דג סלומון *', 'מושט ברוטב', 'דג מושט מטוגן',
      'רול פטריות+רוטב', 'רול בשרי+רוטב', 'דג טונה'
    ],
    main_courses: [
      'צלי בקר', 'עוף בתנור', 'שניצל ויאני', 'שניצלונים', 'קבב של פחמים', 'עוף בדבש/לימון',
      'גולש הונגרי', 'קציצות בשר ברוטב בצל/עגבניות', 'עוף מוקפץ סיני', 'סטייק פרגית על פחמים',
      'פרגית עוף ממולא', 'חזה עוף על פחמים', 'אסאדו'
    ],
    hot_sides: [
      'תפוחי אדמה אפויים', 'אורז לבן, אדום, סיני, הודי', 'קוסקוס', 'רוטב ירקות לקוסקוס',
      'גזר ואפונה', 'שעועית ירוקה', 'תבשיל אפונה וארטישוק', 'זיתים מרוקאים', 'פתיתים',
      'ספגטי ברוטב עגבניות', 'פסטה מטוגנת בבצל', 'פסטה סינית מוקפצת', 'ירקות מוקפצים',
      'קישוא מוקפץ', 'דואט תפוחי אדמה/בטטה', 'קישואים', 'מרוקאית', 'תפוחי אדמה', 'פטריות',
      'קיגל מתוק', 'קיגל ירושלמי', 'בצל'
    ]
  },
  eventTypes: ['shabbat_chatan', 'brit', 'bar_mitzvah', 'wedding', 'henna', 'memorial', 'celebration'],
  addons: noteAddons([
    'מבחר מרקי הבית (מרק לבחירה): ירקות / בצל / עוף או בקר / תפוחי אדמה / תימני עם עוף או בקר / פטריות *',
    'חמין בשרי / חמין לא בשרי',
    '* פריטים המסומנים בכוכבית כרוכים בתוספת מחיר'
  ]),
  sourceUrl: MENU_SOURCE_URL
};

const PHOTO_FILES = ['p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.webp', 'p7.jpg', 'p8.jpeg'];
const PHOTO_CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function uploadOne(file) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const ext = path.extname(file).toLowerCase();
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType: PHOTO_CONTENT_TYPES[ext] });
  return blob.url;
}

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const logoUrl = await uploadOne('logo.png');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file);
    photoUrls.push(url);
    console.log(`Uploaded photo: ${url}`);
  }

  record.logo = logoUrl;
  record.photos = [...(record.photos || []), ...photoUrls];

  if (record.packages.some((p) => p.id === eventMenu.id)) {
    console.warn(`Package "${eventMenu.id}" already exists - skipping.`);
  } else {
    record.packages.push(eventMenu);
  }
  record.menuCategories = ['salads', 'starters', 'main_courses', 'hot_sides'];

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): logo set, ${photoUrls.length} photo(s) added (${record.photos.length} total), event menu formula added (${record.packages.length} package(s) total).`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
