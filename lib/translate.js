// Zero-config translation: uses the free MyMemory API by default (no signup
// needed, generous enough for short catering descriptions). If a
// GOOGLE_TRANSLATE_API_KEY is configured, Google Cloud Translation is used
// instead for better quality / higher volume - useful once the directory
// grows beyond MyMemory's free daily limits.

const LOCALES = ['he', 'en', 'fr'];

export async function autoTranslate(text, sourceLocale) {
  const source = LOCALES.includes(sourceLocale) ? sourceLocale : 'he';
  const clean = (text || '').trim();

  if (!clean) return { he: '', en: '', fr: '' };

  const result = { [source]: clean };
  const targets = LOCALES.filter((l) => l !== source);

  await Promise.all(
    targets.map(async (target) => {
      try {
        result[target] = process.env.GOOGLE_TRANSLATE_API_KEY
          ? await translateWithGoogle(clean, source, target)
          : await translateWithMyMemory(clean, source, target);
      } catch (err) {
        // Never let a translation hiccup block saving the listing -
        // fall back to the original text for that language.
        result[target] = clean;
      }
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
