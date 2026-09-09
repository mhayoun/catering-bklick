// One-off follow-up for "קייטרינג מלכה" (id Ph7PaWBDq0, added by a previous script that found it
// via cafetamara.co.il/תמרה-הבשרי, which explicitly says every menu is "custom-built per event" -
// no packages were seeded). The user then pointed at the caterer's OWN dedicated site,
// https://www.malka-meat.co.il/ (branded "מלכה" in its own PDF headers, so clearly the same
// business), which turned out to publish exactly 3 real, fully priced, itemized order-form PDFs
// linked from its own /menus/ pages:
//   - /menus/catering-menu  -> "תפריט קייטרינג - 95 ש"ח" (general catering menu, 95/guest)
//   - /menus/menu-shabat-hatan -> "תפריט שבת חתן" (a 3-page PDF: Friday night 95/guest, Shabbat
//     lunch 95/guest, Seuda Shlishit 75/guest). Modeled as ONE package using the Shabbat-lunch
//     tier (the fullest - it's the only one with a מרכז שולחן/centerpiece course), since the
//     schema has one pricePerGuest per package; the other two timing tiers are kept as
//     informational note addons rather than invented as separate categoryItems slots.
//   - /menus/mitzva -> "תפריט סעודת מצווה - 75 ש"ח" (bar/bat mitzvah meal, 75/guest)
// All three PDFs are clean, legible order-form checklists (not dense grids like scripts/
// add-hazen-formulas-logo-photos.mjs had to zoom-crop) - read directly, transcribed as printed.
//
// Note: malka-meat.co.il's own /contact page lists phone 054-7777375, which does not match the
// existing record's phone (+972-58-557-7507 / +972-58-793-7707, sourced from cafetamara.co.il).
// Left the record's contact fields untouched here (out of scope for "add the formulas") - flagged
// to the user separately.
//
// Usage: node --env-file=.env.local scripts/add-malka-formulas.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'Ph7PaWBDq0';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function addon(he, priceType, amount) {
  return { id: nanoid(8), name: { he, en: '', fr: '' }, priceType, amount: String(amount ?? '') };
}

const PAID_OPTIONS = [
  addon('ממולאים למרכז שולחן - בצל, כרוב ופלפלונים', 'per_guest', 12),
  addon('סט כלים חד"פ - צלחות, כוסות לסלטים, מפות, מפיות, נייר וסכו"ם ארוז', 'per_guest', 10),
  addon('שתייה קלה ממשפחת קוקה קולה', 'per_guest', 8),
  addon('מגשי קינוחים מתוקים במגוון סוגים', 'flat', 249)
];

const catering = {
  id: 'catering-menu-95',
  type: 'formula',
  name: { he: 'תפריט קייטרינג מלכה', en: 'Malka Catering Menu', fr: 'Menu Traiteur Malka' },
  pricePerGuest: '95',
  minGuests: '',
  includedCategories: ['starters', 'salads', 'main_courses', 'hot_sides', 'breads'],
  categoryLimits: { starters: 1, salads: 7, main_courses: 3, hot_sides: 3, breads: 1 },
  categoryItems: {
    starters: items([
      'מיקס מטוגנים- קוביה, סיגר בשר ופסטל תפו"א', 'קובה חמוסתה אורגינל', 'קובה דלעת כתום',
      'פילה לברק בשמן זית מלח ופלפל 4 עונות', 'פילה חושן בשמן זית שום ועשבי תיבול',
      'פילה חושן ברוטב מרוקאי', 'חריימה קובי דגים ברוטב מרוקאי'
    ]),
    salads: items([
      'חמוצים עיראקים - גזר, קולרבי, כרוב ופלפל אדום', 'כרוב לבן עם סלרי',
      'גזר פיקנטי עם כוסברה קצוצה ושום טרי', 'גזר מבושל בתיבול מרוקאי', 'חומוס הבית',
      'טחינה ירוקה', 'טחינה לבנה', 'מטבוחה ביתית', 'חציל במיונז', 'חציל ספרדי עם אריסה פיקנטית',
      'חציל רומני- חציל ופלפל קלויים בתיבול לימון שום ושמן זית', 'סלק בנוסח מזרחי',
      'מיקס זיתים וחמוצים', 'רצועות פלפל חריף עם שום ולימון שמן זית',
      'סלט פלפלים קלויים בתיבול שום ולימון טרי', 'סלט בטטה עם שומשום וצ\'ילי מתוק',
      'כרוב סגול במיונז', 'סלט תפו"א – תפו"א גזר ומלפפון חמוץ במיונז הולנדי',
      'סלט תירס עם קוביות פלפל אדום פטריות וקצוץ שמיר', 'אורז לבן'
    ]),
    main_courses: items([
      'פרגית צלויה ברוטב סילאן וקינמון', 'פרגית ממולאת במילוי מעורב פיצוחים', 'שניצלונים פריכים',
      'כרעיים עוף עם ענבניות ושום קונפי', 'כרעיים עוף ברוטב טאג\'ין - פירות יבשים מתובל בסילאן וקינמון',
      'נקניקיות צ\'וריסו מוקפצות עם בצל בגריל', 'קציצות אבוחריצה - קציצת בשר מנוחה ברוטב עגבניות',
      'קבב הבית', 'חזה עוף על הפלנצ\'ה', 'בורקס במילוי בשר ושקדים קלויים',
      'סלמון נורווגי בשמן זית שום ועשבי תיבול', 'סלמון נורווגי עטוף בקראקסט פיצוחים', 'פתיתים'
    ]),
    hot_sides: items([
      'אורז לבן', 'אורז מקלובה - אורז בליווי ירקות קלויים', 'שעועית ירוקה ברוטב עגבניות',
      'זיתים שלמים מבושלים בסגנון מרוקאי', 'תבשיל אפונה וארטישוק', 'אנטי פסטי ירקות',
      'שעועית ירוקה בנוסח אסיאתי', 'אטריות סלדון מוקפצות בווק עם ירקות בנוסח אסייתי'
    ]),
    breads: items(['פיתות', 'לחמניות המוציא', 'לחמניות מזונות'])
  },
  eventTypes: ['brit', 'bar_mitzvah', 'engagement', 'wedding', 'celebration', 'memorial'],
  addons: PAID_OPTIONS,
  sourceUrl: 'https://www.malka-meat.co.il/menus/catering-menu'
};

