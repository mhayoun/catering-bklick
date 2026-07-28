'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { CheckboxGroup } from './CheckboxGroup';
import { toLocalizedDraft } from '../lib/localized';
import {
  DISTRICTS,
  KASHRUT_LEVELS,
  CATERING_TYPES,
  EVENT_TYPES,
  MENU_CATEGORIES,
  ADDITIONAL_SERVICES,
  ADDON_PRICE_TYPES,
  LOCALES
} from '../lib/constants';

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function blankPackage() {
  return {
    id: makeId(),
    name: { he: '', en: '', fr: '' },
    pricePerGuest: '',
    minGuests: '',
    includedCategories: [],
    categoryLimits: {},
    addons: []
  };
}

function blankAddon() {
  return { id: makeId(), name: { he: '', en: '', fr: '' }, priceType: 'per_guest', amount: '' };
}

const BLANK = {
  businessName: '',
  description: { he: '', en: '', fr: '' },
  districts: [],
  city: { he: '', en: '', fr: '' },
  address: '',
  kashrutLevels: [],
  cateringTypes: [],
  maxGuests: '',
  priceFrom: '',
  eventTypes: [],
  menuCategories: [],
  services: [],
  phone: '',
  whatsapp: '',
  email: '',
  website: '',
  instagram: '',
  facebook: '',
  photos: [],
  videos: [],
  packages: [],
  // "Common to all formulas" template - defined once and applied to every package.
  // Not sent to the server (see handleSubmit): it's fully redundant with what's
  // already folded into each package's own includedCategories/categoryLimits/addons.
  commonCategories: [],
  commonCategoryLimits: {},
  commonAddons: [],
  commonMinGuests: ''
};

