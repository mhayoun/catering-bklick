// One-off script: adds "רויאל קינג" (Royal King, self-branded "Jerusalem King" on its own menu
// PDFs) as a new, pre-approved caterer, sourced from its own website https://www.king-d.co.il/ -
// a Jerusalem meat caterer. Found via a general web search for other Jerusalem-area caterers not
// yet in this project (user-requested batch of 4).
//
// Kashrut: site's own meta description states "בהשגחת הבד״ץ העדה החרדית" and its menu PDFs print
// "בשרים חלק גם לפי דעת מרן הב״י" (chalak meat, also per the Beit Yosef ruling) - both badatz
// levels are set. cateringTypes is ['meat'] only - no dairy item appears anywhere on the site or
// in either menu PDF.
//
// Address (רח' האומן 14, ירושלים) and phone/WhatsApp (050-4141418) and email (rotmanking@gmail.com)
// all confirmed on-site. Event types kept to what's explicitly named on the site's own /אודות/
// page text: חתונה, בר מצווה, ברית, שבת חתן (+ 'celebration' as the closest existing catch-all for
// its own "כנסים"/conferences mention - EVENT_TYPES has no conference-specific value).
//
// Two full, real, priced-and-detailed formula menus were found as linked PDFs behind the site's
// /התפריטים/ page cover images (not the covers themselves, which carry no dish content):
//   - תפריט-קלאסי-גרוזלם.pdf (its own in-document title reads "תפריט גולד" / Gold Menu)
//   - תפריט-פרימיום-גרוזלם.pdf ("תפריט פרימיום" / Premium Menu)
// Both share the same reception-bar concept, salad bar, and end-of-night/kids-menu structure, but
// differ in choice counts and specific dishes (Premium's main course is one fixed plated dish, not
// a choice list; its dessert is a specific named item vs Classic's generic "assorted desserts"
// line). Modeled as two separate `packages`, matching the site's own two separate PDFs:
//   - salads: the printed "8 לבחירה" salad-bar list (MENU_CATEGORIES has no reception/buffet
//     category, so, as in scripts/add-daniel-catering.mjs's category-merge convention, the welcome
//     reception bar's own stations/stands are kept as an informational addon rather than forced
//     into `categoryItems`, since it's a station-based buffet, not a discrete "choose N" list).
//   - starters: the "מנות ראשונות" personal-plate course (1 fish + 1 meat-pastry, 2 total).
//   - main_courses / hot_sides: as printed, with their own stated choice counts (or none, for
//     Premium's single fixed main).
//   - desserts: the one dessert line each menu prints (generic for Classic, a named item for
//     Premium) - not itemized further since none is given.
// Per-item/per-station surcharges (extra reception stations +5₪, extra salad +2₪, various starter/
// main-course upgrades, the end-of-night bar, kids' table) don't fit any real per-item price field
// in this schema's `categoryItems` (which carry no price) - kept as informational `note` addons
// with the amounts inline in the text, same treatment as scripts/add-daniel-catering.mjs's bar
// סיום/משמחים addons and scripts/add-hazen-formulas-logo-photos.mjs's soup/cholent addons.
// No base per-guest price is printed on either menu - pricePerGuest stays ''.
//
// Logo (Royal King wordmark) and 6 real event photos (drinks station, a plated fish course, two
// elegant table settings, and two real venue/wedding shots featuring actual guests) were found via
// the site's own homepage image slider (files named "Scanned_2025...jpg") and the menu PDFs
// themselves (the fish-course shot appears on both PDF covers).
//
// Usage: node --env-file=.env.local scripts/add-royal-king.mjs

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
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/1f9923fd-0c01-4535-b016-8cf13ab8d766/scratchpad/royalking-images';
const EVENT_TYPES = ['wedding', 'bar_mitzvah', 'brit', 'shabbat_chatan', 'celebration'];

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

