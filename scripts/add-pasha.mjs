// One-off script: adds "פאשה" (Pasha) as a new, pre-approved caterer, sourced from its own
// website https://www.pashajer.co.il/ - a Jerusalem meat-catering business that also runs a
// physical prepared-food shop. Logo + 2 shop photos are downloaded locally then uploaded to this
// project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention).
//
// Unlike every other one-off script in this directory except scripts/update-tmarim-real-pricing
// and scripts/add-tmarim-alacarte-trays.mjs, EVERY package here has a real, published price:
// - 6 named catering menus are published as PDFs (linked from /תפריטי-קייטרינג/), each showing an
//   exact "סה"כ למנה" (total per portion) figure and "מינימום 15 מנות" (minimum 15 portions).
//   PDF text was extracted directly (no OCR/guessing).
// - A 7th PDF ("תפריט קייטרינג פתוח") is a genuine open à-la-carte price list (~100 individually
//   priced items/salads-by-the-liter) - modeled as one a_la_carte package, same convention as
//   scripts/add-tmarim-alacarte-trays.mjs.
//
// kashrutLevels is real, from the footer text present on every page and every PDF: "כשר בהשגחת
// הרבנות ירושלים" (Jerusalem Rabbinate) + "בשר חלק חו״ל לפי שיטת בית יוסף" (Beit Yosef method) +
// "עוף מהדרין" (mehadrin poultry) - all three map onto real KASHRUT_LEVELS entries.
//
// Usage: node --env-file=.env.local scripts/add-pasha.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/pasha-site';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, eventTypes, addons, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest,
    minGuests: minGuests || 15,
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || ['celebration'],
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl
  };
}

const DELIVERY_NOTE = 'ניתן להוסיף הובלה ללא פריקה';
const ADD_SALAD_NOTE = 'ניתן להוסיף סלט בתוספת 3 ₪ למנה';

const SALADS_24 = [
  'סלט כוסברה בתוספת חמוציות ושקדים קלויים', 'סלט סלרי וירוקים קצוצים בדבש, לימון ושמן זית',
  "רצועות בטטה בצ'ילי ושקדים קלויים", 'עדשי פנינה שחורות עם בטטה, חמוציות ושקדים קלויים',
  'רצועות פלפלים קלופים בשום, לימון ושמן זית', 'ירקות מעורבים בתחמיץ הבית', 'כרוב לבן בתחמיץ הבית',
  'קולסלאו - כרוב לבן וגזר במיונז', 'גזר מגורד בתוספת חמוציות וסילאן', 'גזר מגורד עם כוסברה ולימון',
  'גזר מבושל בנוסח מרוקאי', "סלט ביצים בתיבול מיונז וחרדל דיז'ון", 'סלט תפו"א, ביצים, מיונז ובצל ירוק',
  'חומוס הבית', 'טחינה לבנה', 'טחינה ירוקה עם שום ולימון', 'חצילים כתושים עם טחינה',
  'חצילים כתושים עם מיונז', 'חצילים כתושים עם ירקות', 'קוביות חציל בנוסח אסיאתי',
  'סלק אדום בתחמיץ הבית', 'מטבוחה מרוקאית בבישול ארוך', 'מיקס מתבלים וחריפי הבית',
  'מגוון זיתים מובחרים', 'חמוצים עראקי - טורשי'
];

