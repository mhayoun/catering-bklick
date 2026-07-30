'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { pickLocalized, toArrayField } from '../lib/localized';
import { cheapestPackageEstimate } from '../lib/pricing';

export function CatererCard({ caterer, guestCount, matchCount, keyword }) {
  const { dict, t, locale } = useLanguage();
  const photo = caterer.photos?.[0];
  const cateringTypes = toArrayField(caterer, 'cateringTypes', 'cateringType');
  const estimate = guestCount ? cheapestPackageEstimate(caterer, guestCount) : null;
  const href = keyword ? `/caterer/${caterer.id}?hl=${encodeURIComponent(keyword)}` : `/caterer/${caterer.id}`;

  return (
    <Link
      href={href}
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
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-lg text-teal group-hover:text-orange">
            {caterer.businessName}
          </h3>
          <span className="flex gap-1 shrink-0">
            {cateringTypes.map((ct) => (
              <span key={ct} className="text-xs font-display font-bold bg-tealGreen text-cream px-2 py-1 rounded-full whitespace-nowrap">
                {dict.cateringType[ct]}
              </span>
            ))}
          </span>
        </div>
        {matchCount > 0 && (
          <span className="inline-block text-xs font-display font-semibold bg-yellow-300 text-ink px-2 py-0.5 rounded-full">
            {t('card.matchCount', { n: matchCount })}
          </span>
        )}
        <p className="text-sm text-ink/70 line-clamp-2">{pickLocalized(caterer.description, locale)}</p>
        <div className="flex items-center justify-between text-sm font-body text-teal/80 pt-1">
          <span>{pickLocalized(caterer.city, locale)}</span>
          <span>{t('card.guestsUpTo', { n: caterer.maxGuests })}</span>
        </div>
        {estimate ? (
          <p className="text-sm font-display font-semibold text-orange">
            ₪{Math.round(estimate.total).toLocaleString()} {t('card.estimatedFor', { n: guestCount })}
          </p>
        ) : (
          caterer.priceFrom && (
            <p className="text-sm font-display font-semibold text-orange">
              {dict.card.from} ₪{caterer.priceFrom} {dict.card.perGuest}
            </p>
          )
        )}
      </div>
    </Link>
  );
}
