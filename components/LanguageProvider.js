'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDictionary, t as translate } from '../lib/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('he');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('cbk_locale') : null;
    if (saved) setLocaleState(saved);
  }, []);

  useEffect(() => {
    const dict = getDictionary(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dict.dir;
    window.localStorage.setItem('cbk_locale', locale);
  }, [locale]);

  const setLocale = useCallback((next) => setLocaleState(next), []);
  const dict = getDictionary(locale);
  const t = useCallback((path, vars) => translate(dict, path, vars), [dict]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
