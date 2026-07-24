'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import { Logo } from '../../../components/Logo';
import { pickLocalized, toArrayField } from '../../../lib/localized';

export default function CatererProfilePage({ params }) {
  const { dict, locale } = useLanguage();
  const [caterer, setCaterer] = useState(undefined);

  useEffect(() => {
    fetch(`/api/caterers/${params.id}`)
      .then((r) => r.json())
      .then((data) => setCaterer(data.caterer || null));
  }, [params.id]);

  if (caterer === undefined) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-eggplant">…</div>;
  }
  if (caterer === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Logo className="h-16 w-16 mx-auto mb-4" />
        <p className="text-eggplant font-display text-xl">404</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <Link href="/" className="text-paprika font-display font-semibold hover:underline focus-ring rounded">
        ← {dict.profile.backToSearch}
      </Link>

      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-eggplant">{caterer.businessName}</h1>
          <p className="text-ink/70 mt-1">{caterer.city}</p>
        </div>
        <span className="bg-zaatar text-cream font-display font-bold px-3 py-1.5 rounded-full text-sm">
          {toArrayField(caterer, 'cateringTypes', 'cateringType').map((ct) => dict.cateringType[ct]).join(' + ')}
          {' · '}
          {toArrayField(caterer, 'kashrutLevels', 'kashrut').map((k) => dict.kashrut[k]).join(' + ')}
        </span>
      </header>

      {caterer.photos?.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {caterer.photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${caterer.businessName} ${i + 1}`}
              className="w-full h-40 object-cover rounded-blob border-4 border-eggplant"
            />
          ))}
        </section>
      )}

      <section>
        <h2 className="font-display font-bold text-xl text-eggplant mb-2">{dict.profile.about}</h2>
        <p className="text-ink/80">{pickLocalized(caterer.description, locale)}</p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-eggplant mb-3">{dict.profile.menu}</h2>
        <div className="flex flex-wrap gap-2">
          {(caterer.menuCategories || []).map((m) => (
            <span key={m} className="bg-turmericLight border-2 border-eggplant/40 rounded-full px-3 py-1 text-sm">
              {dict.menuCategories[m]}
            </span>
          ))}
          {(caterer.beverageTypes || []).map((b) => (
            <span key={b} className="bg-turmericLight border-2 border-eggplant/40 rounded-full px-3 py-1 text-sm">
              {dict.beverageTypes[b]}
            </span>
          ))}
        </div>
      </section>

      {caterer.services?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-eggplant mb-3">{dict.profile.services}</h2>
          <div className="flex flex-wrap gap-2">
            {caterer.services.map((s) => (
              <span key={s} className="bg-zaatar/20 border-2 border-zaatar rounded-full px-3 py-1 text-sm text-zaatar font-semibold">
                {dict.services[s]}
              </span>
            ))}
          </div>
        </section>
      )}

      {caterer.videos?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-eggplant mb-3">{dict.profile.videos}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {caterer.videos.map((v, i) => (
              <div key={i} className="aspect-video rounded-blob overflow-hidden border-4 border-eggplant">
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

      <section className="bg-white/70 border-4 border-eggplant rounded-blob p-6">
        <h2 className="font-display font-bold text-xl text-eggplant mb-4">{dict.profile.contact}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {caterer.address && <p><strong>{dict.profile.address}:</strong> {caterer.address}</p>}
          {caterer.phone && (
            <a href={`tel:${caterer.phone}`} className="text-paprika font-semibold hover:underline focus-ring rounded">
              📞 {dict.profile.call}: {caterer.phone}
            </a>
          )}
          {caterer.whatsapp && (
            <a
              href={`https://wa.me/${caterer.whatsapp.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-paprika font-semibold hover:underline focus-ring rounded"
            >
              💬 {dict.profile.whatsapp}
            </a>
          )}
          {caterer.email && (
            <a href={`mailto:${caterer.email}`} className="text-paprika font-semibold hover:underline focus-ring rounded">
              ✉️ {caterer.email}
            </a>
          )}
          {caterer.website && (
            <a href={caterer.website} target="_blank" rel="noreferrer" className="text-paprika font-semibold hover:underline focus-ring rounded">
              🌐 {dict.profile.website}
            </a>
          )}
          {caterer.instagram && (
            <a href={caterer.instagram} target="_blank" rel="noreferrer" className="text-paprika font-semibold hover:underline focus-ring rounded">
              📷 Instagram
            </a>
          )}
          {caterer.facebook && (
            <a href={caterer.facebook} target="_blank" rel="noreferrer" className="text-paprika font-semibold hover:underline focus-ring rounded">
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
