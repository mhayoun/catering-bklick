// One-off script: adds "דניאל קייטרינג" (Daniel Catering) as a new, pre-approved caterer,
// sourced from its own website https://www.cateringbadatz.com/ - a meat caterer (with a dairy
// sub-brand, "מילקשייק", not modeled here) based in Beit VeGan, Jerusalem, run by דניאל שמש and
// שלומי בלוך, serving 100-2000 guests. Found via a general web search for other Jerusalem-area
// caterers not yet in this project.
//
// Kashrut is explicit: "בד"ץ העדה החרדית ירושלים" (Badatz Edah Chareidis Jerusalem), for both the
// meat and dairy lines - maps to badatz_eda_chareidis.
//
// The site names and briefly describes 3 formula-menu tiers (כסף/ק"ב אירועים, זהב, VIP) but
// publishes no per-guest price for any of them (downloadable PDF order-checklists only, no
// prices printed on them either - pricePerGuest left '' on all 3, same treatment as
// scripts/add-eat-love-formulas.mjs). Full dish lists were read from those 3 PDFs
// (kb.pdf / daniel.pdf / דניאל VIP-1.pdf, linked from the תפריטי-הקייטרינג page):
//   - כסף (ק"ב אירועים): every course states an explicit "X לבחירה" count.
//   - זהב: only סלטים (6 לבחירה) and תוספות (3 לבחירה) state an explicit count; קבלת פנים, מנה
//     ראשונה, מנה עיקרית and מנה אחרונה don't, so those categories get no categoryLimits entry
//     (no limit = every listed item shown, same convention as other formula scripts here). Its
//     קבלת פנים (welcome-bar snacks) and מנה ראשונה (the seated first course) are both real but
//     distinct site sections merged into one `starters` category, since MENU_CATEGORIES has only
//     one starters slot (same merge convention as scripts/add-arturos-venue-formulas.mjs).
//   - VIP: a small, mostly-fixed suggested menu (not a "choose from a big list" tier) - only the
//     main course names a real 2-item choice (categoryLimits.main_courses = 1); the "3 סוגי
//     סלטים יוקרתיים" and "מרק מוקרם לבחירה" lines name no specific dish, so they're each kept as
//     one placeholder item rather than invented.
// A real "בר סיום/משמחים" (end-of-night snack bar) upgrade exists on the כסף and זהב tiers, at
// extra cost and with a real disclosed minimum ("50% ממספר המנות באירוע" for זהב) - kept as an
// informational addon (priceType 'note') rather than modeled as its own category, since it's an
// optional add-on tier, not part of the base seated menu.
//
// No usable logo/photo asset was found on the site (only the stylized wordmark embedded inside
// the PDF menu covers, not available as a standalone web image).
//
// Usage: node --env-file=.env.local scripts/add-daniel-catering.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const OWNER_EMAIL = 'yelotag@gmail.com';
const EVENT_TYPES = ['brit', 'engagement', 'bar_mitzvah', 'wedding', 'shabbat_chatan', 'celebration'];

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function noteAddons(list) {
  return list.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' }));
}

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

const kbMenu = pkg({
  id: 'kesef-kb-events-menu',
  name: { he: 'תפריט כסף - ק"ב אירועים', en: 'Silver Menu - K.B. Events', fr: 'Menu Argent - K.B. Événements' },
  sourceUrl: 'https://sfilev2.f-static.com/image/users/273992/ftp/my_files/kb.pdf',
  categories: {
    salads: [
      'גזר מרוקאי', 'גזר מתוק ואננס', 'וולדורף', 'חומוס', 'חזרת-חריין', 'חמוצים מעורב', 'חסה שרי נבטים',
      'חציל בטעם כבד', 'חציל במיונז', 'חציל פרוסות', 'חציל קוביות יווני', 'טחינה', 'כרוב וגזר במיונז',
      'כרוב בתחמיץ', 'מטבוחה', 'מלפפון בטבעות בצל', 'סלק מזרחי', 'עגבניות שרי + בזיליקום',
      'פלפל חריף מטוגן', 'תירס גמבה ופטריות', 'תפו"א במיונז', 'סלט סלסה - פלפל טחון'
    ],
    starters: [
      "בורקס תפו\"א ברוטב", 'אגרול ירקות סיני', "בלינצ'ס תפו\"א", 'מוסקה ברוטב עגבניות',
      'פלפל ממולא', 'פסטה עם רוטב פטריות',
      'מנת דג בתוספת מחיר (נסיכה / סול / מושט / סלמון)'
    ],
    main_courses: ['קורדון בלו', 'שניצל', 'רולדה הודו', 'שיפודי עוף ברוטב', 'אוסובוקו (סטייק הודו עם העצם)', 'חזה עוף ממולא'],
    hot_sides: [
      'אורז צימוקים ושקדים', 'אורז סיני', 'אפונה וגזר', 'ירק סיני', 'ירק בגריל', 'פירה ברוטב בצל',
      'קוגל תפו"א', 'תפו"א אפוי קוביות', 'סוגי פשטידות'
    ],
    desserts: ['פטיפור מוגש מרכזי + קפה', 'גלידה גלילית', 'מגנום שוקולד / וניל']
  },
  categoryLimits: { salads: 6, starters: 3, main_courses: 3, hot_sides: 2, desserts: 1 },
  addons: [
    'כלול: חלת חתן, לחמניות, שתייה, עוגות ושתייה לקבלת פנים - על חשבון הבית',
    'בר סיום/משמחים בתוספת תשלום (לא כלול במחיר הסטנדרטי): 3 פריטים חמים + 3 קרים לבחירה'
  ]
});

