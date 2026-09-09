// One-off script: adds "קייטרינג הד שף" (Head Chef Catering, run by chef Gabby Mesica) as a new,
// pre-approved caterer, based in Mazkeret Batya, sourced from its own website
// https://www.headchef.co.il/. Logo + 2 hero photos are downloaded locally then uploaded to this
// project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Unlike aleshelzait/protamar's dedicated per-event formula pages, this site's /תפריט-בשרי/ and
// /תפריט-חלבי/ pages are each one giant reference list (~150+ dishes across starters, salads,
// mains, themed live-cooking stations, desserts) with NO "X לבחירה" choice structure and NO
// pricing anywhere on the site (confirmed on the menu pages, the tray pages, and the /מבצעים/
// promotions page) - a pure "here's everything we can make, contact us for a quote" catalog. To
// keep this proportionate, each menu is represented by a REPRESENTATIVE sample of items per
// category rather than the full list; pricePerGuest is left at 0 (see lib/pricing.js - a falsy
// pricePerGuest just omits the estimate), same reasoning as scripts/add-setti.mjs and
// scripts/add-mangalistim.mjs's written formulas.
//
// kashrutLevels is 'local_rabbinate' only - the site states "כשרות - מועצה דתית רבנות מזכרת
// בתיה" (Mazkeret Batya Religious Council/local rabbinate), no badatz or mehadrin claimed.
//
// Usage: node --env-file=.env.local scripts/add-headchef.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/headchef-site';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, categories, eventTypes, addons, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: 0, // no pricing published anywhere on the site - see header comment
    minGuests: 0,
    includedCategories: Object.keys(categories),
    categoryLimits: {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || ['celebration'],
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl
  };
}

