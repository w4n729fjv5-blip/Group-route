# Linen Delivery Route Creator

A mobile-first web app for planning linen/laundry delivery routes. Build a
**route**, add **stops**, list the **items** to deliver at each stop (linens,
carpets, uniforms, napkins, tablecloths — with quantities), jot **notes**, set a
**delivery day**, and **navigate** the route in Apple Maps or Google Maps. Routes
are saved to the cloud (Supabase) so they sync across every device.

Built with React + TypeScript + Vite. Installs to your phone's home screen as a
web app — no app store needed.

---

## Features

- **Routes** — create, name, save, and delete delivery routes.
- **Delivery day** — tag each route with a weekday (Mon–Sun).
- **Stops** — ordered list per route; reorder with ↑/↓; per-stop name, address,
  and notes.
- **Items** — pick from a preset catalog with quantity steppers, plus add custom
  items.
- **Maps export**
  - **Google Maps:** one tap opens the whole route as a multi-stop driving
    route (up to ~10 stops per link).
  - **Apple Maps:** Apple's URL scheme can't take multiple stops, so each stop
    has its own "Navigate in Apple Maps" button (one stop at a time). Each stop
    also has a single-stop Google button.
- **Cloud sync** — data lives in Supabase and appears on any device that opens
  the app.
- **Installable** — "Add to Home Screen" on iOS/Android for an app-like icon and
  full-screen launch.

---

## Setup

### 1. Create a free Supabase project
1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates
   the `routes` and `stops` tables and the access policies.
3. Open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key

### 2. Configure the app
```bash
cp .env.example .env
```
Edit `.env` and paste your values:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run it locally
```bash
npm install
npm run dev
```
Open the printed URL (e.g. `http://localhost:5173`). To test on your phone on the
same Wi-Fi, open the **Network** URL Vite prints.

---

## Deploy (so you can use it on your phone anywhere)

The build output is static files, so any static host works. Recommended:

**Netlify**
1. Push this repo to GitHub (already done if you're reading this there).
2. In Netlify: **Add new site → Import from Git**, pick the repo.
3. Build command `npm run build`, publish directory `dist`.
4. **Site settings → Environment variables**: add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Open the HTTPS URL on your phone → Share → **Add to Home Screen**.

**Vercel** works the same way (framework preset: Vite). **GitHub Pages** also
works but needs the env vars baked in at build time via an Actions workflow.

---

## How maps export works (and its one limit)

- Map links use the address text you type — no Google API key or geocoding
  needed.
- **Google Maps** supports a true multi-stop route in a single URL, so the route
  screen has **"Open whole route in Google Maps."** Google caps a single link at
  roughly 10 stops; longer routes show a warning and you navigate the overflow
  stop-by-stop.
- **Apple Maps has no multi-waypoint URL** — by design it only accepts one
  destination. So Apple navigation is **per stop** (the " Maps" button on each
  stop). This isn't a bug we can fix; it's an Apple platform limitation.

---

## Privacy note

This app has **no login** (by design choice). Access uses Supabase's public
`anon` key, and the schema grants that key full read/write. Practically: anyone
who has your app's URL can view and edit the routes. That's fine for a single
operator, but don't store sensitive personal data. To make it private later, add
Supabase Auth and replace the `anon` policies in `schema.sql` with per-user
(`auth.uid()`) policies.

---

## Project structure

```
src/
  api/routes.ts        Supabase CRUD for routes & stops
  components/          DaySelector, ItemPicker, StopCard, ExportBar
  data/catalog.ts      preset delivery items
  lib/supabase.ts      Supabase client (from env vars)
  lib/maps.ts          Apple/Google Maps URL builders
  screens/             RoutesList, RouteEditor, StopEditor, SetupNeeded
  types.ts             shared types
supabase/schema.sql    database tables + RLS policies
public/                PWA manifest + icons
```
