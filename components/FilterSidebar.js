'use client';

import { useLanguage } from './LanguageProvider';
import {
  DISTRICTS,
  KASHRUT_LEVELS,
  CATERING_TYPES,
  EVENT_TYPES,
  MENU_CATEGORIES,
  BEVERAGE_TYPES,
  ADDITIONAL_SERVICES,
  GUEST_COUNT_BRACKETS
} from '../lib/constants';

export function FilterSidebar({ filters, setFilters, onReset }) {
  const { dict } = useLanguage();

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

  const activeCount =
    filters.districts.length +
    filters.kashrutLevels.length +
    filters.cateringTypes.length +
    filters.eventTypes.length +
    filters.menuCategories.length +
    filters.beverageTypes.length +
    filters.services.length +
    (filters.minGuests ? 1 : 0);

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="lg:sticky lg:top-24 bg-white border-2 border-eggplant/20 rounded-2xl divide-y divide-eggplant/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-eggplant text-cream">
          <h2 className="font-display font-bold">{dict.search.title}</h2>
          {activeCount > 0 && (
            <button onClick={onReset} className="text-xs font-semibold underline decoration-turmericLight hover:text-turmericLight focus-ring rounded">
              {dict.search.reset} ({activeCount})
            </button>
          )}
        </div>

        <FilterSection title={dict.search.location} defaultOpen>
          <CheckList options={DISTRICTS} labels={dict.districts} values={filters.districts} onToggle={(v) => toggle('districts', v)} />
        </FilterSection>

        <FilterSection title={dict.search.cateringType} defaultOpen>
          <CheckList options={CATERING_TYPES} labels={dict.cateringType} values={filters.cateringTypes} onToggle={(v) => toggle('cateringTypes', v)} />
        </FilterSection>

        <FilterSection title={dict.search.kashrut}>
          <CheckList options={KASHRUT_LEVELS} labels={dict.kashrut} values={filters.kashrutLevels} onToggle={(v) => toggle('kashrutLevels', v)} />
        </FilterSection>

        <FilterSection title={dict.search.eventType} defaultOpen>
          <CheckList options={EVENT_TYPES} labels={dict.eventTypes} values={filters.eventTypes} onToggle={(v) => toggle('eventTypes', v)} />
        </FilterSection>

        <FilterSection title={dict.search.guests}>
          <div className="space-y-1.5">
            {GUEST_COUNT_BRACKETS.map((g) => (
              <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm text-ink/80 hover:text-eggplant">
                <input
                  type="radio"
                  name="guests"
                  checked={String(filters.minGuests) === String(g.max)}
                  onChange={() => setGuests(String(g.max))}
                  className="accent-paprika h-4 w-4"
                />
                {dict.guestBrackets[g.id]}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={dict.search.menu}>
          <CheckList options={MENU_CATEGORIES} labels={dict.menuCategories} values={filters.menuCategories} onToggle={(v) => toggle('menuCategories', v)} />
        </FilterSection>

        <FilterSection title={dict.search.beverages}>
          <CheckList options={BEVERAGE_TYPES} labels={dict.beverageTypes} values={filters.beverageTypes} onToggle={(v) => toggle('beverageTypes', v)} />
        </FilterSection>

        <FilterSection title={dict.search.services}>
          <CheckList options={ADDITIONAL_SERVICES} labels={dict.services} values={filters.services} onToggle={(v) => toggle('services', v)} />
        </FilterSection>
      </div>
    </aside>
  );
}

function FilterSection({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group px-4 py-3">
      <summary className="flex items-center justify-between cursor-pointer list-none font-display font-semibold text-eggplant py-1 focus-ring rounded">
        {title}
        <span className="text-eggplant/50 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function CheckList({ options, labels, values, onToggle }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-ink/80 hover:text-eggplant">
          <input
            type="checkbox"
            checked={values.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-paprika h-4 w-4 rounded"
          />
          {labels[opt]}
        </label>
      ))}
    </div>
  );
}
