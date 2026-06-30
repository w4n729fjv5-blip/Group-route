// Default linens & delivery materials. These seed the editable `materials`
// table the first time the app runs, and also act as a fallback icon lookup.
// After seeding, the live list lives in Supabase and is managed on the
// "Materials" screen.

export interface CatalogItem {
  name: string;
  /** Emoji shown next to the item for quick visual scanning on mobile. */
  icon: string;
}

export const DEFAULT_MATERIALS: CatalogItem[] = [
  { name: "Linens", icon: "🛏️" },
  { name: "Carpets", icon: "🪟" },
  { name: "Uniforms", icon: "👔" },
  { name: "Napkins", icon: "🧻" },
  { name: "Tablecloths", icon: "🍽️" },
];

/** Emoji choices offered when creating/editing a material. */
export const ICON_CHOICES = [
  "📦", "🛏️", "🪟", "👔", "🧻", "🍽️", "🧺", "🧥", "🧦",
  "🛁", "🚿", "🧼", "🪣", "🧷", "👕", "🥼", "🩳", "🧤",
];

/**
 * Fallback icon lookup by name, used where the live materials list isn't
 * loaded (e.g. stop summary pills). Custom items not in the defaults get a box.
 */
export function iconForItem(name: string): string {
  const match = DEFAULT_MATERIALS.find(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}