const zahavMenu = pkg({
  id: 'zahav-menu',
  name: { he: 'תפריט זהב - קייטרינג דניאל', en: 'Gold Menu - Daniel Catering', fr: 'Menu Or - Traiteur Daniel' },
  sourceUrl: 'https://sfilev2.f-static.com/image/users/273992/ftp/my_files/daniel.pdf',
  categories: {
    starters: [
      // קבלת פנים (welcome bar) - hot + cold items
      "קבלת פנים חם: סיגרים / פסטלים", 'קבלת פנים חם: בורקס מיני', 'קבלת פנים חם: קוסקוס עם ירקות',
      'קבלת פנים חם: סוגי פשטידות', 'קבלת פנים קר: פלטות פירות', 'קבלת פנים קר: פלטות ירקות + מטבל',
      'קבלת פנים קר: פלטות אנטיפסטי (ירקות בגריל)', 'קבלת פנים קר: גרנולה עם קצפת',
      'קבלת פנים קר: פלטת עוגות', 'קבלת פנים קר: טיגוניות', 'קבלת פנים קר: דגים מלוחים + מציות',
      // מנה ראשונה (seated starter) - parve / fish / meat
      "בלינצ'ס ירקות", "מעטפת תפו\"א", 'אגרול סיני', 'קיש בצל', 'פלפל ממולא (פרווה)',
      'נסיכה מזרחי בירקות וגרגירי חומוס', 'סול מטוגן ברוטב מונייר', 'דג מרלוזה ברוטב ירקות',
      'אצבעות דג בכיס תאילנדי', 'מוסקת הבית', 'רגו עוף וירקות על רשת', 'קונוס ירושלמי',
      'רביולי ממולא בכבד קצוץ', "בלינצ'ס במילוי השף + רוטב"
    ],
    salads: [
      'סלט תפו"א', 'חציל פרוסות ברוטב שום', 'חציל יווני בעגבניות', 'חציל טבעי קלוי על האש', 'חציל במיונז',
      'חומוס / שמן זית / פפריקה / ירק / סחוג', 'חמוצים מעורב', 'עגבניה ובצל ברוטב פיקנטי',
      'מלפפון בבצל ושמיר', 'טורקי מרוקאי (חריף)', 'כרוב וגזר - קולסלו', 'כרוב ושומשום בסויה',
      'סלק וחזרת', 'סלט סיני', 'גזר חי ואננס', 'גזר פיקנטי', 'הגינה - פטריות, אפונה, תירס, עשבי תיבול',
      'תפו"א ביתי ביצים וחרדל', 'וולדורף מיוחד', 'חציל בטעם כבד', 'טחינה ממרחית בשמן זית',
      'עגבניות שרי ושומשום בבזיליקום', 'קישואים בטעם כבד', 'דלעת פיקנטי', 'מלפפון גזר וגמבה בתחמיץ',
      'כרוב אדום במיונז / בתחמיץ', 'פטריות בתחמיץ / במיונז / יווני', 'נבטים בשמן זית סויה',
      'סלט כפרי עשיר + רוטב', 'סלט מטבוחה פיקנטי / חריף / עם זיתים', 'הבית - מלפפון ירוק וחמוץ מגוון ירקות במיונז',
      'סלט אנטיפסטי (ירקות מיקס בגריל)', 'פלפל חריף מטוגן'
    ],
    main_courses: [
      'עוף צלוי / סיני / בתפוחים / דבש / זיתים', 'עוף ממולא ברוטב כרמל', 'פיקטאה דבש / פיקנטי / זיתים',
      'אוסובוקו ביין', 'שיפודי הנסיך ברוטב טרייאקי', 'סטייק פרגית בגריל', 'גליל עוף ממולא בנוסח קורדון-בלו',
      'הודו ביין ופטריות'
    ],
    hot_sides: [
      'אורז בפטריות ובצל', 'אורז חגיגי', 'אורז בגזר מגורד', 'אורז צימוקים ושקדים', 'אפויים דמוי צ\'יפס',
      'תפו"א אפויים בשמן זית ורוזמרין', 'תפו"א אנה פרוס ברוטב בצל', 'דואט קוביות תפו"א ובטטה ברוטב צ\'ילי',
      'פירה ברוטב בצל', 'פלחי תפו"א בבצל מטוגן', 'נודלס סיני', 'פסטה ברוטב איטלקי', 'פסטה ופירורי לחם ובצל',
      'פשטידת שכבות', 'פשטידת קישואים / פטריות / בצל', 'פשטידת ירקות / תפו"ע',
      'רטטו ירקות (מיקס ירקות ברוטב עגבניות)', 'ירק סיני מוקפץ', 'אנטיפסטי (ירקות מוקפצים בגריל)',
      'אצבעות קישואים בשמיר', 'זיתים ברוטב עגבניות / פיקנטי / טבעי', 'שעועית שלמה ברוטב שום ושקדים'
    ],
    desserts: [
      'עוגת מוס אישי / פאי אישי במבחר טעמים', 'קונכיה מצופה שוקולד במוס מוקה / חלבה / וניל',
      'עוגת שכבות משולב', 'כדור גלידה בסירופ', 'פירות העונה (מרכזי)', 'אבטיח, מלון',
      'סופלה שוקולד ברוטב חם', 'שטרודל תפו"ע', 'נפוליאון (קרמשניט)'
    ]
  },
  categoryLimits: { salads: 6, hot_sides: 3 },
  addons: [
    'כלול: לחמניות קוקטייל/אישי, חלת חתן, יין לחופה ולשבע ברכות, בחירת טקסטיל, שירות מלצרים, שתייה קלה, כלים יוקרתיים - על חשבון הבית',
    'בר סיום/משמחים בתוספת תשלום (לא כלול במחיר הסטנדרטי): 3 פריטים חמים + 3 קרים לבחירה. מינימום מנות בר סיום: 50% ממספר המנות באירוע'
  ]
});

