// One-off follow-up script: adds the 3 all-inclusive "אירוע בפטיו" (patio venue event) formula
// menus published on arturos.co.il's event-hall landing page to the "ארטורוס" caterer (added by
// scripts/add-arturos.mjs). These are a DIFFERENT product from the 2 off-site catering-delivery
// formulas added by scripts/add-arturos-formulas.mjs (same business, same chef, overlapping dish
// names, but this is "host your event at our patio, all-inclusive per-guest price including
// drinks/dessert/a deposit/etc." vs. "we deliver trays to your own venue") - package ids and
// display names are kept distinct (suffixed "(אירוע בפטיו)") so the two product lines don't read
// as duplicates on the caterer profile page.
//
// Each menu's full content is rendered via a client-side JS modal (div.modal.open), not a static
// image or a separate URL - opened by clicking each "לצפייה בתפריט המלא" button on
// https://arturos.co.il/אולם-אירועים-קטן-ביבנה/ and read via the modal's own innerText.
//
// Real, explicitly published facts used below (same page, same 3 modals):
// - pricePerGuest uses each menu's current/sale price (199 / 250 / 325 ₪) - the crossed-out
//   "was" price (229 / 290 / 380 ₪) is preserved as a package addon note instead of a second
//   price field, since this schema only has one pricePerGuest.
// - minGuests: 40 / 32 / 22 - explicit "מינימום X מוזמנים" per menu.
// - This project's MENU_CATEGORIES has no separate slot for the site's two distinct pre-main
//   tiers on the השף/כיד המלך menus ("מנות פתיחה" 2-choice + "מנות ראשונות" 3-or-4-choice,
//   both genuinely starter-course dishes, not side dishes) - both tiers are merged into one
//   `starters` category per menu, with categoryLimits.starters set to the SUM of the two
//   choice counts (5 = 2+3 for השף, 6 = 2+4 for כיד המלך) so the real total choosable count is
//   preserved even though the site's own two-tier split isn't representable here. קלאסי only
//   has one such tier (מנות ראשונות, 3-choice) so no merge is needed there.
// - main_courses, beverages_alcoholic, beverages_non_alcoholic and desserts are all "included,
//   no choice limit" on every menu (the site lists them as a fixed included spread, not a
//   choose-N list) - so those categories get no categoryLimits entry (absence = no limit, same
//   convention as scripts/add-arturos-formulas.mjs's special-menu main_courses duet). קלאסי is
//   the only one of the 3 with no alcohol included (soft drinks only) - no beverages_alcoholic
//   category on that package.
// - Per-item upcharges (e.g. "קבב הבית... (בתוספת 20₪ לסועד)") are folded into the item's own
//   name, same convention as scripts/add-holybagel.mjs's sized-variant items - this schema's
//   addons are package-level, not per-item.
//
// Source: https://arturos.co.il/%d7%90%d7%95%d7%9c%d7%9d-%d7%90%d7%99%d7%a8%d7%95%d7%a2%d7%99%d7%9d-%d7%a7%d7%98%d7%9f-%d7%91%d7%99%d7%91%d7%a0%d7%94/
//
// Usage: node --env-file=.env.local scripts/add-arturos-venue-formulas.mjs

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = '9ZuiVdjSCG';
const SOURCE_URL = 'https://arturos.co.il/%d7%90%d7%95%d7%9c%d7%9d-%d7%90%d7%99%d7%a8%d7%95%d7%a2%d7%99%d7%9d-%d7%a7%d7%98%d7%9f-%d7%91%d7%99%d7%91%d7%a0%d7%94/';

const COMMON_TERMS =
  'מקדמה בהזמנה: 770 ₪ | מסך + מערכת הגברה: 400 ₪ (חד-פעמי) | דמי שירות 10% אינם כלולים במחיר | האירוע מוגבל עד 4 שעות, ולא מאוחר מהשעה 23:00';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, pricePerGuest, minGuests, categories, categoryLimits, addons }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest,
    minGuests,
    includedCategories: Object.keys(categories),
    categoryLimits: categoryLimits || {},
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: ['bar_mitzvah', 'brit', 'celebration'],
    addons: addons.map((he) => ({ id: nanoid(8), name: { he, en: '', fr: '' }, priceType: 'note', amount: '' })),
    sourceUrl: SOURCE_URL
  };
}

