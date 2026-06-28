// Preset catalog of items available for delivery. Users pick from these and set
// a quantity per stop, and can also add custom items not in this list.

export interface CatalogItem {
  name: string;
  /** Emoji shown next to the item for quick visual scanning on mobile. */
  icon: string;
}

export const CATALOG: CatalogItem[] = [
  { name: "Linens", icon: "🛏️" },
  { name: "Carpets", icon: "🪟" },
  { name: "Uniforms", icon: "👔" },
  { name: "Napkins", icon: "🧻" },
  { name: "Tablecloths", icon: "🍽️" },
];

/** Look up the icon for a catalog item by name; falls back to a box for custom items. */
export function iconForItem(name: string): string {
  const match = CATALOG.find(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}
