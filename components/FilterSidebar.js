'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { toggleFilterValue } from '../lib/search';
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

// `optionCounts` (see app/page.js) maps "key:value" -> how many results a click on that option
// would leave you with, given every other filter as currently set. Undefined while the full
// catalog is still loading - every count below falls back to omitting the parenthetical rather
// than flashing "(0)".
export function FilterSidebar({ filters, setFilters, onReset, optionCounts }) {
  const { dict } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle(key, value) {
    setFilters((prev) => toggleFilterValue(prev, key, value));
  }

  function setGuests(value) {
    toggle('minGuests', value);
  }

  function setMaxMinOrder(value) {
    toggle('maxMinOrder', value);
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
            <CheckList
              filterKey="districts"
              options={DISTRICTS}
              labels={dict.districts}
              values={filters.districts}
              onToggle={(v) => toggle('districts', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.cateringType}>
            <CheckList
              filterKey="cateringTypes"
              options={CATERING_TYPES}
              labels={dict.cateringType}
              values={filters.cateringTypes}
              onToggle={(v) => toggle('cateringTypes', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.kashrut}>
            <CheckList
              filterKey="kashrutLevels"
              options={KASHRUT_LEVELS}
              labels={dict.kashrut}
              values={filters.kashrutLevels}
              onToggle={(v) => toggle('kashrutLevels', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.eventType}>
            <CheckList
              filterKey="eventTypes"
              options={EVENT_TYPES}
              labels={dict.eventTypes}
              values={filters.eventTypes}
              onToggle={(v) => toggle('eventTypes', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.guests}>
            <div className="space-y-1.5">
              {GUEST_COUNT_BRACKETS.map((g) => (
                <OptionLabel key={g.id} name="guests" checked={String(filters.minGuests) === String(g.max)} onChange={() => setGuests(String(g.max))}>
                  {dict.guestBrackets[g.id]}
                  <OptionCount optionCounts={optionCounts} countKey={`minGuests:${g.max}`} />
                </OptionLabel>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={dict.search.minOrder}>
            <div className="space-y-1.5">
              {MIN_ORDER_BRACKETS.map((g) => (
                <OptionLabel key={g.id} name="minOrder" checked={String(filters.maxMinOrder) === String(g.max)} onChange={() => setMaxMinOrder(String(g.max))}>
                  {dict.minOrderBrackets[g.id]}
                  <OptionCount optionCounts={optionCounts} countKey={`maxMinOrder:${g.max}`} />
                </OptionLabel>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={dict.search.menu}>
            <CheckList
              filterKey="menuCategories"
              options={MENU_CATEGORIES}
              labels={dict.menuCategories}
              values={filters.menuCategories}
              onToggle={(v) => toggle('menuCategories', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.alaCarteMenu}>
            <CheckList
              filterKey="alaCarteCategories"
              options={ALACARTE_CATEGORIES}
              labels={dict.alaCarteCategories}
              values={filters.alaCarteCategories}
              onToggle={(v) => toggle('alaCarteCategories', v)}
              optionCounts={optionCounts}
            />
          </FilterSection>

          <FilterSection title={dict.search.services}>
            <CheckList
              filterKey="services"
              options={ADDITIONAL_SERVICES}
              labels={dict.services}
              values={filters.services}
              onToggle={(v) => toggle('services', v)}
              optionCounts={optionCounts}
            />
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

function CheckList({ filterKey, options, labels, values, onToggle, optionCounts }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <OptionLabel key={opt} checked={values.includes(opt)} onChange={() => onToggle(opt)}>
          {labels[opt]}
          <OptionCount optionCounts={optionCounts} countKey={`${filterKey}:${opt}`} />
        </OptionLabel>
      ))}
    </div>
  );
}

// Shared row for both a checkbox facet option (CheckList) and a radio-bracket option
// (guest count / minimum order) - same layout either way, just a different input type.
function OptionLabel({ name, checked, onChange, children }) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer text-sm hover:text-teal ${checked ? 'text-teal font-semibold' : 'text-ink/80'}`}
    >
      <input
        type={name ? 'radio' : 'checkbox'}
        name={name}
        checked={checked}
        onChange={onChange}
        className={`accent-orange h-4 w-4 ${name ? '' : 'rounded'}`}
      />
      {children}
    </label>
  );
}

// Renders " (N)" once counts have loaded; a selected-but-now-0-result option still shows "(0)"
// rather than disappearing, since unchecking it is exactly how you'd get back to results.
function OptionCount({ optionCounts, countKey }) {
  if (!optionCounts) return null;
  const count = optionCounts[countKey] ?? 0;
  return <span className={count === 0 ? 'text-ink/40' : 'text-ink/50'}> ({count})</span>;
}
