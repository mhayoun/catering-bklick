// One-off fix: the "ארוחת בסיס" (Base Package) formula for כדיתה - קייטרינג חלבי גורמה
// (caterer id 22vgLjRkR5) has no sourceUrl, unlike its other two packages.
// Source: https://www.cadita.com/תפריט_חתונה/ (same wedding-menu page as the "בופה חתונה" package).
//
// Usage: node --env-file=.env.local scripts/fix-cadita-base-package-source.mjs
import { kv } from '@vercel/kv';

const CATERER_ID = '22vgLjRkR5';

const rec = await kv.get(`caterer:${CATERER_ID}`);
if (!rec) throw new Error('caterer not found');

const pkg = rec.packages.find((p) => p.id === 'base');
if (!pkg) throw new Error('package not found');

pkg.sourceUrl = 'https://www.cadita.com/תפריט_חתונה/';

await kv.set(`caterer:${CATERER_ID}`, rec);
console.log('Updated base package sourceUrl for', CATERER_ID);