const RECEPTION_BAR_NOTE_CLASSIC =
  'בר קבלת פנים (פתוח משעה לפני האירוע): משקאות קלים ותוססים, יין ובירה (בתוספת 10 ש"ח למנה), ' +
  'פלטות מטוגנים (סיגרים/פסטלים/קובה), קוסקוס ומרק ירקות, פלטת ירקות ומטבלים, עמדה מקסיקנית ' +
  '(טורטיות תירס במילוי עוף), בית מאפה (פוקצ\'ות אישיות), עמדה תאילנדית (אטריות מוקפצות עם בשר ' +
  'סצ\'ואן/עוף אסייתי), פיש אנד ציפס, קבב מזרחי, עמדת חלה עם שניצלים, עמדה מזרחית (מרק קובה חמוסטה ' +
  'או קובה סלק - 1 לבחירה), עמדה ים-תיכונית (חומוס בהכנה ביתית), בר סלט בריא, שניצלונים, מרקים ' +
  '(כתום/ירקות/אפונה - 1 לבחירה). כל עמדה נוספת: 5 ש"ח למנה. עמדת אסאדו בתוספת 12 ש"ח למנה.';

const RECEPTION_BAR_NOTE_PREMIUM =
  'בר קבלת פנים (פתוח משעה לפני האירוע), הגשה משודרגת: מפיות משודרגות, כלים מפוארים ואקסקלוסיביים, ' +
  'כוס כפול קריסטל וסכו"ם זהב. משקאות קלים ותוססים, יין ובירה, פלטות מטוגנים (סיגרים/פסטלים/קובה), ' +
  'קוסקוס ומרק ירקות, פלטת ירקות ומטבלים, עמדה מקסיקנית, עמדה מזרחית (מרק קובה חמוסטה או קובה סלק - ' +
  '1 לבחירה) הכוללת קראוסון במילוי בשר טלה מפורק וריבת בצל, בית מאפה, עמדה תאילנדית, פיש אנד ציפס, ' +
  'קבב מזרחי, עמדת חלה עם שניצלים, עמדה ים-תיכונית, בר סלט בריא, שניצלונים, מרקים (1 לבחירה). כל ' +
  'עמדה נוספת: 5 ש"ח למנה. עמדת אסאדו בתוספת 12 ש"ח למנה.';

const SALAD_SURCHARGE_NOTE = 'כל סלט מעבר ל-8 הנבחרים: תוספת 2 ש"ח למנה.';

const CLOSING_BAR_AND_KIDS_NOTES = [
  'מנות משמחים (בר סיום, מוגש לקראת סיום המנה העיקרית, מינימום הזמנת בר 100 מנות): על הבר - 40 ש"ח ' +
    'למנה, 4 פריטים לבחירה (2 בשרי 2 פרווה, בר גברים ובר נשים נפרדים - חמין, סיגרים פסטלים, קוגל ' +
    'איטריות, קוגל תפו"א, פלפל ממולא, פשטידת פטריות, פלטת פירות, פלטת ירקות, קוסקוס עם ירקות, בורקס ' +
    'מיני / שניצלונים, עוף סיני מוקפץ, כנפיים ברוטב צ\'ילי, מעורב ירושלמי, קבבונים). בישיבה - 100 ' +
    'ש"ח למנה מעל הזמנת בסיס (ללא בחירה): סלטים ולחמים, מנה ראשונה עוף סיני מוקפץ, מנה עיקרית סטייק ' +
    'עוף + תוספות.',
  'מנות ילדים (מעל הזמנת בסיס, שולחנות ילדים בלבד): לחמים, סלטים, שניצלונים, ציפס, נקניקיות, בורקס ' +
    'מיני - 80 ש"ח למנה.'
];

function pkg({ id, name, categories, categoryLimits, addons, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: '',
    minGuests: '',
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: EVENT_TYPES,
    addons: noteAddons(addons || []),
    sourceUrl
  };
}

