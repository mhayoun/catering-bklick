'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import { Logo } from '../../../components/Logo';
import { ProposalModal } from '../../../components/ProposalModal';
import { pickLocalized, toArrayField } from '../../../lib/localized';
import { estimatePackageTotal, cheapestPackageEstimate } from '../../../lib/pricing';

export default function CatererProfilePage({ params }) {
  const { dict, locale } = useLanguage();
  const [caterer, setCaterer] = useState(undefined);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState('');

  useEffect(() => {
    fetch(`/api/caterers/${params.id}`)
      .then((r) => r.json())
      .then((data) => setCaterer(data.caterer || null));
  }, [params.id]);

  const photoCount = caterer?.photos?.length || 0;

  useEffect(() => {
    if (lightboxIndex < 0) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') setLightboxIndex(-1);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % photoCount);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + photoCount) % photoCount);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, photoCount]);

  if (caterer === undefined) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">…</div>;
  }
  if (caterer === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Logo className="h-16 w-16 mx-auto mb-4" />
        <p className="text-teal font-display text-xl">404</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <Link href="/" className="text-orange font-display font-semibold hover:underline focus-ring rounded">
        ← {dict.profile.backToSearch}
      </Link>

      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-teal">{caterer.businessName}</h1>
          <p className="text-ink/70 mt-1">{pickLocalized(caterer.city, locale)}</p>
        </div>
        <span className="bg-tealGreen text-cream font-display font-bold px-3 py-1.5 rounded-full text-sm">
          {toArrayField(caterer, 'cateringTypes', 'cateringType').map((ct) => dict.cateringType[ct]).join(' + ')}
          {' · '}
          {toArrayField(caterer, 'kashrutLevels', 'kashrut').map((k) => dict.kashrut[k]).join(' + ')}
        </span>
      </header>

      {caterer.whatsapp && (
        <button
          type="button"
          onClick={() => setProposalOpen(true)}
          className="bg-orange text-cream font-display font-bold px-5 py-3 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring inline-flex items-center gap-2"
        >
          💬 {dict.proposal.cta}
        </button>
      )}

      {caterer.photos?.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {caterer.photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="focus-ring rounded-blob"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${caterer.businessName} ${i + 1}`}
                className="w-full h-40 object-cover rounded-blob border-4 border-teal cursor-pointer hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </section>
      )}

      {lightboxIndex >= 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(-1)}
        >
          <button
            type="button"
            aria-label={dict.profile.galleryClose}
            onClick={() => setLightboxIndex(-1)}
            className="absolute top-4 end-4 h-10 w-10 rounded-full bg-cream/10 text-cream text-2xl leading-none flex items-center justify-center hover:bg-cream/20 focus-ring"
          >
            ×
          </button>

          {photoCount > 1 && (
            <button
              type="button"
              aria-label={dict.profile.galleryPrev}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i - 1 + photoCount) % photoCount);
              }}
              className="absolute start-2 sm:start-6 h-11 w-11 rounded-full bg-cream/10 text-cream text-2xl leading-none flex items-center justify-center hover:bg-cream/20 focus-ring"
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={caterer.photos[lightboxIndex]}
            alt={`${caterer.businessName} ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-blob"
            onClick={(e) => e.stopPropagation()}
          />

          {photoCount > 1 && (
            <button
              type="button"
              aria-label={dict.profile.galleryNext}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i + 1) % photoCount);
              }}
              className="absolute end-2 sm:end-6 h-11 w-11 rounded-full bg-cream/10 text-cream text-2xl leading-none flex items-center justify-center hover:bg-cream/20 focus-ring"
            >
              ›
            </button>
          )}

          {photoCount > 1 && (
            <span dir="ltr" className="absolute bottom-4 start-1/2 -translate-x-1/2 text-cream/80 text-sm font-display">
              {lightboxIndex + 1} / {photoCount}
            </span>
          )}
        </div>
      )}

      <section>
        <h2 className="font-display font-bold text-xl text-teal mb-2">{dict.profile.about}</h2>
        <p className="text-ink/80">{pickLocalized(caterer.description, locale)}</p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-teal mb-3">{dict.profile.menu}</h2>
        <div className="flex flex-wrap gap-2">
          {(caterer.menuCategories || []).filter((m) => dict.menuCategories[m]).map((m) => (
            <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-3 py-1 text-sm">
              {dict.menuCategories[m]}
            </span>
          ))}
        </div>
      </section>

      {caterer.packages?.length > 0 && (
        <PackagesSection caterer={caterer} dict={dict} locale={locale} guestCount={guestCount} setGuestCount={setGuestCount} />
      )}

      {caterer.services?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-teal mb-3">{dict.profile.services}</h2>
          <div className="flex flex-wrap gap-2">
            {caterer.services.filter((s) => dict.services[s]).map((s) => (
              <span key={s} className="bg-tealGreen/20 border-2 border-tealGreen rounded-full px-3 py-1 text-sm text-tealGreen font-semibold">
                {dict.services[s]}
              </span>
            ))}
          </div>
        </section>
      )}

      {caterer.videos?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-teal mb-3">{dict.profile.videos}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {caterer.videos.map((v, i) => (
              <div key={i} className="aspect-video rounded-blob overflow-hidden border-4 border-teal">
                <iframe
                  src={toEmbedUrl(v)}
                  title={`video-${i}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white/70 border-4 border-teal rounded-blob p-6">
        <h2 className="font-display font-bold text-xl text-teal mb-4">{dict.profile.contact}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {caterer.address && <p><strong>{dict.profile.address}:</strong> {caterer.address}</p>}
          {caterer.phone && (
            <a href={`tel:${caterer.phone}`} className="text-orange font-semibold hover:underline focus-ring rounded">
              📞 {dict.profile.call}: {caterer.phone}
            </a>
          )}
          {caterer.whatsapp && (
            <a
              href={`https://wa.me/${caterer.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-orange font-semibold hover:underline focus-ring rounded"
            >
              💬 {dict.profile.whatsapp}
            </a>
          )}
          {caterer.email && (
            <a href={`mailto:${caterer.email}`} className="text-orange font-semibold hover:underline focus-ring rounded">
              ✉️ {caterer.email}
            </a>
          )}
          {caterer.website && (
            <a href={caterer.website} target="_blank" rel="noreferrer" className="text-orange font-semibold hover:underline focus-ring rounded">
              🌐 {dict.profile.website}
            </a>
          )}
          {caterer.instagram && (
            <a href={caterer.instagram} target="_blank" rel="noreferrer" className="text-orange font-semibold hover:underline focus-ring rounded">
              📷 Instagram
            </a>
          )}
          {caterer.facebook && (
            <a href={caterer.facebook} target="_blank" rel="noreferrer" className="text-orange font-semibold hover:underline focus-ring rounded">
              👍 Facebook
            </a>
          )}
        </div>
      </section>

      {proposalOpen && caterer.whatsapp && (
        <ProposalModal caterer={caterer} onClose={() => setProposalOpen(false)} />
      )}
    </div>
  );
}

