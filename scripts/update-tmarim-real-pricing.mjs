// One-off script: follow-up to scripts/update-tmarim-from-site.mjs for "קייטרינג תמרים".
//
// The 13 big formula menus on protamar.com (/תפריטים/) publish no pricing at all, so their
// pricePerGuest stayed an estimate (300, from the directory listing). Checking the site's
// /חבילות/ (packages) section found 11 small fixed-composition tray bundles that DO publish a
// real total price and a fixed guest count (WooCommerce products) - real, sourced numbers. This
// script:
//   1. Corrects minGuests on the 13 existing formula packages from 30 (a guess) to 20 - the real
//      floor evidenced by both the directory listing ("20-250") and the smallest real bundles.
//   2. Adds the 11 real bundles as their own packages, each with pricePerGuest computed from its
//      actual total price / guest count, and minGuests = that bundle's fixed guest count (these
//      are fixed-composition trays, not a "choose N of M" formula, so categoryLimits is omitted -
//      every listed item is included in the bundle).
//   3. Corrects two fields sourced from the site footer, more authoritative than earlier guesses:
//      - address: "דרך המכבים 42" (unabbreviated in the footer), not "רחוב המכבים 42" as read off
//        the kashrut certificate scan.
//      - email: gadre@netvision.net.il (visible in the footer contact block - the site's own
//        product pages don't show it, which is why it was left blank previously).
//
// Usage: node --env-file=.env.local scripts/update-tmarim-real-pricing.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function bundle({ id, name, totalPrice, guests, eventTypes, categories, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: Math.round((totalPrice / guests) * 100) / 100,
    minGuests: guests,
    includedCategories: Object.keys(categories),
    categoryLimits: {}, // fixed composition - every item below is included, not a "choose N" list
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: eventTypes || [],
    addons: [],
    sourceUrl
  };
}

