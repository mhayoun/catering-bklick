// One-off follow-up script: the user asked to reflect "דניאל קייטרינג"'s equipment/textile
// rental page (https://www.cateringbadatz.com/השכרת-ציוד-לאירועים.html) somewhere on its caterer
// record. That page has no food menu and no per-item prices (tablecloths, napkins, chair covers,
// candelabras, glassware, dishware, cutlery, furniture, serving accessories - all quote-only), so
// it doesn't fit either package type this schema supports (formula = food-category menu,
// a_la_carte = priced food-item catalog) - per the user's own choice, this is NOT modeled as a
// package. Instead:
//   1. The description gets a real sentence about the equipment/textile rental service, with the
//      page's own URL included as requested.
//   2. `services` gains 'setup_teardown' (furniture/decor setup - the closest real match in
//      ADDITIONAL_SERVICES to what that page actually offers), alongside the elegant_tableware
//      tag already set by scripts/add-daniel-catering.mjs.
//
// Usage: node --env-file=.env.local scripts/add-daniel-equipment-rental.mjs

import { kv } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'E0snlyvmF6';
const EQUIPMENT_URL = 'https://www.cateringbadatz.com/%D7%94%D7%A9%D7%9B%D7%A8%D7%AA%2D%D7%A6%D7%99%D7%95%D7%93%2D%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D.html';

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  record.description.he +=
    ` מציעים גם מחלקת השכרת ציוד וטקסטיל עשירה לאירועים (מפות, כיסויי כיסאות, מרכזי שולחן, כלי אוכל, ריהוט ועוד) - לפרטים: ${EQUIPMENT_URL}`;
  record.description.en +=
    ` They also offer a rich event equipment and textile rental department (tablecloths, chair covers, table centerpieces, tableware, furniture and more) - details: ${EQUIPMENT_URL}`;
  record.description.fr +=
    ` Ils proposent également un vaste service de location de matériel et de linge pour événements (nappes, housses de chaise, centres de table, vaisselle, mobilier, etc.) - détails : ${EQUIPMENT_URL}`;

  if (!record.services.includes('setup_teardown')) {
    record.services.push('setup_teardown');
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): description enriched with equipment rental info, services now: ${record.services.join(', ')}.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
