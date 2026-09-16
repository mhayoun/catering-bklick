// One-off script: sets the `logo` field on the "אלדברי קייטרינג" caterer record, sourced from
// its own site, https://www.elderberrycatering.com/.
//
// Unlike the other update-*-from-site.mjs scripts in this directory, there is no corresponding
// add-elderberry.mjs here - this record (id DrFYOkssTz) was already present in KV with
// reviewedBy/ownerEmail both set to yelotag@gmail.com (i.e. created directly, not via a saved
// one-off script), already carrying a correct website field, phone, whatsapp, city and
// kashrutLevels.
//
// The site itself (checked via its page-sitemap.xml, which lists exactly 4 real pages - home,
// contact, a thank-you page, and an HTML sitemap - versus 7 separate post-sitemaps of blog
// content) is almost entirely a single long marketing homepage plus a very large SEO blog (the
// homepage embeds ~150 blog-post-title teasers, e.g. "מנות פתיחה שידהימו את האורחים", "קייטרינג
// חלבי לאירוע קליל" - these are blog article titles, not descriptions of this business's own
// menu, and are deliberately NOT used as a basis for any field below). No itemized menu, no
// priced packages, and no `menu2021`-style downloadable order form exist anywhere on the site -
// confirmed by reading the full plain-text content of the homepage, not just an AI summary of
// it. `packages` is therefore NOT touched here (stays empty, same reasoning as
// scripts/update-franco-from-site.mjs).
//
// Verified against the existing record (all match, nothing corrected):
// - phone: only one real tel: link exists on the whole site, tel:0723909716, matching the
//   existing record exactly. (The page's own visible text also shows a second number,
//   0733328700, in a lower "quick contact" block, but it is plain text with no tel: href behind
//   it and contradicts the site's own JSON-LD `telephone` field, which also says "0723909716" -
//   treated as a template leftover, not a real second contact number, and not added anywhere.)
// - whatsapp: https://wa.me/972546272421 button, matching the existing +972546272421 exactly.
// - city: the site's own JSON-LD confirms Modi'in-area service (blog post "קייטרינג במודיעין
//   כשר למהדרין"), matching the existing city field.
// - kashrutLevels: hero text states "קייטרינג כשר למהדרין (בד״ץ העדה החרדית ירושלים)" verbatim,
//   matching the existing ['badatz_eda_chareidis', 'mehadrin'] exactly.
// - No address, Instagram, or Facebook found anywhere on the site (no instagram.com/facebook.com
//   links in the raw HTML at all) - existing blanks left as-is rather than guessed.
//
// logo: was blank - the site's own JSON-LD organization schema declares a logo image
// (.../2022/12/symbol-g85dd1d125_1280-1.jpg - a stock-sounding filename, but the image itself is
// the real wordmark: "קייטרינג" over "ELDERBERRY" in black on white, 250x123, no larger version
// found anywhere on the site). White background rather than transparent (it's a plain JPEG), but
// legible on this app's light CatererCard background, so used as-is.
//
// Usage: node --env-file=.env.local scripts/update-elderberry-from-site.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad/elderberry-logo-candidate.jpg';

async function uploadLogo() {
  const buf = await readFile(LOGO_PATH);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-elderberry-logo.jpg`;
  const blob = await put(filename, buf, { access: 'public', contentType: 'image/jpeg' });
  console.log(`Uploaded logo -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'אלדברי קייטרינג') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "אלדברי קייטרינג" not found in KV.');
    process.exit(1);
  }

  const logoUrl = await uploadLogo();
  const existing = await kv.get(`caterer:${id}`);

  const updated = { ...existing, logo: logoUrl, updatedAt: new Date().toISOString() };

  await kv.set(`caterer:${id}`, updated);
  console.log(`\nSet logo on caterer "אלדברי קייטרינג" (${id}). No other fields changed - see header comment.`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
