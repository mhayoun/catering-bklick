// One-off script: adds "סטי מוצרים" as a new, pre-approved caterer, sourced from its own website
// https://m-setti.com/ (an older ASP-based product catalog site, not a modern formula-menu site
// like aleshelzait.co.il/protamar.com). Logo + 2 hero photos are downloaded locally then uploaded
// to this project's Vercel Blob store (mirroring scripts/add-aleshelzait-photos.mjs's convention)
// before the record is written.
//
// Business model differs from every caterer added so far in this directory: it's described on
// its own "about" page as "מפעל המייצר מאכלים אותנטיים עדתיים" (a factory producing authentic
// ethnic/Mizrahi Jewish dishes) - sells both catering and a weekly "ready-made Friday food" fair,
// via an item catalog rather than fixed-price wedding-style formulas.
//
// No pricing (per-guest or otherwise) or guest-count minimums appear ANYWHERE on the site, unlike
// protamar.com which had priced bundles - pricePerGuest/minGuests are left at 0 on both packages
// below (estimatePackageTotal in lib/pricing.js treats a falsy pricePerGuest as "no estimate
// available" and simply omits the price, rather than showing a fabricated number).
//
// maxGuests (300) IS a guess, unlike everything else in this record - CatererCard always renders
// "up to N guests" unconditionally (no fallback for missing data), so leaving it at 0 would look
// like a UI bug rather than "unknown". Adjust via the dashboard edit form once a real figure is
// known.
//
// kashrutLevels is real, sourced from the site's own /page7.asp (כשרות) page: "בשר חלק בד"צ בית
// יוסף (עטרה)" + "בהשגחת ... הרבנות הראשית מעלה אדומים" - both map onto real KASHRUT_LEVELS
// entries.
//
// Usage: node --env-file=.env.local scripts/add-setti.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/setti-site';

function items(list) {
  return list.map((he) => ({ id: nanoid(8), he, en: '', fr: '' }));
}

