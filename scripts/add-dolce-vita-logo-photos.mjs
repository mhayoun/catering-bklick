// One-off follow-up to scripts/add-dolce-vita.mjs + scripts/add-dolce-vita-formulas.mjs for
// "דולצ'ה ויטה" (id -nQObDT0jq). The first script found no usable logo (described the header
// logo as unreadable white-on-white) and no gallery photos (JS lightbox). Re-checked directly:
// the header <img> at /media/main/קייטרינג-חלבי.jpg is in fact a normal dark-on-white wordmark
// ("דולצ'ה ויטה - קייטרינג | מגשי אירוח | אירועים") - fully legible, just mislabeled by its own
// alt text. Used as the logo.
//
// No new formula content was found beyond the existing 'shop-catalog' a_la_carte package: the
// /תפריטים-לדוגמא/ page still has zero real product markup (confirmed again - same conclusion as
// the original script), and the dedicated /גלריית-תמונות/ page's images are unrelated
// shutterstock stock photography, not real event photos. Real photography does exist, though -
// each dairy catalog item on /מגשי-אירוח-חלבי/ has its own real product photo
// (/media/main/<dish>.jpg, /media/small/<dish>.jpg thumbnails). 5 of the /media/main/ hero shots
// were picked for variety (fruit platter, parmesan pastry twists, cheese sandwich tray, mini choux
// pastries, petit fours) - all visually confirmed dairy/pareve, consistent with this caterer's
// cateringTypes (['dairy'] only).
//
// Usage: node --env-file=.env.local scripts/add-dolce-vita-logo-photos.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set.');
  process.exit(1);
}

const CATERER_ID = '-nQObDT0jq';
const OWNER_EMAIL = 'yelotag@gmail.com';
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/1f9923fd-0c01-4535-b016-8cf13ab8d766/scratchpad/dolcevita-images';

const PHOTO_FILES = ['main1.jpg', 'main2.jpg', 'main3.png', 'main4.jpg', 'main5.jpg'];
const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

async function uploadOne(file) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const ext = path.extname(file).toLowerCase();
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType: CONTENT_TYPES[ext] });
  return blob.url;
}

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const logoUrl = await uploadOne('logo.jpg');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file);
    photoUrls.push(url);
    console.log(`Uploaded photo: ${url}`);
  }

  record.logo = logoUrl;
  record.photos = [...(record.photos || []), ...photoUrls];
  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): logo set, ${photoUrls.length} photo(s) added (${record.photos.length} total).`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
