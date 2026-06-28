# Linen Delivery Route Creator

A phone-first web app for planning linen delivery routes. Create routes, add stops
with a per-stop checklist of linens (linens, carpets, uniforms, napkins, tablecloths,
plus custom items), notes, and an address. Save routes, tag each with a delivery day,
sync them across all your devices, and open the whole route in **Apple Maps** or
**Google Maps** with one tap.

- **Phone-first PWA** — open in Safari/Chrome and "Add to Home Screen" to use it like an app.
- **Cloud sync** via Supabase — your routes follow you to every device.
- **Magic-link login** — no passwords.
- **Free address autocomplete** (OpenStreetMap / Photon) — no API key, no billing.

---

## One-time setup

### 1. Create a free Supabase project
1. Go to <https://supabase.com> → **New project** (the free tier is plenty).
2. Once it's ready, open **Project Settings → API** (or **Data API**) and copy:
   - **Project URL**
   - **anon / public** API key

### 2. Configure the app
```bash
cp .env.example .env
```
Open `.env` and paste your two values:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Create the database tables
1. In Supabase, open the **SQL Editor**.
2. Open `supabase/schema.sql` from this repo, copy the whole file, paste it in, and click **Run**.

   This creates the `routes` and `stops` tables and turns on Row-Level Security so each
   user can only ever see their own data.

### 4. Enable magic-link email login
1. In Supabase, go to **Authentication → Providers → Email** and make sure **Email** is
   enabled (magic links are on by default).
2. Go to **Authentication → URL Configuration** and add your app's URL(s) under
   **Redirect URLs** — e.g. `http://localhost:5173` for local dev and your deployed URL
   (e.g. `https://your-app.netlify.app`) for production.

---

## Run locally
```bash
npm install
npm run dev
```
Open the printed URL (e.g. `http://localhost:5173`). To test on your phone while on the
same Wi-Fi, use the **Network** URL that Vite prints.

## Build for production
```bash
npm run build      # outputs static files to dist/
npm run preview    # preview the production build locally
```

## Deploy (get a public phone URL)
The build is a plain static site — deploy `dist/` anywhere:

- **Netlify / Vercel**: connect this repo, set build command `npm run build`, publish
  directory `dist`, and add the two `VITE_SUPABASE_*` environment variables in the
  dashboard. Or drag-and-drop the `dist/` folder onto Netlify Drop.

After deploying, add the deployed URL to Supabase **Redirect URLs** (step 4 above) so
magic-link sign-in returns to the right place.

---

## How to use
1. Sign in with your email (tap the magic link it sends you).
2. **+ New route** → give it a name and pick a delivery day.
3. **+ Add stop** for each delivery. For each stop:
   - Start typing the **address** and pick a suggestion (this also pins exact coordinates).
   - Tap the linen **chips** to add what's needed and set quantities; add custom items too.
   - Add any **notes** (gate codes, contacts, drop-off instructions).
   - Reorder stops with the ▲/▼ buttons.
4. Tap **Google Maps** or **Apple Maps** to open the full route with every stop as a
   waypoint, in order, for turn-by-turn navigation.

Everything saves automatically and syncs to any device where you're signed in.

---

## Tech
- Vite + React + TypeScript (static SPA, installable PWA)
- Supabase (Postgres + auth) for storage, sync, and login
- Photon (OpenStreetMap) for keyless address autocomplete

### Project layout
```
supabase/schema.sql      Database tables + Row-Level Security (run once)
src/lib/supabase.ts      Supabase client
src/lib/db.ts            All route/stop queries
src/lib/maps.ts          Google & Apple Maps URL builders
src/lib/geocode.ts       Photon address search
src/components/          Auth, RouteList, RouteEditor, StopCard, AddressInput, ItemChecklist
```

## Notes
- Photon is free and needs no key, but it's rate-limited and OpenStreetMap-sourced, so
  address coverage is occasionally less precise than Google Places. Coordinates captured
  when you pick a suggestion keep map export accurate. To switch providers later, edit only
  `src/lib/geocode.ts`.
- Stops export in the order you arrange them. Automatic shortest-route optimization is not
  included in this version.
