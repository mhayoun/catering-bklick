'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { pickLocalized } from '../lib/localized';

export function FormulaCard({ caterer, pkg, matchCount, keyword }) {
  const { dict, t, locale } = useLanguage();
  const photo = caterer.photos?.[0];
  const hl = keyword ? `?hl=${encodeURIComponent(keyword)}` : '';

  return (
    <Link
      href={`/caterer/${caterer.id}${hl}#pkg-${pkg.id}`}
      className="group flex items-center gap-4 bg-white border-4 border-teal rounded-blob overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring p-2 sm:p-3"
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-blob overflow-hidden bg-limeLight">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={caterer.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-teal/50 font-display text-xs text-center px-1">
            {caterer.businessName}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-display font-semibold text-teal/70 truncate">{caterer.businessName}</p>
        <h3 className="font-display font-bold text-base sm:text-lg text-teal group-hover:text-orange truncate">
          {pickLocalized(pkg.name, locale)}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink/60">
          {pickLocalized(caterer.city, locale) && <span>{pickLocalized(caterer.city, locale)}</span>}
          {pkg.minGuests && <span>{dict.profile.packages.minGuestsNote.replace('{n}', pkg.minGuests)}</span>}
          {matchCount > 0 && (
            <span className="font-display font-semibold bg-yellow-300 text-ink px-2 py-0.5 rounded-full">
              {t('card.matchCount', { n: matchCount })}
            </span>
          )}
        </div>
      </div>

      <p className="shrink-0 text-end text-sm sm:text-base font-display font-bold text-orange whitespace-nowrap">
        ₪{Number(pkg.pricePerGuest).toLocaleString()}
        <span className="block text-xs font-body font-normal text-ink/50">{dict.card.perGuest}</span>
      </p>
    </Link>
  );
}
