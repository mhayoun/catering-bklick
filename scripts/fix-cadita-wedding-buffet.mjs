// One-off fix: the "בופה חתונה" (Wedding Buffet) formula for כדיתה - קייטרינג חלבי גורמה
// (caterer id 22vgLjRkR5) lists desserts/breads/beverages_non_alcoholic in includedCategories
// but has no categoryItems for them, even though the source page does mention them (as generic
// category blurbs, not itemized lists - the site itself doesn't break these into individual dishes).
// Source: https://www.cadita.com/תפריט_חתונה/
//   "קינוחים משובחים מעוררי תיאבון כיד המלך" (desserts)
//   "עמדת שתייה חמה" + "שתייה קרה" (beverages_non_alcoholic)
//   "לחמים" (breads)
import { kv } from '@vercel/kv';

const CATERER_ID = '22vgLjRkR5';

function randId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function item(he, en, fr) {
  return { id: randId(), he, en, fr };
}

const rec = await kv.get(`caterer:${CATERER_ID}`);
if (!rec) throw new Error('caterer not found');

const pkg = rec.packages.find((p) => p.name.he === 'בופה חתונה');
if (!pkg) throw new Error('package not found');

pkg.categoryItems.desserts = [
  item(
    'קינוחים משובחים מעוררי תיאבון כיד המלך',
    'Fine desserts fit for a king',
    'Desserts raffinés dignes d’un roi'
  )
];
pkg.categoryItems.breads = [item('לחמים', 'Breads', 'Pains')];
pkg.categoryItems.beverages_non_alcoholic = [
  item('עמדת שתייה חמה', 'Hot beverage station', 'Stand boissons chaudes'),
  item('שתייה קרה', 'Cold drinks', 'Boissons fraîches')
];

await kv.set(`caterer:${CATERER_ID}`, rec);
console.log('Updated', rec.businessName, '-', pkg.name.he);
console.log(JSON.stringify(pkg.categoryItems, null, 2));