const SALADS_CLASSIC = [
  'גזר פיקנטי מגורד עם פלפל חריף לימון ושום', 'ירקות מעורבים - מבחר ירקות טריים בתחמיץ קר ומלח ים',
  'טבולה - גרגירי בורגול עם עשבי תבלין ועגבניות', 'עגבניות שרי בזילוף פסטו שמן זית וגרעיני חמנייה',
  'ירקות ישראלי קצוץ דק', 'חמוצים - זיתים כבושים פטרוזיליה ולימונים לצד מלפפונים בתחמיץ',
  'חומוס בליווי טחינה עם מסבחה', 'טריו פלפלים בשלושה צבעים קלויים בתחמיץ',
  'בטטה אפויה בשמן זית צ\'ילי מתוק ושומשום קלוי', 'פלפל חריף מטוגן בשום ולימון',
  'וולדורף - תפוחי עץ סלרי ואננס בקצפת ואגוזים', 'מטבוחה מרוקאית מעגבניות פלפלים פיקנטי ושום',
  'עגבניות בנוסח הבית - עגבניות טריות שום ופלפל חריף', 'סלק אדום בצל ופטרוזיליה',
  'סיני - כרוב פלפלים אדומים סלרי בצל ירוק וגרעיני חמנייה', 'חצילים מטוגנים בתחמיץ בצל ופטרוזיליה',
  'כרוב וגזר (קולסלאו)', 'כרוב סגול בשומשום בתחמיץ', 'חסה קיסרי בליווי עגבניות שרי',
  'חציל שלם חם עם טחינה - בלאדי', 'חמוצי הבית (טורשי) - מגוון ירקות כבושים',
  'קוביות חציל ובטטה ברוטב צ\'ילי סלרי ושומשום', 'פלפלים צבעוני חי עם פטריות וגרעיני דלעת וחמניה',
  'צנון וקולרבי בתחמיץ ובצל ירוק',
  'פטריות שמפיניון מוקפצות בבלסמי צ\'ילי ועירית - מוגש חם (בתוספת 4 ש"ח למנה)',
  'קרפצ\'יו סלק (בתוספת 4 ש"ח למנה)', 'כבד קצוץ חם (בתוספת 4 ש"ח למנה)', 'חומוס בשר חם (בתוספת 4 ש"ח למנה)'
];

const SALADS_PREMIUM = [
  'סיני - כרוב פלפלים אדומים סלרי בצל ירוק וגרעיני חמנייה', 'חצילים מטוגנים בתחמיץ בצל ופטרוזיליה',
  'כרוב וגזר (קולסלאו)', 'כרוב סגול בשומשום בתחמיץ', 'חסה קיסרי בליווי עגבניות שרי',
  'חציל שלם חם עם טחינה - בלאדי', 'חמוצי הבית (טורשי) - מגוון ירקות כבושים',
  'קוביות חציל ובטטה ברוטב צ\'ילי סלרי ושומשום', 'פלפלים צבעוני חי עם פטריות וגרעיני דלעת וחמניה',
  'צנון וקולרבי בתחמיץ ובצל ירוק', 'פטריות שמפיניון מוקפצות בבלסמי צ\'ילי ועירית - מוגש חם',
  'קרפצ\'יו סלק', 'גזר פיקנטי מגורד עם פלפל חריף לימון ושום',
  'ירקות מעורבים - מבחר ירקות טריים בתחמיץ קר ומלח ים', 'טבולה - גרגירי בורגול עם עשבי תבלין ועגבניות',
  'עגבניות שרי בזילוף פסטו שמן זית וגרעיני חמנייה', 'ירקות ישראלי קצוץ דק',
  'חמוצים - זיתים כבושים פטרוזיליה ולימונים לצד מלפפונים בתחמיץ', 'טריו פלפלים בשלושה צבעים קלויים בתחמיץ',
  'בטטה אפויה בשמן זית צ\'ילי מתוק ושומשום קלוי', 'פלפל חריף מטוגן בשום ולימון',
  'וולדורף - תפוחי עץ סלרי ואננס בקצפת ואגוזים', 'מטבוחה מרוקאית מעגבניות פלפלים פיקנטי ושום',
  'עגבניות בנוסח הבית - עגבניות טריות שום ופלפל חריף'
];

