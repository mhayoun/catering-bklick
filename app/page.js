'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { FilterSidebar } from '../components/FilterSidebar';
import { CatererCard } from '../components/CatererCard';
import { FormulaCard } from '../components/FormulaCard';
import { Spinner } from '../components/Spinner';
import {
  buildCatererHaystack,
  buildPackageHaystack,
  countOccurrencesMulti,
  matchesFilters,
  parseKeywords,
  toggleFilterValue
} from '../lib/search';
import {
  DISTRICTS,
  KASHRUT_LEVELS,
  CATERING_TYPES,
  EVENT_TYPES,
  MENU_CATEGORIES,
  ALACARTE_CATEGORIES,
  ADDITIONAL_SERVICES,
  GUEST_COUNT_BRACKETS,
  MIN_ORDER_BRACKETS
} from '../lib/constants';

// One entry per checkbox facet: [filters key, its full option list, match mode]. Match mode has
// to mirror matchesFilters() in lib/search.js exactly, since it decides how each option's count
// is simulated below:
//   - 'or'  (districts/kashrutLevels/cateringTypes/eventTypes/alaCarteCategories): a caterer needs
//     ANY selected value. Selecting a second option in the same facet only ever ADDS caterers, so
//     an option's count is shown on its own (as if it were the only one picked) - otherwise
//     checking "בשרי" then "חלבי" would make "חלבי (26)" look like "26 dairy caterers" when only
//     12 actually are, the other 14 being meat caterers pulled in by the OR with "בשרי".
//   - 'and' (menuCategories/services): a caterer needs EVERY selected value. Here a second
//     selection only ever narrows, which is what people expect a checkbox count to mean - so an
//     option's count is shown compounded with whatever else is already checked in that facet.
const CHECKBOX_FACETS = [
  ['districts', DISTRICTS, 'or'],
  ['cateringTypes', CATERING_TYPES, 'or'],
  ['kashrutLevels', KASHRUT_LEVELS, 'or'],
  ['eventTypes', EVENT_TYPES, 'or'],
  ['menuCategories', MENU_CATEGORIES, 'and'],
  ['alaCarteCategories', ALACARTE_CATEGORIES, 'or'],
  ['services', ADDITIONAL_SERVICES, 'and']
];

const EMPTY_FILTERS = {
  keyword: '',
  districts: [],
  kashrutLevels: [],
  cateringTypes: [],
  eventTypes: [],
  minGuests: '',
  maxMinOrder: '',
  menuCategories: [],
  alaCarteCategories: [],
  services: []
};

