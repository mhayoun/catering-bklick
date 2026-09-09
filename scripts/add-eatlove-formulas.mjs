// One-off follow-up script: add-eatlove.mjs already modeled the site's 2 priced "מגשי אירוח"
// (hosting tray) catalogs as a_la_carte packages, but deliberately skipped the site's other 2
// menus ("תפריט חלבי" / "תפריט בשרי") because they list dish names only with no prices anywhere
// on either page. The user has now asked for those 2 menus to be added anyway, so they're
// modeled as `formula` packages with pricePerGuest left '' (no price published - same treatment
// as scripts/add-arturos-formulas.mjs's special-menu, which also has no price and still shows
// fine since estimatePackageTotal in lib/pricing.js treats a falsy pricePerGuest as "no estimate
// available"). Neither menu page states a "choose N of M" count anywhere either (unlike e.g.
// aleshelzait's or arturos's formula menus) - these read as a full customizable option list for a
// bespoke quote, not a fixed-count package deal - so categoryLimits is left empty on both
// (no limit = every item shown, matching how the site itself presents the full list).
//
// Section mapping onto this project's MENU_CATEGORIES:
// - "סלטים ומנות פתיחה" is split into `salads` (items literally named "סלט...") and `starters`
//   (the handful of non-salad appetizers in that same list: eggplant rings, beet/sweet-potato
//   carpaccio, ceviche/sashimi).
// - The meat menu's own separate "מנות ביניים ותוספות" section becomes `hot_sides` (the dairy
//   menu has no equivalent separate section - its non-salad small dishes are folded into its
//   "מנות עיקריות" list, same as the site itself presents them).
// - Both menus' "מנות עיקריות" -> `main_courses`, "קינוחים" -> `desserts`.
// - The dairy menu's "פוקצ'ות או לחמים עבודת יד" intro (with a stated 3-dip-of-6 choice) becomes
//   one `breads` item with the dip choices folded into its own name text, since this schema has
//   no separate "choose a dip" sub-field. The meat menu's analogous "פלטות ירקות מעוצבות עם 3
//   מטבלים לבחירה" line is folded the same way into one `hot_sides` item.
//
// Source:
//   https://www.eat-love.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%97%d7%9c%d7%91%d7%99/
//   https://www.eat-love.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%91%d7%a9%d7%a8%d7%99/
//
// Usage: node --env-file=.env.local scripts/add-eatlove-formulas.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'ggZWkeNDUF';
const EVENT_TYPES = ['wedding', 'shabbat_chatan', 'henna', 'brit', 'celebration'];

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, categories, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: '',
    minGuests: '',
    includedCategories: Object.keys(categories),
    categoryLimits: {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: EVENT_TYPES,
    addons: [],
    sourceUrl
  };
}

const dairyMenu = pkg({
  id: 'dairy-menu',
  name: { he: 'תפריט קייטרינג חלבי', en: 'Dairy Catering Menu', fr: 'Menu Traiteur Lacté' },
  sourceUrl: 'https://www.eat-love.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%97%d7%9c%d7%91%d7%99/',
  categories: {
    salads: [
      'סלט קינואה בצבעים עם בטטה, חמוציות ונענע', 'סלט בורגול עשיר בעשבי תיבול עם קוביות סלק',
      'סלט עלי חסה, רצועות בצל סגול ורוטב הבית', 'סלט עלי בייבי, פיצוחים ופירות העונה',
      'סלט קפרזה עם עגבניות, מוצרלה משובחת, בזיליקום ובלסמי מצומצם', 'סלט קוביות סלק עם אגוזי מלך ורוקפור',
      'סלט עדשים שחורים עם בטטה קלויה וכוסברה', 'סלט יווני עם קוביות פטה וזעתר', 'סלט פסטה קר',
      'סלט ירקות שורש', 'סלט כרוב עם סלרי וחמוציות'
    ],
    starters: [
      'טבעות חצילים ברוטב עגבניות עשיר פיקנטי', 'קרפצ\'יו סלק ובטטה', 'חציל בסגנון ים תיכוני',
      'סביצ\'ה דג לבן / סשימי סלמון'
    ],
    breads: [
      "פוקצ'ות או לחמים עבודת יד (3 מטבלים לבחירה: טחינה לבנה / טחינה ירוקה / ממרח פלפלים / צ'ימיצ'ורי / מטבל עגבניות מיובשות / צזיקי קארי)"
    ],
    main_courses: [
      'ירקות שורש צלויים עם רוזמרין, טימין ושמן זית',
      'טריו ירוק: שעועית ירוקה, פרחי ברוקולי וקוביות זוקיני עם שומשום ופיצוחים',
      'פסטה / ניוקי / רביולי עם רוטב לבחירה', 'דואט פלחי תפוחי אדמה ובטטות',
      'דפי לזניה במילוי ריקוטה ותרד / חצילים וגבינות', 'לזניה טבעונית עם ירקות',
      'מאפה פילו עם קוביות בטטה / ברוקולי וגבינת פטה', 'מיני קישים במגוון מילויים',
      'מאפה מלאווח עם חצילים, גבינה ורוקט', 'פשטידה במבחר טעמים (אפשרות ללא גלוטן)',
      'מוסקת חצילים וגבינות', 'מרק מוקרם במבחר טעמים',
      'לחמניות באן עם סלמון מפורק / פטריות פורטובלו וריבת בצל', 'חריימה עם גרגירי חומוס ולא רק',
      'כדורי דג ברוטב עגבניות פיקנטי / קארי', 'קבבוני דג לבן על מצע חמאת בזיל / עראיס דגים',
      'פילה דג לבן בלימון ושקדים / שמנת פטריות / חמאת מרווה', 'דג סלמון בציפוי אגוזים קריספי'
    ],
    desserts: [
      'ריבועי בראוניז', 'עוגת ביסקוויטים ושוקולד', 'עוגת פבלובה עם קצפת ופירות העונה / פירות יער',
      'פרלינים שוקולד', 'עוגה בחושה / שמרים / רולדה (תבנית אינגליש קייק)', 'מגש פחזניות ביס / אצבעות קרמשניט',
      'עוגיות שקדים (ללא גלוטן)', 'טראפלס תמרים ואגוזים', 'קוביות שוקולד וטחינה', 'קינוחי כוסות',
      'פלטת פירות העונה מעוצבת', 'סלט פירות העונה'
    ]
  }
});

