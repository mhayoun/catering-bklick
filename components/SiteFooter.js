'use client';

import { Logo } from './Logo';
import { useLanguage } from './LanguageProvider';

export function SiteFooter() {
  const { dict } = useLanguage();
  return (
    <footer className="border-t-4 border-teal bg-teal text-cream mt-12">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-display font-bold">{dict.siteName}</span>
        </div>
        <p className="text-sm text-limeLight font-body">
          © {new Date().getFullYear()} {dict.siteName} · {dict.footer.rights} · {dict.footer.madeWith}
        </p>
      </div>
    </footer>
  );
}
