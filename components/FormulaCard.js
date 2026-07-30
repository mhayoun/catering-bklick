'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { pickLocalized } from '../lib/localized';

export function FormulaCard({ caterer, pkg }) {
  const { dict, locale } = useLanguage();
  const photo = caterer.photos?.[0];

  return (
    <Link
      href={`/caterer/${caterer.id}#pkg-${pkg.id}`}
      className="group block bg-white border-4 border-teal rounded-blob overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-1 transition-transform focus-ring"
    >
      <div className="h-40 bg-limeLight overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={caterer.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-teal/50 font-display">
            {caterer.businessName}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs font-display font-semibold text-teal/70">{caterer.businessName}</p>
        <h3 className="font-display font-bold text-lg text-teal group-hover:text-orange">
          {pickLocalized(pkg.name, locale)}
        </h3>
        <p className="text-sm font-display font-semibold text-orange">
          ₪{Number(pkg.pricePerGuest).toLocaleString()} {dict.card.perGuest}
        </p>
        {pkg.minGuests && (
          <p className="text-xs text-ink/60">{dict.profile.packages.minGuestsNote.replace('{n}', pkg.minGuests)}</p>
        )}
        {pickLocalized(caterer.city, locale) && (
          <p className="text-sm font-body text-teal/80">{pickLocalized(caterer.city, locale)}</p>
        )}
      </div>
    </Link>
  );
}
