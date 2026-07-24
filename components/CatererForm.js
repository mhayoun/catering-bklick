'use client';

import { useEffect, useState } from 'react';
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
  BEVERAGE_TYPES,
  ADDITIONAL_SERVICES,
  LOCALES
} from '../lib/constants';

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
  beverageTypes: [],
  services: [],
  phone: '',
  whatsapp: '',
  email: '',
  website: '',
  instagram: '',
  facebook: '',
  photos: [],
  videos: []
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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
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

      <FieldBlock label={dict.form.beverageTypes}>
        <CheckboxGroup name={dict.form.beverageTypes} options={BEVERAGE_TYPES} labels={dict.beverageTypes} values={form.beverageTypes} onChange={(v) => set('beverageTypes', v)} />
      </FieldBlock>

      <FieldBlock label={dict.form.services}>
        <CheckboxGroup name={dict.form.services} options={ADDITIONAL_SERVICES} labels={dict.services} values={form.services} onChange={(v) => set('services', v)} />
      </FieldBlock>

      <TextField label={dict.form.priceFrom} type="number" value={form.priceFrom} onChange={(v) => set('priceFrom', v)} />

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
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-16 w-16 object-cover rounded-lg border-2 border-teal/40" />
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
        <ul className="mt-2 text-sm text-ink/70 list-disc ps-5">
          {form.videos.map((v, i) => <li key={i}>{v}</li>)}
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

function TextField({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-display font-semibold text-teal">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-cream focus-ring"
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

function FieldBlock({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="font-display font-bold text-teal">{label}</p>
      {children}
    </div>
  );
}
