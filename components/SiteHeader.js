'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Logo } from './Logo';
import { useLanguage } from './LanguageProvider';
import { LOCALES } from '../lib/constants';

const LOCALE_LABEL = { he: 'עברית', en: 'English', fr: 'Français' };

export function SiteHeader() {
  const { locale, setLocale, dict, t } = useLanguage();
  const { data: session } = useSession();

  return (
    <header className="border-b-4 border-eggplant bg-cream sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo className="h-11 w-11" />
          <span className="font-display font-extrabold text-lg sm:text-xl text-eggplant leading-tight">
            {dict.siteName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 font-display font-medium text-eggplant">
          <Link href="/" className="hover:text-paprika focus-ring rounded">
            {dict.nav.search}
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-paprika focus-ring rounded">
              {dict.nav.dashboard}
            </Link>
          )}
          {session?.user?.isAdmin && (
            <Link href="/admin" className="hover:text-paprika focus-ring rounded">
              {dict.nav.admin}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="bg-turmericLight border-2 border-eggplant rounded-full px-3 py-1 text-sm font-display font-semibold text-eggplant focus-ring cursor-pointer"
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
              className="hidden sm:inline-block text-sm font-display font-semibold text-eggplant hover:text-paprika focus-ring rounded"
            >
              {dict.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="hidden sm:inline-block text-sm font-display font-semibold text-eggplant hover:text-paprika focus-ring rounded"
            >
              {dict.nav.login}
            </button>
          )}

          <Link
            href={session ? '/dashboard/new' : '/login'}
            className="bg-paprika text-cream font-display font-bold px-3 sm:px-4 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap focus-ring"
          >
            {dict.nav.addBusiness}
          </Link>
        </div>
      </div>
    </header>
  );
}