const shabbatChatan = {
  id: 'shabbat-chatan-menu-95',
  type: 'formula',
  name: { he: 'תפריט שבת חתן', en: 'Shabbat Chatan Menu', fr: 'Menu Shabbat Chatan' },
  pricePerGuest: '95',
  minGuests: '',
  includedCategories: ['starters', 'salads', 'main_courses', 'hot_sides', 'breads'],
  categoryLimits: { starters: 1, salads: 7, main_courses: 2, hot_sides: 3, breads: 1 },
  categoryItems: {
    // "מרכז שולחן" (table centerpiece course) from the Shabbat-lunch tier - closest fit to `starters`.
    starters: items([
      'מיקס חצילים סקסי - זוגי, קוזיני, קינואה, ברוקולי', 'מיקס מטוגנים - קוביה, סיגר בשר, נבולסיה, פסטל תפו"א',
      'סופריטו עוף - עוף ותפו"א בבישול ארוך', 'סופריטו בשר - קוביות בשר ותפו"א בבישול ארוך',
      'גולש הונגרי - לישבל בשר וגזר ותפו"א ברוטב עגבניות', 'קציצות של סבתא עם אפונה גינה',
      'כרעיים ברוטב טאג\'ין - פירות יבשים עם סילאן וקינמון טרי', 'כרעיים עוף בתיבול גריל',
      'חמין מפנק - בשרי', 'חמין מפנק - צמחוני', 'שניצלונים פריכים', 'בורקס במילוי בשר ושקדים קלויים'
    ]),
    salads: items([
      'סלט ירקות טרי - חסה אילת בגן עגבניות שרי תמר מלפפון ובצל סגול', 'חמוצים עיראקים - גזר, קולרבי, כרוב ופלפל אדום',
      'כרוב לבן עם סלרי', 'גזר פיקנטי עם כוסברה קצוצה ושום טרי', 'גזר מבושל בתיבול מרוקאי',
      'חומוס הבית', 'טחינה ירוקה', 'טחינה לבנה', 'מטבוחה ביתית', 'חציל במיונז',
      'חציל ספרדי עם אריסה פיקנטית', 'חציל רומני- חציל ופלפל קלויים בתיבול לימון שום ושמן זית',
      'סלק בנוסח מזרחי', 'מיקס זיתים וחמוצים', 'רצועות פלפל חריף עם שום ולימון שמן זית',
      'סלט פלפלים קלויים בתיבול שום ולימון טרי', 'סלט בטטה עם שומשום וצ\'ילי מתוק', 'כרוב סגול במיונז',
      'סלט תפו"א – תפו"א גזר ומלפפון חמוץ במיונז הולנדי', 'סלט תירס עם קוביות פלפל אדום פטריות וקצוץ שמיר'
    ]),
    main_courses: items([
      'פילה סלמון בשמן זית שום ועשבי תיבול', 'פילה סלמון עטוף בקראקסט פיצוחים',
      'פילה מושט ברוטב מרוקאי', 'פילה מושט בשמן זית שום ועשבי תיבול',
      'פילה לברק בשמן זית מלח ופלפל 4 עונות', 'חלפי דג פריכים מוגשים עם רבעי לימון ופטרוזיליה קצוצה',
      'חתיכי אסאדו בבישול ארוך', 'עוף שלם ממולא באורז ועשבי תיבול',
      'צלי בשר ברוטב פטריות שורש ופקאנים', 'קציצות של סבתא ברוטב עגבניות', 'כרעיים עוף עם ריבת בצל וטימין',
      'שניצלונים פריכים', 'פרגית בתיבול סילאן וג\'ינג\'ר', 'פרגית על הפלנצ\'ה בתיבול שווארמה ובצל מטוגן',
      'בורקס במילוי בשר ושקדים קלויים', 'גולש הונגרי – קוביות בשר מנוחות בליווי קוביות תפו"א',
      'בשר סיצ\'ואן – חתיכי בקר מוקפצים ברוטב אסיאתי'
    ]),
    hot_sides: items([
      'אורז לבן', 'אורז מקלובה - אורז בליווי ירקות קלויים', 'אורז ירוק – עם עשבי תיבול טריים',
      'אורז אטריות', 'לישבל גרגרי חומוס מרוקאים', 'גראטן תפו"א', 'קוביות תפו"א בתיבול גריל',
      'זיתים שלמים בסגנון מרוקאי', 'ירקות אנטי פסטי', 'לישבל אפונה וארטישוק',
      'שעועית ירוקה בנוסח אסיאתי', 'שעועית ירוקה ברוטב עגבניות', 'קוסקוס ביתי בליווי מרק ירקות עשיר'
    ]),
    breads: items(['פיתות', 'לחמניות המוציא', 'לחמניות מזונות'])
  },
  eventTypes: ['brit', 'bar_mitzvah', 'engagement', 'wedding', 'celebration', 'memorial'],
  addons: [
    ...PAID_OPTIONS,
    addon('תפריט ליל שישי - 95 ₪ לסועד: אותו היקף (7 סלטים לבחירה, 2 מנות עיקריות, 3 תוספות חמות, לחם) ללא מרכז שולחן', 'note'),
    addon('סעודה שלישית - 75 ₪ לסועד: תפריט מצומצם (4 סלטים לבחירה, מנה עיקרית 1 דגים/פשטידות לבחירה, לחם) עם מרכז שולחן ממולאים/דגים', 'note')
  ],
  sourceUrl: 'https://www.malka-meat.co.il/menus/menu-shabat-hatan'
};

