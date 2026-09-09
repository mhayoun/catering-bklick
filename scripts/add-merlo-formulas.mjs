// One-off follow-up script: scripts/add-merlo.mjs only scraped merlo-c.co.il's homepage, which
// has no menu content of its own - the site's real formula menus live on 4 separate subpages
// that aren't linked from the homepage nav (only reachable via internal links / sitemap), missed
// on the first pass. Re-crawled the full internal link graph this time and found:
//
//   - /weddingmenu/ and the (identical, duplicate) /תפריט-בשרי-בהגשה/ page: "תפריט חתונה בהגשה
//     אישית" - 4 starters, 7 salads, 3 mains (+1 vegetarian, plated/unlimited), dessert bar.
//   - /dairy-menu/: "תפריט חלבי עמדות" - bread, 6 salads, then 3 sub-stations (2 pastas / 2 fish /
//     2 quiches - this schema has one main_courses tier, not 3, so all 6 are pooled there with
//     categoryLimits.main_courses = 6, the real sum), 3 side accompaniments, dessert bar.
//   - /meet/: "תפריט בשרי מזנונים" - 3 of 9 main-course stations (each station, e.g. "עמדת
//     בריאות", is itself a small multi-dish spread but is one selectable unit on the site's own
//     order form, so kept as one item here), 6 of 10 desserts.
//   - /finger-foodpremium/: "תפריט Finger Food פרמיום" (freestyle Israeli-Mediterranean tapas) -
//     5 of 11 stations, 6 of 10 desserts.
//
// None of the 4 pages publish a per-menu price (lead-gen "get a quote" flow on all of them), but
// the site's own /כשרות-בקייטרינג-מרלו/ page DOES publish a real general price range for its
// full-service (waiters + setup + cleanup) offering: ₪200-350/guest, plus a real named small-
// event promo at ₪200+VAT/guest - both kept as an informational addon (priceType 'note') on
// every package below rather than invented as a specific number for any one menu, since the site
// never ties either figure to a single specific menu.
//
// Also found on that same page: kashrut is explicit and specific ("בד"ץ יורה דעה, הרב מחפוד" +
// "משגיח כשרות צמוד" + Gush Katif produce, שמיטה לחומרא) - upgrades kashrutLevels from [] to
// ['badatz_rav_machpud']. A real address ("צומת ביל"ו, רחובות") and email (info@merlo-c.co.il)
// were also found in the footer of the /תפריט-בשרי-בהגשה/ page - upgrades those from blank.
//
// Logo: the header's own logo image is alt="merlo-logo-white" - a genuinely all-white asset by
// design (built for the site's own dark navbar), not a bug on their end like the other white-on-
// white logos documented in earlier scripts' comments. A usable alternative was found instead:
// the site's own 192x192 favicon is a proper black wordmark on a transparent/white ground,
// legible against this project's light card background - downloaded and used as `logo`.
//
// Usage: node --env-file=.env.local scripts/add-merlo-formulas.mjs

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
const CATERER_ID = 'C4AR1GmD60';
const SRC_DIR =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/755d4ccb-8017-43db-87b5-73224b4601e9/scratchpad/merlo';
const LOGO_FILE = 'favicon192.webp'; // actually PNG bytes despite the CDN's .webp-suffixed filename

const PRICE_NOTE =
  'טווח מחירים כללי לקייטרינג בהגשה מלאה (מלצרים, עריכה ופינוי): כ-200-350 ₪ לסועד, תלוי בכמות המוזמנים | מבצע חבילת "הכל כלול" לאירועים קטנים: 200 ₪ + מע"מ לסועד (בכפוף לתנאי המבצע בתוקף)';

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
    eventTypes: ['wedding', 'bar_mitzvah', 'brit', 'celebration'],
    addons: noteAddons([...(addons || []), PRICE_NOTE]),
    sourceUrl
  };
}

