'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { FilterSidebar } from '../components/FilterSidebar';
import { CatererCard } from '../components/CatererCard';
import { FormulaCard } from '../components/FormulaCard';
import { buildPackageHaystack, countOccurrencesMulti, parseKeywords } from '../lib/search';

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
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // When an event-type filter is active, only packages individually tagged with one of the
  // selected event types are kept (the caterer-level match in searchCaterers is broader - it
  // also passes a caterer whose OTHER packages carry the tag, so this narrows back down to just
  // the matching ones).
  const keyword = filters.keyword?.trim();
  const keywordTerms = useMemo(() => parseKeywords(keyword), [keyword]);

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

  const runSearch = useCallback(async (f, loc) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.keyword) params.set('keyword', f.keyword);
    params.set('locale', loc || 'he');
    if (f.minGuests) params.set('minGuests', f.minGuests);
    if (f.maxMinOrder) params.set('maxMinOrder', f.maxMinOrder);
    f.districts.forEach((v) => params.append('districts', v));
    f.kashrutLevels.forEach((v) => params.append('kashrutLevels', v));
    f.cateringTypes.forEach((v) => params.append('cateringTypes', v));
    f.eventTypes.forEach((v) => params.append('eventTypes', v));
    f.menuCategories.forEach((v) => params.append('menuCategories', v));
    f.alaCarteCategories.forEach((v) => params.append('alaCarteCategories', v));
    f.services.forEach((v) => params.append('services', v));

    try {
      const res = await fetch(`/api/caterers?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-apply: every filter change (checkbox click or keyword typing), or a language switch
  // (which changes which locale keyword matching/ranking is scoped to), re-runs the search
  // after a short debounce, no submit button needed.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(filters, locale), 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, locale]);

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
        <FilterSidebar filters={filters} setFilters={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="font-display font-semibold text-teal">
              {loading
                ? '…'
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