const SALADS_9 = [
  'סלט טאבולה - בורגול, המון ירק, מיקס פיצוחים, חמוציות, לימון וסילאן',
  'סלט דודו - עגבניות שרי, שום, עלי כוסברה ופלפל חריף',
  'כרוב חגיגי - כרוב לבן עם ירק, חמוציות, מיקס פיצוחים, שמן זית, לימון וסילאן',
  'חמוצי הבית - כרוב, גזר, קולורבי, מגוון פלפלים ושום',
  'סלט השף - חסה, עלי בייבי, שרי, גזר, שמפניון, בצל סגול, רוטב ופיצוחים',
  'סלט ים תיכוני - זיתי קלמטה, שרי, פלפלים, צנונית, מלפפון, סלרי ועשבי תיבול',
  'פאטוש - פטרוזיליה, נענע וסלרי קצוצים דק, פיצוחים, חמוציות, סילאן ושמן שומשום',
  'חומוס הבית - חומוס עם מסבחה, שמן זית ופטרוזיליה',
  'חציל בלאדי - חציל על האש, טחינה גולמית, רכז רימונים ולימון בעיטור ירק'
];

const APPETIZERS_4 = [
  'כבד קצוץ ביתי - חלת בצל מטוגנת ופרוסות לחם על אש גלויה',
  "כרובית קראנץ' - מטוגנת בציפוי פירורי לחם בליווי טחינה",
  'חציל שניצל - פרוסות חציל בציפוי פריך בליווי סלסה פיקנטית',
  'פטריות עשן - צלויות מוקפצות, קונפי שום, יין לבן ועשבי תיבול על קרם בטטה'
];

const BEVERAGES_ALCOHOLIC_3 = ['יין לבן', 'יין אדום', 'בירה לבנה'];
const BEVERAGES_SOFT_ALCOHOLIC_MENU = ['קולה', 'קולה זירו', 'ספרייט', 'לימונענע', 'תפוזים', 'סודה ומים'];
const BEVERAGES_SOFT_CLASSIC = ['קולה', 'קולה זירו', 'תפוזים', 'סודה ומים'];
const DESSERTS_2 = ['פלטת קינוחים מגוונת ומפנקת (מבית ביסקוטי)', 'קפה ותה לבקשת הסועדים'];

const classicVenueMenu = pkg({
  id: 'venue-classic-menu',
  name: { he: 'תפריט "קלאסי" (אירוע בפטיו)', en: 'Classic Menu (Patio Event)', fr: 'Menu Classique (Événement Patio)' },
  pricePerGuest: 199,
  minGuests: 40,
  categories: {
    salads: SALADS_9,
    starters: [
      'כבד קצוץ ביתי - חלת בצל מטוגנת ופרוסות לחם על אש גלויה',
      "פיש אנד צ'יפס - נתחי דג מובחרים בציפוי טמפורה, איולי אריסה וצ'יפס בצד",
      'רול שווארמה - טורטייה ממולאת נתחי פרגית בתיבול השף וזילוף טחינה',
      'אריס - מיני פיתה במילוי בשר בקר מובחר ומתובל, צלויה על הפלנצ\'ה',
      'סיגר מרוקאי - עלי סיגר מטוגנים במילוי בשר בקר טחון, טחינה וסילאן',
      "הוט וינגס - כנפיים מקוצבות בטיגון עמוק, רוטב צ'ילי מתוק, בצל ירוק ושומשום"
    ],
    main_courses: [
      'פרגיות בתיבול השף צלויות על גריל לוהט בליווי צ\'יפס הבית',
      'נתחי אסאדו בתיבול השף בצלייה ארוכה בליווי ירקות צלויים',
      'קבב הבית מבקר מובחר על הגריל (בתוספת 20 ₪ לסועד)'
    ],
    beverages_non_alcoholic: BEVERAGES_SOFT_CLASSIC,
    desserts: DESSERTS_2
  },
  categoryLimits: { salads: 6, starters: 3 },
  addons: [`מחיר מבצע: 199 ₪ לסועד (במקום 229 ₪)`, COMMON_TERMS]
});