const weddingMenu = pkg({
  id: 'wedding-menu',
  name: { he: 'תפריט חתונה בהגשה אישית', en: 'Wedding Menu - Plated Service', fr: 'Menu Mariage - Service à l\'Assiette' },
  sourceUrl: 'https://www.merlo-c.co.il/weddingmenu/',
  categories: {
    starters: [
      "סביצ'ה על ברוסטה - סלמון, צלפים ועשבי תיבול", 'מקסיקני עטוף - מיני טורטיות במילוי צילי קון קרנה וירקות',
      'שווארמה טורקית - פרגית וחזה עוף בתיבול ים תיכוני, טחינה ועמבה', 'שוק איכרים - ראגו בשר טלה ושומן כבש',
      'מן הים - קציצות דגים פיקנטיות ברוטב מרוקאי', 'באן אישי - אסאדו מפורק, צימיצ\'ורי ואיולי צ\'ילי',
      'ערוק - קציצת ירק ביתית, חומוס וטחינה', 'החומוסיה - חומוס ביתי בהכנה אישית',
      'הטאבון - פוקאצות אישיות טריות מהתנור'
    ],
    salads: [
      'עגבניות שרי, בזיליקום, זיתים שחורים ואגוזי מלך', 'כרוב שובב - כרוב לבן ואדום, בצל ירוק, שומשום קלוי',
      'ממרוקו באהבה - מטבוחה מרוקאית חריפה', 'בורגול האמתי - טבולה בתיבול שמן זית ולימון',
      'חומוס אוריגינל', 'כרוב חמוציות במרינדת לימון', 'גזר בנגיעות נענע', 'קרפצ\'ו סלק',
      'קרפצ\'ו חציל בטחינה גולמית', 'סלט שורשים - גזר, סלק וקולורבי בתיבול אסייתי', 'אורז ג\'עלה',
      'אושפלאו - תבשיל אורז וגמבות', 'סלט גן אביבי - עלי בייבי, רימונים ואגוזי פקאן', 'סלט השף'
    ],
    main_courses: [
      'אותנטי - סטייק פרגית בתיבול מזרחי על מצע תפו"א', 'מקסיקנו - סטייק פרגית במרינדת ג\'ינג\'ר וטריאקי',
      'אסאדו ביין - נתח אסאדו במרינדת יין אדום', 'אסאדו בחרדל - נתח אסאדו במרינדת חרדל ודבש',
      'עופיון מפורק על מצע קרפצ\'ו תפו"א', 'נגיעות מהמזרח הרחוק - פילה סלמון במרינדה אסייתית',
      'סלמון די פארמה - פילה סלמון אפוי ביין לבן', 'לברק הדרים - פילה לברק במרינדת הדרים',
      'סיגר מרלו - בשר טלה וצנוברים בפילו', 'פילה בקר צרוב (בתוספת תשלום)',
      'מנה צמחונית לבחירה: סיגר פילו פירה ופטריות / ניוקי תפו"א / בטטה בורלה וטופו'
    ],
    desserts: [
      'שוקושוט - מוס שוקולד בלגי', 'טארט טאטן', 'שוקולטו - מוס שוקולד וטראפלס', 'טורטה פיקולו',
      'מוס אוורירי (חלבה / ריבת חלב / שוקולד)', 'גליליות מן הגליל', 'נשנוש מתוק - מיני בראוניז',
      'נשיקה של תפוז - טארט שוקולד ותפוז', 'סופלה חם'
    ]
  },
  categoryLimits: { starters: 4, salads: 7, main_courses: 3 }
});

const dairyMenu = pkg({
  id: 'dairy-stations-menu',
  name: { he: 'תפריט חלבי עמדות', en: 'Dairy Stations Menu', fr: 'Menu Lacté (Stands)' },
  sourceUrl: 'https://www.merlo-c.co.il/dairy-menu/',
  categories: {
    breads: ['מגוון לחמים כפריים (אגוזים, זיתים, חמוציות, צימוקים) בליווי מטבלים ביתיים'],
    salads: [
      'סלט פניצלה - עגבניות, מלפפון ופטרוזיליה בויניגרט הדרים', 'סלט קפרזה - עגבניות שרי, בזיליקום ומוצרלה',
      'בטוצ\'ילי - קוביות בטטה ברוטב צ\'ילי מתוק', 'קרפצ\'ו סלק', 'קרפצ\'ו חציל בלאדי בטחינת הבית',
      'סלט גן אביבי - עלי בייבי, נקטרינה ותפוח עץ', 'קינואה - חמוציות ונענע', 'אנטיפסטי איטלקי'
    ],
    main_courses: [
      'פסטה רוזה - רוטב עגבניות ושמנת', 'פסטה פונגי - קרם שמנת ופטריות ביין לבן',
      'ניוקי תפו"א עם עגבניות שרי ופטריות שימאג\'י', 'פסטה ארביאטה', 'פסטה אלי אוליו',
      'אצבעות סלמון אפויות ביין לבן על סלט אטריות אסייתי', 'אמנון הדרים במרינדת הדרים',
      'לברק טוסקנה', 'קיש פטריות ושמנת ("הקיש של ריבה")', 'קיש בטטה כתומה',
      'קיש בצל צרפתי (בצל לבן, סגול וכרישה)', 'קיש קישואים ובצל סגול'
    ],
    starters: ['אנטיפסטי - ירקות בגריל', 'פוקאצות אישיות מהטאבון', 'בייגל רומני עם לבנה וגבינת שום שמיר'],
    desserts: [
      'שוקושוט', 'טארט טאטן', 'שוקולטו', 'טורטה פיקולו', 'מוס אוורירי', 'מגנום על מקל',
      'נשנוש מתוק', 'מיקס מקרון', 'קראנץ שמרים', 'פירות העונה'
    ]
  },
  categoryLimits: { salads: 6, main_courses: 6 } // 6 = 2 pastas + 2 fish + 2 quiches, the site's 3 sub-stations pooled into one tier
});