export default function HomePage() {
  const { dict, t, locale } = useLanguage();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchMode, setSearchMode] = useState('caterers');
  // The full approved catalog, fetched once - small enough (well under a hundred caterers) that
  // every filter change/facet count is just a synchronous pass over it in the browser, instead of
  // a network round-trip per click.
  const [allCaterers, setAllCaterers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/caterers')
      .then((r) => r.json())
      .then((data) => setAllCaterers(data.results || []))
      .finally(() => setLoading(false));
  }, []);

  // When an event-type filter is active, only packages individually tagged with one of the
  // selected event types are kept (the caterer-level match in searchCaterers is broader - it
  // also passes a caterer whose OTHER packages carry the tag, so this narrows back down to just
  // the matching ones).
  const keyword = filters.keyword?.trim();
  const keywordTerms = useMemo(() => parseKeywords(keyword), [keyword]);

  // filters as the search API/matchesFilters expect them - keyword matching is locale-scoped
  // (see lib/search.js), but locale lives in LanguageProvider rather than filter state.
  const activeFilters = useMemo(() => ({ ...filters, locale }), [filters, locale]);

  // Same ranking searchCaterers() used to do server-side (lib/store.js) - kept here so a keyword
  // still surfaces the most-mentioned caterers first, just computed client-side now.
  const results = useMemo(() => {
    const filtered = allCaterers.filter((c) => matchesFilters(c, activeFilters));
    if (keywordTerms.length === 0) return filtered;
    return filtered
      .map((c) => ({ ...c, matchCount: countOccurrencesMulti(buildCatererHaystack(c, locale), keywordTerms) }))
      .sort((a, b) => b.matchCount - a.matchCount);
  }, [allCaterers, activeFilters, keywordTerms, locale]);

  // For every option in every checkbox/radio facet: how many results that option represents,
  // holding every other FACET fixed but treating this one specially per its match mode (see
  // CHECKBOX_FACETS above). Never a literal toggle - toggleFilterValue is still what an actual
  // click runs through, but "what would toggling do" makes a poor count to display: for an
  // already-selected option it would show what UNselecting it does (looks like a bug), and for an
  // 'or' facet with a sibling already checked it would show their inflated union (looks like a
  // wrong count). Either way, showing each option's own count independent of its siblings is what
  // people actually read a facet count as meaning.
  const optionCounts = useMemo(() => {
    if (allCaterers.length === 0) return undefined;
    const counts = {};
    const countWithOr = (key, value) => {
      const hypothetical = { ...filters, [key]: [value], locale };
      return allCaterers.filter((c) => matchesFilters(c, hypothetical)).length;
    };
    const countWithAnd = (key, value) => {
      const already = filters[key].includes(value);
      const hypothetical = { ...(already ? filters : toggleFilterValue(filters, key, value)), locale };
      return allCaterers.filter((c) => matchesFilters(c, hypothetical)).length;
    };
    const countWithRadio = (key, value) => {
      const hypothetical = { ...filters, [key]: value, locale };
      return allCaterers.filter((c) => matchesFilters(c, hypothetical)).length;
    };
    for (const [key, options, mode] of CHECKBOX_FACETS) {
      const countFor = mode === 'and' ? countWithAnd : countWithOr;
      for (const opt of options) counts[`${key}:${opt}`] = countFor(key, opt);
    }
    for (const g of GUEST_COUNT_BRACKETS) counts[`minGuests:${g.max}`] = countWithRadio('minGuests', String(g.max));
    for (const g of MIN_ORDER_BRACKETS) counts[`maxMinOrder:${g.max}`] = countWithRadio('maxMinOrder', String(g.max));
    return counts;
  }, [allCaterers, filters, locale]);

  // Flattens every caterer's packages into individual results, optionally restricted to one
  // package "type" - true fixed-price formulas vs à-la-carte menus (build-your-own item catalogs,
  // tagged pkg.type === 'a_la_carte'). Shared by both the "formulas" and "a_la_carte" search modes.
  const flattenPackages = useCallback(
    (typeFilter) =>
      results
        .flatMap((caterer) => (caterer.packages || []).map((pkg) => ({ caterer, pkg })))
        .filter(({ pkg }) => (typeFilter === 'a_la_carte' ? pkg.type === 'a_la_carte' : pkg.type !== 'a_la_carte'))
        .filter(
          ({ pkg }) =>
            filters.eventTypes.length === 0 || filters.eventTypes.some((e) => (pkg.eventTypes || []).includes(e))
        ),
    [results, filters.eventTypes]
  );

  const rankPackages = useCallback(
    (flattened) => {
      if (keywordTerms.length > 0) {
        return flattened
          .map((f) => ({ ...f, matchCount: countOccurrencesMulti(buildPackageHaystack(f.caterer, f.pkg, locale), keywordTerms) }))
          .filter((f) => f.matchCount > 0)
          .sort((a, b) => b.matchCount - a.matchCount || Number(a.pkg.pricePerGuest) - Number(b.pkg.pricePerGuest));
      }
      return flattened.sort((a, b) => Number(a.pkg.pricePerGuest) - Number(b.pkg.pricePerGuest));
    },
    [keywordTerms, locale]
  );

  // With a keyword search active (one or more terms, comma/space separated), formulas are ranked
  // by how many times ANY of the terms appears in that formula's own content (falling back to
  // price, cheapest first, when there's no keyword or as a tie-breaker). Scoped to the current
  // display locale, same as the API's ranking, so the count shown always matches what can
  // actually be highlighted on click-through.
  const formulas = useMemo(() => rankPackages(flattenPackages('formula')), [flattenPackages, rankPackages]);
  const alaCarte = useMemo(() => rankPackages(flattenPackages('a_la_carte')), [flattenPackages, rankPackages]);

  return (
    <div>
      <section className="bg-teal text-cream">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-extrabold text-base sm:text-lg leading-tight">{dict.hero.title}</h1>
            <p className="text-xs text-limeLight/90 truncate">{dict.hero.subtitle}</p>
          </div>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            placeholder={dict.search.keyword}
            className="w-full max-w-[12rem] sm:max-w-xs shrink-0 rounded-full border-0 px-4 py-2 bg-cream text-ink placeholder:text-ink/50 focus-ring text-sm shadow-card"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col lg:flex-row gap-6">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          optionCounts={optionCounts}
        />

        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="font-display font-semibold text-teal">
              {loading
                ? ''
                : searchMode === 'formulas'
                  ? t('search.resultsCountFormulas', { n: formulas.length })
                  : searchMode === 'a_la_carte'
                    ? t('search.resultsCountALaCarte', { n: alaCarte.length })
                    : t('search.resultsCount', { n: results.length })}
            </p>

            <div className="flex gap-1 bg-cream/60 rounded-full p-1 border-2 border-teal/10">
              <button
                type="button"
                onClick={() => setSearchMode('caterers')}
                aria-pressed={searchMode === 'caterers'}
                className={`text-sm font-display font-semibold rounded-full px-3 py-1.5 focus-ring transition-colors ${
                  searchMode === 'caterers' ? 'bg-teal text-cream' : 'text-teal hover:bg-teal/10'
                }`}
              >
                {dict.search.modeCaterers}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('formulas')}
                aria-pressed={searchMode === 'formulas'}
                className={`text-sm font-display font-semibold rounded-full px-3 py-1.5 focus-ring transition-colors ${
                  searchMode === 'formulas' ? 'bg-teal text-cream' : 'text-teal hover:bg-teal/10'
                }`}
              >
                {dict.search.modeFormulas}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('a_la_carte')}
                aria-pressed={searchMode === 'a_la_carte'}
                className={`text-sm font-display font-semibold rounded-full px-3 py-1.5 focus-ring transition-colors ${
                  searchMode === 'a_la_carte' ? 'bg-teal text-cream' : 'text-teal hover:bg-teal/10'
                }`}
              >
                {dict.search.modeALaCarte}
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Spinner className="h-10 w-10" />
            </div>
          )}

          {!loading && searchMode === 'formulas' && formulas.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResultsFormulas}
            </p>
          )}
          {!loading && searchMode === 'a_la_carte' && alaCarte.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResultsALaCarte}
            </p>
          )}
          {!loading && searchMode === 'caterers' && results.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResults}
            </p>
          )}

          {searchMode === 'formulas' && (
            <div className="flex flex-col gap-3">
              {formulas.map(({ caterer, pkg, matchCount }) => (
                <FormulaCard key={`${caterer.id}-${pkg.id}`} caterer={caterer} pkg={pkg} matchCount={matchCount} keyword={keyword} />
              ))}
            </div>
          )}
          {searchMode === 'a_la_carte' && (
            <div className="flex flex-col gap-3">
              {alaCarte.map(({ caterer, pkg, matchCount }) => (
                <FormulaCard key={`${caterer.id}-${pkg.id}`} caterer={caterer} pkg={pkg} matchCount={matchCount} keyword={keyword} />
              ))}
            </div>
          )}
          {searchMode === 'caterers' && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map((c) => (
                <CatererCard key={c.id} caterer={c} guestCount={filters.minGuests} matchCount={c.matchCount} keyword={keyword} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
