# Linen Delivery Organizer

A mobile-first web app for organizing linen and laundry deliveries. Add a
**delivery** with a **date**, an **address** (that autofills from your saved
addresses), the **linens & materials** to drop off, and **notes** — then the
home screen **organizes everything into a route per day** and hands the whole
day off to Google or Apple Maps for navigation.

Everything is stored **locally in your browser**, so it works instantly with
**no account, server, or setup**. Installs to your phone's home screen as a web
app — no app store needed.

Built with React + TypeScript + Vite.

---

## What you can do

- **Add deliveries** — each has a **date**, customer/location name, **address**,
  **delivery items**, and **notes**.
- **Autofill addresses** — save the places you deliver to once, and they
  autocomplete as you type on any delivery (tap a suggestion to fill it). Save a
  new address straight from a delivery, or manage them all on the **Addresses**
  screen.
- **Add linens & materials from a dropdown** — pick from your catalog
  (Linens, Towels, Carpets, Uniforms, Napkins, Tablecloths, …) and set a
  quantity per item with steppers.
- **Manage your materials list** — add, rename, re-icon, or remove the linens
  and materials in your catalog on the **Materials** screen.
- **Organized by day** — the schedule groups every delivery under its date, so
  each day is its own route in order.
- **Navigate the day** — one tap opens the whole day as a multi-stop driving
  route in **Google Maps**, or navigate a single stop in **Apple Maps**
  (Apple's URL scheme only supports one destination at a time).
- **Installable** — "Add to Home Screen" on iOS/Android for an app-like icon and
  full-screen launch.

---

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`). To use it on your phone on
the same Wi-Fi, open the **Network** URL Vite prints.

To build for production:

```bash
npm run build      # outputs static files to dist/
npm run preview    # serve the production build locally
```

---

## Deploy (so you can use it on your phone anywhere)

The build output is plain static files, so any static host works — no backend or
environment variables required.

**Netlify / Vercel**
1. Push this repo to GitHub.
2. Import the repo (framework preset: **Vite**).
3. Build command `npm run build`, publish directory `dist`.
4. Deploy. Open the HTTPS URL on your phone → Share → **Add to Home Screen**.

**GitHub Pages** also works (it's just static files).

---

## How your data is stored

All data lives in your browser's **localStorage** on the device you're using —
there's no server and nothing leaves your phone. That means:

- It works completely offline and needs zero setup.
- Data is **per-device / per-browser**: it won't automatically sync to another
  phone or laptop, and clearing your browser data erases it.

For a single operator on one phone, this is the simplest setup that just works.

---

## How maps export works (and its one limit)

- Map links use the address text you type — no Google API key or geocoding
  needed.
- **Google Maps** supports a true multi-stop route in a single URL, so each
  day has an **"Navigate this day in Google Maps"** button. Google caps a single
  link at roughly 10 stops; longer days show a warning and you navigate the
  overflow stop-by-stop.
- **Apple Maps has no multi-waypoint URL** — by design it only accepts one
  destination. So Apple navigation is **per stop** (the Apple Maps button on
  each delivery). This isn't a bug; it's an Apple platform limitation.

---

## Project structure

```
src/
  components/
    AddressInput.tsx   address field with autofill from the address book
    ItemPicker.tsx     dropdown to add linens/materials + quantity steppers
  lib/
    store.ts           localStorage persistence + React hooks
    dates.ts           date grouping/labeling helpers
    maps.ts            Apple/Google Maps URL builders
  screens/
    Schedule.tsx       home: deliveries organized into a route per day
    DeliveryEditor.tsx date, address, items, and notes for one delivery
    Materials.tsx      manage the linens & materials catalog
    Addresses.tsx      manage saved addresses for autofill
  types.ts             shared types
public/                PWA manifest + icons
```