const goldMenu = pkg({
  id: 'gold-menu',
  name: { he: 'תפריט גולד (קלאסי)', en: 'Gold Menu (Classic)', fr: 'Menu Or (Classique)' },
  sourceUrl: 'https://www.king-d.co.il/wp-content/uploads/2025/11/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%A7%D7%9C%D7%90%D7%A1%D7%99-%D7%92%D7%A8%D7%95%D7%96%D7%9C%D7%9D.pdf',
  categories: {
    salads: SALADS_CLASSIC,
    starters: [
      'פילה אמנון בעשבי תבלין ושמן זית', 'פילה אמנון מזרחי בנוסח מרוקאי כוסברה ופלפל חריף על מצע גרגירי חומוס',
      'פילה אמנון בקראסט שקדים ועשבי תבלין', 'מעורב ירושלמי בליווי טורטיה',
      'רול פילו במילוי נתחי בשרים מוקפצים', 'מאפה הבית במילוי בשר', 'עוף סיני על מצע פירה בטטה'
    ],
    main_courses: [
      'צלי עגל ביין אדום רך ועסיסי', 'סטייק פרגית בגריל תיבול מזרחי', 'כרעי עוף בגריל',
      'סטייק עוף בירקות', 'שניצל ממולא פטריות ובצל (קורדנבלו)', 'שיפודי נתחי עוף צעיר בירק', 'קבב מזרחי'
    ],
    hot_sides: [
      'אורז לבן שקדים וחמוציות', 'אורז מקלובה - תבשיל אורז וירקות', 'אורז אושפלו - תבשיל אורז עם ירקות ובשר',
      'תפו"א פריזיאן בשמן זית שום ורוזמרין', 'דואט תפוחי אדמה ובטטה בנוסח השף',
      'שעועית ירוקה מוקפצת עם שומשום', 'ירקות מוקפצים', 'ירקות בגריל (אנטיפסטי)'
    ],
    desserts: ['מבחר קינוחים מפנקים (הגשה למרכז שולחן)']
  },
  categoryLimits: { starters: 2, main_courses: 3, hot_sides: 3, salads: 8 },
  addons: [
    RECEPTION_BAR_NOTE_CLASSIC,
    SALAD_SURCHARGE_NOTE,
    'תוספות בתשלום למנה ראשונה: קראוסון במילוי בשר טלה מפורק וריבת בצל +5 ש"ח, פילה סלמון +10 ש"ח, כבד על מצע פירה בטטה +10 ש"ח (עבור כל המנות שהוזמנו).',
    'תוספות בתשלום למנה עיקרית: חזה בקר מפולפל (בריסקט) +5 ש"ח למנה, נתח אסאדו מיושן בטימין +8 ש"ח למנה, שיפודי אנטריקוט +8 ש"ח למנה.',
    ...CLOSING_BAR_AND_KIDS_NOTES
  ]
});

