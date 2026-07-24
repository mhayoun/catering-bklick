'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Logo } from './Logo';
import { useLanguage } from './LanguageProvider';
import { LOCALES } from '../lib/constants';

const LOCALE_LABEL = { he: 'עברית', en: 'English', fr: 'Français' };

export function SiteHeader() {
  const { locale, setLocale, dict } = useLanguage();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b-4 border-teal bg-cream sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0" onClick={() => setMenuOpen(false)}>
          <Logo className="h-11 w-11 shrink-0" />
          <span className="font-display font-extrabold text-base sm:text-xl text-teal leading-tight truncate">
            {dict.siteName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 font-display font-medium text-teal">
          <Link href="/" className="hover:text-orange focus-ring rounded">
            {dict.nav.search}
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-orange focus-ring rounded">
              {dict.nav.dashboard}
            </Link>
          )}
          {session?.user?.isAdmin && (
            <Link href="/admin" className="hover:text-orange focus-ring rounded">
              {dict.nav.admin}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="hidden md:block bg-limeLight border-2 border-teal rounded-full px-3 py-1 text-sm font-display font-semibold text-teal focus-ring cursor-pointer"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABEL[l]}
              </option>
            ))}
          </select>

          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hidden md:inline-block text-sm font-display font-semibold text-teal hover:text-orange focus-ring rounded"
            >
              {dict.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="hidden md:inline-block text-sm font-display font-semibold text-teal hover:text-orange focus-ring rounded"
            >
              {dict.nav.login}
            </button>
          )}

          <Link
            href={session ? '/dashboard/new' : '/login'}
            className="bg-orange text-cream font-display font-bold px-3 sm:px-4 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap focus-ring"
            onClick={() => setMenuOpen(false)}
          >
            {dict.nav.addBusiness}
          </Link>

          <button
            type="button"
            aria-label={dict.nav.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col items-center justify-center gap-1 h-9 w-9 shrink-0 border-2 border-teal rounded-full focus-ring"
          >
            <span className={`block h-0.5 w-4 bg-teal transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-4 bg-teal transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-4 bg-teal transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t-2 border-teal/20 bg-cream px-4 py-3 flex flex-col gap-3 font-display font-medium text-teal">
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="bg-limeLight border-2 border-teal rounded-full px-3 py-1.5 text-sm font-display font-semibold text-teal focus-ring cursor-pointer self-start"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABEL[l]}
              </option>
            ))}
          </select>

          <Link href="/" className="hover:text-orange focus-ring rounded" onClick={() => setMenuOpen(false)}>
            {dict.nav.search}
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-orange focus-ring rounded" onClick={() => setMenuOpen(false)}>
              {dict.nav.dashboard}
            </Link>
          )}
          {session?.user?.isAdmin && (
            <Link href="/admin" className="hover:text-orange focus-ring rounded" onClick={() => setMenuOpen(false)}>
              {dict.nav.admin}
            </Link>
          )}
          {session ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="text-start hover:text-orange focus-ring rounded"
            >
              {dict.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                signIn('google');
              }}
              className="text-start hover:text-orange focus-ring rounded"
            >
              {dict.nav.login}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