const chefVenueMenu = pkg({
  id: 'venue-chef-menu',
  name: { he: 'תפריט "השף" (אירוע בפטיו)', en: "Chef's Menu (Patio Event)", fr: 'Menu du Chef (Événement Patio)' },
  pricePerGuest: 250,
  minGuests: 32,
  categories: {
    salads: SALADS_9,
    // Merges the site's own 2 tiers here (מנות פתיחה 2-choice + מנות ראשונות 3-choice) into one
    // category - see file header comment.
    starters: [
      ...APPETIZERS_4,
      "פיש אנד צ'יפס - נתחי דג מובחרים בציפוי טמפורה, איולי אריסה וצ'יפס בצד",
      'רול שווארמה - טורטייה ממולאת נתחי פרגית בתיבול השף וזילוף טחינה',
      'אריס - מיני פיתה במילוי בשר בקר מובחר ומתובל, צלויה על הפלנצ\'ה בזילוף טחינה',
      'סיגר מרוקאי - עלי סיגר מטוגנים במילוי בשר בקר טחון, זילוף טחינה וסילאן',
      "קוביות סלמון - בקראסט פיצוחים בליווי איולי צ'ילי",
      "סביצ'ה סלמון - סלט ערבי קצוץ דק, צ'ילי חריף ועשבי תיבול",
      'קרפצ\'יו סינטה - סלטון בכבישה קרה של מלח ים, שמן זית וחומץ בלסמי'
    ],
    main_courses: [
      'פרגיות צלויות על הגריל בתיבול השף',
      'קבב הבית מבקר מובחר על הגריל',
      'נתחי אנטריקוט פרימיום מיושן היטב על הגריל',
      'אושפלו של השף ארתור - תבשיל בוכרי עם נתחי אסאדו (בתוספת 20 ₪ לסועד)'
    ],
    beverages_alcoholic: BEVERAGES_ALCOHOLIC_3,
    beverages_non_alcoholic: BEVERAGES_SOFT_ALCOHOLIC_MENU,
    desserts: DESSERTS_2
  },
  categoryLimits: { salads: 6, starters: 5 }, // 5 = 2 (מנות פתיחה) + 3 (מנות ראשונות)
  addons: [`מחיר מבצע: 250 ₪ לסועד (במקום 290 ₪)`, COMMON_TERMS]
});

const royalVenueMenu = pkg({
  id: 'venue-royal-menu',
  name: { he: 'תפריט "כיד המלך" (אירוע בפטיו)', en: "Royal Menu (Patio Event)", fr: 'Menu Royal (Événement Patio)' },
  pricePerGuest: 325,
  minGuests: 22,
  categories: {
    salads: SALADS_9,
    // Merges the site's own 2 tiers here (מנות פתיחה 2-choice + מנות ראשונות 4-choice) - see
    // file header comment.
    starters: [
      ...APPETIZERS_4,
      "פיש אנד צ'יפס - נתחי דג מובחרים בציפוי טמפורה, איולי אריסה וצ'יפס בצד",
      'רול שווארמה - טורטייה ממולאת נתחי פרגית בתיבול השף וזילוף טחינה',
      'אריס - מיני פיתה במילוי בשר בקר מובחר ומתובל, צלויה על הפלנצ\'ה בזילוף טחינה',
      'סיגר מרוקאי - עלי סיגר מטוגנים במילוי בשר בקר טחון, זילוף טחינה וסילאן',
      "קוביות סלמון - בקראסט פיצוחים בליווי איולי צ'ילי",
      "סביצ'ה סלמון - סלט ערבי קצוץ דק, צ'ילי חריף ועשבי תיבול",
      'תבשיל בשר ראש - פיקנטי עם גרגירי חומוס ותבלינים מהמטבח המרוקאי',
      'קרפצ\'יו סינטה - סלטון בכבישה קרה של מלח ים, שמן זית וחומץ בלסמי',
      "גוז'גוז'ה - מאפה בורכי ממולא בשר משובך קצוץ דק-דק"
    ],
    main_courses: [
      'קבב בקר מובחר צלוי על הגריל',
      'צלעות טלה פרימיום מקוצבות',
      'פרגיות צלויות על הגריל בתיבול השף',
      'נתחי אנטריקוט פרימיום מיושן היטב על הגריל',
      'אושפלו של השף ארתור - תבשיל בוכרי עם נתחי אסאדו'
    ],
    beverages_alcoholic: BEVERAGES_ALCOHOLIC_3,
    beverages_non_alcoholic: BEVERAGES_SOFT_ALCOHOLIC_MENU,
    desserts: DESSERTS_2
  },
  categoryLimits: { salads: 7, starters: 6 }, // 6 = 2 (מנות פתיחה) + 4 (מנות ראשונות)
  addons: [`מחיר מבצע: 325 ₪ לסועד (במקום 380 ₪)`, COMMON_TERMS]
});

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  let added = 0;
  for (const formula of [classicVenueMenu, chefVenueMenu, royalVenueMenu]) {
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
