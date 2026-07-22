'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';

export function CatererCard({ caterer }) {
  const { dict, t } = useLanguage();
  const photo = caterer.photos?.[0];

  return (
    <Link
      href={`/caterer/${caterer.id}`}
      className="group block bg-white border-4 border-eggplant rounded-blob overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-1 transition-transform focus-ring"
    >
      <div className="h-40 bg-turmericLight overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={caterer.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-eggplant/50 font-display">
            {caterer.businessName}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-lg text-eggplant group-hover:text-paprika">
            {caterer.businessName}
          </h3>
          <span className="text-xs font-display font-bold bg-zaatar text-cream px-2 py-1 rounded-full whitespace-nowrap">
            {dict.cateringType[caterer.cateringType]}
          </span>
        </div>
        <p className="text-sm text-ink/70 line-clamp-2">{caterer.description}</p>
        <div className="flex items-center justify-between text-sm font-body text-eggplant/80 pt-1">
          <span>{caterer.city}</span>
          <span>{t('card.guestsUpTo', { n: caterer.maxGuests })}</span>
        </div>
        {caterer.priceFrom && (
          <p className="text-sm font-display font-semibold text-paprika">
            {dict.card.from} ₪{caterer.priceFrom} {dict.card.perGuest}
          </p>
        )}
      </div>
    </Link>
  );
}
