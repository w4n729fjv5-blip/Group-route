// Catalog of linens & delivery materials available to deliver.
//
// The catalog is EDITABLE by the user (see the "Manage items" screen) and is
// persisted in the browser's localStorage, so it survives reloads on the same
// device. It starts from a sensible default list. Stops reference items by
// name, so removing a catalog item never affects items already saved on a stop.

import { useSyncExternalStore } from "react";

export interface CatalogItem {
  name: string;
  /** Emoji shown next to the item for quick visual scanning on mobile. */
  icon: string;
}

/** The list the catalog falls back to before the user customizes it. */
export const DEFAULT_CATALOG: CatalogItem[] = [
  { name: "Linens", icon: "🛏️" },
  { name: "Towels", icon: "🧖" },
  { name: "Carpets", icon: "🟫" },
  { name: "Uniforms", icon: "👔" },
  { name: "Napkins", icon: "🧻" },
  { name: "Tablecloths", icon: "🍽️" },
  { name: "Aprons", icon: "🦺" },
  { name: "Bar mops", icon: "🧽" },
];

/** Emoji used for items that aren't in the catalog (e.g. removed presets). */
export const FALLBACK_ICON = "📦";

const STORAGE_KEY = "linen.catalog.v1";

// In-memory cache so useSyncExternalStore gets a stable snapshot reference
// between renders (it only changes when we write).
let cache: CatalogItem[] | null = null;
const listeners = new Set<() => void>();

function isValid(item: unknown): item is CatalogItem {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as CatalogItem).name === "string" &&
    (item as CatalogItem).name.trim().length > 0
  );
}

function load(): CatalogItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cache = parsed.filter(isValid).map((it) => ({
          name: it.name,
          icon: typeof it.icon === "string" && it.icon ? it.icon : FALLBACK_ICON,
        }));
        return cache;
      }
    }
  } catch {
    // Corrupt/unavailable storage — fall through to defaults.
  }
  cache = [...DEFAULT_CATALOG];
  return cache;
}

function commit(items: CatalogItem[]) {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage might be full or disabled; keep the in-memory copy regardless.
  }
  listeners.forEach((l) => l());
}

/** Current catalog (stable reference until it changes). */
export function getCatalog(): CatalogItem[] {
  return load();
}

/** Subscribe to catalog changes; returns an unsubscribe function. */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function indexByName(items: CatalogItem[], name: string): number {
  return items.findIndex(
    (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
}

/**
 * Add a linen/material type to the catalog. No-op (returns false) if an item
 * with the same name already exists. Returns true when something was added.
 */
export function addCatalogItem(name: string, icon: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const items = load();
  if (indexByName(items, trimmed) >= 0) return false;
  commit([...items, { name: trimmed, icon: icon.trim() || FALLBACK_ICON }]);
  return true;
}

/** Remove a catalog item by name. Saved stop items are unaffected. */
export function removeCatalogItem(name: string): void {
  const items = load();
  const idx = indexByName(items, name);
  if (idx < 0) return;
  const next = [...items];
  next.splice(idx, 1);
  commit(next);
}

/** Restore the catalog to the built-in default list. */
export function resetCatalog(): void {
  commit([...DEFAULT_CATALOG]);
}

/** React hook returning the live catalog. */
export function useCatalog(): CatalogItem[] {
  return useSyncExternalStore(subscribe, getCatalog, getCatalog);
}

/** Look up the icon for an item by name; falls back to a box for unknown items. */
export function iconForItem(name: string): string {
  const items = load();
  const idx = indexByName(items, name);
  return idx >= 0 ? items[idx].icon : FALLBACK_ICON;
}
