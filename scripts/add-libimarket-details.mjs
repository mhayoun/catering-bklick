// One-off script: enriches the "ליבי מרקט" caterer record (added by scripts/add-libimarket.mjs)
// with the fuller detail available on its directory listing at
// https://cateringisrael.co.il/catering-suppliers/ליבי-מרקט/ - logo, cover/gallery photos
// (downloaded locally then re-uploaded to this project's Vercel Blob store, mirroring the
// convention in scripts/add-aleshelzait-photos.mjs), and the listing's own category tags.
//
// Notes on fields that DON'T map onto this platform's taxonomy (lib/constants.js) and were
// therefore left as close as reasonably possible rather than invented:
// - Kashrut: the listing states "לא כשר" (not kosher) - there is no "not kosher" option in
//   KASHRUT_LEVELS, so kashrutLevels stays [] (accurately: no kashrut certification).
// - "סוג אוכל" tags צמחוני / קייטרינג פיצות / קייטרינג קינוחים have no CATERING_TYPES equivalent
//   (only dairy/meat exist) - vegetarian is covered via services (vegetarian_food), pizza/desserts
//   via menuCategories (main_courses/desserts).
// - "סוג אירוע" tags אירוע עסקי / יום הולדת / אירוע קטן / מגשי אירוח לאירועים have no dedicated
//   EVENT_TYPES entry and map to the catch-all 'celebration'.
// - Still no dedicated website, address, or packages/formulas - none are published on the source
//   listing (no "תפריט" content beyond the 3 cover photos already pulled in as gallery photos).
//
// Usage: node --env-file=.env.local scripts/add-libimarket-details.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
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
const SRC_DIR =
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/78156e22-ee4c-49b9-8084-a5b231c687a2/scratchpad/libimarket-photos';

// logo.png uploaded separately as `logo`; the 3 covers become `photos` (first = thumbnail).
const LOGO_FILE = 'logo.png';
const PHOTO_FILES = ['cover1.jpeg', 'cover3.jpeg', 'cover2.jpeg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${file} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'ליבי מרקט') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "ליבי מרקט" not found in KV - run add-libimarket.mjs first.');
    process.exit(1);
  }

  const existing = await kv.get(`caterer:${id}`);

  const logoUrl = await uploadOne(LOGO_FILE, 'image/png');
  const photoUrls = [];
  for (const f of PHOTO_FILES) {
    photoUrls.push(await uploadOne(f, 'image/jpeg'));
  }

  const updated = {
    ...existing,
    logo: logoUrl,
    photos: photoUrls,
    // Confirmed / clarified against the live listing (see notes above for what didn't map):
    cateringTypes: ['dairy'],
    kashrutLevels: [],
    eventTypes: ['brit', 'bar_mitzvah', 'henna', 'shabbat_chatan', 'celebration'],
    menuCategories: ['main_courses', 'desserts'],
    services: ['vegetarian_food', 'gluten_free_options'],
    maxGuests: 100,
    priceFrom: 108,
    updatedAt: new Date().toISOString()
  };

  await kv.set(`caterer:${id}`, updated);
  console.log(`\nUpdated caterer "ליבי מרקט" (${id}): logo + ${photoUrls.length} photos + category tags.`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