export function CatererForm({ initial, catererId }) {
  const { dict, locale } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const merged = { ...BLANK, ...initial };
    merged.description = toLocalizedDraft(initial?.description, locale);
    merged.city = toLocalizedDraft(initial?.city, locale);
    // Backward-compat: older records stored these as single values.
    if (!initial?.districts && initial?.district) merged.districts = [initial.district];
    if (!initial?.kashrutLevels && initial?.kashrut) merged.kashrutLevels = [initial.kashrut];
    if (!initial?.cateringTypes && initial?.cateringType) merged.cateringTypes = [initial.cateringType];
    merged.packages = (initial?.packages || []).map((pkg) => ({
      ...blankPackage(),
      ...pkg,
      name: toLocalizedDraft(pkg.name, locale),
      addons: (pkg.addons || []).map((addon) => ({
        ...blankAddon(),
        ...addon,
        name: toLocalizedDraft(addon.name, locale)
      }))
    }));

    // Older records don't store a "common" template - infer one, once, from
    // whatever's already identical across every existing package.
    const categorySets = merged.packages.map((p) => new Set(p.includedCategories || []));
    merged.commonCategories =
      merged.packages.length > 1 && categorySets.length > 0
        ? [...categorySets[0]].filter((cat) => categorySets.every((s) => s.has(cat)))
        : [];
    merged.commonCategoryLimits = Object.fromEntries(
      merged.commonCategories
        .map((cat) => {
          const values = merged.packages.map((p) => Number(p.categoryLimits?.[cat]) || null);
          return values.every((v) => v === values[0]) ? [cat, values[0]] : null;
        })
        .filter(Boolean)
    );
    const addonIdSets = merged.packages.map((p) => new Set((p.addons || []).map((a) => a.id)));
    const commonAddonIds =
      merged.packages.length > 1 && addonIdSets.length > 0
        ? [...addonIdSets[0]].filter((id) => addonIdSets.every((s) => s.has(id)))
        : [];
    merged.commonAddons = commonAddonIds.map((id) => merged.packages[0].addons.find((a) => a.id === id)).filter(Boolean);

    const minGuestsValues = merged.packages.map((p) => Number(p.minGuests) || null);
    merged.commonMinGuests =
      merged.packages.length > 1 && minGuestsValues.every((v) => v && v === minGuestsValues[0]) ? String(minGuestsValues[0]) : '';

    return merged;
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoDraft, setVideoDraft] = useState('');
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState({});

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setLocalized(key, text) {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [locale]: text } }));
  }

  function addPackage() {
    setForm((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          ...blankPackage(),
          minGuests: prev.commonMinGuests,
          includedCategories: [...prev.commonCategories],
          categoryLimits: { ...prev.commonCategoryLimits },
          addons: prev.commonAddons.map((addon) => ({ ...addon }))
        }
      ]
    }));
  }

  function removePackage(pkgIndex) {
    setForm((prev) => ({ ...prev, packages: prev.packages.filter((_, i) => i !== pkgIndex) }));
  }

  function updatePackage(pkgIndex, patch) {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => (i === pkgIndex ? { ...pkg, ...patch } : pkg))
    }));
  }

  function setPackageName(pkgIndex, text) {
    updatePackage(pkgIndex, { name: { ...form.packages[pkgIndex].name, [locale]: text } });
  }

  function addAddon(pkgIndex) {
    updatePackage(pkgIndex, { addons: [...form.packages[pkgIndex].addons, blankAddon()] });
  }

  function removeAddon(pkgIndex, addonIndex) {
    updatePackage(pkgIndex, { addons: form.packages[pkgIndex].addons.filter((_, i) => i !== addonIndex) });
  }

  function updateAddon(pkgIndex, addonIndex, patch) {
    updatePackage(pkgIndex, {
      addons: form.packages[pkgIndex].addons.map((addon, i) => (i === addonIndex ? { ...addon, ...patch } : addon))
    });
  }

  function setAddonName(pkgIndex, addonIndex, text) {
    updateAddon(pkgIndex, addonIndex, { name: { ...form.packages[pkgIndex].addons[addonIndex].name, [locale]: text } });
  }

  // Bulk helpers below apply a single edit to every package at once, so a
  // menu category or add-on that's the same across all formulas only needs
  // to be defined/edited in one place instead of per-package.

  function setCommonMinGuests(value) {
    setForm((prev) => ({
      ...prev,
      commonMinGuests: value,
      packages: prev.packages.map((pkg) => ({ ...pkg, minGuests: value }))
    }));
  }

  function toggleCommonCategory(cat) {
    setForm((prev) => {
      const isCommon = prev.commonCategories.includes(cat);
      const { [cat]: _removedCommonLimit, ...restCommonLimits } = prev.commonCategoryLimits || {};
      return {
        ...prev,
        commonCategories: isCommon ? prev.commonCategories.filter((c) => c !== cat) : [...prev.commonCategories, cat],
        commonCategoryLimits: isCommon ? restCommonLimits : prev.commonCategoryLimits,
        packages: prev.packages.map((pkg) => {
          if (isCommon) {
            const { [cat]: _removed, ...restLimits } = pkg.categoryLimits || {};
            return { ...pkg, includedCategories: pkg.includedCategories.filter((c) => c !== cat), categoryLimits: restLimits };
          }
          return pkg.includedCategories.includes(cat) ? pkg : { ...pkg, includedCategories: [...pkg.includedCategories, cat] };
        })
      };
    });
  }

  function setCommonCategoryLimit(cat, value) {
    setForm((prev) => ({
      ...prev,
      commonCategoryLimits: { ...prev.commonCategoryLimits, [cat]: value },
      packages: prev.packages.map((pkg) =>
        pkg.includedCategories.includes(cat) ? { ...pkg, categoryLimits: { ...pkg.categoryLimits, [cat]: value } } : pkg
      )
    }));
  }

  function addCommonAddon() {
    const addon = blankAddon();
    setForm((prev) => ({
      ...prev,
      commonAddons: [...prev.commonAddons, addon],
      packages: prev.packages.map((pkg) => ({ ...pkg, addons: [...pkg.addons, { ...addon }] }))
    }));
  }

  function removeCommonAddon(id) {
    setForm((prev) => ({
      ...prev,
      commonAddons: prev.commonAddons.filter((a) => a.id !== id),
      packages: prev.packages.map((pkg) => ({ ...pkg, addons: pkg.addons.filter((a) => a.id !== id) }))
    }));
  }

  function updateCommonAddon(id, patch) {
    setForm((prev) => ({
      ...prev,
      commonAddons: prev.commonAddons.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      packages: prev.packages.map((pkg) => ({
        ...pkg,
        addons: pkg.addons.map((a) => (a.id === id ? { ...a, ...patch } : a))
      }))
    }));
  }

  // Live in-form translation preview: when the owner switches the active
  // language and a description/city field is blank for it, fill it in from
  // whichever language they already typed - so switching to Hebrew shows a
  // Hebrew translation instead of an empty box. Never overwrites text that's
  // already there (typed or previously translated).
  useEffect(() => {
    let cancelled = false;

    async function fillGap(key) {
      const value = form[key];
      if (value[locale]?.trim()) return;
      const sourceLocale = LOCALES.find((l) => value[l]?.trim());
      if (!sourceLocale) return;

      setTranslating((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: value[sourceLocale], source: sourceLocale, target: locale })
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.translated) {
          setForm((prev) =>
            prev[key][locale]?.trim() ? prev : { ...prev, [key]: { ...prev[key], [locale]: data.translated } }
          );
        }
      } catch {
        // Ignore - the owner can just type the translation manually.
      } finally {
        if (!cancelled) setTranslating((prev) => ({ ...prev, [key]: false }));
      }
    }

    fillGap('description');
    fillGap('city');

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'upload failed');
        urls.push(data.url);
      }
      set('photos', [...form.photos, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function addVideo() {
    if (!videoDraft.trim()) return;
    set('videos', [...form.videos, videoDraft.trim()]);
    setVideoDraft('');
  }

  function removePhoto(index) {
    set('photos', form.photos.filter((_, i) => i !== index));
  }

  function removeVideo(index) {
    set('videos', form.videos.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.districts.length === 0) {
      setError(dict.form.districtsRequired);
      return;
    }
    if (form.cateringTypes.length === 0) {
      setError(dict.form.cateringTypesRequired);
      return;
    }

    setSaving(true);
    try {
      const url = catererId ? `/api/caterers/${catererId}` : '/api/caterers';
      const method = catererId ? 'PUT' : 'POST';
      // commonCategories/commonCategoryLimits/commonAddons are an editor-only
      // convenience - everything they represent is already folded into each
      // package's own includedCategories/categoryLimits/addons.
      const { commonCategories, commonCategoryLimits, commonAddons, commonMinGuests, ...payload } = form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'save failed');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const commonCategories = form.commonCategories;
  const commonCategoryLimit = (cat) => form.commonCategoryLimits?.[cat] ?? null;
  const commonAddons = form.commonAddons;
  const commonAddonIds = form.commonAddons.map((a) => a.id);
  const commonMinGuests = form.commonMinGuests;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white/70 border-4 border-teal rounded-blob p-6 sm:p-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-teal">{dict.form.title}</h1>
        <p className="text-ink/70 mt-1">{dict.form.subtitle}</p>
        <p className="text-sm text-orangeDark bg-orange/10 border-2 border-orange/40 rounded-blob px-3 py-2 mt-3">
          {dict.form.moderationNotice}
        </p>
      </div>

      {error && <p className="bg-orange/10 border-2 border-orange text-orangeDark rounded-blob p-3">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label={dict.form.businessName} value={form.businessName} onChange={(v) => set('businessName', v)} required />
        <div>
          <TextField label={dict.form.city} value={form.city[locale]} onChange={(v) => setLocalized('city', v)} required />
          <p className="text-xs text-tealGreen font-semibold mt-1">
            {translating.city ? `⏳ ${dict.form.translating}` : `✨ ${dict.form.cityAutoTranslate}`}
          </p>
        </div>
      </div>

      <div>
        <TextArea label={dict.form.description} value={form.description[locale]} onChange={(v) => setLocalized('description', v)} />
        <p className="text-xs text-tealGreen font-semibold mt-1">
          {translating.description ? `⏳ ${dict.form.translating}` : `✨ ${dict.form.descriptionAutoTranslate}`}
        </p>
      </div>

      <TextField label={dict.form.address} value={form.address} onChange={(v) => set('address', v)} />

      <div className="grid sm:grid-cols-3 gap-6">
        <FieldBlock label={dict.form.districts}>
          <CheckboxGroup name={dict.form.districts} options={DISTRICTS} labels={dict.districts} values={form.districts} onChange={(v) => set('districts', v)} />
        </FieldBlock>

        <FieldBlock label={dict.form.kashrutLevels}>
          <CheckboxGroup name={dict.form.kashrutLevels} options={KASHRUT_LEVELS} labels={dict.kashrut} values={form.kashrutLevels} onChange={(v) => set('kashrutLevels', v)} />
        </FieldBlock>

        <FieldBlock label={dict.form.cateringTypes}>
          <CheckboxGroup name={dict.form.cateringTypes} options={CATERING_TYPES} labels={dict.cateringType} values={form.cateringTypes} onChange={(v) => set('cateringTypes', v)} />
        </FieldBlock>
      </div>

      <TextField
        label={dict.form.maxGuests}
        type="number"
        value={form.maxGuests}
        onChange={(v) => set('maxGuests', v)}
        required
      />

      <FieldBlock label={dict.form.eventTypes}>
        <CheckboxGroup name={dict.form.eventTypes} options={EVENT_TYPES} labels={dict.eventTypes} values={form.eventTypes} onChange={(v) => set('eventTypes', v)} />
      </FieldBlock>

      <FieldBlock label={dict.form.menuCategories}>
        <CheckboxGroup name={dict.form.menuCategories} options={MENU_CATEGORIES} labels={dict.menuCategories} values={form.menuCategories} onChange={(v) => set('menuCategories', v)} />
      </FieldBlock>

      <FieldBlock label={dict.form.services}>
        <CheckboxGroup name={dict.form.services} options={ADDITIONAL_SERVICES} labels={dict.services} values={form.services} onChange={(v) => set('services', v)} />
      </FieldBlock>

      <InlineNumberField label={dict.form.priceFrom} value={form.priceFrom} onChange={(v) => set('priceFrom', v)} />

      <FieldBlock label={dict.form.packages.title}>
        <p className="text-sm text-ink/70 -mt-1">{dict.form.packages.subtitle}</p>

        <div className="mt-2 border-2 border-teal/20 rounded-blob p-4 bg-cream/50 space-y-4">
          <p className="font-display font-semibold text-teal text-sm">{dict.profile.packages.commonToAll}</p>

          <InlineNumberField label={dict.form.packages.minGuests} value={commonMinGuests} onChange={setCommonMinGuests} />

          <FieldBlock label={dict.form.packages.includedCategories}>
            <CheckboxGroup
              name={dict.form.packages.includedCategories}
              options={MENU_CATEGORIES}
              labels={dict.menuCategories}
              values={commonCategories}
              onChange={(next) => {
                const cat =
                  next.length > commonCategories.length
                    ? next.find((c) => !commonCategories.includes(c))
                    : commonCategories.find((c) => !next.includes(c));
                if (cat) toggleCommonCategory(cat);
              }}
            />
            {commonCategories.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-1">
                {commonCategories.map((cat) => (
                  <InlineNumberField
                    key={cat}
                    label={dict.menuCategories[cat]}
                    value={commonCategoryLimit(cat) ?? ''}
                    onChange={(v) => setCommonCategoryLimit(cat, v)}
                  />
                ))}
              </div>
            )}
          </FieldBlock>

          <div>
            <p className="text-sm font-display font-semibold text-teal mb-2">{dict.form.packages.addons}</p>
            {commonAddons.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-[3fr,auto,5rem,auto] items-center">
                <AddonsHeaderRow d={dict.form.packages} />
                {commonAddons.map((addon) => (
                  <Fragment key={addon.id}>
                    <TextField
                      label={dict.form.packages.addonName}
                      hideLabel
                      value={addon.name[locale]}
                      onChange={(v) => updateCommonAddon(addon.id, { name: { ...addon.name, [locale]: v } })}
                    />
                    <select
                      aria-label={dict.form.packages.addonPriceType}
                      value={addon.priceType}
                      onChange={(e) => updateCommonAddon(addon.id, { priceType: e.target.value })}
                      className="rounded-full border-2 border-teal/40 px-3 py-2 bg-cream focus-ring"
                    >
                      {ADDON_PRICE_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt === 'per_guest' ? dict.form.packages.priceTypePerGuest : dict.form.packages.priceTypeFlat}
                        </option>
                      ))}
                    </select>
                    <TextField
                      label={dict.form.packages.addonAmount}
                      hideLabel
                      type="number"
                      value={addon.amount}
                      onChange={(v) => updateCommonAddon(addon.id, { amount: v })}
                    />
                    <button
                      type="button"
                      onClick={() => removeCommonAddon(addon.id)}
                      aria-label={dict.form.packages.removeAddon}
                      className="text-red-600 hover:text-red-700 font-bold text-lg leading-none focus-ring rounded h-fit px-1"
                    >
                      ×
                    </button>
                  </Fragment>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addCommonAddon}
              className="mt-2 text-teal text-sm font-display font-semibold underline focus-ring rounded"
            >
              + {dict.form.packages.addAddon}
            </button>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {form.packages.map((pkg, pkgIndex) => (
            <PackageEditor
              key={pkg.id}
              pkg={pkg}
              dict={dict}
              locale={locale}
              commonCategories={commonCategories}
              commonAddonIds={commonAddonIds}
              commonMinGuests={commonMinGuests}
              onNameChange={(text) => setPackageName(pkgIndex, text)}
              onFieldChange={(patch) => updatePackage(pkgIndex, patch)}
              onRemove={() => removePackage(pkgIndex)}
              onAddAddon={() => addAddon(pkgIndex)}
              onRemoveAddon={(addonIndex) => removeAddon(pkgIndex, addonIndex)}
              onAddonFieldChange={(addonIndex, patch) => updateAddon(pkgIndex, addonIndex, patch)}
              onAddonNameChange={(addonIndex, text) => setAddonName(pkgIndex, addonIndex, text)}
            />
          ))}
          {form.packages.length === 0 && <p className="text-sm text-ink/50">{dict.form.packages.empty}</p>}
        </div>
        <button
          type="button"
          onClick={addPackage}
          className="mt-3 bg-tealGreen text-cream px-4 py-2 rounded-full font-display font-semibold focus-ring"
        >
          + {dict.form.packages.addPackage}
        </button>
      </FieldBlock>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label={dict.form.phone} value={form.phone} onChange={(v) => set('phone', v)} />
        <TextField label={dict.form.whatsapp} value={form.whatsapp} onChange={(v) => set('whatsapp', v)} />
        <TextField label={dict.form.email} type="email" value={form.email} onChange={(v) => set('email', v)} />
        <TextField label={dict.form.website} value={form.website} onChange={(v) => set('website', v)} />
        <TextField label={dict.form.instagram} value={form.instagram} onChange={(v) => set('instagram', v)} />
        <TextField label={dict.form.facebook} value={form.facebook} onChange={(v) => set('facebook', v)} />
      </div>

      <FieldBlock label={dict.form.photos}>
        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="block" />
        {uploading && <p className="text-sm text-ink/60 mt-1">{dict.form.saving}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {form.photos.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-16 w-16 object-cover rounded-lg border-2 border-teal/40" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={dict.form.removePhoto}
                className="absolute -top-2 -end-2 h-5 w-5 rounded-full bg-orangeDark text-cream text-xs leading-none flex items-center justify-center focus-ring"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock label={dict.form.videos}>
        <div className="flex gap-2">
          <input
            type="text"
            value={videoDraft}
            onChange={(e) => setVideoDraft(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 rounded-full border-2 border-teal/40 px-4 py-2 bg-cream focus-ring"
          />
          <button type="button" onClick={addVideo} className="bg-tealGreen text-cream px-4 py-2 rounded-full font-display font-semibold focus-ring">
            {dict.form.addVideoLink}
          </button>
        </div>
        <ul className="mt-2 text-sm text-ink/70 space-y-1">
          {form.videos.map((v, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="truncate">{v}</span>
              <button
                type="button"
                onClick={() => removeVideo(i)}
                className="text-orangeDark font-semibold hover:underline focus-ring rounded shrink-0"
              >
                {dict.form.removeVideoLink}
              </button>
            </li>
          ))}
        </ul>
      </FieldBlock>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange text-cream font-display font-bold px-6 py-2.5 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring disabled:opacity-60"
        >
          {saving ? dict.form.saving : dict.form.save}
        </button>
        <button type="button" onClick={() => router.push('/dashboard')} className="text-teal font-display font-semibold px-4 py-2.5 hover:text-orange focus-ring rounded">
          {dict.form.cancel}
        </button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, type = 'text', required, hideLabel }) {
  return (
    <label className="block space-y-1.5">
      {!hideLabel && <span className="text-sm font-display font-semibold text-teal">{label}</span>}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={hideLabel ? label : undefined}
        className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-cream focus-ring"
      />
    </label>
  );
}

function InlineNumberField({ label, value, onChange, required }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm font-display font-semibold text-teal">{label}</span>
      <input
        type="number"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-full border-2 border-teal/40 px-3 py-2 bg-cream focus-ring"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-display font-semibold text-teal">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-blob border-2 border-teal/40 px-4 py-2 bg-cream focus-ring"
      />
    </label>
  );
}

function PackageEditor({
  pkg,
  dict,
  locale,
  commonCategories,
  commonAddonIds,
  commonMinGuests,
  onNameChange,
  onFieldChange,
  onRemove,
  onAddAddon,
  onRemoveAddon,
  onAddonFieldChange,
  onAddonNameChange
}) {
  const d = dict.form.packages;
  const ownIncludedCategories = pkg.includedCategories.filter((cat) => !commonCategories.includes(cat));
  return (
    <div className="border-2 border-teal/30 rounded-blob p-4 space-y-3 bg-cream/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <TextField label={d.name} value={pkg.name[locale]} onChange={onNameChange} />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-orangeDark text-sm font-semibold underline focus-ring rounded shrink-0 mt-6"
        >
          {d.removePackage}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <InlineNumberField label={d.pricePerGuest} value={pkg.pricePerGuest} onChange={(v) => onFieldChange({ pricePerGuest: v })} />
        {!commonMinGuests && (
          <InlineNumberField label={d.minGuests} value={pkg.minGuests} onChange={(v) => onFieldChange({ minGuests: v })} />
        )}
      </div>

      <FieldBlock label={d.includedCategories}>
        <CheckboxGroup
          name={d.includedCategories}
          options={MENU_CATEGORIES.filter((cat) => !commonCategories.includes(cat))}
          labels={dict.menuCategories}
          values={ownIncludedCategories}
          onChange={(v) => {
            const nextIncluded = [...commonCategories, ...v];
            onFieldChange({
              includedCategories: nextIncluded,
              categoryLimits: Object.fromEntries(Object.entries(pkg.categoryLimits || {}).filter(([cat]) => nextIncluded.includes(cat)))
            });
          }}
        />
      </FieldBlock>

      {ownIncludedCategories.length > 0 && (
        <FieldBlock label={d.categoryLimits}>
          <div className="flex flex-wrap gap-4">
            {ownIncludedCategories.map((cat) => (
              <InlineNumberField
                key={cat}
                label={dict.menuCategories[cat]}
                value={pkg.categoryLimits?.[cat] ?? ''}
                onChange={(v) => onFieldChange({ categoryLimits: { ...pkg.categoryLimits, [cat]: v } })}
              />
            ))}
          </div>
        </FieldBlock>
      )}

      <div>
        <p className="text-sm font-display font-semibold text-teal mb-2">{d.addons}</p>
        {pkg.addons.some((a) => !commonAddonIds.includes(a.id)) && (
          <div className="grid gap-2 sm:grid-cols-[3fr,auto,5rem,auto] items-center">
            <AddonsHeaderRow d={d} />
            {pkg.addons.map((addon, addonIndex) => {
              if (commonAddonIds.includes(addon.id)) return null;
              return (
                <Fragment key={addon.id}>
                  <TextField label={d.addonName} hideLabel value={addon.name[locale]} onChange={(v) => onAddonNameChange(addonIndex, v)} />
                  <select
                    aria-label={d.addonPriceType}
                    value={addon.priceType}
                    onChange={(e) => onAddonFieldChange(addonIndex, { priceType: e.target.value })}
                    className="rounded-full border-2 border-teal/40 px-3 py-2 bg-cream focus-ring"
                  >
                    {ADDON_PRICE_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt === 'per_guest' ? d.priceTypePerGuest : d.priceTypeFlat}
                      </option>
                    ))}
                  </select>
                  <TextField
                    label={d.addonAmount}
                    hideLabel
                    type="number"
                    value={addon.amount}
                    onChange={(v) => onAddonFieldChange(addonIndex, { amount: v })}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveAddon(addonIndex)}
                    aria-label={d.removeAddon}
                    className="text-red-600 hover:text-red-700 font-bold text-lg leading-none focus-ring rounded h-fit px-1"
                  >
                    ×
                  </button>
                </Fragment>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onAddAddon}
          className="mt-2 text-teal text-sm font-display font-semibold underline focus-ring rounded"
        >
          + {d.addAddon}
        </button>
      </div>
    </div>
  );
}

function AddonsHeaderRow({ d }) {
  return (
    <>
      <span className="hidden sm:block text-sm font-display font-semibold text-teal">{d.addonName}</span>
      <span className="hidden sm:block text-sm font-display font-semibold text-teal">{d.addonPriceType}</span>
      <span className="hidden sm:block text-sm font-display font-semibold text-teal">{d.addonAmount}</span>
      <span className="hidden sm:block" />
    </>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="font-display font-bold text-teal">{label}</p>
      {children}
    </div>
  );
}
