// One-off follow-up script: adds the 2 formula menus published on arturos.co.il's own site to
// the "ארטורוס" caterer (added by scripts/add-arturos.mjs, which seeded no `packages` since the
// site's home/about pages have no pricing). Both menus are published as designed PNG images
// (not live HTML text) under /קייטרינג-בשרי/תפריטים/ - transcribed manually below, verified by
// re-reading a 3x-scaled crop of each image region against the first transcription.
//
//   1. תפריט קייטרינג קלאסי - the only one of the two with a published per-portion price
//      (55 ש"ח למנה). 3 upcharge main courses are noted inline with their real "+ 5 ש"ח" surcharge
//      (this project's addon schema is package-level, not per-item, so the surcharge is folded
//      into the item's own name, same convention as scripts/add-holybagel.mjs's sized-variant
//      items). The "תוספת מנה עיקרית שנייה - 25 ₪ לסועד" note becomes a package-level addon
//      (priceType 'note', since it applies per-guest but isn't itself a chosen menu item).
//   2. תפריט קייטרינג ספיישל - main course is a fixed two-item "chef's duet" (both included, not
//      a choice), so main_courses gets no categoryLimits entry (no limit = both shown/included).
//      No price is published anywhere on this menu's page - pricePerGuest stays '' rather than
//      guessed (estimatePackageTotal in lib/pricing.js already treats a falsy pricePerGuest as
//      "no estimate available").
//
// Source:
//   https://arturos.co.il/קייטרינג-בשרי/תפריטים/תפריט-קלאסי/
//   https://arturos.co.il/קייטרינג-בשרי/תפריטים/תפריט-קייטרינג-ספיישל/
//
// Usage: node --env-file=.env.local scripts/add-arturos-formulas.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = '9ZuiVdjSCG';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, addons, eventTypes, sourceUrl }) {
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
    addons: (addons || []).map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl
  };
}

const classicMenu = pkg({
  id: 'classic-menu',
  name: { he: 'תפריט קייטרינג קלאסי', en: 'Classic Catering Menu', fr: 'Menu Traiteur Classique' },
  pricePerGuest: 55,
  minGuests: 20, // site's own lead form: "20–30 אורחים (מינימום)" as the general event minimum
  categories: {
    salads: [
      'מטבוחה אסלית', 'כרוב אדום במיונז', 'קולסלאו - כרוב לבן וגזר במיונז', 'כרוב כבוש עם רצועות גזר',
      'סלט ערבי עם עגבניות, שום ופלפל חריף', "חציל בצ'ימיצ'ורי", 'חצילים מטוגנים', 'חציל במיונז',
      'חמוצי הבית', 'מלפפון, בצל ופלפלים', 'שומר מתובל (בעונה)', 'פלפל חריף', 'חומוס מסעדות',
      'סלק מזרחי', 'גזר מגורד פיקנטי', 'טחינה'
    ],
    hot_sides: [
      'אורז לבן', 'תפו"א אנה (פרוס)', 'תפו"א פריזיאן אפוי', 'מיקס ירקות צלויים', 'זיתים מרוקאים',
      'אפונה וגזר', 'שעועית מוקפצת', 'קוסקוס + ירקות'
    ],
    main_courses: [
      'פילה מושט בעשבי תיבול', 'פילה מושט בסגנון מזרחי', 'קציצות דגים ברוטב פיקנטי',
      'קציצות בקר/עוף ברוטב', 'כרעיים צלויים בגריל', 'שניצל בסגנון ביתי',
      'צלי עגל בצייר בקר (+ 5 ש"ח)', 'סטייק פרגית בתיבול השף (+ 5 ש"ח)', 'אסאדו בצליה איטית (+ 5 ש"ח)'
    ]
  },
  categoryLimits: { salads: 6, hot_sides: 3, main_courses: 1 },
  addons: ['תוספת מנה עיקרית שנייה: 25 ₪ לסועד (המנה כוללת גם לחמנייה/פיתה)'],
  eventTypes: ['bar_mitzvah', 'brit', 'celebration'],
  sourceUrl: 'https://arturos.co.il/%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%91%d7%a9%d7%a8%d7%99/%d7%aa%d7%a4%d7%a8%d7%99%d7%98%d7%99%d7%9d/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%a7%d7%9c%d7%90%d7%a1%d7%99/'
});

const specialMenu = pkg({
  id: 'special-menu',
  name: { he: 'תפריט קייטרינג ספיישל', en: 'Special Catering Menu', fr: 'Menu Traiteur Spécial' },
  pricePerGuest: '', // no price published anywhere on this menu's page
  minGuests: 20,
  categories: {
    salads: [
      'סלט טאבולה - בורגול, המון ירק, מיקס פיצוחים, חמוציות, לימון וסילאן',
      'סלט דודו - עגבניות שרי, שום, עלי כוסברה ופלפל חריף',
      'כרוב חגיגי - כרוב לבן עם ירק, מיקס פיצוחים, שמן זית, לימון וסילאן',
      'חמוצי הבית - כרוב, גזר, קולורבי, מגוון פלפלים ושום',
      'סלט השף - חסה, עלי בייבי, שרי, גזר, שמפניון, בצל סגול, רוטב ופיצוחים',
      'סלט ים תיכוני - זיתי קלמטה, פלפלים, צנונית, מלפפון, סלרי ועשבי תיבול',
      'סלט ירוק - פטרוזיליה, נענע, סלרי, פיצוחים, חמוציות, סילאן, לימון ושמן שומשום',
      "חצילים בצ'ימיצ'ורי - קוביות חציל מטוגן בליווי צ'ימיצ'ורי הבית",
      'חומוס הבית - חומוס עם מסבחה, שמן זית ופטרוזיליה'
    ],
    starters: [
      "כרובית קראנץ' - כרובית מטוגנת בציפוי פירורי לחם בליווי טחינה",
      'פיש & פיש - נתחי דג מובחרים בציפוי טמפורה בליווי איולי אריסה',
      'רול שוואורמה - טורטייה ממולאת נתחי פרגית קצוצים דק דק בתיבול השף',
      "מיני צ'וריסוס - נקניקיות מיני מנתחים מובחרים צלויים על הגריל",
      "ארעיס - רבעי פיתה במילוי קציצה עסיסית ומתובלת צלויה על הפלנצ'ה",
      'סלמון יפני - קוביות סלמון בציפוי פנקו וקראסט פיצוחים בליווי איולי צ\'ילי'
    ],
    main_courses: [
      'פרגית צלויה על הגריל בתיבול השף (כלול - חלק מדואט השף)',
      'נתח אסאדו צלוי בתיבול בצלייה ארוכה (כלול - חלק מדואט השף)'
    ]
  },
  categoryLimits: { salads: 6, starters: 3 }, // main_courses has no limit - both items are the fixed included duet
  eventTypes: ['bar_mitzvah', 'brit', 'celebration'],
  sourceUrl: 'https://arturos.co.il/%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%91%d7%a9%d7%a8%d7%99/%d7%aa%d7%a4%d7%a8%d7%99%d7%98%d7%99%d7%9d/%d7%aa%d7%a4%d7%a8%d7%99%d7%98-%d7%a7%d7%99%d7%99%d7%98%d7%a8%d7%99%d7%a0%d7%92-%d7%a1%d7%a4%d7%99%d7%99%d7%a9%d7%9c/'
});

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  let added = 0;
  for (const formula of [classicMenu, specialMenu]) {
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
