'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../components/LanguageProvider';
import { FilterSidebar } from '../components/FilterSidebar';
import { CatererCard } from '../components/CatererCard';
import { Logo } from '../components/Logo';

const EMPTY_FILTERS = {
  keyword: '',
  districts: [],
  kashrutLevels: [],
  cateringTypes: [],
  eventTypes: [],
  minGuests: '',
  menuCategories: [],
  services: []
};

export default function HomePage() {
  const { dict, t } = useLanguage();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (f) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.keyword) params.set('keyword', f.keyword);
    if (f.minGuests) params.set('minGuests', f.minGuests);
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

  // Auto-apply: every filter change (checkbox click or keyword typing)
  // re-runs the search after a short debounce, no submit button needed.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(filters), 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
        />

        <section className="flex-1 min-w-0">
          <p className="font-display font-semibold text-teal mb-4">
            {loading ? '…' : t('search.resultsCount', { n: results.length })}
          </p>

          {!loading && results.length === 0 && (
            <p className="text-ink/70 bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center">
              {dict.search.noResults}
            </p>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {results.map((c) => (
              <CatererCard key={c.id} caterer={c} guestCount={filters.minGuests} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
