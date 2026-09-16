// Scans every caterer for {he,en,fr} fields (package names, categoryItems, addon names) that are
// missing en and/or fr, and prints every unique Hebrew string not already covered by
// scripts/i18n/translations-dict.mjs - grouped by caterer, in DB order, so translation work can
// proceed caterer-by-caterer without re-listing strings already translated in an earlier batch.
//
// Usage: node --env-file=.env.local scripts/i18n/dump-remaining.mjs [--limit=N]

import { kv } from '@vercel/kv';
import { T } from './translations-dict.mjs';

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const ids = await kv.smembers('caterers:index');
let shown = 0;
for (const id of ids) {
  if (shown >= limit) break;
  const c = await kv.get(`caterer:${id}`);
  if (!c) continue;
  const set = new Set();
  for (const pkg of c.packages || []) {
    if (pkg.name?.he && (!pkg.name.en || !pkg.name.fr) && !T[pkg.name.he]) set.add(pkg.name.he);
    for (const cat of Object.keys(pkg.categoryItems || {})) {
      for (const item of pkg.categoryItems[cat] || []) {
        if (item.he && (!item.en || !item.fr) && !T[item.he]) set.add(item.he);
      }
    }
    for (const addon of pkg.addons || []) {
      if (addon.name?.he && (!addon.name.en || !addon.name.fr) && !T[addon.name.he]) set.add(addon.name.he);
    }
  }
  if (set.size === 0) continue;
  shown++;
  console.log(`\n=== ${c.businessName} (${id}) - ${set.size} need translation ===`);
  for (const s of set) console.log(s);
}
if (shown === 0) console.log('Nothing left to translate.');