const packages = [
  pkg({
    id: 'meat-menu',
    name: { he: 'תפריט קייטרינג בשרי', en: 'Meat Catering Menu', fr: 'Menu Traiteur Viande' },
    sourceUrl: 'https://www.headchef.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%91%d7%a9%d7%a8%d7%99/',
    categories: {
      salads: [
        'סלט השף: חסה, נבטים, אגוזים, גרעיני חמנייה, קרוטונים, עגבניות שרי ורוטב איטלקי עדין',
        'בייבי בתפוז ופקאן: עלי תרד ורוקט צעירים, פלחי תפוזים, פקאן סיני ורוטב ויניגרט חרדלי',
        'סלט ציטרוס: חסה עם פלחי הדרים בויניגרט הדרים',
        'סלט בריאות: על בסיס עשבי תיבול בלבד - כוסברה, פטרוזיליה, שמיר, בזיליקום, נענע וסלרי',
        'סלט שורש: גזר, שורש פטרוזיליה ושורש סלרי מאודים בדבש ולימון עם אגוזים מסוכרים',
        'סלט פלפלים אינדונזי: פלפל חמוץ מתוק וגם חריף עם קבנוס ובוטנים מטוגנים',
        'חומוס ביתי', 'טחינה: ירוקה, אגוזים, רגילה', 'מטבוחה ביתית',
        'סלט קינואה עם עשבי תיבול', 'סלט עדשים כתומות עם שום טרי קצוץ, נענע, פטרוזיליה ותימין'
      ],
      starters: [
        'פטריות ממולאות פטה כבד', 'פטריות במילוי פסטו', 'שניצלוני פטריות יער',
        'עלי גפן ממולאים באורז עם נענע לימון ושמן זית', 'עלי גפן במילוי בשר טלה עם צימוקים וצנוברים',
        'מיני קיש - בצל, פטריות, ברוקולי, קרישה', 'מיני קורדונבלו (שניצלים קטנים ממולאים אווז וממרח חרדל)',
        'מיני אגרול', 'שיפודוני עגל בפלפלת', 'שיפודוני פרגית בטריאקי', "נקניקיות במעטפת בצק", "צ'וריסיטו",
        'כבד קצוץ', 'גלילי חצילים בפסטו', 'כנפי עוף ברוטב צ\'ילי', 'מיני קבבון'
      ],
      main_courses: [
        'פילה מוסר בלימון ושקדים', 'פילה אמנון ברוטב שום ועשבי תיבול', 'פילה סלמון מאודה',
        'פלטת ממולאים', 'לזניה בולונז', 'מוסקה חצילים', 'כבד עוף על טוסט', 'ארטישוק ממולא',
        'צליית נקניקיות צ\'וריסו (ארגנטינאי) מוגש עם רוטב צ\'ימיצ\'ורי וצ\'ילי חריף',
        'קבב או קציצות טלה עם עשבי תיבול וצנובר על מצע טבולה בלווי טחינה (לבנוני)',
        'פיתות עשויות במקום על הסאג\' ממולאות בקציץ בשר טלה עם בצל וצנובר (דרוזי אותנטי)'
      ],
      hot_sides: [
        'ירקות בטמפורה', 'ברוקולי בבצק בירה', 'עוף בבצק בירה חמוץ מתוק', 'שניצלוני עוף בשומשום',
        'נתחי דג בשומשום'
      ]
    },
    addons: [
      'מגוון מזנוני נושא לקבלת פנים: מכסיקני, תאילנדי, ישראלי, יפני (סושי), טאבון, סמוסה הודי, איטלקי, אנטיפסטי, דגים, פיש אנד צ\'יפס, פינת באן',
      'התפריט המלא כולל מבחר רחב הרבה יותר - יש לפנות טלפונית לפירוט מלא ולהצעת מחיר'
    ]
  }),

  pkg({
    id: 'dairy-menu',
    name: { he: 'תפריט קייטרינג חלבי', en: 'Dairy Catering Menu', fr: 'Menu Traiteur Lacté' },
    sourceUrl: 'https://www.headchef.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%97%d7%9c%d7%91%d7%99/',
    categories: {
      salads: [
        'סלט ניסואז: תפוחי אדמה עם שעועית ירוקה, ביצים קשות וטונה', 'סלט קפרזה: פרוסות עגבניות ומוצרלה בבזיל ואורגנו טרי',
        'סלט שורש: גזר, שורש פטרוזיליה ושורש סלרי מאודים בדבש ולימון עם אגוזים מסוכרים',
        'סלט תרד עם חצאי אגסים ושזיפים ביין מרסלה', 'חומוס ביתי', 'טחינה: ירוקה, אגוזים, רגילה', 'מטבוחה ביתית',
        'בטטה קלויה בדבש ונגיעות שומשום', 'חציל קלוי על האש עם בזיליקום ועגבניות מיובשות',
        'פלטת אנטיפסטי: מגוון ירקות קלויים בזילוף שמן זית ועשבי תיבול',
        'קוקטייל שרי מוצרלה: חצאי עגבניות שרי טריות ומיובשות, שום כבוש, בצלצלים, זיתים, כדורי מוצרלה ובזיליקום'
      ],
      starters: [
        'פילה ברבוניה בטמפורה', 'פטריות שמפיניון טריות בציפוי פנקו', 'פטריות ממולאות גבינת עיזים בקראסט',
        'תאנה ממולאת, שזיף ממולא', 'עלי גפן ממולאים באורז ועשבי תיבול', 'קרפלך', 'מיני מאפה פילו',
        'אננס מטוגן בירה'
      ],
      desserts: [
        'סופלה שוקולד אישי', 'עוגת שוקולד חמה', 'טראפלס', 'מוס שלושת השוקולדים (לבן, מריר ובלגי עשיר)',
        'מוס חלבה', 'פאים לבחירה: תפוחים, אגסים, אגוזים, שוקולד לימון', 'בלינצ\'ס תפוחי עץ',
        'שטרודל תפוחי עץ', 'קדאיף גבינות', 'כנאפה', 'עוגת גבינה עם פירורים', 'מלבי אמיתי על מצע קדאיף',
        'פונדו שוקולד'
      ]
    },
    addons: ['התפריט המלא כולל מבחר רחב הרבה יותר - יש לפנות טלפונית לפירוט מלא ולהצעת מחיר']
  })
];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const logoUrl = await uploadOne('logo.png', 'image/png');
  const photo1 = await uploadOne('photo1.jpg', 'image/jpeg');
  const photo2 = await uploadOne('photo2.jpg', 'image/jpeg');
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'קייטרינג הד שף',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'קייטרינג הד שף בבעלותו וניהולו של השף הוותיק והמנוסה גבי מסיקה, מתמחה באירועים קטנים כגדולים, ותמיד מקפיד על רמה גבוהה מבחינת טריות, הגשה, שירות ומבחר - תפריטים בשריים, חלביים וטבעוניים.',
      en: 'Head Chef Catering, owned and run by veteran, experienced chef Gabby Mesica, specializes in events small and large, always insisting on a high standard of freshness, presentation, service and selection - meat, dairy and vegan menus.',
      fr: "Head Chef Catering, dirigé par le chef expérimenté Gabby Mesica, se spécialise dans les événements petits et grands, en insistant toujours sur un haut niveau de fraîcheur, de présentation, de service et de choix - menus viande, lactés et végétaliens."
    },
    districts: ['center'],
    city: { he: 'מזכרת בתיה', en: 'Mazkeret Batya', fr: 'Mazkeret Batya' },
    address: '',
    kashrutLevels: ['local_rabbinate'],
    cateringTypes: ['dairy', 'meat'],
    maxGuests: 500,
    priceFrom: '', // no pricing published anywhere on the site
    packages,
    eventTypes: ['wedding', 'brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'memorial', 'celebration'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'desserts'],
    services: ['vegetarian_food', 'live_cooking_station'],
    phone: '+972-72-3926778',
    whatsapp: '',
    email: 'headchef@smile.net.il',
    website: 'https://www.headchef.co.il/',
    instagram: '',
    facebook: 'https://www.facebook.com/headchef.gabbymesica',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, and ${packages.length} formulas.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