const premiumMenu = pkg({
  id: 'premium-menu',
  name: { he: 'תפריט פרימיום', en: 'Premium Menu', fr: 'Menu Premium' },
  sourceUrl: 'https://www.king-d.co.il/wp-content/uploads/2025/11/%D7%AA%D7%A4%D7%A8%D7%99%D7%98-%D7%A4%D7%A8%D7%99%D7%9E%D7%99%D7%95%D7%9D-%D7%92%D7%A8%D7%95%D7%96%D7%9C%D7%9D.pdf',
  categories: {
    salads: SALADS_PREMIUM,
    starters: [
      'פילה אמנון בעשבי תבלין ושמן זית', 'פילה אמנון מזרחי בנוסח מרוקאי כוסברה ופלפל חריף על מצע גרגירי חומוס',
      'פילה אמנון בקראסט שקדים ועשבי תבלין', 'פילה סלמון בעשבי תבלין שום ושמן זית על מצע פטוצ\'יני פסטו או ברוטב מזרחי',
      'דג לברק על מצע של בורגול', 'כבד על מצע פירה בטטה', 'מעורב ירושלמי בליווי טורטיה',
      'רול פילו במילוי נתחי בשרים מוקפצים', 'מאפה הבית במילוי בשר', 'עוף סיני על מצע פירה בטטה'
    ],
    main_courses: ['דואט פרגית וצלי עגל בליווי פרחי ברוקולי וכרובית (מוגש בפלטה אישית יוקרתית, ללא בחירה)'],
    hot_sides: [
      'אורז לבן שקדים וחמוציות', 'אורז מקלובה - תבשיל אורז וירקות', 'אורז אושפלו - תבשיל אורז עם ירקות ובשר',
      'תפו"א פריזיאן בשמן זית שום ורוזמרין', 'דואט תפוחי אדמה ובטטה בנוסח השף',
      'שעועית ירוקה מוקפצת עם שומשום', 'ירקות מוקפצים', 'ירקות בגריל (אנטיפסטי)'
    ],
    desserts: ['אקלר שוקולד לצד גלידה וניל (הגשה אישית)']
  },
  categoryLimits: { starters: 2, hot_sides: 2, salads: 8 },
  addons: [RECEPTION_BAR_NOTE_PREMIUM, ...CLOSING_BAR_AND_KIDS_NOTES]
});

const PHOTO_FILES = ['menu_0001.jpg', 'menu_0016.jpg', 'menu_0048.jpg', 'menu_0051.jpg', 'menu_0087.jpg', 'menu_0091.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  return blob.url;
}

async function main() {
  const now = new Date().toISOString();

  const logoUrl = await uploadOne('logo.png', 'image/png');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file, 'image/jpeg');
    photoUrls.push(url);
    console.log(`Uploaded photo: ${url}`);
  }

  const record = {
    id: nanoid(10),
    businessName: 'רויאל קינג',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'רויאל קינג (Royal King) - קייטרינג בשרי כשר בד"ץ העדה החרדית ירושלים (בשרים חלק, גם לפי דעת מרן הבית יוסף), רח\' האומן 14, ירושלים. מציעים תפריטי אירועים עשירים - בר קבלת פנים עם עמדות שף, מבחר סלטים, מנות ראשונות דגים ובשריות, מנות עיקריות, תוספות חמות, קינוחים, בר משמחים לסיום הערב ותפריט ילדים.',
      en: 'Royal King - kosher meat catering (Badatz Eda Chareidis Jerusalem, chalak meat also per the Beit Yosef ruling), Haoman St. 14, Jerusalem. Offers rich event menus with a welcome-bar reception featuring live cooking stations, a wide salad selection, fish and meat starters, main courses, hot sides, desserts, a late-night snack bar, and a kids\' menu.',
      fr: 'Royal King - traiteur viande cacher (Badatz Edah Hareidit de Jérusalem, viande "halak" également selon l\'avis du Beit Yossef), rue Haoman 14, Jérusalem. Propose des menus d\'événements riches - un bar d\'accueil avec stands de cuisine en direct, un large choix de salades, des entrées de poisson et de viande, des plats principaux, des accompagnements chauds, des desserts, un bar de fin de soirée et un menu enfants.'
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'רח\' האומן 14, ירושלים',
    kashrutLevels: ['badatz_eda_chareidis', 'badatz_beit_yosef'],
    cateringTypes: ['meat'],
    maxGuests: '',
    priceFrom: '',
    packages: [goldMenu, premiumMenu],
    eventTypes: EVENT_TYPES,
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'desserts'],
    services: ['elegant_tableware', 'waiter_staff', 'live_cooking_station', 'kids_meals'],
    phone: '+972-50-4141418',
    whatsapp: '+972-50-4141418',
    email: 'rotmanking@gmail.com',
    website: 'https://www.king-d.co.il/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, 2 formula packages, logo, and ${photoUrls.length} photos.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
