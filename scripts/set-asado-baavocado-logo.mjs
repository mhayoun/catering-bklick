// One-off script: sets the `logo` field on the "אסאדו באבוקדו" caterer record (added by
// scripts/add-asado-baavocado.mjs with logo left blank, since its original cateringisrael.co.il
// directory listing had no business-specific logo).
//
// Logo sourced from the business's own site, https://www.asado10.com/ - extracted from the
// header's <img> (Wix media id 73e8fa_6a73bf848abe448ab0aebc679e07f09d), 637x209 PNG with a
// transparent background. Verified against a live browser screenshot of the site (zoomed crop of
// the rendered header) to confirm the downloaded file's orientation matches the on-site rendering
// pixel-for-pixel - it is not mirrored. Uploaded as-is (not re-encoded to JPEG like the in-app
// dashboard logo upload does) to preserve transparency: the orange/red lettering reads fine on
// both the site's dark navbar and this app's light CatererCard background, unlike the all-white
// logo skipped in scripts/update-tmarim-from-site.mjs. Already fits within the app's
// LOGO_WIDTH x LOGO_HEIGHT (796x476) cap, so no resize was needed.
//
// Usage: node --env-file=.env.local scripts/set-asado-baavocado-logo.mjs

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
  '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/f85bd78d-d39e-424b-a404-2e38a8aa778a/scratchpad/asado-logo.png';

async function main() {
  const ids = await kv.smembers('caterers:index');
  let id = null;
  for (const cid of ids) {
    const c = await kv.get(`caterer:${cid}`);
    if (c?.businessName === 'אסאדו באבוקדו') {
      id = cid;
      break;
    }
  }
  if (!id) {
    console.error('Caterer "אסאדו באבוקדו" not found in KV - run add-asado-baavocado.mjs first.');
    process.exit(1);
  }

  const buf = await readFile(LOGO_PATH);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-asado-baavocado-logo.png`;
  const blob = await put(filename, buf, { access: 'public', contentType: 'image/png' });
  console.log(`Uploaded logo -> ${blob.url}`);

  const existing = await kv.get(`caterer:${id}`);
  const updated = { ...existing, logo: blob.url, updatedAt: new Date().toISOString() };

  await kv.set(`caterer:${id}`, updated);
  console.log(`Set logo on caterer "אסאדו באבוקדו" (${id}).`);
}

main().catch((err) => {
  console.error('Failed to set logo:', err);
  process.exit(1);
});
