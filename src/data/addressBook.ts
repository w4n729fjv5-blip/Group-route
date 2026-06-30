// Saved addresses ("address book"). Picking a saved place autofills a stop's
// name, address, and notes so frequent drop-off points don't get retyped.
// Stored in localStorage, editable from the "Addresses" screen.

import type { SavedPlace } from "../types";

const KEY = "linen.addresses.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `addr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Read all saved places, sorted by name. */
export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedPlace[];
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

function save(places: SavedPlace[]): void {
  localStorage.setItem(KEY, JSON.stringify(places));
}

/**
 * Add or update a saved place. If an entry with the same name already exists
 * (case-insensitive), it's updated in place rather than duplicated.
 */
export function upsertSavedPlace(
  place: Omit<SavedPlace, "id"> & { id?: string }
): SavedPlace[] {
  const places = getSavedPlaces();
  const name = place.name.trim();
  if (!name) return places;

  const existing = places.find(
    (p) =>
      p.id === place.id ||
      p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    existing.name = name;
    existing.address = place.address.trim();
    existing.notes = place.notes.trim();
  } else {
    places.push({
      id: place.id ?? newId(),
      name,
      address: place.address.trim(),
      notes: place.notes.trim(),
    });
  }
  save(places);
  return getSavedPlaces();
}

/** Remove a saved place by id. */
export function removeSavedPlace(id: string): SavedPlace[] {
  const next = getSavedPlaces().filter((p) => p.id !== id);
  save(next);
  return next;
}
