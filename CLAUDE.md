# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

קייטרינג בקליק — a trilingual (Hebrew/English/French) catering search & directory
platform for Israel, built with Next.js 14 (App Router). Customers search caterers
by district, kashrut level, catering type, event type, guest count, menu categories,
and services; business owners sign in with Google to create/manage listings, which
go through admin review before appearing in public search.

## Commands

```bash
npm install
npm run dev      # start dev server at http://localhost:3000
npm run build
npm run start    # serve production build
npm run lint     # next lint
```

There is no test suite configured. `.env.example` documents every environment
variable; copy it to `.env.local` before running locally. The app has fallbacks
for every external service (see below), so it runs with zero configuration.

## Architecture

### Data layer: KV-or-memory (`lib/store.js`)

All persistence goes through `lib/store.js`. It talks to Vercel KV (Redis) when
`KV_REST_API_URL`/`KV_REST_API_TOKEN` are set; otherwise it falls back to an
in-memory `Map` on `globalThis` (seeded from `data/seed.js`), which persists only
for the life of the dev server process. Every function in the module (`listCaterers`,
`getCaterer`, `upsertCaterer`, `setCatererStatus`, `searchCaterers`, etc.) handles
both backends internally — callers never branch on which store is active. When
adding a new data operation, extend this file rather than reaching for `kv`
directly elsewhere.

### Moderation workflow

Every `upsertCaterer` (create or edit, by the owner) forces `status: 'pending_review'`
and clears `reviewedBy`/`reviewedAt`/`rejectionReason` — status can only change via
`setCatererStatus()`, which only admin-gated API routes call. Consequences:
- `GET /api/caterers` (public search) filters to `status === 'approved'` only.
- `GET /api/caterers/[id]` allows non-approved records only for the owner or an admin.
- Editing an already-approved listing knocks it back to pending until re-approved.
- Admin review lives at `/admin` (`app/admin/page.js`) backed by
  `app/api/admin/pending/route.js` (list) and
  `app/api/admin/caterers/[id]/review/route.js` (approve/reject).
- Admin-ness is `isAdminEmail()` in `lib/admin.js`, driven by the comma-separated
  `ADMIN_EMAILS` env var (default `joetiger05@gmail.com`), checked case-insensitively.

### Auth (`lib/auth.js`)

NextAuth with `session: { strategy: 'jwt' }`. Google OAuth is the real provider,
enabled only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set. When they are
*not* set AND `NODE_ENV !== 'production'`, a `CredentialsProvider` dev-only fallback
(`id: 'dev-demo'`) is added that authorizes any email with no password check — this
is what powers the "Continue as Demo Owner" button on `/login`. Do not weaken the
double gate (`!hasGoogleCreds && NODE_ENV !== 'production'`) on this provider; it
exists specifically so it can never be reachable in a real deployment.
`session.user.isAdmin` is computed via `isAdminEmail()` in the `session` callback.

### Single source of truth for criteria (`lib/constants.js`)

Search filters and the registration form are required to expose *exactly* the same
options (product requirement). Both `components/FilterSidebar.js` and
`components/CatererForm.js` render their checkboxes/selects by iterating the arrays
in `lib/constants.js` (`DISTRICTS`, `KASHRUT_LEVELS`, `CATERING_TYPES`, `EVENT_TYPES`,
`MENU_CATEGORIES`, `BEVERAGE_TYPES`, `ADDITIONAL_SERVICES`, `GUEST_COUNT_BRACKETS`).
Add or rename a criterion there and both UIs, plus `lib/i18n.js` translations for the
new key, pick it up — never hardcode an option list in a component.

Several caterer fields are multi-select arrays (`districts`, `kashrutLevels`,
`cateringTypes`) but older/seed records may have the singular legacy field
(`district`, `kashrut`, `cateringType`). `lib/localized.js#toArrayField()` and the
`matches()` filter logic in `lib/store.js` both fall back from plural → singular —
preserve that fallback when touching either.

### i18n (`lib/i18n.js` + `components/LanguageProvider.js`)

Locale is client-side React context (`LanguageProvider`), persisted to
`localStorage` (`cbk_locale`), defaulting to `he`. `he` is RTL (`RTL_LOCALES` in
`lib/constants.js`); switching locale sets `document.documentElement.lang`/`dir`
directly. Use `useLanguage()` → `{ locale, setLocale, dict, t }` in client components;
`t('path.to.key', vars)` looks up `lib/i18n.js`'s per-locale dictionaries.

Free-text fields (currently the caterer "short description") are stored as
`{ he, en, fr }` objects rather than a single string. `lib/localized.js#pickLocalized()`
reads the right one for the active locale, falling back `he → en → fr`, and also
handles legacy plain-string data. Never assume a description field is a string when
rendering it.

### Auto-translation (`lib/translate.js`)

On caterer create/update, the description is auto-translated into the two languages
the owner didn't type it in, via `autoTranslate(text, sourceLocale)`. Uses the free
MyMemory API by default; switches to Google Cloud Translation automatically if
`GOOGLE_TRANSLATE_API_KEY` is set. Translation failures are swallowed per-target-language
(falls back to the original text) — a translation hiccup must never block saving a
listing. The PUT route (`app/api/caterers/[id]/route.js`) skips re-translation when
the text for that language is unchanged from the stored version, to avoid wasted API
calls; only the language actually being edited gets re-translated.

### Photo upload (`app/api/upload/route.js`)

Uploads to Vercel Blob under `caterers/{ownerEmail}/{timestamp}-{filename}`. Returns
a clear 500 error if `BLOB_READ_WRITE_TOKEN` isn't configured rather than failing
silently — the rest of the app (listing without photos) still works.

### Route structure

```
app/
  page.js                              Home: hero, search filters, results grid
  caterer/[id]/page.js                 Public caterer profile
  login/page.js                        Google sign-in (+ dev demo login)
  dashboard/page.js                    Owner's own listings
  dashboard/new/page.js                Registration form (create)
  dashboard/[id]/edit/page.js          Registration form (edit)
  admin/page.js                        Pending-listing review queue
  api/caterers/route.js                GET (approved-only search) / POST (create, forces pending)
  api/caterers/[id]/route.js           GET (owner/admin see unapproved too) / PUT / DELETE
  api/my-caterers/route.js             GET listings owned by the signed-in user
  api/admin/pending/route.js           GET all pending listings (admin only)
  api/admin/caterers/[id]/review/route.js  POST { action: 'approve'|'reject', reason? }
  api/upload/route.js                  Photo upload to Vercel Blob
  api/auth/[...nextauth]/route.js      NextAuth
```

Every mutating API route re-derives authorization from `getServerSession(authOptions)`
server-side — never trust a client-supplied owner/admin flag.
