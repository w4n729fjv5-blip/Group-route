# Linen Delivery Organizer

A mobile-first web app for planning linen & laundry delivery routes. Build a
**route** for a day, add **stops**, choose the **linens and materials** to drop
at each stop (from a dropdown you control), set a **date**, save **addresses**
that autofill, jot **notes**, and **navigate** in Apple Maps or Google Maps.

**Works out of the box — no account, no database, no setup.** Your data is saved
right on your device. (Optional cloud sync across devices is available via
Supabase; see the bottom of this file.)

Built with React + TypeScript + Vite. Installs to your phone's home screen as a
web app — no app store needed.

---

## Features

- **Routes organized by day** — every route is grouped under its weekday on the
  home screen (Monday → Sunday, plus an "Unscheduled" bucket).
- **Date, items, address & notes** — each route holds a delivery **date**, and
  every stop holds the **items** to deliver, the **address**, and free-form
  **notes**.
- **Dropdown to add linens & materials** — on every stop, pick items from a
  dropdown and set quantities with +/− steppers. Add one-off items inline too.
- **Manage items menu** — add or remove your own linen/material types (with an
  emoji); they instantly appear in the dropdown on every stop.
- **Address autofill** — save frequent drop-off points in the **Addresses**
  book. On a stop, pick one from "Use a saved address" to autofill the name,
  address, and notes — or save the current stop's address for reuse with one tap.
  The address field also type-ahead suggests your saved addresses.
- **Maps export**
  - **Google Maps:** one tap opens the whole route as a multi-stop driving route
    (up to ~10 stops per link).
  - **Apple Maps:** Apple's URL scheme can't take multiple stops, so each stop
    has its own "Navigate in Apple Maps" button (one stop at a time).
- **Installable** — "Add to Home Screen" on iOS/Android for an app-like icon and
  full-screen launch.

---

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`). That's it — start adding
routes. To use it on your phone over the same Wi-Fi, open the **Network** URL
Vite prints.

### Build for production / deploy

The build output is static files, so any static host works (Netlify, Vercel,
GitHub Pages, …).

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

On Netlify/Vercel: build command `npm run build`, publish directory `dist`. Open
the HTTPS URL on your phone → Share → **Add to Home Screen**.

---

## How it works / where data lives

By default the app stores everything in your browser's **localStorage**:

- Routes & stops
- Your item catalog (the dropdown of linens & materials)
- Your saved addresses

That means data lives **on the device/browser you used**. It is not shared
between devices and is tied to that browser's storage. Clearing site data or
using a different browser starts fresh. For a single operator on one phone this
is simple and reliable.

### How maps export works (and its one limit)

- Map links use the address text you type — no Google API key or geocoding
  needed.
- **Google Maps** supports a true multi-stop route in a single URL, so the route
  screen has **"Open whole route in Google Maps."** Google caps a single link at
  roughly 10 stops; longer routes show a warning and you navigate the overflow
  stop-by-stop.
- **Apple Maps has no multi-waypoint URL** — by design it only accepts one
  destination. So Apple navigation is **per stop**.

---

## Optional: cloud sync across devices (Supabase)

If you want the same routes on multiple devices, you can point the app at a free
Supabase project. When the two env vars below are set, the app uses Supabase for
routes/stops instead of local storage automatically.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Project Settings → API** and copy your **Project URL** and **anon
   public** key.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Restart the app.

> Note: the cloud option uses Supabase's public `anon` key with no login. Your
> item catalog and saved addresses stay on-device; routes/stops sync. Anyone
> with the app URL could read/write the routes — fine for a single operator, but
> don't store sensitive personal data. Add Supabase Auth + per-user policies to
> make it private.

---

## Project structure

```
src/
  api/routes.ts        Routes/stops data access (localStorage or Supabase)
  lib/localStore.ts    Zero-setup localStorage backend
  lib/supabase.ts      Optional Supabase client (from env vars)
  lib/maps.ts          Apple/Google Maps URL builders
  data/catalog.ts      Editable catalog of linens & materials (localStorage)
  data/addressBook.ts  Saved addresses for autofill (localStorage)
  components/          DaySelector, ItemPicker, StopCard, ExportBar
  screens/             RoutesList, RouteEditor, StopEditor, ManageItems,
                       AddressBook
  types.ts             shared types
supabase/schema.sql    optional cloud database tables + policies
public/                PWA manifest + icons
```
