// Default linens & delivery materials the catalog is seeded with the first time
// the app runs. After that the list is editable from the Materials screen and
// lives in the database, so these are only used to bootstrap an empty catalog
// (and as a read-only fallback if the materials table hasn't been created yet).

import type { Material } from "../types";

/** Seed list used to populate an empty materials catalog. */
export const DEFAULT_MATERIALS: Omit<Material, "id">[] = [
  { name: "Linens", icon: "🛏️" },
  { name: "Towels", icon: "🧺" },
  { name: "Carpets", icon: "🪟" },
  { name: "Uniforms", icon: "👔" },
  { name: "Napkins", icon: "🧻" },
  { name: "Tablecloths", icon: "🍽️" },
  { name: "Aprons", icon: "🥼" },
  { name: "Bar mops", icon: "🧽" },
];

/** A handful of quick-pick emojis for the Materials editor. */
export const ICON_CHOICES = [
  "🛏️",
  "🧺",
  "🪟",
  "👔",
  "🧻",
  "🍽️",
  "🥼",
  "🧽",
  "🧹",
  "🧦",
  "👚",
  "📦",
];

/**
 * Find the icon for an item name within a materials list (case-insensitive).
 * Falls back to a box for custom / unknown items.
 */
export function iconFor(materials: Material[], name: string): string {
  const match = materials.find(
    (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}
