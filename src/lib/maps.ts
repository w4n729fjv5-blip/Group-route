// Builders for Apple Maps and Google Maps navigation links.
//
// Important platform difference:
//  - Google Maps supports a full multi-stop route in one URL (waypoints).
//  - Apple Maps has NO multi-waypoint URL scheme; it can only take a single
//    destination. So for Apple we navigate one stop at a time.

/** Google Maps limits a single directions URL to roughly 9 waypoints. */
export const GOOGLE_MAX_WAYPOINTS = 9;

/** Keep only non-empty, trimmed addresses (preserving order). */
function cleanAddresses(addresses: string[]): string[] {
  return addresses.map((a) => a.trim()).filter((a) => a.length > 0);
}

/**
 * Build a single Google Maps URL covering a whole day's route in order.
 * The user's current location is the origin, intermediate stops become
 * waypoints, and the last stop is the destination.
 *
 * Returns null if there are no addressable stops.
 */
export function googleRouteUrl(addresses: string[]): string | null {
  const ordered = cleanAddresses(addresses);
  if (ordered.length === 0) return null;

  const destination = ordered[ordered.length - 1];
  const waypoints = ordered.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** True when the route has more stops than a single Google link can hold. */
export function exceedsGoogleLimit(addresses: string[]): boolean {
  return cleanAddresses(addresses).length - 1 > GOOGLE_MAX_WAYPOINTS;
}

/** Navigate to a single address in Google Maps. */
export function googleStopUrl(address: string): string {
  const params = new URLSearchParams({
    api: "1",
    destination: address.trim(),
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Navigate to a single address in Apple Maps (driving directions). */
export function appleStopUrl(address: string): string {
  const params = new URLSearchParams({
    daddr: address.trim(),
    dirflg: "d", // driving
  });
  return `https://maps.apple.com/?${params.toString()}`;
}
