export function pickLocalized(value, locale) {
  if (!value) return '';
  if (typeof value === 'string') return value; // legacy plain-string data
  return value[locale] || value.he || value.en || value.fr || '';
}

// Used by CatererForm to turn a stored description/city field into an
// editable `{ he, en, fr }` draft. A legacy plain string is placed under
// `fallbackLocale` (the locale currently being viewed) since there's no way
// to know what language it was originally written in.
export function toLocalizedDraft(value, fallbackLocale) {
  if (!value) return { he: '', en: '', fr: '' };
  if (typeof value === 'string') return { he: '', en: '', fr: '', [fallbackLocale]: value };
  return { he: '', en: '', fr: '', ...value };
}

// Reads a multi-select array field, falling back to an older singular
// field (e.g. record.cateringTypes ?? [record.cateringType]) for records
// saved before that field became multi-select.
export function toArrayField(record, pluralKey, singularKey) {
  if (Array.isArray(record?.[pluralKey])) return record[pluralKey];
  if (record?.[singularKey]) return [record[singularKey]];
  return [];
}