const meatStationsMenu = pkg({
  id: 'meat-stations-menu',
  name: { he: 'תפריט בשרי מזנונים', en: 'Meat Buffet Stations Menu', fr: 'Menu Viande (Buffets)' },
  sourceUrl: 'https://www.merlo-c.co.il/meet/',
  categories: {
    main_courses: [
      'עמדת בריאות - חומוס, קרפצ\'ו סלק, סלט קינואה, סלט גן אביבי, סלט כרוב, סלט עגבניות וקרפצ\'ו חציל בלאדי',
      'טוסקנה - פילה לברק אפוי על מצע קרם פלפלים', 'סלמון ביין - פילה סלמון ביין לבן על ריזוטו בורגול',
      'דואט קבב - קובבה וקבב טלה על מצע אורז פאיה', 'אסאדו בר - נתח אסאדו מעושן בצ\'ימיצ\'ורי על קרם בטטה',
      'מקסיקנו - פרגית צלויה עם אורז אושפלאו ותפו"א ובטטה', 'עוף מפורק - עופיון בבישול איטי על מנגל פחמים',
      'ניוקי מרלו - ניוקי תפו"א עם עגבניות שרי, פורטובלו וארטישוק (הכנה מול האורחים)',
      'פילה בקר צרוב על פירה כמהין (בתוספת תשלום)'
    ],
    desserts: [
      'שוקושוט', 'טארט טאטן', 'שוקולטו', 'טורטה פיקולו', 'מוס אוורירי', 'מגנום על מקל',
      'נשנוש מתוק', 'מיקס מקרון', 'קראנץ שמרים', 'סופלה שוקולד חם'
    ]
  },
  categoryLimits: { main_courses: 3, desserts: 6 }
});

const fingerFoodMenu = pkg({
  id: 'finger-food-premium-menu',
  name: { he: 'תפריט Finger Food פרמיום', en: 'Finger Food Premium Menu', fr: 'Menu Finger Food Premium' },
  sourceUrl: 'https://www.merlo-c.co.il/finger-foodpremium/',
  categories: {
    main_courses: [
      'עמדת בריאות - לחמי מחמצת, קרפצ\'ו חציל וסלק, סלט עלי בייבי וסלט כרוב',
      'טרטר דג ים - טרטר בר ים על עלי אנדיב', 'על הפלנצ\'ה - סטייק אנטריקוט נצרב על פירה כמהין',
      'מיני סיגר טלה - טלה וצנוברים בפילו עם איולי נענע', "Fish Kitchen - קוביית סלמון יין לבן על עדשים שחורות",
      "סביצ'ה על ברוסקטה - סלמון ולברק", 'טלה על מקל - קבב טלה על מקל קינמון',
      'ניוקי מרלו - הקפצה פרונטלית מול האורחים', 'בורגר אנטריקוט מיני על הפלנצ\'ה',
      'באן אישי - אסאדו מפורק עם שערות חלווה', 'הטאבון - פוקאצות חמות הנאפות מול האורחים'
    ],
    desserts: [
      'שוקושוט', 'קטן ואישי - מיני מגנום', 'פרימה בלרינה פבלובה', 'מקרונים', 'טורטה פיקולו',
      'גליליות מן הגליל', 'נשנוש מתוק', 'ביס של שחיתות', 'קראנץ שמרים', 'סופלה שוקולד'
    ]
  },
  categoryLimits: { main_courses: 5, desserts: 6 }
});

async function main() {
  const logoBuf = await readFile(path.join(SRC_DIR, LOGO_FILE));
  const logoUrl = (
    await put(`caterers/${OWNER_EMAIL}/${Date.now()}-merlo-logo.png`, logoBuf, { access: 'public', contentType: 'image/png' })
  ).url;
  console.log(`Uploaded logo -> ${logoUrl}`);

  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  record.logo = logoUrl;
  record.address = 'צומת ביל"ו, רחובות';
  record.city = { he: 'רחובות', en: 'Rehovot', fr: 'Rehovot' };
  record.districts = ['center'];
  record.email = 'info@merlo-c.co.il';
  record.kashrutLevels = ['badatz_rav_machpud'];
  record.cateringTypes = ['dairy', 'meat'];
  record.priceFrom = 200;
  record.menuCategories = ['starters', 'salads', 'main_courses', 'desserts', 'breads'];

  let added = 0;
  for (const formula of [weddingMenu, dairyMenu, meatStationsMenu, fingerFoodMenu]) {
    if (record.packages.some((p) => p.id === formula.id)) {
      console.warn(`Package "${formula.id}" already exists - skipping.`);
      continue;
    }
    record.packages.push(formula);
    added++;
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(
    `Updated caterer "${record.businessName}" (${CATERER_ID}): logo set, business details enriched, added ${added} formula package(s). Now has ${record.packages.length} package(s) total.`
  );
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