const vipMenu = pkg({
  id: 'vip-menu',
  name: { he: 'תפריט VIP', en: 'VIP Menu', fr: 'Menu VIP' },
  sourceUrl: 'https://sfilev2.f-static.com/image/users/273992/ftp/my_files/%D7%93%D7%A0%D7%99%D7%90%D7%9C%20VIP-1.pdf',
  categories: {
    salads: ['3 סוגי סלטים יוקרתיים (לפי בחירת השף)'],
    starters: ['סלמון בשמן זית ורוזמרין על מצע ירקות'],
    hot_sides: ['מרק מוקרם לבחירה', 'כדור אורז ירוק', 'אנטיפסטי שלושה צבעים', 'קישוא ממולא'],
    main_courses: ['פרגית בפירות יבשים', 'בקר ביין ופטריות'],
    desserts: ['עוגת מוס אישי במבחר טעמים']
  },
  categoryLimits: { main_courses: 1 },
  addons: ['כלול: לחמניות אישיות + גלגל לחמים במרכז, מפות ומפיות מדגם ויאנה, יין על כל שולחן, שתייה קלה']
});

async function main() {
  const now = new Date().toISOString();

  const record = {
    id: nanoid(10),
    businessName: 'דניאל קייטרינג',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: 'דניאל קייטרינג - קייטרינג בשרי כשר למהדרין (בד"ץ העדה החרדית ירושלים) בבית וגן, ירושלים, בניהולם של דניאל שמש ושלומי בלוך. שלושה תפריטים בשריים (כסף, זהב, VIP) לאירועים של 100 עד 2000 איש, וכן מותג חלבי ("מילקשייק") באותה כשרות. כולל גם השכרת ציוד וטקסטיל לאירועים.',
      en: "Daniel Catering - kosher mehadrin meat catering (Badatz Edah Chareidis Jerusalem) in Beit VeGan, Jerusalem, run by Daniel Shemesh and Shlomi Bloch. Three meat menu tiers (Silver, Gold, VIP) for events of 100 to 2000 guests, plus a dairy sub-brand (\"Milkshake\") under the same kashrut. Also offers event equipment and textile rental.",
      fr: "Traiteur Daniel - traiteur viande cacher mehadrin (Badatz Edah Chareidis Jérusalem) à Beit VeGan, Jérusalem, dirigé par Daniel Shemesh et Shlomi Bloch. Trois menus viande (Argent, Or, VIP) pour des événements de 100 à 2000 convives, ainsi qu'une marque lactée (\"Milkshake\") sous la même cacherout. Propose aussi la location d'équipement et de linge de table pour événements."
    },
    districts: ['jerusalem'],
    city: { he: 'ירושלים', en: 'Jerusalem', fr: 'Jérusalem' },
    address: 'רח\' הפסגה 3, בית וגן, ירושלים (במלון חן)',
    kashrutLevels: ['badatz_eda_chareidis'],
    cateringTypes: ['meat', 'dairy'],
    maxGuests: 2000,
    priceFrom: '',
    packages: [kbMenu, zahavMenu, vipMenu],
    eventTypes: EVENT_TYPES,
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'desserts'],
    services: ['waiter_staff', 'elegant_tableware'],
    phone: '+972-52-3473086',
    whatsapp: '+972-52-3473086',
    email: 'sh-daniel@012.net.il',
    website: 'https://www.cateringbadatz.com/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id} and 3 formula packages.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
