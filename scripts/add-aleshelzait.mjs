// One-off script: adds "קייטרינג עלה של זית" (aleshelzait.co.il) as a new, pre-approved
// caterer with all 9 menu formulas ("formules") found on their site's /תפריטים/ gallery
// (scanned menu-order sheets under 3 badatz kashrut certifications: Machpud, Landa, Beit Yosef -
// the same 9 formulas are offered under all three; this script stores one canonical set).
//
// Source: https://aleshelzait.co.il/ (business info) + https://aleshelzait.co.il/תפריטים/
// (menu images, transcribed manually).
//
// NOTE on pricing: the source site does not publish per-formula prices (order forms leave
// price blank - "price on request"). pricePerGuest below is an ESTIMATE derived from the
// directory listing's disclosed "average price per portion" (247 NIS) for this business,
// scaled per formula tier. Adjust via the dashboard edit form once real pricing is known.
//
// Usage: node --env-file=.env.local scripts/add-aleshelzait.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set - nothing to connect to.');
  process.exit(1);
}

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, addons, eventTypes }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest,
    minGuests,
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || [],
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }))
  };
}

const SALADS_COMMON = [
  'חומוס', 'טחינה', 'פלפל חריף', 'גזר מרוקאי', 'מטבוחה', 'סלט טונה', 'סלט ירקות', 'חמוצים',
  'תפוח אדמה במיונז', 'חצילים מטוגנים', 'חצילים במיונז', 'גזר חי בלימון', 'כרוב אדום במיונז',
  'כרוב לבן בלימון', 'רצועות פלפל מתוק', 'סלט פטריות', 'חציל יווני', 'סלט טוניסאי', 'מלפפון בשמיר',
  'עגבניות שרי בבזיליקום', 'חסה בייבי בתוספת ירקות', 'אנטיפסטי', 'סלט וולדורף', 'סלט חצילים רומני',
  'חצילים בטחינה', 'סלט בורגול', 'סלט אבוקדו', 'חמוצי הבית', 'פלטת ירקות', 'סלט טורקי',
  'קולסלאו (כרוב במיונז)', 'סלט ירוק עם חמוציות', 'סלט עדשים'
];