function pkg({ id, name, categories, sourceUrl }) {
  return {
    id,
    type: 'formula',
    name,
    pricePerGuest: 0, // no pricing published anywhere on the site - see header comment
    minGuests: 0,
    includedCategories: Object.keys(categories),
    categoryLimits: {}, // plain item catalogs, not "choose N of M" formulas
    categoryItems: Object.fromEntries(Object.entries(categories).map(([cat, list]) => [cat, items(list)])),
    eventTypes: ['celebration'],
    addons: [],
    sourceUrl
  };
}

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

  const packages = [
    pkg({
      id: 'basic-menu',
      name: { he: 'תפריט בסיסי', en: 'Basic Catering Menu', fr: 'Menu Traiteur de Base' },
      sourceUrl: 'https://m-setti.com/catalog.asp?t1=3&t2=1',
      categories: {
        main_courses: [
          'דג פילה מושט ברוטב מרוקאי', 'סלומון בעשבי תיבול', 'פילה מושט מטוגן', 'סול מטוגן', 'בקלה מטוגן',
          'שניצל', 'פרגית', 'צלי בשר', 'בורקס בשר', 'קבב', 'קציצות בשר', 'כרעיים עוף צלוי', 'שיפודי עוף',
          'מעורב ירושלמי', 'מוקפץ עם עוף', 'מפרום', 'מוסקה', 'אסאדו בערמונים',
          'פסטייה - מאפה בשר טחון ופירות יבשים', 'בשר ראש עם גרגירי חומוס', 'פרגית ממולאת בשר ופיסטוקים',
          'מאפה מעורב'
        ],
        hot_sides: [
          'אורז - לבן/צהוב/אדום', 'אורז עם אטריות', 'אורז עם חומוס', 'שעועית ירוקה ברוטב עגבניות',
          'שעועית ירוקה מוקפצת עם שומשום', 'זיתים מבושלים', 'אפונה', 'תפו"א אפוי', 'דואט תפו"א ובטטה',
          'אפונה וגזר', 'ירקות מוקפצים', 'פטריות עם תחתיות ארטישוק', 'שעועית לבנה ברוטב עגבניות'
        ],
        breads: ['לחמניות', 'לחוחים', 'פרנות וכו\''],
        salads: [
          'מטבוחה', 'טחינת הבית', 'כרובית בטחינה', 'חומוס', 'גזר מגורד עם לימון פיקנטי', 'פלפל חריף מטוגן',
          'כרוב בלימון', 'כרוב גזר ותירס במיונז', 'כרוב במיונז', 'קוסלו', 'זיתים', 'מלפפון חמוץ', 'טבולה',
          'סחוג ירוק', 'חילבה', 'תפו"א עם מיונז', 'סלט ביצים', 'שרי עם בזיליקום שום ולימון'
        ],
        desserts: ['בקלאווה', 'סיגרים ממולאים שוקולד/חלבה']
      }
    }),
    pkg({
      id: 'fried-buffet',
      name: { he: 'תפריט מזנון מטוגנים', en: 'Fried Buffet Menu', fr: 'Buffet de Fritures' },
      sourceUrl: 'https://m-setti.com/catalog.asp?t1=3&t2=2',
      categories: {
        starters: [
          'קובה מטוגן', 'סיגרים בשר/תפו"א', 'פסטל תפו"א', 'אגרול ירקות', 'שניצלונים', 'קבבונים',
          'קובה למרק אדום', 'קובה חמוסטה', 'עלי גפן', 'כרוב ממולא', 'בצל ממולא', 'סמבוסק חומוס',
          'אמפנדס בשר', 'בורקס בשר', 'כרובית מטוגנת'
        ],
        hot_sides: ['תפו"א אפוי', 'אורז', "צ'יפס", "טבעות צ'יפס"],
        desserts: ['סיגרים שוקולד']
      }
    })
  ];

  const record = {
    id: nanoid(10),
    businessName: 'סטי מוצרים',
    ownerEmail: OWNER_EMAIL,
    description: {
      he: '"סטי מוצרים" הינו תוצר של אהבה לאוכל - מפעל המייצר מאכלים אותנטיים עדתיים. בסטי מוצרים אנו משלבים את כל החושים יחד ויוצרים הרמוניה של צבעים וטעמים, תוך שימת לב לפרטים הקטנים ביותר. אנו מתמחים באוכל טבעי, טרי וטעים!, שמים דגש על טיב חומרי הגלם כדי שתקבלו את המוצרים והמנות האסתטיים ביותר במחירי השוק הנמוכים ביותר. תוכלו להזמין אצלנו קייטרינג לכל אירוע, ברמה הגבוהה ביותר וכן להינות ולקנות ביריד האוכל המוכן לשבת בימי שישי.',
      en: '"Setti Products" is a product of a love for food - a factory producing authentic, ethnic Jewish dishes. At Setti Products we combine all the senses together, creating a harmony of colors and flavors, paying attention to the smallest details. We specialize in natural, fresh and delicious food, emphasizing the quality of our ingredients so you get the most aesthetic products and dishes at the lowest market prices. You can order catering with us for any event, at the highest level, and also enjoy and buy at our Friday ready-made Shabbat food fair.',
      fr: "\"Setti Products\" est le fruit d'un amour pour la cuisine - une usine produisant des plats juifs authentiques et communautaires. Chez Setti Products, nous combinons tous les sens pour créer une harmonie de couleurs et de saveurs, en portant attention aux moindres détails. Nous sommes spécialisés dans une cuisine naturelle, fraîche et savoureuse, avec un accent mis sur la qualité des ingrédients pour vous offrir les produits et plats les plus esthétiques aux prix du marché les plus bas. Vous pouvez commander chez nous un service traiteur pour tout événement, au plus haut niveau, et aussi profiter de notre marché d'aliments prêts pour le Shabbat, le vendredi."
    },
    districts: ['judea_samaria'],
    city: { he: 'מעלה אדומים', en: "Ma'ale Adumim", fr: 'Maalé Adoumim' },
    address: 'רחוב נביעות 16, אזור תעשייה מישור אדומים, מעלה אדומים',
    kashrutLevels: ['badatz_beit_yosef', 'local_rabbinate'], // site's /page7.asp: בד"ץ בית יוסף + הרבנות הראשית מעלה אדומים
    cateringTypes: ['meat'], // no dairy items found anywhere on the site
    maxGuests: 300, // unverified estimate - see header comment
    priceFrom: '', // no pricing published anywhere on the site
    packages,
    eventTypes: ['celebration'],
    menuCategories: ['salads', 'starters', 'main_courses', 'hot_sides', 'breads', 'desserts'],
    services: ['vegetarian_food'], // site sells קובה-צמחוני (vegetarian kubbeh) among its best sellers
    phone: '+972-52-8617001',
    whatsapp: '+972528617001',
    email: 'motti.setti@gmail.com',
    website: 'https://m-setti.com/',
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
  console.log(`\nAdded caterer "${record.businessName}" with id ${record.id}, logo, 2 photos, and ${packages.length} formulas.`);
}

main().catch((err) => {
  console.error('Failed to add caterer:', err);
  process.exit(1);
});
