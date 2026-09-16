// Applies scripts/i18n/translations-dict.mjs to every caterer in the database: for every
// {he,en,fr} field (package name, categoryItems dish name, addon name) whose he text is a key in
// the dictionary, fills/overwrites en and fr. Only writes a caterer record back to KV if at
// least one field actually changed. Safe to re-run repeatedly as the dictionary grows (idempotent
// - unchanged fields are skipped, not re-written).
//
// Usage: node --env-file=.env.local scripts/i18n/apply-all-translations.mjs

import { kv } from '@vercel/kv';
import { T } from './translations-dict.mjs';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

function apply(field) {
  if (!field?.he) return false;
  const t = T[field.he];
  if (!t) return false;
  const [en, fr] = t;
  if (field.en === en && field.fr === fr) return false;
  field.en = en;
  field.fr = fr;
  return true;
}

async function main() {
  const ids = await kv.smembers('caterers:index');
  let caterersChanged = 0;
  let fieldsChanged = 0;

  for (const id of ids) {
    const record = await kv.get(`caterer:${id}`);
    if (!record) continue;

    let changed = 0;
    for (const pkg of record.packages || []) {
      if (apply(pkg.name)) changed++;
      for (const cat of Object.keys(pkg.categoryItems || {})) {
        for (const item of pkg.categoryItems[cat] || []) {
          if (apply(item)) changed++;
        }
      }
      for (const addon of pkg.addons || []) {
        if (apply(addon.name)) changed++;
      }
    }

    if (changed > 0) {
      record.updatedAt = new Date().toISOString();
      await kv.set(`caterer:${id}`, record);
      caterersChanged++;
      fieldsChanged += changed;
      console.log(`"${record.businessName}" (${id}): ${changed} fields updated.`);
    }
  }

  console.log(`\nDone: ${caterersChanged} caterers updated, ${fieldsChanged} fields total.`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
