// Device-local settings: the materials catalog and the saved-address book.
//
// Routes and stops live in Supabase (so they sync across devices), but the
// catalog of linens/materials you choose from and your saved delivery addresses
// are configuration you edit rarely and want available instantly. We keep those
// in localStorage so the "manage materials" and "address autofill" features work
// with zero database setup. Everything here is reactive via useSyncExternalStore
// so editing the catalog or address book updates every open screen immediately.

import { useSyncExternalStore } from "react";

/** A linen/material the user can deliver, shown in the items dropdown. */
export interface Material {
  name: string;
  /** Emoji shown next to the item for quick visual scanning on mobile. */
  icon: string;
}

/** A reusable delivery address the user can pick to auto-fill a stop. */
export interface SavedPlace {
  id: string;
  /** Friendly name, e.g. "Riverside Hotel". */
  label: string;
  /** Full street address used for maps navigation. */
  address: string;
  /** Optional default notes (gate code, contact) copied into the stop. */
  notes: string;
}

/** Starter catalog used until the user customizes it. */
export const DEFAULT_MATERIALS: Material[] = [
  { name: "Linens", icon: "🛏️" },
  { name: "Carpets", icon: "🪟" },
  { name: "Uniforms", icon: "👔" },
  { name: "Napkins", icon: "🧻" },
  { name: "Tablecloths", icon: "🍽️" },
];

const MATERIALS_KEY = "linen.materials.v1";
const PLACES_KEY = "linen.places.v1";

/**
 * A tiny localStorage-backed reactive store. Caches a parsed snapshot so
 * useSyncExternalStore gets a stable reference between changes, and syncs across
 * browser tabs via the "storage" event.
 */
function createStore<T>(key: string, fallback: T) {
  function read(): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  let cache: T = read();
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        cache = read();
        emit();
      }
    });
  }

  return {
    get: () => cache,
    set(value: T) {
      cache = value;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore quota / private-mode write failures; state still updates in-memory.
      }
      emit();
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

const materialsStore = createStore<Material[]>(MATERIALS_KEY, DEFAULT_MATERIALS);
const placesStore = createStore<SavedPlace[]>(PLACES_KEY, []);

// Materials -----------------------------------------------------------------
export function getMaterials(): Material[] {
  return materialsStore.get();
}

export function setMaterials(materials: Material[]): void {
  materialsStore.set(materials);
}

/** Subscribe a component to the live materials catalog. */
export function useMaterials(): Material[] {
  return useSyncExternalStore(
    materialsStore.subscribe,
    materialsStore.get,
    () => DEFAULT_MATERIALS
  );
}

/** Icon for a delivered item by name; falls back to a box for unknown items. */
export function iconForMaterial(name: string): string {
  const match = getMaterials().find(
    (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}

// Saved places --------------------------------------------------------------
export function getPlaces(): SavedPlace[] {
  return placesStore.get();
}

export function setPlaces(places: SavedPlace[]): void {
  placesStore.set(places);
}

/** Subscribe a component to the live address book. */
export function usePlaces(): SavedPlace[] {
  return useSyncExternalStore(placesStore.subscribe, placesStore.get, () => []);
}

/** Generate a stable id for new catalog/address entries. */
export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
