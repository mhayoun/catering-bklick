# קייטרינג בקליק — Catering in a Click

A trilingual (Hebrew / English / French) catering search & directory platform
for Israel. Built with Next.js (App Router), Tailwind CSS, NextAuth (Google
login), Vercel KV (Redis) for data, and Vercel Blob for photo storage.

## Features

- **Search** caterers by area of Israel, kashrut certification, catering type
  (dairy/meat), event type, maximum guests, menu categories (salads, fish,
  meat, main courses, desserts, beverages — with alcoholic/non-alcoholic
  split), and additional services (elegant tableware, free delivery, etc).
- **Caterer profiles** with description, menu, services, photo gallery,
  embedded videos, and full contact details (phone, WhatsApp, email,
  website, Instagram, Facebook) with direct-contact links.
- **Google sign-in** (NextAuth) for business owners to create and manage
  their own listings.
- The **registration form uses the exact same criteria constants**
  (`lib/constants.js`) and translations (`lib/i18n.js`) as the search
  system, so a caterer's profile always matches what customers can filter by.
- Fully **i18n'd** (Hebrew/RTL, English, French) via a lightweight React
  context — no page reload needed to switch languages.
- **Funny logo**: a chef's toque getting "clicked" by a mouse cursor, with
  a wink baked into the hat band (`components/Logo.js`, pure SVG).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything has a fallback (see below)
npm run dev
```

Open http://localhost:3000.

### Local development quick-start (no Google OAuth yet)

```bash
npm install
cp .env.example .env.local
```

Then edit `.env.local` and set at minimum:
```
NEXTAUTH_SECRET=any-random-string   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Without `NEXTAUTH_SECRET`/`NEXTAUTH_URL` set, NextAuth logs warnings (harmless
in dev, but set them to silence them and to make sessions work reliably).

If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are **not** set, the app
automatically enables a **dev-only "Continue as Demo Owner" button** on the
`/login` page so you can test sign-in, the dashboard, and the registration
form right away. This fallback is gated on `NODE_ENV !== 'production'` and
disappears the moment Google credentials are configured, so it can never
leak into a real deployment.

### Running without any cloud services configured

The app is designed to work out of the box for local development/demo:

- **No Vercel KV configured?** `lib/store.js` automatically falls back to an
  in-memory store seeded with 3 demo caterers (`data/seed.js`). Great for
  trying the UI, but data resets when the dev server restarts.
- **No Google OAuth configured?** Use the dev-only demo login above to test
  sign-in and registration locally.
- **No Blob token configured?** Photo upload in the registration form will
  show an error, but everything else still works — you can still list a
  caterer without uploading images.

## Auto-translated descriptions

The "short description" field is stored as `{ he, en, fr }` and is
**automatically translated** on save:

- The owner types the description once, in whichever language their UI is
  currently set to.
- On save, `lib/translate.js` translates it into the other two languages
  and stores all three - no extra fields, no manual retyping.
- Works with **zero configuration** out of the box via the free
  [MyMemory](https://mymemory.translated.net/) API. For higher quality or
  volume, set `GOOGLE_TRANSLATE_API_KEY` and Google Cloud Translation is
  used automatically instead.
- Editing the description in the same language it was last saved in and
  re-saving without changes skips re-translation (no wasted API calls);
  editing the text re-triggers translation for that language's edit.
- Search, cards, profile pages, and the admin review screen all read the
  right language automatically via `lib/localized.js`'s `pickLocalized()`.
- Translation quality is "good enough for a directory listing," not
  professional-grade - business owners can still see all three versions
  and there's room to add a manual-edit-per-language UI later if needed.

## Deploying to Vercel

1. Push this project to a GitHub repo and import it in Vercel.
2. In your Vercel project, go to **Storage** and:
   - Create a **KV (Redis)** database and connect it to the project — this
     injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` etc. automatically.
   - Create a **Blob** store and connect it — this injects
     `BLOB_READ_WRITE_TOKEN` automatically.
3. In **Settings → Environment Variables**, add:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from a Google Cloud OAuth
     client. Add `https://YOUR_DOMAIN/api/auth/callback/google` as an
     authorized redirect URI.
   - `NEXTAUTH_SECRET` — any long random string (`openssl rand -base64 32`).
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://catering-bklick.vercel.app`.
4. Deploy. On first run, the search page will read from KV; if it's empty,
   it automatically shows the demo listings so the site never looks empty.

## Project structure

```
app/
  page.js                     Home page: hero, search filters, results grid
  caterer/[id]/page.js        Public caterer profile
  login/page.js                Google sign-in
  dashboard/page.js            Owner's listing management
  dashboard/new/page.js        Registration form (create)
  dashboard/[id]/edit/page.js  Registration form (edit)
  api/caterers/route.js        GET (search) / POST (create)
  api/caterers/[id]/route.js   GET / PUT / DELETE one caterer
  api/upload/route.js          Photo upload to Vercel Blob
  api/auth/[...nextauth]/route.js  NextAuth (Google)
components/
  Logo.js                     The funny SVG logo
  SearchFilters.js             Search UI (uses lib/constants.js)
  CatererForm.js                Registration/edit form (same constants)
  CatererCard.js, SiteHeader.js, SiteFooter.js, LanguageProvider.js, ...
lib/
  constants.js                 Single source of truth for all criteria
  i18n.js                        he / en / fr dictionaries
  store.js                       KV-or-memory data layer
  auth.js                         NextAuth config
data/seed.js                    Demo caterers shown before real signups
```

## Notes & next steps

- Kashrut levels, districts, event types, menu categories, beverage types
  and additional services all live in `lib/constants.js` — add or rename
  options there and both the search filters and the registration form pick
  them up automatically.
- Video fields accept a YouTube/video URL and are embedded automatically.
- For production you'll likely want image moderation/limits on the upload
  route and pagination on the search results once the directory grows.
