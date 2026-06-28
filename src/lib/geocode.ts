/**
 * Address autocomplete via Photon (https://photon.komoot.io) — an
 * OpenStreetMap-based geocoder that needs no API key or billing.
 * Swap providers later by editing only this file.
 */

export interface GeocodeResult {
  /** Human-readable single-line address shown in the suggestion list. */
  label: string
  lat: number
  lng: number
}

const PHOTON_URL = 'https://photon.komoot.io/api/'

interface PhotonFeature {
  geometry: { coordinates: [number, number] } // [lng, lat]
  properties: {
    name?: string
    housenumber?: string
    street?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

/** Build a clean one-line label from Photon's address fields. */
function formatLabel(p: PhotonFeature['properties']): string {
  const line1 = [p.housenumber, p.street].filter(Boolean).join(' ')
  const head = line1 || p.name || ''
  const parts = [head, p.city, p.state, p.postcode, p.country].filter(Boolean)
  // De-duplicate when name already equals the street line.
  return Array.from(new Set(parts)).join(', ')
}

/**
 * Query Photon for address suggestions. Pass an AbortSignal to cancel a
 * superseded request (the caller debounces keystrokes).
 */
export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&limit=5&lang=en`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Geocoder error ${res.status}`)

  const data = (await res.json()) as { features?: PhotonFeature[] }
  return (data.features ?? [])
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates
      return { label: formatLabel(f.properties), lat, lng }
    })
    .filter((r) => r.label.length > 0)
}