const packages = [
  pkg({
    id: 'bbq',
    name: { he: 'תפריט ברביקיו', en: 'BBQ Menu', fr: 'Menu Barbecue' },
    pricePerGuest: 260,
    minGuests: 50,
    eventTypes: ['celebration'],
    categories: {
      salads: [
        'סלט ירקות ישראלי', 'סלט חסה ואגוזים', 'סלט עגבניות שרי צבעוניות', 'סלט חצילים על גחלים',
        'סלט עגבניות חריף', 'חומוס', 'חומוס עם גרגירי חומוס', 'טחינה', 'טחינה ירוקה',
        'סלט גזר חי בלימון', 'חמוצי הבית', 'כרוב לבן בלימון', 'פלטת ירקות', 'סלט אנטיפסטי',
        'סלט משוואיה עגבניות על גחלים', 'סלט פלפל חריף', "סלט צ'ירצ'יל", 'חצילים שלמים בטחינה ועגבניה'
      ],
      main_courses: [
        'צלעות כבש', "נקניקיות צ'וריסוס", 'סטייק פרגית', 'חזה עוף', 'מרגז', 'שיפודי קבב',
        'המבורגר', 'אסאדו', 'סטייק מעושן', 'סטייק אנטריקוט', 'פילה בקר', 'שיפודי פרגית'
      ],
      hot_sides: [
        'פרחי ברוקולי וכרובית בתנור', 'שיפודי תפוח אדמה', 'אורז עם אטריות', 'תפו"א בנייר כסף',
        'קלחי תירס על גחלים', 'שעועית עדינה מוקפצת', 'תפוח אדמה גמדי ברוזמרין', "צ'יפס במקום",
        'פרחי תפוחי אדמה', 'אורז לבן עם שקדים וצימוקים'
      ],
      breads: ['פיתות', 'לאפות', 'לחמניות', "פוקאצ'ות", 'פרנות'],
      desserts: ['פירות', 'עוגיות'],
      beverages_non_alcoholic: ['שתיה']
    },
    addons: ['ציוד חד פעמי', 'ציוד קרמיקה', 'מלצרים', 'גרילמן במקום', 'הובלה (בתוספת תשלום)']
  }),

  pkg({
    id: 'weddings',
    name: { he: 'תפריט חתונות', en: 'Wedding Menu', fr: 'Menu Mariage' },
    pricePerGuest: 320,
    minGuests: 50,
    eventTypes: ['wedding'],
    categories: {
      starters: [
        "אפיית פוקאצ'ות ממולאות באנטיפסטי על לבנים בטאבון, ממרח עגבניות ואנטיפסטי",
        'פלטת מטוגנים (קובה, סיגר, פסטל, אגרול)',
        "בר דגים (סושי, פלטת דגים מעושנים, פריסת סלמון ברוטב דיז'ון)",
        'איטליאנו (אנטיפסטי, מיני קישים, פסטה פסטו)',
        'המזרח הרחוק - פריסת בשר ברוטב טריאקי, פאד תאי סיני ירקות מוקפץ, שניצלונים בשומשום',
        'מרוקו הקטנה - קוסקוס בית מעוטר בגרגירי חומוס ומרק ירקות, שיפודי מרגז, שיפודי קבב מרוקאי נוסח "עלה של זית"',
        "פיש אנד צ'יפס (נתחי דג בציפוי פריך, בליווי רוטב טרטר איולי)",
        "פינה סינית - עוף מוקפץ, בקר סצ'ואן, פאד תאי סיני, נודלס",
        'טורטיה ממולאת בבשר עגל',
        'סלמון שלם בפריסה מול האורח בליווי רטבים',
        'שווארמה',
        'פטה כבד עוף בריבת בצלים שחומים', 'תרמיל תאילנדי במילוי בשר עגל',
        'פילה סלמון ברוטב טריאקי ושומשום שחור', 'פילה אמנון בניחוח הציידים על מצע בטטה ושעועית עדינה',
        'פטריות פורטובלו ממולאות בשר עגל ברוטב יין מצומצם', 'חזה עוף ממולא בעגל ברוטב שמפניה',
        'חזה עגל ברוטב מצומצם בלסמי מלווה פיצוחים', 'פסטה רביולי ברוטב רוזה',
        'פילה סלמון מרוקאי פיקנטי', 'דג מושט מזרחי בליווי חומוס', 'תחתיות ארטישוק בליווי בשר כבש',
        'קיש בשר בטאבון ברוטב בצל', 'פלטת סושי', 'כבד עוף ברוטב סילאן'
      ],
      salads: [
        'סלט עלי בייבי ורוקט ברוטב ויניגרט בלסמי', 'סלט בורגול גס עם גרגירי רימון וירק', 'סלט מטבוחה',
        'סלט פלפלים ושום מבושל', 'סלט עדשים, ירקות ובצל', 'חומוס בליווי גרגירי חומוס', 'טחינה ירוקה',
        'סלט פטריות מזוגגות בבצל', 'סלט בטטה עם נענע ובוטנים', 'סלט חסה, פטריות, עגבניות שרי ואגוזים',
        'סלט פלפל חריף', 'סלט גזר חי בלימון', 'סלט סלק אדום', 'מחמצת הבית ממבחר ירקות'
      ],
      main_courses: [
        "טאג'ין עוף בפירות יבשים", 'עופיון ממולא בשר עגל וצנובר', "אסאדו ברוטב צ'ימיצ'ורי או יין",
        "סטייק פרגית ברוטב צ'ילי", 'בשר עגל ברוטב שמפניה ובצל', 'סטייק על גחלים ברוטב יין',
        'צלי בקר מזרחי', 'בשר ספריז בבישול איטי', 'קבבוני טלה על מצע טחינה',
        'לשוניות המדבר ברוטב פלפל המושבה'
      ],
      hot_sides: [
        'שלל ירקות על גחלים', 'סירות בטטה טחינה בליווי גולמית ושומשום', 'שעועית ירוקה בשומשום',
        "קוביות בטטה ברוטב צ'ילי מתוק", 'דואט תפו"א ובטטה בטימין ורוזמרין',
        'אורז בוכרי עם חצילים מטוגנים', 'אורז לבן ואורז עם שקדים וצימוקים',
        'פלחי ארטישוק ופטריות מוקפצים', 'ניחוחות מרקש - טנזיה מרוקאית',
        "כרובית מטוגנת ברוטב צ'ילי מתוק", 'קוסקוס מרוקאי בליווי ירקות', 'דואט כרובית וברוקולי בתנור'
      ],
      breads: ['מבחר לחמים'],
      desserts: [
        'פלטת פירות עשירה', 'סופלה שוקולד בליווי גלידה', 'פבלובה ממולאת גלידה ופירות',
        'פלטה עשירה של פטיפורים', 'פאי לימון אמיתי', 'פאי תפוחים עם כדור גלידה', 'מוס פספילורה',
        'קדאיף עם קציפת חלבה ופספילורה', 'אצבעות תפוח עץ מזוגג',
        "צ'ורוס - סופגניה דרום אמריקאית מטוגנת במקום"
      ],
      beverages_non_alcoholic: ['משקאות על השולחן (קלים, תפוזים, אשכוליות, מים מינרלים)']
    },
    categoryLimits: { starters: 4, salads: 8, main_courses: 3, hot_sides: 3 },
    addons: ['פינה חמה (קפה, תה, צמחים)', 'עוגת כלה', 'ציוד הגשה', 'אנשי צוות', 'מלצרים', 'מנהל אירוע']
  }),

  pkg({
    id: 'shabbat-chatan-henna-bar-mitzvah',
    name: {
      he: 'תפריט שבת חתן / חינה / בר מצווה',
      en: 'Shabbat Chatan / Henna / Bar Mitzvah Menu',
      fr: 'Menu Shabbat Hatan / Henné / Bar Mitsva'
    },
    pricePerGuest: 230,
    minGuests: 50,
    eventTypes: ['shabbat_chatan', 'henna', 'bar_mitzvah'],
    categories: {
      salads: SALADS_COMMON,
      starters: [
        'דג חרוסה מרוקאית', 'דג נסיכה מרוקאי', 'דג בקלה מטוגן', 'בורקס תפו"א', 'מוסקה / מפרום',
        'סלמון (בתוספת 10₪)', 'מבחר מטוגנים', 'סול מטוגן', 'קציצות דג ברוטב', 'ארטישוק ממולא'
      ],
      main_courses: [
        'שניצל בשומשום', 'כרעיים עוף צלוי', 'צלי בקר / פרגית', 'פאי בשר', 'לשון מזרחי',
        'פרגית ממולאת', 'סטייק על האש', 'חמין + ביצים', 'חזה עוף על הגריל', 'פרגיות על האש',
        'קציצות דג ברוטב', 'חורש זבזי (מאכל פרסי)', 'גונדי (מאכל פרסי)', 'רצועות בקר עם פטריות',
        'עוף בפירות יבשים', 'עוף סיני', 'אסאדו / עוף ממולא (בתוספת 10₪ למנה)'
      ],
      hot_sides: [
        'אטריות מרוקאיות', 'פטריות חמות עם ארטישוק', 'טנזיה - פירות יבשים מבושלים (בתוספת 7₪)',
        'זיתים מרוקאים', 'אפונה וגזר', 'אורז לבן', 'אורז צהוב', 'אורז אדום', 'תפו"א אפוי',
        "תפו\"א פרוס", 'שעועית', 'פשטידות מחמר', 'ספגטי עגבניות', "אורז מג'דרה", 'לקט ירקות',
        'קוסקוס + מרק', 'גזר צימס', 'אורז פרסי ירוק', 'אורז לבן עם שקדים וצימוקים', 'אורז עם ירקות'
      ],
      desserts: ['פלטת פירות'],
      beverages_non_alcoholic: ['שתיה']
    },
    categoryLimits: { salads: 8, starters: 2, main_courses: 3, hot_sides: 3 },
    addons: ['ציוד חד פעמי', 'ציוד קרמיקה', 'לחמניות (בתוספת תשלום)', 'הובלה (בתוספת תשלום)']
  }),

  pkg({
    id: 'memorial',
    name: { he: 'תפריט אזכרות', en: 'Memorial (Hesped) Menu', fr: 'Menu Commémoration' },
    pricePerGuest: 160,
    minGuests: 50,
    eventTypes: ['memorial'],
    categories: {
      salads: SALADS_COMMON,
      main_courses: [
        'קציצות דגים ברוטב (מומלץ)', 'דג חריימה', 'פילה מלרוזה', 'סול מטוגן', 'בורקס תפו"א',
        'סלמון (בתוספת 10₪)', 'פילה מושט מבושל', 'פילה מושט מטוגן', 'חזה עוף בגריל',
        'שניצל בשומשום', 'כרעיים עוף בגריל', 'קציצות ברוטב', 'קבב הבית', 'גונדי (מאכל פרסי)',
        'חורש זבזי (מאכל פרסי)', 'קיש בשר', 'מרק תימני + לחוח + חילבה', 'מפרום',
        'חזה עוף ממולא (בתוספת 8₪)'
      ],
      hot_sides: [
        'אטריות מרוקאיות', 'פטריות חמות עם ארטישוק', 'טנזיה - פירות יבשים מבושלים (בתוספת 10₪)',
        'זיתים מרוקאים', 'אפונה וגזר', 'אורז לבן', 'אורז צהוב', 'אורז אדום', 'תפו"א אפוי',
        "תפו\"א פרוס", 'שעועית', 'פשטידות מחמר', 'ספגטי עגבניות', "אורז מג'דרה", 'לקט ירקות',
        'קוסקוס + מרק', 'גזר צימס', 'אורז פרסי ירוק', 'אורז לבן עם שקדים וצימוקים', 'אורז עם ירקות'
      ],
      beverages_non_alcoholic: ['שתיה']
    },
    categoryLimits: { salads: 6, main_courses: 3, hot_sides: 3 },
    addons: ['ציוד חד פעמי', 'ציוד קרמיקה', 'לחמניות', 'הובלה (בתוספת תשלום)']
  }),

  pkg({
    id: 'market-table',
    name: { he: 'בר כריכים / שולחן שוק', en: 'Sandwich Bar / Market Table', fr: 'Bar à Sandwichs / Table du Marché' },
    pricePerGuest: 180,
    minGuests: 50,
    eventTypes: ['celebration'],
    categories: {
      main_courses: [
        'כריכים עם נקניק', 'שניצל כריך', 'אסאדו כריך', 'לחמניית המבורגר', 'חזה עוף בלחמניה',
        'טורטיה ממולאת בשר', 'פלאפל', 'שווארמה על גלגל'
      ],
      hot_sides: ['טבעות בצל מטוגנות', 'סיגרים + פסטלים', "צ'יפס", "צ'יפס מצופה תבלינים", 'קלחי תירס'],
      salads: ['חמוצים', 'סלט ירקות', 'כרוב לבן', 'חומוס']
    },
    addons: [
      'קטשופ, מיונז ורוטב שום', 'שייק פירות', 'שתיה קלה', 'שתיה בקרח', 'לחמים',
      'ציוד חד פעמי', 'מלצרים', 'פירות', 'מנות אחרונות', 'קיוסק חד פעמי'
    ]
  }),

  pkg({
    id: 'israeli-breakfast',
    name: { he: 'תפריט בוקר ישראלי', en: 'Israeli Breakfast Menu', fr: 'Menu Petit-Déjeuner Israélien' },
    pricePerGuest: 140,
    minGuests: 50,
    eventTypes: ['celebration', 'brit'],
    categories: {
      salads: [
        'סלט אנטיפסטי', 'סלט אבוקדו', 'סלט ירקות', 'פלטת ירקות', 'סלט עגבניות שרי',
        'סלט חמוצים מובחרים', 'גזר חי בלימון', 'סלט תירס', 'סלט טונה', 'חצילים מטוגנים (פרוס)',
        'סלט כרוב לבן', 'סלט כרוב אדום במיונז', 'סלט ביצים', 'חומוס', 'טחינה', 'חסה',
        'פטריות ושרי', 'סלט פטריות', 'סלט בורגול', 'רצועות פלפל מתוק', 'סחוג', 'סלט וולדורף',
        'סלט בטטה, נענע ובוטנים', 'תפוח אדמה במיונז', 'סלט חמוציות', 'סלט קינואה ועדשים',
        'סלט שעועית לבנה', 'סלט עדשים ובצל', 'סלט כרוב סיני ושומשום', 'סלט כרובית',
        'סלט פסטה צבעונית', 'סלט שורשים'
      ],
      main_courses: [
        "ג'חנון + ביצה + רסק", 'קישים בטעמים', 'מבחר פשטידות', 'פאד תאי סיני', 'קיגל מתוק',
        'חביתת ירק', 'לחוח, חילבה וקובנה', 'רביולי / ניוקי', 'מבחר בורקסים', 'בלינצס ממולא',
        'מבחר לביבות', 'לזניה', 'שקשוקה', 'חמין פרווה', 'קרואסון צרפתי',
        'דג סלמון שלם (פרוס מול האורח)', 'דג פילה סלמון ברוטב לימון', 'דג מושט מטוגן / מבושל',
        'דג פילה מלרוזה מטוגן', 'דג חריימה נסיכה', 'דג מרוקאי נסיכה', 'פלטת דגים מעושנים',
        'דג מושט מזרחי', 'פסטות ברטבים שונים'
      ],
      desserts: ['עוגיות מרוקאיות', 'פלטת פירות', 'עוגיות פטיפורים', 'עוגיות שמרים', 'גלידה'],
      breads: ['מגוון לחמים']
    },
    categoryLimits: { salads: 8, main_courses: 5 },
    addons: ['ציוד קרמיקה', 'שתיה קלה', 'ציוד חד פעמי']
  }),

  pkg({
    id: 'kiddush',
    name: { he: 'תפריט קידוש', en: 'Kiddush Menu', fr: 'Menu Kiddouch' },
    pricePerGuest: 120,
    minGuests: 50,
    eventTypes: ['celebration'],
    categories: {
      starters: [
        'פלטת ירקות עשירה', 'פלטת חמוצים', 'אנטיפסטי', 'קרקרים', 'עלי גפן', 'סלט טונה',
        'טחינה', 'ביצים קשות', 'חצילים מטוגנים'
      ],
      main_courses: [
        'פלטת דגים מעושנים', 'קיגל מתוק', 'קיגל תפוחי אדמה', 'דג מלוח פרוס במקום', 'דגים מטוגנים',
        'חמין (צ\'ולנט)', 'סושי', 'בורקס', 'פשטידות שונות', 'קישים', 'דג הרינג מלוח',
        "ג'חנון + רסק + סחוג"
      ],
      desserts: ['רוגלך + קרואסונים', 'פירות יבשים', 'מבחר פירות', 'פיצוחים'],
      beverages_alcoholic: ['יין או ערק']
    },
    addons: ['לחמניות ביס', 'שתיה קלה', 'ציוד חד פעמי', 'מלצרים', 'הובלה (בתוספת תשלום)']
  }),

  pkg({
    id: 'buffet-stations',
    name: { he: 'תפריט מזנונים', en: 'Buffet Stations Menu', fr: 'Menu Buffet' },
    pricePerGuest: 220,
    minGuests: 50,
    eventTypes: ['wedding', 'celebration'],
    categories: {
      salads: SALADS_COMMON,
      main_courses: [
        'מיני פרגיות', 'שיפודי קבב', 'מיני שווארמה', 'שניצלונים בשומשום', 'מבחר מטוגנים',
        'עוף סיני', 'קיש בשר', 'תרמיל תאילנדי', 'רצועות בקר שמפיניון', 'שוקיות עוף שזיפים',
        'פלטת סושי', 'דג סלמון בפריסה מול האורח', "פיש אנד צ'יפס", 'מעורב ירושלמי',
        'בר דגים מעושנים', 'פסטה רביולי', 'אטריות תאילנדי', 'קוסקוס + מרק מרוקאי'
      ],
      hot_sides: [
        'פטריות חמות', 'טנזיה (בתוספת 2₪)', 'זיתים מרוקאים', 'אורז אדום', 'חומוס בליווי חומוס',
        'תפוח אדמה אפוי', 'תפוח אדמה פרוס', 'שעועית סיני', 'פשטידות מחמר', "אורז מג'דרה",
        'לקט ירקות וארטישוק', 'קוסקוס + מרק', 'גזר צימס', 'אורז פרסי ירוק',
        'אורז לבן עם שקדים וצימוקים', 'לוביה ברוטב', 'פאד תאי סיני'
      ]
    },
    categoryLimits: { salads: 6, main_courses: 4, hot_sides: 5 },
    addons: ['שתיה', 'ציוד חד פעמי', 'ציוד קרמיקה מהודר (בתוספת תשלום)', 'לחמניות', 'מבחר עוגות']
  }),

  pkg({
    id: 'sandwich-bar',
    name: { he: 'תפריט בר כריכים', en: 'Sandwich Bar Menu', fr: 'Menu Bar à Sandwichs' },
    pricePerGuest: 110,
    minGuests: 50,
    eventTypes: ['celebration'],
    categories: {
      starters: [
        'פלטת ירקות עשירה', 'פלטת חמוצים עשירה', 'פלטת פירות', 'פלטת דגים מעושנים',
        'מיני בורקס', 'עלי גפן ממולאים', 'פלטת פיצוחים', 'לביבות ירק'
      ],
      main_courses: [
        'כריך חביתה וירק', 'כריך סביח', 'כריך טונה', 'כריך אבוקדו',
        'כריך סלט ביצים', 'כריך אנטיפסטי', 'מיני פשטידות'
      ],
      desserts: ['פלטת פטיפורים']
    }
  })
];

