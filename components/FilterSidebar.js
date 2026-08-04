'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
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

export function FilterSidebar({ filters, setFilters, onReset }) {
  const { dict } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle(key, value) {
    setFilters((prev) => {
      const set = new Set(prev[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: Array.from(set) };
    });
  }

  function setGuests(value) {
    setFilters((prev) => ({ ...prev, minGuests: prev.minGuests === value ? '' : value }));
  }

  function setMaxMinOrder(value) {
    setFilters((prev) => ({ ...prev, maxMinOrder: prev.maxMinOrder === value ? '' : value }));
  }

  const activeCount =
    filters.districts.length +
    filters.kashrutLevels.length +
    filters.cateringTypes.length +
    filters.eventTypes.length +
    filters.menuCategories.length +
    filters.alaCarteCategories.length +
    filters.services.length +
    (filters.minGuests ? 1 : 0) +
    (filters.maxMinOrder ? 1 : 0);

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-teal text-cream rounded-2xl font-display font-bold focus-ring"
      >
        <span>
          {dict.search.title}
          {activeCount > 0 && <span className="ms-2 bg-orange text-cream text-xs rounded-full px-2 py-0.5">{activeCount}</span>}
        </span>
        <span className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      <div
        className={`lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] mt-2 lg:mt-0 bg-white border-2 border-teal/20 rounded-2xl overflow-hidden flex flex-col ${
          mobileOpen ? 'block' : 'hidden'
        } lg:flex`}
      >
        <div className="hidden lg:flex items-center justify-between px-4 py-3 bg-teal text-cream shrink-0">
          <h2 className="font-display font-bold">{dict.search.title}</h2>
          {activeCount > 0 && (
            <button onClick={onReset} className="text-xs font-semibold underline decoration-limeLight hover:text-limeLight focus-ring rounded">
              {dict.search.reset} ({activeCount})
            </button>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="lg:hidden w-full shrink-0 text-start px-4 py-2 text-xs font-semibold text-orange underline focus-ring"
          >
            {dict.search.reset} ({activeCount})
          </button>
        )}

        <div className="overflow-y-auto divide-y divide-teal/10">
          <FilterSection title={dict.search.location}>
            <CheckList options={DISTRICTS} labels={dict.districts} values={filters.districts} onToggle={(v) => toggle('districts', v)} />
          </FilterSection>

          <FilterSection title={dict.search.cateringType}>
            <CheckList options={CATERING_TYPES} labels={dict.cateringType} values={filters.cateringTypes} onToggle={(v) => toggle('cateringTypes', v)} />
          </FilterSection>

          <FilterSection title={dict.search.kashrut}>
            <CheckList options={KASHRUT_LEVELS} labels={dict.kashrut} values={filters.kashrutLevels} onToggle={(v) => toggle('kashrutLevels', v)} />
          </FilterSection>

          <FilterSection title={dict.search.eventType}>
            <CheckList options={EVENT_TYPES} labels={dict.eventTypes} values={filters.eventTypes} onToggle={(v) => toggle('eventTypes', v)} />
          </FilterSection>

          <FilterSection title={dict.search.guests}>
            <div className="space-y-1.5">
              {GUEST_COUNT_BRACKETS.map((g) => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm text-ink/80 hover:text-teal">
                  <input
                    type="radio"
                    name="guests"
                    checked={String(filters.minGuests) === String(g.max)}
                    onChange={() => setGuests(String(g.max))}
                    className="accent-orange h-4 w-4"
                  />
                  {dict.guestBrackets[g.id]}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={dict.search.minOrder}>
            <div className="space-y-1.5">
              {MIN_ORDER_BRACKETS.map((g) => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm text-ink/80 hover:text-teal">
                  <input
                    type="radio"
                    name="minOrder"
                    checked={String(filters.maxMinOrder) === String(g.max)}
                    onChange={() => setMaxMinOrder(String(g.max))}
                    className="accent-orange h-4 w-4"
                  />
                  {dict.minOrderBrackets[g.id]}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={dict.search.menu}>
            <CheckList options={MENU_CATEGORIES} labels={dict.menuCategories} values={filters.menuCategories} onToggle={(v) => toggle('menuCategories', v)} />
          </FilterSection>

          <FilterSection title={dict.search.alaCarteMenu}>
            <CheckList
              options={ALACARTE_CATEGORIES}
              labels={dict.alaCarteCategories}
              values={filters.alaCarteCategories}
              onToggle={(v) => toggle('alaCarteCategories', v)}
            />
          </FilterSection>

          <FilterSection title={dict.search.services}>
            <CheckList options={ADDITIONAL_SERVICES} labels={dict.services} values={filters.services} onToggle={(v) => toggle('services', v)} />
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}

function FilterSection({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group px-4 py-3">
      <summary className="flex items-center justify-between cursor-pointer list-none font-display font-semibold text-teal py-1 focus-ring rounded">
        {title}
        <span className="text-teal/50 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function CheckList({ options, labels, values, onToggle }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-ink/80 hover:text-teal">
          <input
            type="checkbox"
            checked={values.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-orange h-4 w-4 rounded"
          />
          {labels[opt]}
        </label>
      ))}
    </div>
  );
}