const newPackages = [
  bundle({
    id: 'bundle-tu-bav-20',
    name: { he: 'חבילה לטו באב ל-20 איש', en: "Tu B'Av Package for 20", fr: 'Forfait Tou Beav pour 20' },
    totalPrice: 1800,
    guests: 20,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%97%d7%91%d7%99%d7%9c%d7%94-%d7%9c%d7%98%d7%95-%d7%91%d7%90%d7%91-%d7%9c-20-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: ["מיני קיש – 24 יח' במגש מעורב", 'מגש אנטיפסטי'],
      main_courses: [
        'פסטה שחורה וטרייה ברוטב טריאקי ושמנת - 2 ליטר',
        'טורטליני במילוי פטריות במעטפת של עגבניות שרי, שום, פסטו, זיתים ושמן זית',
        'לזניה גבינות אישית ברוטב עגבניות - 12 במגש'
      ],
      breads: ['פוקאצות – 3 יח\' במגש'],
      salads: ['סלט עגבניות שרי בצרוף כף הגשה', 'סלט ים תיכוני בצרוף כף הגשה'],
      desserts: ['מגש טארטלט חצי פיצוחים בקרמל חצי שוקולד', 'עוגת גבינה אישית עם פירורים - 24 יחידות']
    }
  }),

  bundle({
    id: 'bundle-retirement-70',
    name: { he: 'מסיבת פרישה ל-70 איש', en: 'Retirement Party for 70', fr: 'Fête de Départ à la Retraite pour 70' },
    totalPrice: 3400,
    guests: 70,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%9e%d7%a1%d7%99%d7%91%d7%aa-%d7%a4%d7%a8%d7%99%d7%a9%d7%94-70-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'שני מגשי טורטיה בחיתוך סושי – 30 יחידות במגש', 'שני מגשי מיני קיש – 24 יחידות במגש',
        'שני מגשי מאפה בוייקוס – כ-24 יחידות במגש', 'שני מגשי מאפה גבינה וזית – כ-24 יחידות במגש',
        'שני מגשי פילו מלוח – כ-30 יחידות במגש', 'שני מגשי ירקות חתוכים בלווי מטבל'
      ],
      salads: [
        'שני סלטים ים תיכוני – 3 ליטר לסלט', 'שני סלטים טאבולה (בריאות) – 3 ליטר לסלט',
        'סלט עגבניות שרי – 3 ליטר', 'סלט בטטה – 3 ליטר', 'סלט ירוק – 3 ליטר'
      ],
      desserts: [
        'שני מגשי פרופיטרול במילוי קרם וניל – 24 יחידות במגש', 'שני מגשי מאפים מתוקים – 30 יחידות במגש',
        'מגש טרטלט פיצוחים בקרמל – כ-24 יחידות'
      ]
    }
  }),

  bundle({
    id: 'bundle-vegan-refreshment-20',
    name: { he: 'כיבוד טבעוני לאירוע 20 איש', en: 'Vegan Refreshment for 20', fr: 'Buffet Végétalien pour 20' },
    totalPrice: 2320,
    guests: 20,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%9b%d7%99%d7%91%d7%95%d7%93-%d7%98%d7%91%d7%a2%d7%95%d7%a0%d7%99-%d7%9c%d7%90%d7%99%d7%a8%d7%95%d7%a2-20-%d7%90%d7%99%d7%a9/',
    categories: {
      main_courses: [
        'שני קיש עגול – קוטר 24, טבעוני', 'מגש לביבות אפויות תפו"א ובטטה – כ-24 יחידות במגש',
        'שני מגשי חצאי טורטייה במילוי שווארמה טבעונית – 10 יחידות במגש',
        'מגש מיני המבורגר טבעוני עם לחמנייה – כ-12 יחידות במגש', 'מוקפץ ירקות עם נודלס – 2 קילו',
        'פסטה ברוטב עגבניות – 4 ליטר'
      ],
      starters: ['מגש פילו מלוח – כ-30 יחידות במגש'],
      salads: [
        'סלט עגבניות שרי – 3 ליטר', 'סלט סלק חי – כ-3 ליטר', 'סלט בטטה – 3 ליטר או סלט פד תאי',
        'סלט בריאות (טאבולה) – 3 ליטר'
      ],
      desserts: ['מגש טראפלס שוקולד טבעוני – כ-30 יחידות במגש', 'מגש טארטלט פיצוחים בקרמל טבעוני – כ-24 יחידות במגש']
    }
  }),

  bundle({
    id: 'bundle-bachelorette-20',
    name: { he: 'מסיבת רווקות ל-20 בנות', en: 'Bachelorette Party for 20', fr: "Enterrement de Vie de Jeune Fille pour 20" },
    totalPrice: 2180,
    guests: 20,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%9e%d7%a1%d7%99%d7%91%d7%aa-%d7%a8%d7%95%d7%95%d7%a7%d7%95%d7%aa-20-%d7%91%d7%a0%d7%95%d7%aa/',
    categories: {
      starters: [
        'מגש טורטייה בחיתוך סושי – כ-30 יחידות במגש', 'מגש כריכוני קוראסון – 12 יחידות במגש',
        'מגש כריכוני קוקטייל מיני פרנה – 15 יחידות במגש', 'מגש מיני קיש – 24 יחידות במגש מעורב',
        'מגש מאפה גבינה וזית – כ-24 יחידות במגש', 'מגש פילו מלוח – כ-30 יחידות במגש'
      ],
      breads: ["מגש פוקאצ'ות – 3 יחידות במגש"],
      main_courses: ['לזניה עגבניות וגבינות – מחולק ל-24', 'פסטה ברוטב שמנת פטריות – 4 ליטר', 'פסטה בטטה – 4 ליטר'],
      salads: ['סלט ים תיכוני – 3 ליטר', 'סלט בריאות (טאבולה) – 3 ליטר'],
      desserts: [
        'מגש בראוניז שוקולד – 25 יחידות במגש', 'מגש מיני קאדיף במילוי קרם – כ-24 יחידות במגש',
        'מגש טארטלט פיצוחים בקרמל – כ-24 יחידות במגש'
      ]
    }
  }),

  bundle({
    id: 'bundle-shabbat-chatan-30',
    name: { he: 'מגשי אירוח לשבת חתן - 30 איש', en: 'Shabbat Chatan Trays for 30', fr: 'Plateaux Shabbat Hatan pour 30' },
    totalPrice: 2592,
    guests: 30,
    eventTypes: ['shabbat_chatan'],
    sourceUrl: 'https://protamar.com/product/%d7%a9%d7%91%d7%aa-%d7%97%d7%aa%d7%9f-30-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש טורטייה בחיתוך סושי – כ-30 יחידות במגש', 'שלושה מגשי כריכוני מיני בייגלס – 10 יחידות במגש',
        'שני מגשי מיני קיש – 24 יחידות במגש מעורב', 'מגש פילו מלוח – כ-30 יחידות במגש',
        'מגש מאפה גבינה וזית – כ-24 יחידות במגש'
      ],
      main_courses: [
        'לזניה עגבניות וגבינות – מחולק ל-24', 'לזניה פטריות עם נגיעות כמהין – מחולק ל-24',
        'גראטן תפו"א ובטטה – גודל A4'
      ],
      salads: ['סלט ירוק – 3 ליטר', 'סלט ים תיכוני – 3 ליטר', 'סלט עגבניות שרי – 3 ליטר', 'סלט בריאות (טאבולה) – 3 ליטר'],
      desserts: ['מגש טראפלס שוקולד – כ-30 יחידות במגש', 'מגש פרופיטרול במילוי קרם וניל – 24 יחידות במגש']
    }
  }),

  bundle({
    id: 'bundle-happy-hour-20',
    name: { he: 'Happy Hour ל-20 איש', en: 'Happy Hour for 20', fr: 'Happy Hour pour 20' },
    totalPrice: 1610,
    guests: 20,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/happey-hour-%d7%9e%d7%95%d7%aa%d7%90%d7%9d-%d7%9c-20-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש טורטייה בחיתוך סושי – כ-30 יחידות במגש', 'שני מגשי מיני קיש – 24 יחידות במגש מעורב',
        'מגש מאפה בוייקוס – כ-24 יחידות', 'מגש מאפה גבינה וזית – כ-24 יחידות במגש',
        'שני מגשי כריכוני קוראסון – 12 יחידות במגש', 'מגש כריכוני קוקטייל מיני פרנה – 15 יחידות במגש',
        'שני מגשי ירקות חתוכים בלווי מטבל'
      ],
      beverages_alcoholic: ['שני בקבוקי יין אדום/לבן']
    }
  }),

  bundle({
    id: 'bundle-torah-aliyah-30',
    name: { he: 'עלייה לתורה ל-30 איש', en: 'Torah Aliyah Celebration for 30', fr: 'Célébration Alyah LaTorah pour 30' },
    totalPrice: 2195,
    guests: 30,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%a2%d7%9c%d7%99%d7%94-%d7%9c%d7%aa%d7%95%d7%a8%d7%94-30-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש כריכוני קוראסון – 12 יחידות במגש', 'שני מגשי כריכוני מיני בייגלס – 10 יחידות במגש',
        'מגש כריכוני קוקטייל מיני פרנה – 15 יחידות במגש', 'מגש טורטייה בחיתוך סושי – כ-30 יחידות במגש',
        'שני מגשי מיני קיש – 24 יחידות במגש מעורב', 'מגש פילו מלוח – כ-30 יחידות במגש'
      ],
      breads: ["מגש פוקצ'ות – 3 יחידות במגש"],
      salads: ['סלט ירוק – 3 ליטר', 'סלט ים תיכוני – 3 ליטר', 'סלט עגבניות שרי – 3 ליטר', 'סלט בריאות (טאבולה) – 3 ליטר'],
      desserts: ['מגש טראפלס שוקולד – כ-30 יחידות במגש', 'מגש פרופיטרול במילוי קרם וניל – 24 יחידות במגש']
    }
  }),

  bundle({
    id: 'bundle-challah-separation-40',
    name: { he: 'הפרשת חלה ל-40 איש', en: 'Challah Separation Gathering for 40', fr: 'Rassemblement Hafrachat Hala pour 40' },
    totalPrice: 3175,
    guests: 40,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%94%d7%a4%d7%a8%d7%a9%d7%aa-%d7%97%d7%9c%d7%94-40-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש טורטייה בחיתוך סושי – כ-30 יחידות במגש', 'שני מגשי כריכוני קוראסון – 12 יחידות במגש',
        'שני מגשי מיני קיש – 24 יחידות במגש מעורב', 'מגש פילו מלוח – כ-30 יחידות במגש',
        'מגש מאפה גבינה וזית – כ-24 יחידות במגש'
      ],
      main_courses: [
        'לזניה עגבניות וגבינות – מחולק ל-24', 'לזניה פטריות עם נגיעות כמהין – מחולק ל-24',
        'גראטן תפו"א ובטטה – גודל A4', 'פסטה ברוטב שמנת פטריות – 4 ליטר', 'פסטה ברוטב עגבניות – 4 ליטר', 'פסטה בטטה – 4 ליטר'
      ],
      salads: ['סלט ים תיכוני – 3 ליטר', 'סלט עגבניות שרי – 3 ליטר', 'סלט בריאות (טאבולה) – 3 ליטר'],
      desserts: [
        'מגש טראפלס שוקולד – כ-30 יחידות במגש', 'מגש פרופיטרול במילוי קרם וניל – 24 יחידות במגש',
        'מגש טארטלט פיצוחים בקרמל – כ-24 יחידות במגש', 'מגש עוגת גבינה אישית עם פירורים – 24 יחידות במגש'
      ]
    }
  }),

  bundle({
    id: 'bundle-birthday-40',
    name: { he: 'יום הולדת ל-40 איש', en: 'Birthday Party for 40', fr: "Fête d'Anniversaire pour 40" },
    totalPrice: 3045,
    guests: 40,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%99%d7%95%d7%9d-%d7%94%d7%95%d7%9c%d7%93%d7%aa-40-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש טורטיה בחיתוך סושי – כ-30 יחידות במגש', 'שני מגשי כריכוני קוראסון – 12 יחידות במגש',
        'שני מגשי מיני קיש – 24 יחידות במגש מעורב', 'מגש פילו מלוח – כ-30 יחידות במגש',
        'מגש מאפה גבינה וזית – כ-24 יחידות במגש'
      ],
      main_courses: ['לזניה עגבניות וגבינות – מחולק ל-24', 'לזניה פטריות עם נגיעות כמהין – מחולק ל-24', 'פסטה ברוטב שמנת פטריות – 4 ליטר'],
      salads: ['סלט בטטה – 3 ליטר', 'סלט ים תיכוני – 3 ליטר', 'סלט עגבניות שרי – 3 ליטר', 'סלט בריאות (טאבולה) – 3 ליטר'],
      desserts: [
        'מגש טראפלס שוקולד – כ-30 יחידות במגש', 'מגש פרופיטרול במילוי קרם וניל – כ-24 יחידות במגש',
        'מגש טארטלט פיצוחים בקרמל – כ-24 יחידות במגש', 'מגש עוגת גבינה אישית עם פירורים – כ-24 יחידות במגש',
        'עוגת יום הולדת – קוטר 26'
      ]
    }
  }),

  bundle({
    id: 'bundle-cocktail-finger-food-40',
    name: { he: 'קוקטייל פינגר פוד ל-40 איש', en: 'Cocktail Finger Food for 40', fr: 'Cocktail Finger Food pour 40' },
    totalPrice: 2880,
    guests: 40,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%a7%d7%95%d7%a7%d7%98%d7%99%d7%99%d7%9c-%d7%a4%d7%99%d7%a0%d7%92%d7%a8-%d7%a4%d7%95%d7%93-40-%d7%90%d7%99%d7%a9/',
    categories: {
      starters: [
        'מגש גלילי חצילים ממולאים בגבינות – כ-24 יחידות', 'שני מגשי כריכוני מיני בייגלס – 10 יחידות במגש',
        'שני מגשי כריכוני קוקטייל מיני פרנה – 15 יחידות במגש', 'שני מגשי כריכוני קוראסון – 12 יחידות במגש',
        'שני מגשי מיני קיש – 24 יחידות במגש', 'שני מגשי מאפה גבינה וזית – כ-24 יחידות במגש',
        'מגש מאפה חציל בלקני עם קרמבל – כ-25 יחידות', 'שני מגשי ירקות חתוכים בלווי מטבל'
      ],
      desserts: ['מגש פרופיטרול במילוי קרם וניל – 24 יחידות', 'מגש טראפלס שוקולד – כ-30 יחידות', 'מגש מוס – כ-50 יחידות']
    }
  }),

  bundle({
    id: 'bundle-morning-afternoon-conference-50',
    name: { he: 'כנס בוקר + צהריים ל-50 איש', en: 'Morning + Afternoon Conference for 50', fr: 'Conférence Matin + Après-midi pour 50' },
    totalPrice: 5485,
    guests: 50,
    eventTypes: ['celebration'],
    sourceUrl: 'https://protamar.com/product/%d7%9b%d7%a0%d7%a1-%d7%91%d7%95%d7%a7%d7%a8-%d7%a6%d7%94%d7%a8%d7%99%d7%99%d7%9d-%d7%9c-50-%d7%90%d7%99%d7%a9/',
    categories: {
      // "משלוח בוקר" (morning delivery) + "משלוח צהריים" (afternoon delivery) folded together.
      starters: [
        'שני מגשי מאפים מתוקים – 30 יחידות במגש', 'שני מגשי מאפה בוייקוס – כ-30 יחידות במגש',
        'שני מגשי פילו מלוח – כ-30 יחידות במגש', 'שני מגשי ירקות חתוכים בלווי מטבל',
        'שני מגשי כריכוני קוקטייל מיני פרנה – 15 יחידות במגש', 'שני מגשי כריכוני מיני בייגלס – 10 יחידות במגש',
        'ארבעה מגשי מיני קיש – 24 יחידות במגש מעורב'
      ],
      main_courses: [
        'שתי קערות פסטה ברוטב עגבניות – 4 ליטר בקערה', 'שתי קערות פסטה ברוטב שמנת פטריות – 4 ליטר בקערה',
        'שני גראטן תפו"א ובטטה גודל A4', 'לזניה עגבניות וגבינות – מחולק ל-24 מנות', 'לזניה פטריות עם נגיעות כמהין – מחולק ל-24 מנות'
      ],
      salads: ['סלט ים תיכוני – 3 ליטר', 'סלט טאבולה – 3 ליטר', 'סלט עדשים שחורות ובטטה – 3 ליטר'],
      breads: ["שני מגשי פוקצ'ות – 3 יחידות במגש"],
      desserts: [
        'שני מגשי עוגיות – שלושה סוגים במגש מהודר', 'שני מגשי פירות העונה', 'מגש טארטלט פיצוחים בקרמל – כ-24 יחידות במגש',
        'מגש טראפלס שוקולד – כ-30 יחידות במגש', 'מגש פרופיטרול במילוי קרם וניל – 24 יחידות במגש'
      ]
    }
  })
];

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'קייטרינג תמרים') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "קייטרינג תמרים" not found in KV - run the previous tmarim scripts first.');
    process.exit(1);
  }

  const existing = await kv.get(`caterer:${id}`);

  const correctedExistingPackages = existing.packages.map((p) => ({ ...p, minGuests: 20 }));

  const updated = {
    ...existing,
    address: 'דרך המכבים 42, ראשון לציון', // corrected: unabbreviated in the site footer
    email: 'gadre@netvision.net.il', // found in the site footer contact block
    packages: [...correctedExistingPackages, ...newPackages],
    updatedAt: new Date().toISOString()
  };

  await kv.set(`caterer:${id}`, updated);
  console.log(`Updated caterer "קייטרينג תמרים" (${id}): ${newPackages.length} new priced bundles added, minGuests corrected to 20 on the ${correctedExistingPackages.length} existing formulas.`);
  newPackages.forEach((p) => console.log(`  - ${p.name.he}: ₪${p.pricePerGuest}/guest, min ${p.minGuests} guests`));
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