const mitzva = {
  id: 'mitzva-meal-menu-75',
  type: 'formula',
  name: { he: 'תפריט סעודת מצווה', en: 'Mitzvah Meal Menu', fr: 'Menu Repas de Mitsva' },
  pricePerGuest: '75',
  minGuests: '',
  includedCategories: ['starters', 'salads', 'main_courses', 'hot_sides'],
  categoryLimits: { starters: 1, salads: 6, main_courses: 2, hot_sides: 3 },
  categoryItems: {
    starters: items([
      'פילה חושן ברוטב מרוקאי / רוטב עשבי תיבול', 'נתחי דג מטוגנים בליווי פלחי לימון ופטרוזיליה',
      'קציצות דג ברוטב מרוקאי וגרגרי חומוס', '3 סוגי ממולאים (עלי גפן, כרוב, בצל) / מיקס מטוגנים למרכז שולחן'
    ]),
    salads: items([
      'סלט ירקות קצוץ עם בצל ופטרוזיליה', 'ירקות מוחמצים- גזר, קולרבי, כרוב ופלפל אדום',
      'כרוב לבן עם סלרי', 'גזר פיקנטי עם כוסברה קצוצה ושום טרי', 'גזר מבושל בתיבול מרוקאי',
      'חומוס הבית', 'טחינה ירוקה', 'חציל במיונז', 'חציל ספרדי עם אריסה פיקנטית',
      'סלק עם עשבי תיבול', 'מיקס זיתים וחמוצים', 'רצועות פלפל חריף עם לימון ושמן זית',
      'סלט בטטה עם שומשום וצ\'ילי מתוק', 'כרוב סגול במיונז', 'סלט פלפלים קלויים בתיבול שום ולימון טרי',
      'חציל רומני- חציל ופלפל קלויים בתיבול לימון שום ושמן זית'
    ]),
    main_courses: items([
      'כרעיים עוף צלויים עם ענבניות ושום קונפי', 'כרעיים עוף ברוטב קארי וכוסברה', 'שניצלונים פריכים',
      'פרגית בגריל ברוטב סילאן וקינמון', 'סלמון נורווגי ברוטב אסייתי / רוטב עשבי תיבול',
      'פילה חושן ברוטב מרוקאי / עשבי תיבול'
    ]),
    hot_sides: items([
      'אורז לבן', 'תפו"א אפוי בטימין שום ושמן זית', 'זיתים מבושלים בסגנון מרוקאי',
      'אפונה וארטישוק', 'שעועית לבנה ברוטב עגבניות', 'שעועית ירוקה אסייתית',
      'ירקות אנטי פסטי', 'אורז עם אטריות'
    ])
  },
  eventTypes: ['brit', 'bar_mitzvah', 'engagement', 'wedding', 'celebration', 'memorial'],
  addons: [],
  sourceUrl: 'https://www.malka-meat.co.il/menus/mitzva'
};

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const newPackages = [catering, shabbatChatan, mitzva];
  for (const pkg of newPackages) {
    if (record.packages.some((p) => p.id === pkg.id)) {
      console.warn(`Package "${pkg.id}" already exists - skipping.`);
    } else {
      record.packages.push(pkg);
    }
  }
  record.menuCategories = ['starters', 'salads', 'main_courses', 'hot_sides', 'breads'];

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): now has ${record.packages.length} package(s) total.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
