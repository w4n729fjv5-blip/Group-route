# Linen Delivery Route Creator

A mobile-first web app for planning linen/laundry delivery routes. Build a
**route**, add **stops**, list the **items** to deliver at each stop (linens,
carpets, uniforms, napkins, tablecloths — with quantities), jot **notes**, set a
**delivery day**, and **navigate** the route in Apple Maps or Google Maps.

Everything is stored **locally on your device** in the browser — no accounts, no
passwords, no cloud, no setup. Your routes never leave your phone or computer.

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
- **Fully local** — data is saved in your browser's `localStorage`. It works
  offline and stays private to the device.
- **Backup & restore** — export all routes to a JSON file and import it back on
  any device. Still fully offline; import merges by id so re-importing is safe.
- **Installable** — "Add to Home Screen" on iOS/Android for an app-like icon and
  full-screen launch.

---

## Run it locally

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`). To test on your phone on the
same Wi-Fi, open the **Network** URL Vite prints. That's it — there's nothing to
configure.

---

## Deploy (so you can use it on your phone anywhere)

The build output is static files, so any static host works (Netlify, Vercel,
GitHub Pages, etc.). No environment variables or backend are needed.

**Netlify / Vercel**
1. Push this repo to GitHub.
2. Import the repo in Netlify or Vercel (framework preset: Vite).
3. Build command `npm run build`, publish directory `dist`.
4. Deploy. Open the HTTPS URL on your phone → Share → **Add to Home Screen**.

---

## Where your data lives (and what to know)

- Routes and stops are saved in the browser's `localStorage` under the key
  `linen-route-creator/v1`.
- Data is tied to the specific browser/device and site URL. It does **not** sync
  between devices, and it isn't backed up anywhere.
- Clearing your browser's site data, or some "private browsing" modes, will
  remove saved routes. Installing to the home screen and using the app normally
  keeps them.
- Use **Export backup** on the home screen to save all your routes to a JSON
  file, and **Import backup** to restore them (or copy them to another device).
  Import merges by id, so importing the same file twice won't create duplicates.

---

## How maps export works (and its one limit)

- Map links use the address text you type — no Google API key or geocoding
  needed.
- **Google Maps** supports a true multi-stop route in a single URL, so the route
  screen has **"Open whole route in Google Maps."** Google caps a single link at
  roughly 10 stops; longer routes show a warning and you navigate the overflow
  stop-by-stop.
- **Apple Maps has no multi-waypoint URL** — by design it only accepts one
  destination. So Apple navigation is **per stop** (the "Maps" button on each
  stop). This isn't a bug we can fix; it's an Apple platform limitation.

---

## Project structure

```
src/
  api/routes.ts        local (localStorage) CRUD for routes & stops
  components/          DaySelector, ItemPicker, StopCard, ExportBar
  data/catalog.ts      preset delivery items
  lib/maps.ts          Apple/Google Maps URL builders
  screens/             RoutesList, RouteEditor, StopEditor
  types.ts             shared types
public/                PWA manifest + icons
```
