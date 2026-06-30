// The catalog of linens & delivery materials the user can add to a stop.
//
// The list is editable from the "Manage items" screen and persisted in
// localStorage, so operators can add their own linen and material types. A
// default starter set seeds the catalog the first time the app runs.

export interface CatalogItem {
  name: string;
  /** Emoji shown next to the item for quick visual scanning on mobile. */
  icon: string;
}

const KEY = "linen.catalog.v1";

/** Starter catalog used until the user customizes it. */
export const DEFAULT_CATALOG: CatalogItem[] = [
  { name: "Sheets", icon: "🛏️" },
  { name: "Pillowcases", icon: "🛌" },
  { name: "Bath towels", icon: "🛁" },
  { name: "Hand towels", icon: "🧼" },
  { name: "Washcloths", icon: "🧽" },
  { name: "Tablecloths", icon: "🍽️" },
  { name: "Napkins", icon: "🧻" },
  { name: "Uniforms", icon: "👔" },
  { name: "Aprons", icon: "🧑‍🍳" },
  { name: "Floor mats", icon: "🟫" },
  { name: "Bar mops", icon: "🧹" },
  { name: "Bags / soiled linen", icon: "🛍️" },
];

/** Read the current catalog, seeding defaults on first run. */
export function getCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CatalogItem[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_CATALOG;
}

/** Persist the catalog. */
export function saveCatalog(items: CatalogItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

/** Add a new item type (no-op if the name already exists, case-insensitive). */
export function addCatalogItem(name: string, icon: string): CatalogItem[] {
  const trimmed = name.trim();
  const items = getCatalog();
  if (!trimmed) return items;
  if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
    return items;
  }
  const next = [...items, { name: trimmed, icon: icon.trim() || "📦" }];
  saveCatalog(next);
  return next;
}

/** Remove an item type by name. */
export function removeCatalogItem(name: string): CatalogItem[] {
  const next = getCatalog().filter(
    (i) => i.name.toLowerCase() !== name.trim().toLowerCase()
  );
  saveCatalog(next);
  return next;
}

/** Look up the icon for an item by name; falls back to a box for unknown items. */
export function iconForItem(name: string): string {
  const match = getCatalog().find(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}
