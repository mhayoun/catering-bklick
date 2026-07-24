// Zero-config translation: uses the free MyMemory API by default (no signup
// needed, generous enough for short catering descriptions). If a
// GOOGLE_TRANSLATE_API_KEY is configured, Google Cloud Translation is used
// instead for better quality / higher volume - useful once the directory
// grows beyond MyMemory's free daily limits.

const LOCALES = ['he', 'en', 'fr'];

// Translates a single string from one locale to another. Used both by the
// live in-form preview (POST /api/translate, one field/one locale at a time)
// and by fillLocalizedGaps below. Never throws - falls back to the original
// text so a translation hiccup can never block saving a listing.
export async function translateOne(text, source, target) {
  const clean = (text || '').trim();
  if (!clean) return '';
  try {
    return process.env.GOOGLE_TRANSLATE_API_KEY
      ? await translateWithGoogle(clean, source, target)
      : await translateWithMyMemory(clean, source, target);
  } catch (err) {
    return clean;
  }
}

// Fills in only the BLANK locales of a `{ he, en, fr }` field, translating
// from whichever locale already has text. Existing text - whether typed by
// the owner or already translated - is never touched or overwritten. This
// is the save-time safety net for whatever the live in-form preview (see
// CatererForm) didn't already fill in (e.g. a language tab the owner never
// visited).
export async function fillLocalizedGaps(value) {
  const result = { he: '', en: '', fr: '', ...value };
  const source = LOCALES.find((l) => result[l]?.trim());
  if (!source) return result; // nothing typed anywhere - nothing to translate from

  await Promise.all(
    LOCALES.filter((l) => l !== source && !result[l]?.trim()).map(async (target) => {
      result[target] = await translateOne(result[source], source, target);
    })
  );

  return result;
}

async function translateWithMyMemory(text, source, target) {
  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
  if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL);

  const res = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
  if (!res.ok) throw new Error('MyMemory translation request failed');
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated || /MYMEMORY WARNING/i.test(translated)) throw new Error('MyMemory returned no translation');
  return translated;
}

async function translateWithGoogle(text, source, target) {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' })
    }
  );
  if (!res.ok) throw new Error('Google Translate request failed');
  const data = await res.json();
  const translated = data?.data?.translations?.[0]?.translatedText;
  if (!translated) throw new Error('Google Translate returned no translation');
  return translated;
}
