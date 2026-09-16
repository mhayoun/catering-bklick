// One-off script: enriches the "קייטרינג Franco" caterer record (added by scripts/add-franco.mjs
// from its cateringisrael.co.il directory listing, which had no city/address, no kashrut level,
// no email/social links, and no logo) with data from the business's own site,
// https://franco-group.co.il/.
//
// Unlike scripts/update-hakatering-hacham-from-site.mjs's source, this site has NO itemized menu
// or priced packages anywhere - its sitemap (page-sitemap.xml) lists exactly one real content
// page beyond the homepage ("מגשי אירוח" / hospitality trays), and that page is pure marketing +
// a lead-gen quote-request form, not a menu. `packages` is therefore deliberately left as-is
// (empty) rather than fabricated - confirmed by reading both the homepage and the trays page's
// full plain-text content, not just an AI summary of them.
//
// Corrections/additions vs. the original directory-sourced record:
// - city/address: were blank - now אשקלון (Ashkelon) / הרצל 5, both stated directly in the
//   site's "בואו לבקר אצלנו" (come visit us) contact section.
// - kashrutLevels: was [] (directory listing said generic "כשר" with no body named). The site
//   repeatedly states "כשרות מהודרת בד״צ בית יוסף ומהדרין" (Mehadrin Beit Yosef Badatz
//   certification) - a specific, named certifying body, unlike the previous two sites in this
//   batch. Set to ['badatz_beit_yosef', 'mehadrin'].
// - email: still blank - none published anywhere on the site (only a phone/WhatsApp contact
//   form, no mailto: link found in the raw HTML of either page checked).
// - website/instagram/facebook: were blank - now filled in from the homepage's own footer icon
//   links (raw hrefs, not paraphrased).
// - whatsapp: was blank - now +972528877679, taken from the homepage's
//   api.whatsapp.com/send?phone= link. NOTE this is a different number from the main phone
//   (072-3318991, kept as `phone`, already correct in the original record) - the site itself
//   uses two distinct numbers for calls vs. WhatsApp, so both are kept as given rather than
//   assumed to be the same.
// - services: gains 'waiter_staff' and 'setup_teardown', both explicitly offered
//   ("שירותי הגשה ודיילים באירוע שלכם", "אופציה לעיצוב וסידור שולחנות").
// - logo: was blank. The site's JSON-LD structured data declares
//   .../2024/09/Screenshot_1.png as the canonical logo, but that file is a solid-white "FRANCO"
//   wordmark meant for a dark background - invisible on this app's light CatererCard background,
//   the exact problem already documented and avoided in scripts/update-tmarim-from-site.mjs for
//   a different caterer's white-on-transparent logo. This site also has a second, actually-used
//   logo file (cropped-לוגו אתר פרנקו אירועים.png, 2250x870) with dark text ("טעמים" / "a world
//   of flavors" / "dairy · asian · fish") on a transparent background - that one is used here
//   instead, since it's legible on both dark and light surfaces.
// - eventTypes/districts/priceFrom/maxGuests/cateringTypes: left unchanged - nothing on this
//   site contradicts or adds confirmed new values beyond what the directory listing already gave
//   (e.g. the site's own FAQ list of event types - עלייה לתורה, מקווה, etc. - has no matching
//   EVENT_TYPES entries beyond what's already set).
//
// Usage: node --env-file=.env.local scripts/update-franco-from-site.mjs

import { readFile } from 'node:fs/promises';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set.');
  process.exit(1);
}

const OWNER_EMAIL = 'yelotag@gmail.com';
const LOGO_PATH =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad/franco-logo-screenshot.png';

async function uploadLogo() {
  const buf = await readFile(LOGO_PATH);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-franco-logo.png`;
  const blob = await put(filename, buf, { access: 'public', contentType: 'image/png' });
  console.log(`Uploaded logo -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'קייטרינג Franco') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "קייטרינג Franco" not found in KV - run add-franco.mjs first.');
    process.exit(1);
  }

  const logoUrl = await uploadLogo();
  const existing = await kv.get(`caterer:${id}`);

  const updated = {
    ...existing,
    city: { he: 'אשקלון', en: 'Ashkelon', fr: 'Ashkelon' },
    address: 'הרצל 5',
    kashrutLevels: ['badatz_beit_yosef', 'mehadrin'], // כשרות מהודרת בד"צ בית יוסף ומהדרין - see header comment
    website: 'https://franco-group.co.il/',
    whatsapp: '+972528877679',
    instagram: 'https://www.instagram.com/franco.events',
    facebook: 'https://www.facebook.com/events.franco',
    services: [...new Set([...(existing.services || []), 'waiter_staff', 'setup_teardown'])],
    logo: logoUrl,
    updatedAt: new Date().toISOString()
  };

  await kv.set(`caterer:${id}`, updated);
  console.log(`\nUpdated caterer "קייטרינג Franco" (${id}) - contact info, kashrut, socials, and logo set. No packages added (site has no published menu/pricing).`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
