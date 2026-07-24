'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import { Logo } from '../../../components/Logo';
import { pickLocalized, toArrayField } from '../../../lib/localized';

export default function CatererProfilePage({ params }) {
  const { dict, locale } = useLanguage();
  const [caterer, setCaterer] = useState(undefined);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

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
          {(caterer.menuCategories || []).map((m) => (
            <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-3 py-1 text-sm">
              {dict.menuCategories[m]}
            </span>
          ))}
          {(caterer.beverageTypes || []).map((b) => (
            <span key={b} className="bg-limeLight border-2 border-teal/40 rounded-full px-3 py-1 text-sm">
              {dict.beverageTypes[b]}
            </span>
          ))}
        </div>
      </section>

      {caterer.services?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-teal mb-3">{dict.profile.services}</h2>
          <div className="flex flex-wrap gap-2">
            {caterer.services.map((s) => (
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
    </div>
  );
}

function toEmbedUrl(url) {
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/))([\w-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
}
