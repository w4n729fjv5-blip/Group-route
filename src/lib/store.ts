// Local-first persistence. All data lives in localStorage so the app works
// offline with zero setup. A tiny pub/sub plus a snapshot cache lets React
// components re-render when a slice changes (see the hooks below).
//
// The cache matters: useSyncExternalStore requires getSnapshot to return a
// stable reference until the data actually changes. Parsing JSON on every call
// would hand React a new array each render and loop forever, so we parse once
// and reuse that reference until the next write.

import { useSyncExternalStore } from "react";
import type { Delivery, Material, SavedAddress } from "../types";

const KEYS = {
  deliveries: "linen.deliveries.v1",
  materials: "linen.materials.v1",
  addresses: "linen.addresses.v1",
} as const;

/** Default material catalog, used the first time the app runs. */
const DEFAULT_MATERIALS: Material[] = [
  { id: "m-linens", name: "Linens", icon: "🛏️" },
  { id: "m-towels", name: "Towels", icon: "🧖" },
  { id: "m-carpets", name: "Carpets", icon: "🪟" },
  { id: "m-uniforms", name: "Uniforms", icon: "👔" },
  { id: "m-napkins", name: "Napkins", icon: "🧻" },
  { id: "m-tablecloths", name: "Tablecloths", icon: "🍽️" },
  { id: "m-aprons", name: "Aprons", icon: "🥽" },
  { id: "m-mats", name: "Floor mats", icon: "🚪" },
];

/** Generate a reasonably-unique id without extra dependencies. */
export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// --- Snapshot cache ---------------------------------------------------------

// Cached parsed value per key. `undefined` means "not loaded yet".
const cache = new Map<string, unknown>();

function load<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

function store<T>(key: string, value: T): void {
  cache.set(key, value);
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

// --- Subscription plumbing for useSyncExternalStore -------------------------

const listeners = new Set<() => void>();

function onStorage(e: StorageEvent) {
  // Another tab changed a slice; drop our cache for it and re-render.
  if (e.key && cache.has(e.key)) {
    cache.delete(e.key);
    emit();
  }
}

function subscribe(cb: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function emit(): void {
  listeners.forEach((cb) => cb());
}

// --- Deliveries -------------------------------------------------------------

export function getDeliveries(): Delivery[] {
  return load<Delivery[]>(KEYS.deliveries, []);
}

export function saveDelivery(delivery: Delivery): void {
  const all = getDeliveries();
  const idx = all.findIndex((d) => d.id === delivery.id);
  const next = idx >= 0 ? all.map((d) => (d.id === delivery.id ? delivery : d)) : [...all, delivery];
  store(KEYS.deliveries, next);
}

export function createDelivery(date: string): Delivery {
  const all = getDeliveries();
  const sameDay = all.filter((d) => d.date === date);
  const delivery: Delivery = {
    id: uid("dlv"),
    date,
    name: "",
    address: "",
    items: [],
    notes: "",
    position: sameDay.length,
  };
  store(KEYS.deliveries, [...all, delivery]);
  return delivery;
}

export function deleteDelivery(id: string): void {
  store(
    KEYS.deliveries,
    getDeliveries().filter((d) => d.id !== id)
  );
}

// --- Materials --------------------------------------------------------------

export function getMaterials(): Material[] {
  // Seed defaults the first time the app is opened. We write straight to
  // storage + cache here (no emit) because this runs inside getSnapshot during
  // render — notifying subscribers mid-render would loop.
  if (!cache.has(KEYS.materials)) {
    if (localStorage.getItem(KEYS.materials) == null) {
      cache.set(KEYS.materials, DEFAULT_MATERIALS);
      try {
        localStorage.setItem(KEYS.materials, JSON.stringify(DEFAULT_MATERIALS));
      } catch {
        /* storage may be unavailable (private mode); cache still serves it */
      }
      return DEFAULT_MATERIALS;
    }
  }
  return load<Material[]>(KEYS.materials, DEFAULT_MATERIALS);
}

export function saveMaterials(materials: Material[]): void {
  store(KEYS.materials, materials);
}

// --- Saved addresses --------------------------------------------------------

export function getAddresses(): SavedAddress[] {
  return load<SavedAddress[]>(KEYS.addresses, []);
}

export function saveAddresses(addresses: SavedAddress[]): void {
  store(KEYS.addresses, addresses);
}

/** Add an address to the book if that exact address isn't already saved. */
export function rememberAddress(label: string, address: string): void {
  const trimmed = address.trim();
  if (!trimmed) return;
  const all = getAddresses();
  if (all.some((a) => a.address.trim().toLowerCase() === trimmed.toLowerCase()))
    return;
  saveAddresses([
    ...all,
    { id: uid("addr"), label: label.trim(), address: trimmed },
  ]);
}

// --- React hooks ------------------------------------------------------------

export function useDeliveries(): Delivery[] {
  return useSyncExternalStore(subscribe, getDeliveries, () => []);
}

export function useMaterials(): Material[] {
  return useSyncExternalStore(subscribe, getMaterials, () => DEFAULT_MATERIALS);
}

export function useAddresses(): SavedAddress[] {
  return useSyncExternalStore(subscribe, getAddresses, () => []);
}