const packages = [
  pkg({
    id: 'shabbat-chatan-friday',
    name: { he: 'תפריט לשבת חתן - ליום שישי', en: 'Shabbat Chatan Menu - Friday Evening', fr: 'Menu Shabbat Hatan - Vendredi Soir' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/07/%D7%A9%D7%91%D7%AA-%D7%97%D7%AA%D7%9F.pdf',
    pricePerGuest: 97,
    eventTypes: ['shabbat_chatan'],
    categories: {
      salads: SALADS_24,
      starters: [
        "פילה לברק טרי צרוב על הפלאנצ'ה עם מלח אטלנטי ושמן זית (בתוספת 12 ₪ למנה)", 'פילה סלמון ברוטב מרוקאי',
        'פילה סלמון בנוסח אסיאתי', 'פילה סלמון בעשבי תיבול טריים', 'פילה מושט טרי ברוטב מרוקאי',
        '"חריימה" - קבב דגים ברוטב מרוקאי עשיר', 'בורקס פילאס במילוי בשר עגל',
        'מיני מאפה במילוי חזה עוף ופטריות'
      ],
      main_courses: [
        'אסאדו בבישול ארוך בציר בקר ויין', 'צלי בקר ברוטב עשיר ופטריות טריות', 'רצועות בקר בנוסח סצ\'ואן',
        'קציצות בשר עם אפונה עדינה', 'קבב יווני "סופלאקי"', 'פרגיות בגריל', "פרגיות ברכז רימונים וג'ינג'ר",
        "פרגיות בצ'ילי והדרים", 'פרגיות במילוי פיסטוק שמי וקשיו', 'כרעיים עוף צלויים בגריל',
        'כרעיים עוף טנזיה בפירות יבשים', 'שניצלונים בציפוי פירורי לחם ושומשום'
      ],
      hot_sides: [
        'אורז לבן עם שקדים וצימוקים', 'אורז עם אפונה עדינה וירקות', 'אורז מאלובה עם ירקות',
        'תפו"א אפוי בשום, שמן זית ורוזמרין טרי', 'תפו"א "גורמה"', 'תפו"א בנוסח אסיאתי',
        'ירקות מנגל בנוסח איטלקי', 'ירקות מבושלים בנוסח טורקי', 'זיתים מבושלים בסגנון מרוקאי',
        'שעועית ירוקה מוקפצת בשמן שומשום ובצל סגול', 'קוסקוס מרוקאי', 'מרק קוסקוס עשיר'
      ]
    },
    categoryLimits: { salads: 7, main_courses: 2, hot_sides: 3 },
    addons: [ADD_SALAD_NOTE, DELIVERY_NOTE]
  }),

  pkg({
    id: 'shabbat-chatan-saturday',
    name: { he: 'תפריט לשבת חתן - ליום שבת', en: 'Shabbat Chatan Menu - Saturday Lunch', fr: 'Menu Shabbat Hatan - Samedi Midi' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/07/%D7%A9%D7%91%D7%AA-%D7%97%D7%AA%D7%9F.pdf',
    pricePerGuest: 87,
    eventTypes: ['shabbat_chatan'],
    categories: {
      salads: SALADS_24,
      starters: [
        'עלי גפן + בצל ממולאים באורז ועגבניות', 'עלי גפן + כרוב ממולאים באורז ועגבניות',
        'קובה חמוסטה ברוטב סלרי ועלי מנגולד', 'קובה נבלוסיה במילוי בשר / פטריות',
        'לביבות תפו"א במילוי בשר / פטריות', 'סיגר במילוי בשר סיסקא', 'שישברק בשר', 'פלאפל קישואי זוקיני',
        'לביבות ירק (לטקס)', 'קציצות כרישה (פרסה)', 'בורקס פילאס בשר / חזה עוף ופטריות'
      ],
      main_courses: [
        'אסאדו בבישול ארוך בציר בקר ויין', 'צלי בקר ברוטב עשיר ופטריות טריות', 'רצועות בקר בנוסח סצ\'ואן',
        'קציצות בשר ברוטב מרוקאי עשיר', 'קבב יווני "סופלאקי"', 'פרגיות בגריל', "פרגיות ברכז רימונים וג'ינג'ר",
        "פרגיות בצ'ילי והדרים", 'פרגיות במילוי פיסטוק שמי וקשיו', 'כרעיים עוף צלויים בגריל',
        'כרעיים עוף טנזיה בפירות יבשים', 'שניצלונים בציפוי פירורי לחם ושומשום'
      ],
      hot_sides: [
        'אורז לבן עם שקדים וצימוקים', 'אורז עם אפונה עדינה וירקות', 'אורז בר וירקות גינה',
        'תפו"א אפוי בשום, שמן זית ורוזמרין טרי', 'תפו"א "גורמה"', 'תפו"א בנוסח אסיאתי',
        'ירקות מנגל בנוסח איטלקי', 'ירקות מבושלים בנוסח טורקי', 'זיתים מבושלים בסגנון מרוקאי',
        'שעועית ירוקה מוקפצת בשמן שומשום ובצל סגול', 'שעועית ירוקה ברוטב עגבניות', 'קוסקוס מרוקאי',
        'מרק קוסקוס עשיר'
      ]
    },
    categoryLimits: { salads: 7, starters: 4, main_courses: 2, hot_sides: 3 },
    addons: [ADD_SALAD_NOTE, DELIVERY_NOTE]
  }),

  pkg({
    id: 'snacks-menu',
    name: { he: 'תפריט החטיפים', en: 'Snacks Menu', fr: 'Menu Collations' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2025/07/%D7%97%D7%98%D7%99%D7%A4%D7%99%D7%9D.pdf',
    pricePerGuest: 80,
    categories: {
      salads: [
        'סלט כוסברה בתוספת חמוציות ושקדים קלויים', 'עגבניות שרי תמר בנענע שום ושמן זית',
        'ירקות מעורבים בתחמיץ הבית', 'טחינה לבנה עם שום ולימון', 'מיקס מתבלים וחריפי הבית',
        'מגוון זיתים מובחרים', 'חמוצים עיראקי טורשי'
      ],
      starters: [
        'שיפוד רול קבב', 'קבב יווני "סופלאקי"', 'נקניקיות "צ\'וריסוס" עגל', 'סטייק פרגית בגריל',
        'שניצלונים בציפוי פרורי לחם ושומשום', 'קובה נבלוסיה במילוי בשר', 'סיגר במילוי בשר סיסקא',
        'שישברק בשר', 'פרחי כרובית בציפוי פריך', 'עלי גפן וכרוב ממולאים באורז ועגבניות',
        "צ'יפס שעועית ירוקה עם שום ושמן זית"
      ]
    },
    addons: ['כולל פיתות חמות', ADD_SALAD_NOTE, DELIVERY_NOTE]
  }),

  pkg({
    id: 'wednesday-thursday-catering',
    name: { he: 'תפריט קייטרינג לימי רביעי או חמישי', en: 'Wednesday/Thursday Catering Menu', fr: 'Menu Traiteur Mercredi/Jeudi' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/07/%D7%90%D7%9E%D7%A6%D7%A9.pdf',
    pricePerGuest: 79,
    categories: {
      salads: [
        'סלט כוסברה בתוספת חמוציות ושקדים קלויים', 'סלט סלרי וירוקים קצוצים בדבש, לימון ושמן זית',
        'עגבניות שרי תמר בנענע, שום ושמן זית', 'סלט ירקות עם בצל סגול, פטרוזיליה ונענע',
        'ירקות מעורבים בתחמיץ הבית', 'כרוב לבן בתחמיץ הבית', 'קולסלאו - כרוב לבן וגזר במיונז',
        'גזר מגורד עם כוסברה ולימון', 'חומוס הבית', 'טחינה לבנה עם שום ולימון', 'חצילים כתושים עם טחינה',
        'חצילים כתושים עם מיונז', 'חצילים כתושים עם ירקות', 'קוביות חציל בנוסח אסיאתי',
        'סלק אדום בתחמיץ הבית', 'מטבוחה מרוקאית בבישול ארוך', 'סלט טורקי', 'מיקס מתבלים וחריפי הבית',
        'מגוון זיתים מובחרים', 'חמוצים עראקי - טורשי', 'פלפל ירוק חריף מקולף בשום, לימון ושמן זית'
      ],
      starters: [
        'עלי גפן + בצל ממולאים באורז ועגבניות', 'עלי גפן + כרוב ממולאים באורז ועגבניות',
        'קובה חמוסטה ברוטב סלרי ועלי מנגולד', 'קובה נבלוסיה במילוי בשר / פטריות', 'שישברק בשר',
        'סיגר מרוקאי במילוי בשר', 'סיגר מרוקאי במילוי תפו"א', 'לביבות תפו"א במילוי בשר',
        'לביבות תפו"א במילוי פטריות', 'פלאפל קישואי זוקיני', 'קציצות כרישה (פרסה)', 'לביבות ירק (לטקס)',
        'פסטל במילוי תפו"א'
      ],
      main_courses: [
        'פרגיות בגריל', "פרגיות ברכז רימונים וג'ינג'ר", "פרגיות בצ'ילי והדרים",
        'פרגיות במילוי פיסטוק שמי וקשיו', 'שניצלונים בציפוי פרורי לחם ושומשום', 'שוקיים וירכיים צלויים בגריל',
        'שוקיים וירכיים טנזיה בפירות יבשים', 'נקנקיות צ\'וריסוס עגל', 'שיפוד רול קבב', 'קבב יווני "סופלאקי"',
        'קבב ביתי על הגריל', 'קציצות בשר ברוטב עגבניות', 'קציצות בשר ברוטב מרוקאי עשיר'
      ],
      hot_sides: [
        'אורז לבן עם שקדים וצימוקים', 'אורז עם אטריות "שערייה"', 'אורז מאלובה עם ירקות',
        'תפו"א אפוי בשום, שמן זית ורוזמרין טרי', 'ירקות מבושלים בנוסח טורקי', 'זיתים מבושלים בסגנון מרוקאי',
        'שעועית ירוקה ברוטב עגבניות', "צ'יפס שעועית ירוקה עם שום, שמן זית ומלח גס",
        'שעועית ירוקה מוקפצת בנוסח אסיאתי'
      ]
    },
    categoryLimits: { salads: 6, starters: 4, main_courses: 3, hot_sides: 3 },
    addons: ['כולל פיתות חמות', ADD_SALAD_NOTE, DELIVERY_NOTE]
  }),

  pkg({
    id: 'seudat-mitzvah-1',
    name: { he: 'תפריט לסעודת מצווה 1', en: 'Seudat Mitzvah Menu 1', fr: 'Menu Seoudat Mitsva 1' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/07/%D7%9E%D7%A6%D7%95%D7%95%D7%94.pdf',
    pricePerGuest: 65,
    eventTypes: ['brit', 'bar_mitzvah', 'celebration'],
    categories: {
      salads: [
        'סלט כוסברה בתוספת חמוציות ושקדים קלויים', 'סלט סלרי וירוקים קצוצים בדבש, לימון ושמן זית',
        'עגבניות שרי תמר בנענע, שום ושמן זית', 'סלט ירקות עם בצל סגול, פטרוזיליה ונענע',
        'ירקות מעורבים בתחמיץ הבית', 'כרוב לבן בתחמיץ הבית', 'קולסלאו - כרוב לבן וגזר במיונז',
        'גזר מגורד עם כוסברה ולימון', 'חומוס הבית', 'טחינה לבנה עם שום ולימון', 'חצילים כתושים עם טחינה',
        'חצילים כתושים עם מיונז', 'חצילים כתושים עם ירקות', 'קוביות חציל בנוסח אסיאתי',
        'סלק אדום בתחמיץ הבית', 'מטבוחה מרוקאית בבישול ארוך', 'סלט טורקי', 'מיקס מתבלים וחריפי הבית',
        'מגוון זיתים מובחרים', 'חמוצים עראקי - טורשי', 'פלפל ירוק חריף מקולף בשום, לימון ושמן זית'
      ],
      main_courses: [
        'פרגיות בגריל', 'שניצלונים בציפוי פירורי לחם ושומשום', 'שוקיים וירכיים צלויים בגריל',
        'קבב יווני "סופלאקי"', 'קבב ביתי על הגריל', 'שיפוד רול קבב', 'כרעיים עוף טריים צלויים בגריל',
        'כרעיים עוף טנזיה בפירות יבשים', 'שניצל עוף בציפוי פירורי לחם ושומשום', 'פילה מושט טרי מטוגן',
        'פילה מושט טרי ברוטב מרוקאי', 'פילה סלמון ברוטב מרוקאי', 'פילה סלמון בעשבי תיבול טריים'
      ],
      hot_sides: [
        'אורז לבן', 'אורז עם איטריות "שערייה"', 'אורז מאלובה עם ירקות',
        'תפו"א אפוי בשום, שמן זית ורוזמרין טרי', "צ'יפס שעועית ירוקה עם שום, שמן זית ומלח גס",
        'ירקות מבושלים בנוסח טורקי', 'זיתים מבושלים בסגנון מרוקאי', 'שעועית ירוקה ברוטב עגבניות'
      ]
    },
    categoryLimits: { salads: 5, main_courses: 2, hot_sides: 3 },
    addons: [
      'עיקרית: אופציה א׳ - 2 סוגים מתוך 6 (בשר/עוף/קבב); אופציה ב׳ - מנה אישית אחת מתוך 7 (עוף/דג)',
      'ניתן להוסיף ממולאים / מטוגנים בתוספת תשלום', 'כולל לחמניות: מזונות / המוציא / פיתות',
      ADD_SALAD_NOTE, DELIVERY_NOTE
    ]
  }),

  pkg({
    id: 'seudat-mitzvah-2',
    name: { he: 'תפריט לסעודת מצווה 2', en: 'Seudat Mitzvah Menu 2', fr: 'Menu Seoudat Mitsva 2' },
    sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/07/%D7%9E%D7%A6%D7%95%D7%95%D7%94.pdf',
    pricePerGuest: 79,
    eventTypes: ['brit', 'bar_mitzvah', 'celebration'],
    categories: {
      salads: [
        'סלט כוסברה בתוספת חמוציות ושקדים קלויים', 'סלט סלרי וירוקים קצוצים בדבש, לימון ושמן זית',
        'עגבניות שרי תמר בנענע, שום ושמן זית', 'סלט ירקות עם בצל סגול, פטרוזיליה ונענע',
        'ירקות מעורבים בתחמיץ הבית', 'כרוב לבן בתחמיץ הבית', 'קולסלאו - כרוב לבן וגזר במיונז',
        'גזר מגורד עם כוסברה ולימון', 'חומוס הבית', 'טחינה לבנה עם שום ולימון', 'חצילים כתושים עם טחינה',
        'חצילים כתושים עם מיונז', 'חצילים כתושים עם ירקות', 'קוביות חציל בנוסח אסיאתי',
        'סלק אדום בתחמיץ הבית', 'מטבוחה מרוקאית בבישול ארוך', 'סלט טורקי', 'מיקס מתבלים וחריפי הבית',
        'מגוון זיתים מובחרים', 'חמוצים עראקי - טורשי', 'פלפל ירוק חריף מקולף בשום, לימון ושמן זית'
      ],
      starters: [
        'פילה מושט טרי מטוגן', 'פילה מושט טרי ברוטב מרוקאי', 'קבב דגים "חריימה"'
      ],
      main_courses: [
        'פרגיות בגריל', 'שניצלונים בציפוי פירורי לחם ושומשום', 'שוקיים וירכיים צלויים בגריל',
        'קבב יווני "סופלאקי"', 'קבב ביתי על הגריל', 'שיפוד רול קבב', 'כרעיים עוף טריים צלויים בגריל',
        'כרעיים עוף טנזיה בפירות יבשים', 'שניצל עוף בציפוי פירורי לחם ושומשום', 'פילה מושט טרי מטוגן',
        'פילה מושט טרי ברוטב מרוקאי', 'פילה סלמון ברוטב מרוקאי', 'פילה סלמון בעשבי תיבול טריים'
      ],
      hot_sides: [
        'אורז לבן', 'אורז עם איטריות "שערייה"', 'אורז מאלובה עם ירקות',
        'תפו"א אפוי בשום, שמן זית ורוזמרין טרי', "צ'יפס שעועית ירוקה עם שום, שמן זית ומלח גס",
        'ירקות מבושלים בנוסח טורקי', 'זיתים מבושלים בסגנון מרוקאי', 'שעועית ירוקה ברוטב עגבניות'
      ]
    },
    categoryLimits: { salads: 6, starters: 1, main_courses: 2, hot_sides: 3 },
    addons: [
      'עיקרית: אופציה א׳ - 3 סוגים מתוך 6 (בשר/עוף/קבב); אופציה ב׳ - מנה אישית אחת מתוך 7 (עוף/דג)',
      'כולל 3 סוגי ממולאים / מטוגנים', 'כולל לחמניות: מזונות / המוציא / פיתות', ADD_SALAD_NOTE, DELIVERY_NOTE
    ]
  })
];

const alaCarteAddons = [
  // ממולאים / מטוגנים (stuffed/fried) - price per unit
  ['עלי גפן ממולאים באורז ועגבניות', 2.8, 'hot_food'], ['בצל ממולא באורז ועגבניות', 3.6, 'hot_food'],
  ['כרוב ממולא באורז ועגבניות', 3.6, 'hot_food'], ['קובה אורפלי (חמו)', 13, 'hot_food'],
  ['קובה חמוסטה ברוטב סלרי ועלי מנגולד', 6.5, 'hot_food'], ['קובה נבלוסיה גדול במילוי בשר וצנוברים', 7.5, 'hot_food'],
  ['קובה נבלוסיה במילוי בשר / פטריות', 4.4, 'hot_food'], ['לביבות תפו"א במילוי בשר / פטריות', 4.4, 'hot_food'],
  ['לביבות ירק (לטקס)', 4.4, 'hot_food'], ['קציצות כרישה (פרסה)', 4.4, 'hot_food'],
  ['אגרול סיני במילוי ירקות', 4.4, 'hot_food'], ['פלאפל קישואי זוקיני', 3.6, 'pareve_vegan_no_sugar'],
  ['פסטל במילוי תפו"א', 3.6, 'hot_food'], ['כדורי פירה תפו"א בציפוי פריך', 2.8, 'hot_food'],
  ['טבעות בצל', 2.8, 'hot_food'], ['שישברק בשר', 2.8, 'hot_food'],
  ['סיגר מרוקאי במילוי בשר / תפו"א', 2.8, 'hot_food'], ['סיגר במילוי בשר סיסקא', 5.5, 'hot_food'],
  ['סיגר פילו במילוי בשר בציפוי פנקו', 5.5, 'hot_food'],
  ['פרחי כרובית בציפוי פריך (ל-100 גר\')', 9.6, 'hot_food'], ['פרחי ברוקולי בציפוי פריך (ל-100 גר\')', 9.6, 'hot_food'],
  // מבחר מאפים (pastries)
  ['בורקס פילאס במילוי בשר עגל', 13, 'quiches_pies_burekas'], ['מיני מאפה במילוי חזה עוף ופטריות', 13, 'quiches_pies_burekas'],
  ['קאדה בעבודת יד במילוי בשר / פטריות', 13, 'quiches_pies_burekas'],
  ['טורטיה אפויה במילוי בשר / עוף / ירקות', 10, 'quiches_pies_burekas'], ['עראייס בשר', 6, 'quiches_pies_burekas'],
  // מבחר דגים (fish)
  ['פילה לברק טרי צרוב על הפלאנצ\'ה עם מלח אטלנטי ושמן זית', 49, 'hot_food'],
  ['פילה סלמון ברוטב מרוקאי', 39, 'hot_food'], ['פילה סלמון בנוסח אסיאתי', 39, 'hot_food'],
  ['פילה סלמון בעשבי תיבול טריים', 39, 'hot_food'], ['פילה מושט טרי בנוסח מרוקאי', 39, 'hot_food'],
  ['פילה מושט טרי מטוגן', 39, 'hot_food'], ['פילה מושט טרי מטוגן - מנה ראשונה', 20, 'hot_food'],
  ['"חריימה" - קבב דגים ברוטב מרוקאי עשיר', 9, 'hot_food'],
  // מבחר מנות בשר (meat)
  ['צלי בקר ברוטב עשיר ופטריות טריות', 28, 'hot_food'], ['המבורגר גורמה', 24, 'hot_food'],
  ['נקניקיות צ\'וריסוס עגל', 10, 'hot_food'], ['מוסקה - חציל בלאדי במילוי בשר', 10, 'hot_food'],
  ['קבב יווני "סופלאקי"', 10, 'hot_food'], ['שיפוד רול קבב', 9, 'hot_food'], ['קבב ביתי על הגריל', 9, 'hot_food'],
  ['קציצות בשר ברוטב מרוקאי עשיר', 9, 'hot_food'], ['קציצות בשר ברוטב עגבניות', 8, 'hot_food'],
  // מבחר מנות עוף (chicken)
  ['פרגיות בגריל / רכז רימונים', 14, 'hot_food'], ['פרגיות במילוי פיסטוק שמי וקשיו', 16, 'hot_food'],
  ['חזה עוף בגריל', 16, 'hot_food'], ['שניצל עוף בציפוי פירורי לחם ושומשום', 25, 'hot_food'],
  ['שניצלונים בציפוי פרורי לחם ושומשום', 7, 'hot_food'], ['שניצלונים בתיבול מקסיקני', 7, 'hot_food'],
  ['קציצות עוף "עראקיות"', 7, 'hot_food'], ["צ'יקן נאגטס", 3.5, 'hot_food'],
  ['כרעיים עוף צלויים / טנזיה פירות יבשים', 25, 'hot_food'], ['שוקיים וירכיים טנזיה בפירות יבשים', 15, 'hot_food'],
  ['שוקיים וירכיים צלויים / ברכז רימונים', 14, 'hot_food'],
  // מבחר תוספות / פחמימות (sides, per 100g unless noted)
  ['אורז לבן עם שקדים וצימוקים (ל-100 גר\')', 4.9, 'hot_food'], ['אורז עם אטריות "שערייה" (ל-100 גר\')', 4.9, 'hot_food'],
  ['אורז לבן עם עשבי תיבול טריים וחמוציות (ל-100 גר\')', 4.9, 'hot_food'],
  ['אורז מאלובה עם ירקות (ל-100 גר\')', 4.9, 'hot_food'],
  ['תפו"א אפוי בשום, שמן זית ורוזמרין טרי (ל-100 גר\')', 4.9, 'hot_food'],
  ['פוטטוס בתיבול קייג\'ין (ל-100 גר\')', 6.5, 'hot_food'], ['צ\'יפס בלגי / צ\'יפס בטטה (ל-100 גר\')', 6.5, 'hot_food'],
  ['שעועית ירוקה מוקפצת בנוסח אסיאתי (ל-100 גר\')', 5.9, 'hot_food'],
  ['צ\'יפס שעועית ירוקה עם שום ושמן זית (ל-100 גר\')', 5.9, 'hot_food'],
  ['שעועית ירוקה ברוטב עגבניות (ל-100 גר\')', 4.9, 'hot_food'],
  ['זיתים מבושלים בסגנון מרוקאי (ל-100 גר\')', 4.9, 'hot_food'], ['ירקות מבושלים בנוסח טורקי (ל-100 גר\')', 4.9, 'hot_food'],
  ['פרחי כרובית מאודים בשמן זית ועשבי תיבול (ל-100 גר\')', 9.6, 'hot_food'],
  ['פרחי ברוקולי מאודים בשום, שמן זית ומלח גס (ל-100 גר\')', 9.6, 'hot_food'],
  ['קוגל ירושלמי אמיתי / קוגל תפו"א (ליחידה)', 6, 'hot_food'],
  // מבחר סלטים לליטר - 50₪
  ['חומוס הבית (לליטר, 50 ₪)', 50, 'salads'], ['טחינה לבנה/ירוקה (לליטר, 50 ₪)', 50, 'salads'],
  ["עגבניות שרי ברכז רימונים/בנענע ושום (לליטר, 50 ₪)", 50, 'salads'],
  ['כוסברה בתוספת חמוציות ושקדים (לליטר, 50 ₪)', 50, 'salads'], ['סלט סלרי וירוקים (לליטר, 50 ₪)', 50, 'salads'],
  ['סלט ירקות (לליטר, 50 ₪)', 50, 'salads'], ['כרוב בתחמיץ / סגול במיונז (לליטר, 50 ₪)', 50, 'salads'],
  ['קולסלאו (לליטר, 50 ₪)', 50, 'salads'], ['סלט ביצים (לליטר, 50 ₪)', 50, 'salads'],
  ['סלט סלק (לליטר, 50 ₪)', 50, 'salads'], ['סלט טורקי (לליטר, 50 ₪)', 50, 'salads'],
  ['חמוצים עראקי טורשי (לליטר, 50 ₪)', 50, 'salads'], ['זיתים סורים (לליטר, 50 ₪)', 50, 'salads'],
  ['מלפפון חמוץ ביתי (לליטר, 50 ₪)', 50, 'salads'],
  // מבחר סלטים לליטר - 60₪
  ['חצילים כתושים בטחינה / מיונז / ירקות (לליטר, 60 ₪)', 60, 'salads'],
  ['חציל בנוסח אסיאתי (לליטר, 60 ₪)', 60, 'salads'], ['גזר מגורד עם כוסברה ולימון (לליטר, 60 ₪)', 60, 'salads'],
  ['גזר מגורד בתוספת חמוציות וסילאן (לליטר, 60 ₪)', 60, 'salads'], ['גזר מרוקאי (לליטר, 60 ₪)', 60, 'salads'],
  ['סלט תפו"א וביצים (לליטר, 60 ₪)', 60, 'salads'], ["רצועות בטטה בצ'ילי ושקדים (לליטר, 60 ₪)", 60, 'salads'],
  ['רצועות פלפלים קלופים בשום (לליטר, 60 ₪)', 60, 'salads'], ['סלט פירות העונה (לליטר, 60 ₪)', 60, 'salads'],
  ['ירקות מעורבים (לליטר, 60 ₪)', 60, 'salads'], ['סחוג מרוקאי (לליטר, 60 ₪)', 60, 'salads'],
  ['פלפל חריף מקולף בשום (לליטר, 60 ₪)', 60, 'salads'], ['מתבל לימון כבוש (לליטר, 60 ₪)', 60, 'salads'],
  // מבחר סלטים לליטר - 70₪
  ['עדשי פנינה עם בטטה וחמוציות (לליטר, 70 ₪)', 70, 'salads'], ['מטבוחה מרוקאית (לליטר, 70 ₪)', 70, 'salads'],
  ['אבוקדו עם ביצים ובצל ירוק (לליטר, 70 ₪)', 70, 'salads'], ['טונה עם ירקות במיונז (לליטר, 70 ₪)', 70, 'salads'],
  ['סלט וולדרוף (לליטר, 70 ₪)', 70, 'salads'], ['קינואה בתוספת חמוציות וסילאן (לליטר, 70 ₪)', 70, 'salads'],
  ['סלט טבולה מקינואה אדומה (לליטר, 70 ₪)', 70, 'salads'], ['כרוב סגול פיצוחים (לליטר, 70 ₪)', 70, 'salads'],
  ['כרוב לבן פירות יבשים (לליטר, 70 ₪)', 70, 'salads'], ['סחוג של אסתר (חריפות מעודנת) (לליטר, 70 ₪)', 70, 'salads'],
  // אחרים
  ['מארז מיקס מתבלים / זיתים מובחרים', 28, 'salads'],
  ['לחמניות מזונות', 4.9, 'cheese_bread_savory'], ['לחמניות המוציא', 3.5, 'cheese_bread_savory'],
  ['פיתות', 2.5, 'cheese_bread_savory']
];

const alaCartePackage = {
  id: 'open-catering-menu',
  type: 'a_la_carte',
  name: { he: 'תפריט קייטרינג פתוח', en: 'Open Catering Menu (Per-Item Price List)', fr: "Menu Traiteur Ouvert (Liste de Prix à l'Unité)" },
  pricePerGuest: '',
  minGuests: '',
  includedCategories: [],
  categoryLimits: {},
  categoryItems: {},
  eventTypes: [],
  sourceUrl: 'https://www.pashajer.co.il/wp-content/uploads/2026/01/67207_tafrit-katering.pdf',
  addons: alaCarteAddons.map(([he, amount, categoryId]) => ({
    id: nanoid(8),
    name: { he, en: '', fr: '' },
    priceType: 'flat',
    amount: String(amount),
    categoryId
  }))
};

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
    businessName: 'פאשה',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'פאשה - מתחם האוכל המוכן הגדול בירושלים, המשלב חנות אוכל מוכן לשבת וקייטרינג בשרי עשיר. מעל 180 מנות עשירות, החל מ-15 מנות ומעלה. כשר בהשגחת הרבנות ירושלים, בשר חלק חו״ל לפי שיטת בית יוסף, עוף מהדרין וירק גוש קטיף.',
      en: "Pasha - Jerusalem's largest prepared-food complex, combining a ready-for-Shabbat food shop with rich meat catering. Over 180 dishes, starting from 15 portions. Kosher under the Jerusalem Rabbinate's supervision, chalak meat from abroad per the Beit Yosef method, mehadrin poultry and Gush Katif vegetables.",
      fr: "Pasha - le plus grand complexe de plats préparés de Jérusalem, combinant une boutique de plats prêts pour Shabbat et un service traiteur de viande riche. Plus de 180 plats, à partir de 15 portions. Cacher sous la supervision du Rabbinat de Jérusalem, viande chalak importée selon la méthode Beit Yossef, volaille mehadrin et légumes de Goush Katif."
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'פייר קניג 28, תלפיות, ירושלים',
    kashrutLevels: ['local_rabbinate', 'badatz_beit_yosef', 'mehadrin'],
    cateringTypes: ['meat'],
    maxGuests: 500,
    priceFrom: 65, // real: cheapest published per-portion menu (seudat-mitzvah-1)
    packages: [...packages, alaCartePackage],
    eventTypes: ['shabbat_chatan', 'brit', 'bar_mitzvah', 'celebration'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads'],
    services: [],
    phone: '+972-2-6482220',
    whatsapp: '+972026482220',
    email: '',
    website: 'https://www.pashajer.co.il/',
    instagram: '',
    facebook: '',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, ${packages.length} priced formulas, and 1 a_la_carte catalog (${alaCartePackage.addons.length} items).`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
