// Pure text-search helpers shared between the server-side ranking in lib/store.js
// and client-side rendering (match-count badges, yellow highlighting on the
// profile page). No KV/server-only imports here - safe to import from 'use client'
// components as well as from lib/store.js.

// Free-text field (string or {he,en,fr}) -> the text for one specific locale, with the same
// locale → he → en → fr fallback used everywhere else content is displayed (lib/localized.js's
// pickLocalized). Kept locale-scoped rather than joining all three languages together: a match
// that only exists in a language the visitor isn't viewing can never actually be highlighted for
// them, so counting/searching it would produce a "N matches" badge with nothing visible to show for it.
export function localizedText(value, locale) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.he || value.en || value.fr || '';
}

// Constant codes are stored as snake_case (e.g. 'badatz_rav_machpud', 'bar_mitzvah') - turn
// the underscores into spaces so a keyword search for "Badatz Rav Machpud" or "Bar Mitzvah" matches.
export function normalizeCode(code) {
  return String(code).replace(/_/g, ' ');
}

// Case-insensitive count of every (possibly overlapping-free, left-to-right) occurrence of
// `needle` inside `haystack`. Returns 0 for an empty needle/haystack.
export function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count++;
    idx += n.length;
  }
  return count;
}

// Splits a search box's raw input into individual search terms - comma and/or whitespace
// separated (e.g. "maroc, badatz mehadrin" -> ['maroc', 'badatz', 'mehadrin']).
export function parseKeywords(input) {
  if (!input) return [];
  return input
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Total match count across every term - a caterer/formula matching more of the typed terms
// (or the same term more times) ranks higher. A single term behaves exactly like countOccurrences.
export function countOccurrencesMulti(haystack, terms) {
  return terms.reduce((sum, term) => sum + countOccurrences(haystack, term), 0);
}

// Districts/kashrut/catering-type, with the legacy singular-field fallback for older records.
export function getCodedFields(c) {
  return {
    cDistricts: c.districts || (c.district ? [c.district] : []),
    cKashrutLevels: c.kashrutLevels || (c.kashrut ? [c.kashrut] : []),
    cCateringTypes: c.cateringTypes || (c.cateringType ? [c.cateringType] : [])
  };
}

// Fields shared by every one of a caterer's packages/formulas - business identity and
// business-wide tags, as opposed to a single package's own name/items/addons.
function catererSharedFields(c, locale) {
  const { cDistricts, cKashrutLevels, cCateringTypes } = getCodedFields(c);
  return [
    c.businessName,
    localizedText(c.description, locale),
    localizedText(c.city, locale),
    c.address,
    c.phone,
    c.whatsapp,
    c.email,
    ...cDistricts.map(normalizeCode),
    ...cKashrutLevels.map(normalizeCode),
    ...cCateringTypes.map(normalizeCode),
    ...(c.eventTypes || []).map(normalizeCode),
    ...(c.menuCategories || []).map(normalizeCode),
    ...(c.services || []).map(normalizeCode)
  ];
}

function packageOwnFields(pkg, locale) {
  return [
    localizedText(pkg.name, locale),
    ...(pkg.eventTypes || []).map(normalizeCode),
    ...(pkg.addons || []).map((a) => localizedText(a.name, locale)),
    ...Object.values(pkg.categoryItems || {}).flatMap((items) => (items || []).map((it) => localizedText(it, locale)))
  ];
}

// Full searchable text for a caterer, across the caterer itself and every one of its packages,
// scoped to a single display locale so matches always correspond to what can be highlighted.
export function buildCatererHaystack(c, locale) {
  const parts = [...catererSharedFields(c, locale), ...(c.packages || []).flatMap((p) => packageOwnFields(p, locale))];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

// Searchable text scoped to one specific package - the caterer's shared fields (so a match in
// the business description/kashrut/etc. still counts toward every one of its formulas) plus
// that package's own name/items/addons/event types, all in a single display locale.
export function buildPackageHaystack(c, pkg, locale) {
  const parts = [...catererSharedFields(c, locale), ...packageOwnFields(pkg, locale)];
  return parts.filter(Boolean).join(' ').toLowerCase();
}
