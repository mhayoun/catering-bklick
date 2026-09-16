// One-off follow-up to scripts/add-scoop.mjs, per user request: "extract the logo and insert
// formules like אוכל מוכן לשבת חגים".
//
// Logo: add-scoop.mjs originally left logo blank because the only <img alt="logo"> asset on the
// site is a purely decorative gold swirl/flourish graphic (extracted from an inline SVG's
// base64-embedded PNG at /images/logo/logo.svg) with no wordmark, and the site's favicon.ico is
// the framework's generic default document icon - neither is a real brand mark. Per this
// follow-up request the decorative swirl is used anyway, since it is literally what the site
// itself renders as its "logo" element in the header.
//
// Packages: the site's own top nav splits ordering into two entries - "אוכל מוכן לשבת" (running
// at /OurMenu?HolMenue=שבת) and "חגים" (a submenu, currently active entry "שבת ויום כיפור" at
// /OurMenu?HolMenue=שבת ויום כיפור, all other named holidays e.g. סוכות/פסח/שבועות marked
// "(לא פעיל)" i.e. out of season/inactive). Checked both live: they render the exact same six
// product categories (ids 2-6, 9) with the exact same items and prices - the site does not
// publish a separate holiday-specific menu or a different bundle/package price, just the same
// per-item catalog re-labeled for the holiday delivery date. Rather than one generic
// "ready-food-catalog" package (as originally added), this replaces it with two identically-
// priced a_la_carte packages named after the site's own two real nav entries, so the listing
// mirrors how the business itself presents its ordering flow - not a fabricated bundle price.
//
// Usage: node --env-file=.env.local scripts/fix-scoop-logo-and-holiday-package.mjs

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

const CATERER_ID = 'PoTelhGays';
const OWNER_EMAIL = 'yelotag@gmail.com';
const SCRATCH = '/tmp/claude-1001/-home-moshe-mydev-catering-catering-bklick/dd7c3c19-a0ef-43c3-892c-3b871e78b18b/scratchpad';
const LOGO_PATH = `${SCRATCH}/scoop-photos/logo.png`;

async function uploadOne(filePath, contentType) {
  const buf = await readFile(filePath);
  const filename = `caterers/${OWNER_EMAIL}/${Date.now()}-${path.basename(filePath)}`;
  const blob = await put(filename, buf, { access: 'public', contentType });
  console.log(`Uploaded ${path.basename(filePath)} -> ${blob.url}`);
  return blob.url;
}

async function main() {
  const record = await kv.get(`caterer:${CATERER_ID}`);
  if (!record) {
    console.error(`Caterer ${CATERER_ID} not found in KV.`);
    process.exit(1);
  }

  record.logo = await uploadOne(LOGO_PATH, 'image/png');

  const oldPkg = record.packages.find((p) => p.id === 'ready-food-catalog');
  if (!oldPkg) {
    console.error("Expected package 'ready-food-catalog' not found - aborting to avoid guessing.");
    process.exit(1);
  }

  const shabbatPkg = {
    ...oldPkg,
    id: 'shabbat-ready-food',
    name: { he: 'אוכל מוכן לשבת', en: '', fr: '' },
    addons: oldPkg.addons.map((a) => ({ ...a, id: nanoid(8) })),
    sourceUrl: 'https://www.scoopcatering.com/OurMenu?HolMenue=%D7%A9%D7%91%D7%AA'
  };
  const holidayPkg = {
    ...oldPkg,
    id: 'holiday-ready-food',
    name: { he: 'אוכל מוכן לחגים', en: '', fr: '' },
    addons: oldPkg.addons.map((a) => ({ ...a, id: nanoid(8) })),
    sourceUrl: 'https://www.scoopcatering.com/OurMenu?HolMenue=%D7%A9%D7%91%D7%AA%20%D7%95%D7%99%D7%95%D7%9D%20%D7%9B%D7%99%D7%A4%D7%95%D7%A8'
  };

  record.packages = [shabbatPkg, holidayPkg];
  record.updatedAt = new Date().toISOString();

  await kv.set(`caterer:${CATERER_ID}`, record);
  console.log(`Updated caterer "${record.businessName}" (${CATERER_ID}): logo set, packages = [${record.packages.map((p) => p.name.he).join(', ')}] (${record.packages[0].addons.length} items each).`);
}

main().catch((err) => {
  console.error('Failed to update caterer:', err);
  process.exit(1);
});
