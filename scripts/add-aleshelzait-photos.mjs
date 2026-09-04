// One-off script: uploads a handful of images extracted from aleshelzait.co.il
// (logo + gallery/hero photos) to this project's Vercel Blob store, then updates the
// "קייטרינג עלה של זית" caterer record (added by scripts/add-aleshelzait.mjs) with the
// resulting Blob URLs in its `photos` array - mirroring the same upload convention used
// by app/api/upload/route.js (`caterers/{ownerEmail}/{timestamp}-{filename}`).
//
// Photos with an identifiable bystander or a client's private child's name on a custom
// cake were deliberately excluded from the source gallery.
//
// Usage: node --env-file=.env.local scripts/add-aleshelzait-photos.mjs

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

const CATERER_ID = process.argv[2];
if (!CATERER_ID) {
  console.error('Usage: node --env-file=.env.local scripts/add-aleshelzait-photos.mjs <catererId>');
  process.exit(1);
}

const OWNER_EMAIL = 'yelotag@gmail.com';
const SRC_DIR = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f3e7a2f9-f7bb-4ee7-9893-8658b86adde5/scratchpad/aleshelzait-photos';

// Order matters: first entry is used as the caterer's thumbnail/cover photo.
const FILES = ['gallery1.jpg', 'gallery4.jpg', 'hero.jpg', 'gallery2.jpg', 'logo.jpg'];

async function main() {
  const existing = await kv.get(`caterer:${CATERER_ID}`);
  if (!existing) {
    console.error(`No caterer found with id ${CATERER_ID}`);
    process.exit(1);
  }

  const urls = [];
  for (const file of FILES) {
    const buf = await readFile(path.join(SRC_DIR, file));
    const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${file}`;
    const blob = await put(filename, buf, { access: 'public', contentType: 'image/jpeg' });
    urls.push(blob.url);
    console.log(`Uploaded ${file} -> ${blob.url}`);
  }

  const updated = { ...existing, photos: urls, updatedAt: new Date().toISOString() };
  await kv.set(`caterer:${CATERER_ID}`, updated);
  console.log(`\nUpdated caterer ${CATERER_ID} with ${urls.length} photos.`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
