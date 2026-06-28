import type { Stop } from './types'

/**
 * A stop is usable for navigation when it has either coordinates (preferred,
 * most accurate) or a non-empty address string.
 */
export function stopIsLocatable(stop: Pick<Stop, 'address' | 'lat' | 'lng'>): boolean {
  return (stop.lat != null && stop.lng != null) || stop.address.trim().length > 0
}

/** Coordinates win over the typed address because they are unambiguous. */
function stopToQuery(stop: Pick<Stop, 'address' | 'lat' | 'lng'>): string {
  if (stop.lat != null && stop.lng != null) return `${stop.lat},${stop.lng}`
  return stop.address.trim()
}

function locatableStops(stops: Stop[]): Stop[] {
  return stops.filter(stopIsLocatable)
}

/**
 * Google Maps multi-stop directions URL.
 * Origin is omitted so Google uses the device's current location.
 * Stops before the last become waypoints; the last is the destination.
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function buildGoogleMapsUrl(stops: Stop[]): string | null {
  const usable = locatableStops(stops)
  if (usable.length === 0) return null

  const destination = stopToQuery(usable[usable.length - 1])
  const waypoints = usable.slice(0, -1).map(stopToQuery)

  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  })
  if (waypoints.length > 0) {
    // URLSearchParams encodes the pipe separators for us.
    params.set('waypoints', waypoints.join('|'))
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/**
 * Apple Maps directions URL with chained stops via the `to:` syntax.
 * https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
 * Multi-stop support is more limited than Google's; on older iOS only the
 * first destination may be honored, which is still a useful fallback.
 */
export function buildAppleMapsUrl(stops: Stop[]): string | null {
  const usable = locatableStops(stops)
  if (usable.length === 0) return null

  const daddr = usable.map(stopToQuery).map(encodeURIComponent).join('+to:')
  return `https://maps.apple.com/?daddr=${daddr}&dirflg=d`
}
