'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../components/LanguageProvider';
import { Logo } from '../../../components/Logo';
import { ProposalModal } from '../../../components/ProposalModal';
import { Highlight } from '../../../components/Highlight';
import { pickLocalized, toArrayField } from '../../../lib/localized';
import { estimatePackageTotal, cheapestPackageEstimate } from '../../../lib/pricing';
import { countOccurrences, parseKeywords } from '../../../lib/search';

// useSearchParams() must be read inside a Suspense boundary, or Next.js's production build can
// silently freeze it (it read fine in `next dev`, which skips that optimization) - this is what
// broke the "?hl=" highlight/auto-open-accordion feature specifically in production.
export default function CatererProfilePage(props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">…</div>}>
      <CatererProfilePageInner {...props} />
    </Suspense>
  );
}

function CatererProfilePageInner({ params }) {
  const { dict, locale } = useLanguage();
  const [caterer, setCaterer] = useState(undefined);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState('');
  const hl = useSearchParams().get('hl') || '';
  // Which search mode the visitor arrived from (?mode=formulas|a_la_carte) - when a caterer has
  // both formulas and à-la-carte menus, this decides which of the two accordions opens by
  // default, so someone who searched specifically for one doesn't have to click to reveal it.
  const arrivalMode = useSearchParams().get('mode') || '';

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
          <h1 className="font-display font-extrabold text-3xl text-teal">
            <Highlight text={caterer.businessName} query={hl} />
          </h1>
          <p className="text-ink/70 mt-1">
            <Highlight text={pickLocalized(caterer.city, locale)} query={hl} />
          </p>
        </div>
        <span className="bg-tealGreen text-cream font-display font-bold px-3 py-1.5 rounded-full text-sm">
          <Highlight text={toArrayField(caterer, 'cateringTypes', 'cateringType').map((ct) => dict.cateringType[ct]).join(' + ')} query={hl} />
          {' · '}
          <Highlight text={toArrayField(caterer, 'kashrutLevels', 'kashrut').map((k) => dict.kashrut[k]).join(' + ')} query={hl} />
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
        <p className="text-ink/80">
          <Highlight text={pickLocalized(caterer.description, locale)} query={hl} />
        </p>
      </section>

      {caterer.packages?.length > 0 && (
        <PackagesSection
          caterer={caterer}
          dict={dict}
          locale={locale}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          hl={hl}
          arrivalMode={arrivalMode}
        />
      )}

      {caterer.services?.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-teal mb-3">{dict.profile.services}</h2>
          <div className="flex flex-wrap gap-2">
            {caterer.services.filter((s) => dict.services[s]).map((s) => (
              <span key={s} className="bg-tealGreen/20 border-2 border-tealGreen rounded-full px-3 py-1 text-sm text-tealGreen font-semibold">
                <Highlight text={dict.services[s]} query={hl} />
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
          {caterer.address && (
            <p>
              <strong>{dict.profile.address}:</strong> <Highlight text={caterer.address} query={hl} />
            </p>
          )}
          {caterer.phone && (
            <a href={`tel:${caterer.phone}`} className="text-orange font-semibold hover:underline focus-ring rounded">
              📞 {dict.profile.call}: <span dir="ltr" className="inline-block">{caterer.phone}</span>
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

function PackagesSection({ caterer, dict, locale, guestCount, setGuestCount, hl, arrivalMode }) {
  const d = dict.profile.packages;
  const cheapest = cheapestPackageEstimate(caterer, guestCount);
  // Whether any search-highlighted term (comma/space separated) appears in the given text -
  // used to auto-open the accordion it's inside of, so a visitor arriving from search results
  // doesn't have to click through every collapsed section to find where their terms matched.
  const hlTerms = parseKeywords(hl);
  const hasMatch = (text) => hlTerms.some((term) => countOccurrences(text, term) > 0);

  // Fixed-price-per-guest formulas and à-la-carte item catalogs (pkg.type === 'a_la_carte')
  // are different enough in shape (price/min-guests/addons mean different things on each)
  // that comparing them together in one "common to all" block would be meaningless - each
  // gets its own group, with its own "common to all" comparison scoped to just that group.
  const formulaPackages = caterer.packages.filter((p) => p.type !== 'a_la_carte');
  const alaCartePackages = caterer.packages.filter((p) => p.type === 'a_la_carte');
  // Only worth an accordion (collapsed by default) when a visitor has to choose between the two -
  // a caterer with just one kind shows it plainly, nothing to collapse against. When both exist,
  // whichever search mode the visitor arrived from (?mode=formulas|a_la_carte) opens by default;
  // arriving from the plain "caterers" search (or a bookmarked/direct link) leaves both collapsed.
  const bothPresent = formulaPackages.length > 0 && alaCartePackages.length > 0;

  const groupProps = { dict, d, locale, hl, hasMatch, guestCount, cheapest };

  // The overall menu-category tags and the guest-count price calculator only make sense
  // alongside fixed-price formulas - an à-la-carte catalog has no per-guest price to calculate -
  // so both live inside the Formules group instead of as page-wide sections above it.
  const menuAndCalculator = (
    <>
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-teal mb-2">{dict.profile.menu}</h3>
        <div className="flex flex-wrap gap-2">
          {(caterer.menuCategories || []).filter((m) => dict.menuCategories[m]).map((m) => (
            <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-3 py-1 text-sm">
              <Highlight text={dict.menuCategories[m]} query={hl} />
            </span>
          ))}
        </div>
      </div>

      <h3 className="font-display font-bold text-lg text-teal mb-3">{d.title}</h3>
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
    </>
  );

  const renderGroup = (heading, packages, openWhenMode, extraContent) =>
    bothPresent ? (
      <details open={arrivalMode === openWhenMode} className="mb-4 border-2 border-teal/20 rounded-blob overflow-hidden">
        <summary className="cursor-pointer px-4 py-2.5 bg-teal/10 font-display font-bold text-lg text-teal focus-ring">
          {heading}
        </summary>
        <div className="p-4">
          {extraContent}
          <PackageGroup packages={packages} {...groupProps} />
        </div>
      </details>
    ) : (
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-teal/80 mb-2">{heading}</h3>
        {extraContent}
        <PackageGroup packages={packages} {...groupProps} />
      </div>
    );

  return (
    <section>
      {formulaPackages.length > 0 && renderGroup(dict.search.modeFormulas, formulaPackages, 'formulas', menuAndCalculator)}
      {alaCartePackages.length > 0 && renderGroup(dict.search.modeALaCarte, alaCartePackages, 'a_la_carte')}
    </section>
  );
}

function PackageGroup({ packages, dict, d, locale, hl, hasMatch, guestCount, cheapest }) {
  // Only worth extracting "common to all" when there's more than one package to compare.
  const comparable = packages.length > 1;

  // Minimum guest count, when every package shares the same one.
  const minGuestsValues = packages.map((p) => Number(p.minGuests) || 0);
  const commonMinGuests =
    comparable && minGuestsValues[0] > 0 && minGuestsValues.every((v) => v === minGuestsValues[0]) ? minGuestsValues[0] : null;

  // Add-ons (matched by id) present in every package - shown once instead of once per card,
  // regardless of whether they carry a real price or are "price on request" (amount 0).
  const addonIdSets = packages.map((p) => new Set((p.addons || []).map((a) => a.id)));
  const commonAddonIds = comparable && addonIdSets.length > 0 ? [...addonIdSets[0]].filter((id) => addonIdSets.every((s) => s.has(id))) : [];
  const commonAddons = commonAddonIds.map((id) => packages[0].addons.find((a) => a.id === id)).filter(Boolean);
  const commonBilledGuests = Math.max(Number(guestCount) || 0, commonMinGuests || 0);

  // Menu categories included in every package with the SAME choice count (shown once, in "common to all",
  // instead of repeated on each card). A category included everywhere but with a different count per package
  // (e.g. salads: choose 7 in one package, choose 8 in another) must stay on its own card - hoisting it here
  // would silently drop the per-package number instead of showing it.
  const categorySets = packages.map((p) => new Set(p.includedCategories || []));
  const commonCategoryLimit = (cat) => {
    const values = packages.map((p) => Number(p.categoryLimits?.[cat]) || null);
    return values.every((v) => v === values[0]) ? values[0] : null;
  };
  const commonCategories =
    comparable && categorySets.length > 0
      ? [...categorySets[0]].filter((cat) => {
          if (!dict.menuCategories[cat] || !categorySets.every((s) => s.has(cat))) return false;
          const values = packages.map((p) => Number(p.categoryLimits?.[cat]) || null);
          const varies = values.some((v) => v !== null) && !values.every((v) => v === values[0]);
          return !varies;
        })
      : [];

  // Specific menu items (e.g. individual salads) present in every package's own item list for a
  // given category - shown once in "common to all" instead of repeated on each card. Only computed
  // for categories where EVERY package actually lists items (not just a choice count).
  const itemizedCategories = comparable
    ? [...new Set(packages.flatMap((p) => Object.keys(p.categoryItems || {})))].filter((cat) =>
        packages.every((p) => (p.categoryItems?.[cat]?.length || 0) > 0)
      )
    : [];
  const commonItemIdsByCategory = Object.fromEntries(
    itemizedCategories.map((cat) => {
      const itemSets = packages.map((p) => new Set(p.categoryItems[cat].map((it) => it.id)));
      const commonIds = [...itemSets[0]].filter((itemId) => itemSets.every((s) => s.has(itemId)));
      return [cat, new Set(commonIds)];
    })
  );
  const commonItemsByCategory = Object.fromEntries(
    itemizedCategories.map((cat) => [cat, packages[0].categoryItems[cat].filter((it) => commonItemIdsByCategory[cat].has(it.id))])
  );

  return (
    <>
      {(commonMinGuests || commonCategories.length > 0 || commonAddons.length > 0 || itemizedCategories.some((cat) => commonItemsByCategory[cat].length > 0)) && (
        <div className="mb-4 border-4 border-teal/20 rounded-blob p-4 bg-cream/50 space-y-2">
          <p className="font-display font-semibold text-teal text-sm">{d.commonToAll}</p>
          {commonMinGuests && <p className="text-xs text-ink/60">{d.minGuestsNote.replace('{n}', commonMinGuests)}</p>}
          {commonCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {commonCategories.map((m) => (
                <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-2.5 py-0.5 text-xs">
                  <Highlight text={dict.menuCategories[m]} query={hl} />
                  {commonCategoryLimit(m) && ` · ${d.categoryChoiceCount.replace('{n}', commonCategoryLimit(m))}`}
                </span>
              ))}
            </div>
          )}
          {itemizedCategories
            .filter((cat) => commonItemsByCategory[cat].length > 0)
            .map((cat) => {
              const text = commonItemsByCategory[cat].map((item) => pickLocalized(item, locale)).join(', ');
              return (
                <details key={cat} open={hasMatch(text)} className="text-xs text-ink/60">
                  <summary className="cursor-pointer text-teal font-display font-semibold focus-ring rounded">
                    {dict.menuCategories[cat]} ({commonItemsByCategory[cat].length})
                  </summary>
                  <p className="pt-1 leading-relaxed">
                    <Highlight text={text} query={hl} />
                  </p>
                </details>
              );
            })}
          {commonAddons.length > 0 && (
            <details
              open={hasMatch(commonAddons.map((a) => pickLocalized(a.name, locale)).join(', '))}
              className="text-xs text-ink/60"
            >
              <summary className="cursor-pointer text-teal font-display font-semibold focus-ring rounded">
                {d.addonsIncluded} ({commonAddons.length})
              </summary>
              <ul className="pt-1 space-y-0.5">
                {commonAddons.map((addon) => {
                  const hasPrice = Number(addon.amount) > 0;
                  const estimatedAmount =
                    addon.priceType === 'per_guest' ? Number(addon.amount) * commonBilledGuests : Number(addon.amount);
                  return (
                    <li key={addon.id}>
                      + <Highlight text={pickLocalized(addon.name, locale)} query={hl} />:{' '}
                      {hasPrice ? (
                        <>
                          ₪{Number(addon.amount).toLocaleString()}
                          {addon.priceType === 'per_guest' ? ` ${d.perGuest}` : ` (${dict.form.packages.priceTypeFlat})`}
                          {commonBilledGuests > 0 && ` — ₪${Math.round(estimatedAmount).toLocaleString()} ${d.estimatedTotal}`}
                        </>
                      ) : (
                        d.priceOnRequest
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {packages.map((pkg) => {
          const estimate = estimatePackageTotal(pkg, guestCount);
          const isCheapest = cheapest && cheapest.pkg.id === pkg.id;
          return (
            <div
              key={pkg.id}
              id={`pkg-${pkg.id}`}
              className={`border-4 rounded-blob p-4 space-y-2 scroll-mt-24 ${isCheapest ? 'border-orange bg-orange/5' : 'border-teal/30 bg-white/70'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-teal">
                  <Highlight text={pickLocalized(pkg.name, locale)} query={hl} />
                </h3>
                <div className="flex items-center gap-2">
                  {pkg.sourceUrl && (
                    <a
                      href={pkg.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal/70 hover:underline focus-ring rounded whitespace-nowrap"
                    >
                      🔗 {d.viewSource}
                    </a>
                  )}
                  {isCheapest && (
                    <span className="text-xs font-display font-bold bg-orange text-cream px-2 py-1 rounded-full whitespace-nowrap">
                      {d.cheapestBadge}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-ink/70">₪{pkg.pricePerGuest} {d.perGuest}</p>
              {!commonMinGuests && pkg.minGuests && <p className="text-xs text-ink/50">{d.minGuestsNote.replace('{n}', pkg.minGuests)}</p>}

              {pkg.includedCategories?.filter((m) => dict.menuCategories[m] && !commonCategories.includes(m)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pkg.includedCategories.filter((m) => dict.menuCategories[m] && !commonCategories.includes(m)).map((m) => (
                    <span key={m} className="bg-limeLight border-2 border-teal/40 rounded-full px-2.5 py-0.5 text-xs">
                      <Highlight text={dict.menuCategories[m]} query={hl} />
                      {pkg.categoryLimits?.[m] && ` · ${d.categoryChoiceCount.replace('{n}', pkg.categoryLimits[m])}`}
                    </span>
                  ))}
                </div>
              )}

              {pkg.includedCategories
                ?.filter((m) => pkg.categoryItems?.[m]?.length > 0)
                .map((m) => {
                  const commonIds = commonItemIdsByCategory[m];
                  const items = commonIds ? pkg.categoryItems[m].filter((it) => !commonIds.has(it.id)) : pkg.categoryItems[m];
                  if (items.length === 0) return null;
                  const text = items.map((item) => pickLocalized(item, locale)).join(', ');
                  return (
                    <details key={`${m}-items`} open={hasMatch(text)} className="text-xs text-ink/60">
                      <summary className="cursor-pointer text-teal font-display font-semibold underline focus-ring rounded">
                        {dict.menuCategories[m]} · {commonIds ? d.extraOptions : d.viewOptions}
                      </summary>
                      <p className="pt-1 leading-relaxed">
                        <Highlight text={text} query={hl} />
                      </p>
                    </details>
                  );
                })}

              {estimate && (
                <div className="pt-2 border-t-2 border-teal/10">
                  <p className="font-display font-extrabold text-lg text-teal">
                    ₪{Math.round(estimate.total).toLocaleString()} <span className="text-sm font-body font-normal text-ink/60">{d.estimatedTotal}</span>
                  </p>
                  {estimate.belowMinimum && <p className="text-xs text-orangeDark mt-1">{d.belowMinimum}</p>}
                </div>
              )}

              {pkg.addons?.some((a) => !commonAddonIds.includes(a.id)) &&
                (() => {
                  const shownAddons = pkg.addons.filter((a) => !commonAddonIds.includes(a.id));
                  const renderAddonLine = (addon) => {
                    const hasPrice = Number(addon.amount) > 0;
                    const computed = estimate?.availableAddons.find((a) => a.id === addon.id);
                    return (
                      <li key={addon.id}>
                        + <Highlight text={pickLocalized(addon.name, locale)} query={hl} />:{' '}
                        {hasPrice ? (
                          <>
                            ₪{Number(addon.amount).toLocaleString()}
                            {addon.priceType === 'per_guest' ? ` ${d.perGuest}` : ` (${dict.form.packages.priceTypeFlat})`}
                            {computed && ` — ₪${Math.round(computed.estimatedAmount).toLocaleString()} ${d.estimatedTotal}`}
                          </>
                        ) : (
                          d.priceOnRequest
                        )}
                      </li>
                    );
                  };

                  // Menu-item catalogs (e.g. an à-la-carte holiday menu) tag every addon with the
                  // category it came from - group those into nested accordions instead of one long
                  // flat list. Packages with untagged addons (e.g. hand-authored formulas) keep the
                  // original single flat list.
                  const allCategorized = shownAddons.every((a) => a.category);

                  if (!allCategorized) {
                    return (
                      <details
                        open={hasMatch(shownAddons.map((a) => pickLocalized(a.name, locale)).join(', '))}
                        className="pt-2 border-t-2 border-teal/10 text-xs text-ink/60"
                      >
                        <summary className="cursor-pointer text-ink/50 font-display font-semibold focus-ring rounded">
                          {d.addonsIncluded} ({shownAddons.length})
                        </summary>
                        <ul className="pt-1 space-y-0.5">{shownAddons.map(renderAddonLine)}</ul>
                      </details>
                    );
                  }

                  const groups = [];
                  const groupIndexByKey = {};
                  shownAddons.forEach((addon) => {
                    const key = addon.category.en || pickLocalized(addon.category, locale);
                    if (!(key in groupIndexByKey)) {
                      groupIndexByKey[key] = groups.length;
                      groups.push({ category: addon.category, items: [] });
                    }
                    groups[groupIndexByKey[key]].items.push(addon);
                  });

                  return (
                    <div className="pt-2 border-t-2 border-teal/10 space-y-1">
                      {groups.map(({ category, items }) => (
                        <details
                          key={category.en}
                          open={hasMatch(items.map((a) => pickLocalized(a.name, locale)).join(', '))}
                          className="text-xs text-ink/60"
                        >
                          <summary className="cursor-pointer text-teal font-display font-semibold focus-ring rounded">
                            {pickLocalized(category, locale)} ({items.length})
                          </summary>
                          <ul className="pt-1 space-y-0.5 ps-2">{items.map(renderAddonLine)}</ul>
                        </details>
                      ))}
                    </div>
                  );
                })()}
            </div>
          );
        })}
      </div>
    </>
  );
}

function toEmbedUrl(url) {
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/))([\w-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
}
