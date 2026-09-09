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

// The search page's own filter predicate - whether caterer `c` satisfies every active filter in
// `f`. Pure/no server-only imports, so it's shared as-is between the API route (lib/store.js) and
// client-side filtering/facet-count simulation on the search page - one definition, so the two
// can never quietly drift apart.
export function matchesFilters(c, f) {
  const { cDistricts, cKashrutLevels, cCateringTypes } = getCodedFields(c);

  const keywordTerms = parseKeywords(f.keyword);
  if (keywordTerms.length > 0) {
    const haystack = buildCatererHaystack(c, f.locale || 'he');
    const ok = keywordTerms.some((term) => countOccurrences(haystack, term) > 0);
    if (!ok) return false;
  }
  if (f.districts?.length) {
    const ok = f.districts.some((d) => cDistricts.includes(d));
    if (!ok) return false;
  }
  if (f.kashrutLevels?.length) {
    const ok = f.kashrutLevels.some((k) => cKashrutLevels.includes(k));
    if (!ok) return false;
  }
  if (f.cateringTypes?.length) {
    const ok = f.cateringTypes.some((t) => cCateringTypes.includes(t));
    if (!ok) return false;
  }
  if (f.eventTypes?.length) {
    // Match if the caterer itself is tagged, OR any individual package/formula is - a caterer
    // can offer a package for an event type without tagging the whole business with it.
    const packageEventTypes = (c.packages || []).flatMap((p) => p.eventTypes || []);
    const ok = f.eventTypes.some((e) => (c.eventTypes || []).includes(e) || packageEventTypes.includes(e));
    if (!ok) return false;
  }
  if (f.minGuests && Number(c.maxGuests) < Number(f.minGuests)) return false;
  if (f.maxMinOrder) {
    const packages = c.packages || [];
    // No packages set up yet - order minimum is unknown, don't exclude the caterer.
    if (packages.length > 0) {
      const ok = packages.some((p) => !p.minGuests || Number(p.minGuests) <= Number(f.maxMinOrder));
      if (!ok) return false;
    }
  }
  if (f.menuCategories?.length) {
    const ok = f.menuCategories.every((m) => (c.menuCategories || []).includes(m));
    if (!ok) return false;
  }
  if (f.alaCarteCategories?.length) {
    // Deep match, same shape as eventTypes above: an à-la-carte package's items each carry their
    // own categoryId (see ALACARTE_CATEGORIES in lib/constants.js), so this has to look inside
    // every package's addons rather than a caterer-level tag - a profile-level flag here could
    // claim a category with zero matching items actually listed.
    const itemCategoryIds = (c.packages || [])
      .filter((p) => p.type === 'a_la_carte')
      .flatMap((p) => p.addons || [])
      .map((a) => a.categoryId)
      .filter(Boolean);
    const ok = f.alaCarteCategories.some((cat) => itemCategoryIds.includes(cat));
    if (!ok) return false;
  }
  if (f.services?.length) {
    const ok = f.services.every((s) => (c.services || []).includes(s));
    if (!ok) return false;
  }
  return true;
}

// Applies one filter-sidebar click to a filters object, without mutating it - a checkbox facet
// (districts, kashrutLevels, cateringTypes, eventTypes, menuCategories, alaCarteCategories,
// services) toggles `value` in/out of that key's array; a radio facet (minGuests, maxMinOrder)
// replaces the key's single value, clearing it if `value` was already selected. Used both by
// FilterSidebar's actual click handlers and by the search page's facet-count simulation (“if this
// were also clicked, how many results?”), so the two can never disagree about what a click does.
const RADIO_FILTER_KEYS = ['minGuests', 'maxMinOrder'];
export function toggleFilterValue(filters, key, value) {
  if (RADIO_FILTER_KEYS.includes(key)) {
    return { ...filters, [key]: filters[key] === value ? '' : value };
  }
  const set = new Set(filters[key]);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return { ...filters, [key]: Array.from(set) };
}

// Searchable text scoped to one specific package - the caterer's shared fields (so a match in
// the business description/kashrut/etc. still counts toward every one of its formulas) plus
// that package's own name/items/addons/event types, all in a single display locale.
export function buildPackageHaystack(c, pkg, locale) {
  const parts = [...catererSharedFields(c, locale), ...packageOwnFields(pkg, locale)];
  return parts.filter(Boolean).join(' ').toLowerCase();
}
