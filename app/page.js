'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { FilterSidebar } from '../components/FilterSidebar';
import { CatererCard } from '../components/CatererCard';
import { FormulaCard } from '../components/FormulaCard';
import { Logo } from '../components/Logo';
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
  services: []
};

export default function HomePage() {
  const { dict, t, locale } = useLanguage();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchMode, setSearchMode] = useState('formulas');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // Every caterer's packages, flattened into individual formula results - only relevant in
  // "formulas" search mode. When an event-type filter is active, only formulas individually
  // tagged with one of the selected event types are kept (the caterer-level match in
  // searchCaterers is broader - it also passes a caterer whose OTHER packages carry the tag,
  // so this narrows back down to just the matching ones). With a keyword search active (one or
  // more terms, comma/space separated), formulas are ranked by how many times ANY of the terms
  // appears in that formula's own content (falling back to price, cheapest first, when there's
  // no keyword or as a tie-breaker). Scoped to the current display locale, same as the API's
  // ranking, so the count shown always matches what can actually be highlighted on click-through.
  const keyword = filters.keyword?.trim();
  const keywordTerms = useMemo(() => parseKeywords(keyword), [keyword]);
  const formulas = useMemo(() => {
    const flattened = results
      .flatMap((caterer) => (caterer.packages || []).map((pkg) => ({ caterer, pkg })))
      .filter(
        ({ pkg }) =>
          filters.eventTypes.length === 0 || filters.eventTypes.some((e) => (pkg.eventTypes || []).includes(e))
      );

    if (keywordTerms.length > 0) {
      return flattened
        .map((f) => ({ ...f, matchCount: countOccurrencesMulti(buildPackageHaystack(f.caterer, f.pkg, locale), keywordTerms) }))
        .filter((f) => f.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount || Number(a.pkg.pricePerGuest) - Number(b.pkg.pricePerGuest));
    }
    return flattened.sort((a, b) => Number(a.pkg.pricePerGuest) - Number(b.pkg.pricePerGuest));
  }, [results, filters.eventTypes, keywordTerms, locale]);

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
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start">
          <Logo className="h-16 w-16 sm:h-20 sm:w-20 shrink-0" />
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-2xl sm:text-4xl leading-tight">{dict.hero.title}</h1>
            <p className="mt-2 text-limeLight/90 max-w-2xl">{dict.hero.subtitle}</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-8">
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            placeholder={dict.search.keyword}
            className="w-full rounded-full border-0 px-5 py-3.5 bg-cream text-ink placeholder:text-ink/50 focus-ring text-base shadow-card"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col lg:flex-row gap-6">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
        />

        <section className="flex-1 min-w-0">
          <p className="font-display font-semibold text-teal mb-4">
            {loading
              ? '…'
              : searchMode === 'formulas'
                ? t('search.resultsCountFormulas', { n: formulas.length })
                : t('search.resultsCount', { n: results.length })}
          </p>

          {!loading && searchMode === 'formulas' && formulas.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResultsFormulas}
            </p>
          )}
          {!loading && searchMode === 'caterers' && results.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResults}
            </p>
          )}

          {searchMode === 'formulas' ? (
            <div className="flex flex-col gap-3">
              {formulas.map(({ caterer, pkg, matchCount }) => (
                <FormulaCard key={`${caterer.id}-${pkg.id}`} caterer={caterer} pkg={pkg} matchCount={matchCount} keyword={keyword} />
              ))}
            </div>
          ) : (
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
