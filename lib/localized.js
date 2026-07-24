export function pickLocalized(value, locale) {
  if (!value) return '';
  if (typeof value === 'string') return value; // legacy plain-string data
  return value[locale] || value.he || value.en || value.fr || '';
}

// Reads a multi-select array field, falling back to an older singular
// field (e.g. record.cateringTypes ?? [record.cateringType]) for records
// saved before that field became multi-select.
export function toArrayField(record, pluralKey, singularKey) {
  if (Array.isArray(record?.[pluralKey])) return record[pluralKey];
  if (record?.[singularKey]) return [record[singularKey]];
  return [];
}