const meatMenu = pkg({
  id: 'meat-menu',
  name: { he: 'תפריט קייטרינג בשרי', en: 'Meat Catering Menu', fr: 'Menu Traiteur Viande' },
  sourceUrl: 'https://www.eat-love.co.il/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%91%d7%a9%d7%a8%d7%99/',
  categories: {
    salads: [
      'סלט קינואה בצבעים עם בטטה, חמוציות ונענע', 'סלט בורגול עשיר בעשבי תיבול עם קוביות סלק',
      'סלט עלי חסה, רצועות בצל סגול ורוטב הבית', 'סלט עלי בייבי, פיצוחים ופירות העונה',
      'סלט עגבניות שרי, צנוברים ובזיליקום', 'סלט קוביות סלק עם אגוזי מלך',
      'סלט עדשים שחורים עם בטטה קלויה וכוסברה', 'סלט כרוב עם סלרי וחמוציות', 'סלט ירקות שורש',
      'סלט פטוש', 'סלט פסטה קר'
    ],
    starters: [
      'טבעות חצילים ברוטב עגבניות עשיר פיקנטי', 'קרפצ\'יו סלק ובטטה', 'חציל קלוי בסגנון ים תיכוני',
      'סביצ\'ה דג לבן / סשימי סלמון'
    ],
    hot_sides: [
      'אנטיפסטי ירקות שורש', 'אורז לבן / אדום / ירוק, עם פירות יבשים ושקדים',
      'טריו ירוק: שעועית ירוקה, פרחי ברוקולי וקוביות זוקיני מוקפץ עם שומשום קלוי',
      'סינייה כרובית, טחינה ירוקה ושקדים פרוסים', 'פסטה / ניוקי / רביולי עם רוטב לבחירה',
      'דואט תפוחי אדמה ובטטה בתנור', 'מוקפץ צמחוני', 'לזניה טבעונית',
      'פלטות ירקות מעוצבות (3 מטבלים לבחירה: טחינה / טחינה ירוקה / ממרח פלפלים / ממרח גזר / צ\'ימיצ\'ורי / חומוס / ממרח עגבניות מיובשות)'
    ],
    main_courses: [
      'שיפודי פרגיות ברוטב הדרים / אסיאתי פיקנטי', 'שניצלים',
      'חצאי טורטיות עם שוארמה ביתית, טחינה ובצל מוחמץ', 'עראיס בשר / דגים', 'קבבונים על מקל קינמון',
      'לחמניות באן עם אסאדו מפורק / סלמון מפורק', 'מוסקת חצילים ובשר עם ירק',
      'מאפה בצק עלים עם בשר / כבד ופטריות', 'לזניה / קנלוני ברוטב בולונז', 'פילה דג לבן בלימון ושקדים',
      'דג סלמון בציפוי קריספי / קלאסי וטעים', 'חריימה עם גרגירי חומוס ולא רק',
      'כדורי דג ברוטב עגבניות פיקנטי / קארי', 'לשון עגל עם פירות יבשים, שקדים וערמונים',
      'רוסטביף מנתח סינטה / פילה משובח', 'שוק טלה בתנור עם ירקות שורש',
      'קשת אסאדו ממולאת באורז, צנוברים ועשבי תיבול'
    ],
    desserts: [
      'עוגה בחושה: בננה ומייפל / גזר / תפוזים ושוקולד ציפס / טחינה',
      'עוגת שמרים או רוגלך: שוקולד / חלבה / תפוחים / קינמון ואגוזים וכו\'', 'כדורי טראפלס תמרים ואגוזים',
      'קוביות שוקולד וטחינה', 'פרלינים שוקולד', 'פלטת פירות העונה מעוצבת', 'סלט פירות העונה'
    ]
  }
});

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  let added = 0;
  for (const formula of [dairyMenu, meatMenu]) {
    if (record.packages.some((p) => p.id === formula.id)) {
      console.warn(`Package "${formula.id}" already exists - skipping.`);
      continue;
    }
    record.packages.push(formula);
    added++;
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): added ${added} formula package(s). Now has ${record.packages.length} package(s) total.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
