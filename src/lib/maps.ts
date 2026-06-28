import type { Stop } from "../types";

// Builders for Apple Maps and Google Maps navigation links.
//
// Important platform difference:
//  - Google Maps supports a full multi-stop route in one URL (waypoints).
//  - Apple Maps has NO multi-waypoint URL scheme; it can only take a single
//    destination. So for Apple we navigate one stop at a time.

/** Stops that actually have an address we can route to. */
export function navigableStops(stops: Stop[]): Stop[] {
  return stops
    .filter((s) => s.address.trim().length > 0)
    .sort((a, b) => a.position - b.position);
}

/**
 * Build a single Google Maps URL covering the whole route in order.
 *
 * Uses the official Maps URL scheme. The user's current location is the origin,
 * intermediate stops become waypoints, and the final stop is the destination.
 * Google supports up to ~9 waypoints; beyond that the link is truncated and we
 * surface a warning in the UI.
 *
 * Returns null if there are no addressable stops.
 */
export function googleRouteUrl(stops: Stop[]): string | null {
  const ordered = navigableStops(stops);
  if (ordered.length === 0) return null;

  const addresses = ordered.map((s) => s.address.trim());
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    // URLSearchParams encodes the "|" separators for us.
    params.set("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Google Maps limits a single directions URL to roughly 9 waypoints. */
export const GOOGLE_MAX_WAYPOINTS = 9;

/** True when the route has more stops than a single Google link can hold. */
export function exceedsGoogleLimit(stops: Stop[]): boolean {
  // destination + waypoints; waypoints = total - 1
  return navigableStops(stops).length - 1 > GOOGLE_MAX_WAYPOINTS;
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
