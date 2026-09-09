// One-off follow-up to scripts/add-hazen.mjs + scripts/add-hazen-formulas-logo-photos.mjs. The
// user pointed at 19 links from the site's own "השירותים שלנו" page (event-type and
// service-area SEO landing pages, e.g. קייטרינג-בצפון, אוכל-מוכן-בפתח-תקווה, קייטרינג-לאירוסין,
// קייטרינג-לראש-השנה). Checked a sample of these directly (קייטרינג בצפון, אוכל מוכן לשבת,
// already-checked קייטרינג לאזכרה) - all are generic SEO/marketing filler pointing back to the
// same single order-form menu (already modeled as the 'event-order-menu' package), not separate
// menus. Nothing there to add as new packages.
//
// Two real facts do fall out of that link list that weren't on the record yet:
//   - eventTypes: קייטרינג-לאירוסין (engagement) and קייטרינג-לראש-שנה (Rosh Hashana) are
//     explicit, named pages - 'engagement' and 'rosh_hashana' both exist in EVENT_TYPES and
//     weren't set. (חתונה קטנה/אירועים קטנים/סוכות/שמחת תורה don't have their own EVENT_TYPES
//     slot - left under the existing 'celebration' catch-all rather than inventing new values.)
//   - districts: קייטרינג-בצפון, אוכל-מוכן-בפתח-תקווה (Petah Tikva = center) and קייטרינג-בחדרה
//     (Hadera = haifa district) are explicit named service-area pages, alongside the existing
//     קייטרינג-בירושלים - so the caterer serves more than just 'jerusalem'.
//
// Usage: node --env-file=.env.local scripts/fix-hazen-districts-eventtypes.mjs

import { kv } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_ID = 'iSJLOKh58c';
const ADD_EVENT_TYPES = ['engagement', 'rosh_hashana'];
const ADD_DISTRICTS = ['north', 'center', 'haifa'];

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  for (const t of ADD_EVENT_TYPES) {
    if (!record.eventTypes.includes(t)) record.eventTypes.push(t);
  }
  for (const d of ADD_DISTRICTS) {
    if (!record.districts.includes(d)) record.districts.push(d);
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): eventTypes = [${record.eventTypes.join(', ')}], districts = [${record.districts.join(', ')}].`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
