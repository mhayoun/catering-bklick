'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { CheckboxGroup } from './CheckboxGroup';
import { pickLocalized, toArrayField } from '../lib/localized';
import { estimatePackageTotal } from '../lib/pricing';
import { EVENT_TYPES } from '../lib/constants';

export function ProposalModal({ caterer, onClose }) {
  const { dict, t, locale } = useLanguage();

  const eventTypeOptions = caterer.eventTypes?.length ? caterer.eventTypes : EVENT_TYPES;
  const cateringTypeOptions = toArrayField(caterer, 'cateringTypes', 'cateringType');
  const kashrutOptions = toArrayField(caterer, 'kashrutLevels', 'kashrut');
  const menuOptions = (caterer.menuCategories || []).filter((m) => dict.menuCategories[m]);
  const serviceOptions = (caterer.services || []).filter((s) => dict.services[s]);
  const packages = caterer.packages || [];

  const [form, setForm] = useState({
    where: pickLocalized(caterer.city, locale),
    when: '',
    eventType: eventTypeOptions[0] || '',
    cateringType: cateringTypeOptions[0] || '',
    kashrut: kashrutOptions[0] || '',
    guests: '',
    packageId: packages[0]?.id || '',
    menu: packages[0]?.includedCategories || [],
    services: []
  });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Picking a package pre-fills the menu checkboxes with what that package
  // includes - the customer can still adjust them by hand afterwards.
  function selectPackage(packageId) {
    const pkg = packages.find((p) => p.id === packageId);
    setForm((prev) => ({ ...prev, packageId, menu: pkg?.includedCategories || prev.menu }));
  }

  const selectedPackage = packages.find((p) => p.id === form.packageId) || null;
  const estimate = selectedPackage ? estimatePackageTotal(selectedPackage, form.guests) : null;

  function buildMessage() {
    // Emoji are built from numeric code points via String.fromCodePoint()
    // rather than literal characters or \u{} escapes - literal emoji (and
    // even \u{} escapes for BMP code points, which the compiler re-emits as
    // literal bytes) in this file were observed getting corrupted to U+FFFD
    // somewhere in the build pipeline. A pure-ASCII source line can't be
    // corrupted by any charset mismatch.
    const PIN = String.fromCodePoint(0x1f4cd); // 📍
    const CALENDAR = String.fromCodePoint(0x1f4c5); // 📅
    const PARTY = String.fromCodePoint(0x1f389); // 🎉
    const PLATE = String.fromCodePoint(0x1f37d, 0xfe0f); // 🍽️
    const STAR_OF_DAVID = String.fromCodePoint(0x2721, 0xfe0f); // ✡️
    const PEOPLE = String.fromCodePoint(0x1f465); // 👥
    const FOOD = String.fromCodePoint(0x1f372); // 🍲
    const SPARKLES = String.fromCodePoint(0x2728); // ✨
    const MONEY = String.fromCodePoint(0x1f4b0); // 💰

    const lines = [`${dict.proposal.messageIntro} ${caterer.businessName}:`];
    if (form.where) lines.push(`${PIN} ${dict.proposal.where}: ${form.where}`);
    if (form.when) lines.push(`${CALENDAR} ${dict.proposal.when}: ${form.when}`);
    if (form.eventType) lines.push(`${PARTY} ${dict.search.eventType}: ${dict.eventTypes[form.eventType]}`);
    if (form.cateringType) lines.push(`${PLATE} ${dict.search.cateringType}: ${dict.cateringType[form.cateringType]}`);
    if (form.kashrut) lines.push(`${STAR_OF_DAVID} ${dict.search.kashrut}: ${dict.kashrut[form.kashrut]}`);
    if (form.guests) lines.push(`${PEOPLE} ${dict.proposal.guests}: ${form.guests}`);
    if (selectedPackage) {
      lines.push(`${PLATE} ${dict.proposal.package}: ${pickLocalized(selectedPackage.name, locale)} (₪${selectedPackage.pricePerGuest} ${dict.card.perGuest})`);
    }
    if (estimate) {
      lines.push(`${MONEY} ${dict.proposal.estimatedPrice}: ₪${Math.round(estimate.total).toLocaleString()}`);
    }
    if (form.menu.length) lines.push(`${FOOD} ${dict.search.menu}: ${form.menu.map((m) => dict.menuCategories[m]).join(', ')}`);
    if (form.services.length) lines.push(`${SPARKLES} ${dict.search.services}: ${form.services.map((s) => dict.services[s]).join(', ')}`);
    return lines.join('\n');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const phone = caterer.whatsapp.replace(/[^\d]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-cream border-4 border-teal rounded-blob p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-xl text-teal">{dict.proposal.title}</h2>
            <p className="text-sm text-ink/70 mt-1">{t('proposal.subtitle', { name: caterer.businessName })}</p>
          </div>
          <button
            type="button"
            aria-label={dict.profile.galleryClose}
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-full border-2 border-teal/40 text-teal text-xl leading-none flex items-center justify-center hover:border-teal focus-ring"
          >
            ×
          </button>
        </div>

        <Field label={dict.proposal.where}>
          <input
            type="text"
            value={form.where}
            onChange={(e) => set('where', e.target.value)}
            className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-white focus-ring"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={dict.proposal.when}>
            <input
              type="date"
              value={form.when}
              onChange={(e) => set('when', e.target.value)}
              required
              className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-white focus-ring"
            />
          </Field>

          <Field label={dict.proposal.guests}>
            <input
              type="number"
              min="1"
              value={form.guests}
              onChange={(e) => set('guests', e.target.value)}
              required
              className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-white focus-ring"
            />
          </Field>
        </div>

        {packages.length > 0 && (
          <Field label={dict.proposal.package}>
            <Select
              value={form.packageId}
              onChange={selectPackage}
              options={packages.map((p) => p.id)}
              labels={Object.fromEntries(packages.map((p) => [p.id, pickLocalized(p.name, locale)]))}
            />
            {estimate && (
              <p className="text-sm text-tealGreen font-semibold mt-1.5">
                {dict.proposal.estimatedPrice}: ₪{Math.round(estimate.total).toLocaleString()}
                {estimate.belowMinimum && ` (${dict.profile.packages.belowMinimum})`}
              </p>
            )}
          </Field>
        )}

        {eventTypeOptions.length > 0 && (
          <Field label={dict.search.eventType}>
            <Select value={form.eventType} onChange={(v) => set('eventType', v)} options={eventTypeOptions} labels={dict.eventTypes} />
          </Field>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {cateringTypeOptions.length > 0 && (
            <Field label={dict.search.cateringType}>
              <Select value={form.cateringType} onChange={(v) => set('cateringType', v)} options={cateringTypeOptions} labels={dict.cateringType} />
            </Field>
          )}

          {kashrutOptions.length > 0 && (
            <Field label={dict.search.kashrut}>
              <Select value={form.kashrut} onChange={(v) => set('kashrut', v)} options={kashrutOptions} labels={dict.kashrut} />
            </Field>
          )}
        </div>

        {menuOptions.length > 0 && (
          <Field label={dict.search.menu}>
            <CheckboxGroup name={dict.search.menu} options={menuOptions} labels={dict.menuCategories} values={form.menu} onChange={(v) => set('menu', v)} />
          </Field>
        )}

        {serviceOptions.length > 0 && (
          <Field label={dict.search.services}>
            <CheckboxGroup name={dict.search.services} options={serviceOptions} labels={dict.services} values={form.services} onChange={(v) => set('services', v)} />
          </Field>
        )}

        <button
          type="submit"
          className="w-full bg-orange text-cream font-display font-bold px-6 py-3 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring"
        >
          {dict.proposal.send}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-display font-semibold text-teal">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, labels }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-white focus-ring cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels[opt]}
        </option>
      ))}
    </select>
  );
}