const now = new Date().toISOString();

const record = {
  id: nanoid(10),
  businessName: 'קייטרינג עלה של זית',
  ownerEmail: 'yelotag@gmail.com',
  description: {
    he: 'קייטרינג עלה של זית מציע לכם ולאורחים שלכם חוויה קולינרית מענגת שמשלבת טעמים, צבעים וריחות - קונצרט של מאכלים מזרחיים, פרסיים, מערביים ואוריינטליים. כשר גלאט למהדרין בהשגחת בד"ץ (בית יוסף, לנדא, יורה דעה בפיקוח הרב שלמה מחפוד).',
    en: 'Aleh Shel Zait Catering offers you and your guests a delightful culinary experience blending flavors, colors and aromas - a concert of Middle Eastern, Persian, Western and Oriental dishes. Glatt kosher mehadrin, under badatz supervision (Beit Yosef, Landa, Yoreh Deah under Rabbi Shlomo Machpud).',
    fr: "Le traiteur Aleh Shel Zait vous offre, à vous et à vos invités, une expérience culinaire raffinée mêlant saveurs, couleurs et arômes - un concert de mets moyen-orientaux, persans, occidentaux et orientaux. Cacher glatt mehadrin, sous supervision badatz (Beit Yossef, Landa, Yoré Déa sous le rabbin Shlomo Machpud)."
  },
  districts: ['center', 'telaviv'],
  city: 'הרצליה',
  address: 'מנחם בן סרוק 10, הרצליה',
  kashrutLevels: ['badatz_rav_machpud', 'badatz_rav_landau', 'badatz_beit_yosef'],
  cateringTypes: ['meat', 'dairy'],
  maxGuests: 700,
  priceFrom: 247,
  packages,
  eventTypes: ['brit', 'bar_mitzvah', 'wedding', 'henna', 'shabbat_chatan', 'celebration', 'memorial', 'rosh_hashana'],
  menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts', 'beverages_non_alcoholic', 'beverages_alcoholic'],
  services: ['elegant_tableware', 'disposable_tableware', 'waiter_staff', 'setup_teardown', 'vegetarian_food', 'gluten_free_options'],
  phone: '+972-54-4337751',
  whatsapp: '+972544337751',
  email: '0544337751a@gmail.com',
  website: 'https://aleshelzait.co.il',
  instagram: '',
  facebook: 'https://facebook.com/aleshelzait',
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
  console.log(`Added caterer "${record.businessName}" with id ${record.id} and ${packages.length} formulas.`);
  packages.forEach((p) => console.log(`  - ${p.name.he} (${p.id}): ~${Object.values(p.categoryItems).reduce((n, l) => n + l.length, 0)} items`));
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
