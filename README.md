# Linen Delivery Route Creator

A mobile-first web app for planning linen/laundry delivery routes. Build a
**route**, add **stops**, list the **items** to deliver at each stop (linens,
towels, uniforms, napkins, tablecloths — with quantities), jot **notes**, set a
**date** and a **delivery day**, and **navigate** the route in Apple Maps or
Google Maps. Everything is saved **locally on your device** — no account, no
server, no setup.

Built with React + TypeScript + Vite. Installs to your phone's home screen as a
web app — no app store needed.

---

## Features

- **Routes organized by day** — create, name, save, and delete delivery routes;
  the home screen groups them by delivery weekday (Mon–Sun), with an
  "Unscheduled" bucket.
- **Delivery day** — tag each route with a weekday (Mon–Sun).
- **Stops** — ordered list per route; reorder with ↑/↓. Each stop has a
  **date**, **delivery items**, **address**, and **notes** section.
- **Address autofill** — start typing an address and pick from live suggestions
  (powered by OpenStreetMap's free geocoder — no API key needed).
- **Items dropdown** — add linens & materials to a stop from a dropdown sourced
  from your catalog, with quantity steppers, plus one-off custom items.
- **Editable materials catalog** — a **Materials** menu (top-right on the home
  screen) where you add/remove the different linens and delivery materials, each
  with an emoji. The catalog feeds every stop's dropdown.
- **Maps export**
  - **Google Maps:** one tap opens the whole route as a multi-stop driving
    route (up to ~10 stops per link).
  - **Apple Maps:** Apple's URL scheme can't take multiple stops, so each stop
    has its own "Navigate in Apple Maps" button (one stop at a time). Each stop
    also has a single-stop Google button.
- **Local storage** — all data lives in your browser on this device. Nothing is
  uploaded anywhere.
- **Installable** — "Add to Home Screen" on iOS/Android for an app-like icon and
  full-screen launch.

---

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`). That's it — no `.env`, no
database, no API keys. To test on your phone on the same Wi-Fi, open the
**Network** URL Vite prints.

---

## Deploy (so you can use it on your phone anywhere)

The build output is plain static files, so any static host works.

```bash
npm run build      # outputs to dist/
```

**Netlify / Vercel:** import the repo, build command `npm run build`, publish
directory `dist`. **GitHub Pages** works too — just publish the `dist/` folder.
No environment variables to configure.

Then open the HTTPS URL on your phone → Share → **Add to Home Screen**.

---

## Where is my data stored?

All routes, stops, and your materials catalog are saved in your browser's
`localStorage` on the device you're using, under keys prefixed with `linen.`.

What that means:

- **It's private** — nothing leaves your device.
- **It's per-device / per-browser** — data does *not* sync between your phone
  and laptop. Each device keeps its own list.
- **Clearing your browser data** (or using private/incognito mode) erases it. If
  you want a backup, keep the device's browser data intact.

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

## Project structure

```
src/
  api/routes.ts        local (localStorage) CRUD for routes & stops
  api/materials.ts     local CRUD for the materials catalog
  components/          DaySelector, ItemPicker, StopCard, ExportBar, AddressInput
  data/catalog.ts      default materials + icon helpers
  lib/localdb.ts       tiny localStorage JSON store + id generator
  lib/maps.ts          Apple/Google Maps URL builders
  materials/           MaterialsContext (shared, editable catalog)
  screens/             RoutesList, RouteEditor, StopEditor, Materials
  types.ts             shared types
public/                PWA manifest + icons
```
