// One-off follow-up script for "דניאל קייטרינג" (scripts/add-daniel-catering.mjs): that script
// noted no usable logo/photo asset had been found on the site at the time. A closer look found:
//   - A real text logo at /image/users/273992/ftp/my_files/sop-resize-200-לוגו בייסיק-1.jpg
//     (the other "logo.png" on the site is a decorative gold monogram flourish, not the wordmark).
//   - A real photo gallery, embedded as 4 iframe "album" widgets on the site's own גלריית-תמונות
//     page (table designs / desserts / centerpieces / wedding - category_ids 374014, 374015,
//     374018, 374019 under depart_id 273992), each rendering images from
//     /image/users/273992/departAlbum/273992/big/<id>.jpg. 6 photos were picked across those
//     albums for variety (food display, two table settings, a decor/candles shot, and the full
//     wedding-hall shot).
// Downloaded locally first (scripts/../scratch not committed), then re-uploaded to this project's
// own Vercel Blob store (not hotlinked from the source site) and saved onto the caterer record.
//
// Usage: node --env-file=.env.local scripts/add-daniel-logo-and-photos.mjs

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

const CATERER_ID = 'E0snlyvmF6';
const OWNER_EMAIL = 'yelotag@gmail.com';
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/1f9923fd-0c01-4535-b016-8cf13ab8d766/scratchpad/daniel-images';

const PHOTO_FILES = ['3601167.jpg', '3601175.jpg', '3601179.jpg', '3601193.jpg', '3601197.jpg', '3601201.jpg'];

async function uploadOne(file, contentType) {
  const buf = await readFile(path.join(SRC_DIR, file));
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  return blob.url;
}

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  const logoUrl = await uploadOne('logo-basic.jpg', 'image/jpeg');
  console.log(`Uploaded logo: ${logoUrl}`);

  const photoUrls = [];
  for (const file of PHOTO_FILES) {
    const url = await uploadOne(file, 'image/jpeg');
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