function PackagesSection({ caterer, dict, locale, guestCount, setGuestCount }) {
  const d = dict.profile.packages;
  const cheapest = cheapestPackageEstimate(caterer, guestCount);

  return (
    <section>
      <h2 className="font-display font-bold text-xl text-teal mb-3">{d.title}</h2>

      <label className="block max-w-xs mb-4">
        <span className="text-sm font-display font-semibold text-teal">{d.guestCountLabel}</span>
        <input
          type="number"
          min="1"
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          className="mt-1.5 w-full rounded-full border-2 border-teal/40 px-4 py-2 bg-cream focus-ring"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        {caterer.packages.map((pkg) => {
          const estimate = estimatePackageTotal(pkg, guestCount);
          const isCheapest = cheapest && cheapest.pkg.id === pkg.id;
          return (
            <div
              key={pkg.id}
              className={`border-4 rounded-blob p-4 space-y-2 ${isCheapest ? 'border-orange bg-orange/5' : 'border-teal/30 bg-white/70'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-teal">{pickLocalized(pkg.name, locale)}</h3>
                {isCheapest && (
                  <span className="text-xs font-display font-bold bg-orange text-cream px-2 py-1 rounded-full whitespace-nowrap">
                    {d.cheapestBadge}
                  </span>
                )}
              </div>

              <p className="text-sm text-ink/70">₪{pkg.pricePerGuest} {d.perGuest}</p>
              {pkg.minGuests && <p className="text-xs text-ink/50">{d.minGuestsNote.replace('{n}', pkg.minGuests)}</p>}

              {pkg.includedCategories?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pkg.includedCategories.filter((m) => dict.menuCategories[m]).map((m) => (
                    <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-2.5 py-0.5 text-xs">
                      {dict.menuCategories[m]}
                    </span>
                  ))}
                </div>
              )}

              {estimate && (
                <div className="pt-2 border-t-2 border-teal/10">
                  <p className="font-display font-extrabold text-lg text-teal">
                    ₪{Math.round(estimate.total).toLocaleString()} <span className="text-sm font-body font-normal text-ink/60">{d.estimatedTotal}</span>
                  </p>
                  {estimate.belowMinimum && <p className="text-xs text-orangeDark mt-1">{d.belowMinimum}</p>}
                  {estimate.availableAddons.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-ink/50">{d.addonsIncluded}</p>
                      <ul className="text-xs text-ink/60 space-y-0.5">
                        {estimate.availableAddons.map((addon) => (
                          <li key={addon.id}>
                            + {pickLocalized(addon.name, locale)}: ₪{Math.round(addon.estimatedAmount).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function toEmbedUrl(url) {
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/))([\w-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
}
