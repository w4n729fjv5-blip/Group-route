// Shared domain types for the Linen Delivery Route Creator.

/** A line item to deliver at a stop, e.g. { name: "Napkins", quantity: 50 }. */
export interface LineItem {
  name: string;
  quantity: number;
}

/** A single delivery stop within a route. */
export interface Stop {
  id: string;
  route_id: string;
  /** Customer / location name, e.g. "Riverside Hotel". */
  name: string;
  /** Full street address used for maps navigation. */
  address: string;
  /** Free-form notes for this stop (gate codes, contact, instructions). */
  notes: string;
  /** Order of the stop within the route (0-based). */
  position: number;
  /** Items to deliver here. */
  items: LineItem[];
}

/** Days of the week a route can be assigned to. */
export const DELIVERY_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DeliveryDay = (typeof DELIVERY_DAYS)[number];

/** A saved delivery route. */
export interface Route {
  id: string;
  name: string;
  /** Weekday the route is delivered, or null if unscheduled. */
  delivery_day: DeliveryDay | null;
  /** Specific delivery date as YYYY-MM-DD, or null if only a weekday is set. */
  delivery_date: string | null;
  /** Route-level notes. */
  notes: string;
  created_at: string;
}

/** A route together with its ordered stops. */
export interface RouteWithStops extends Route {
  stops: Stop[];
}

/**
 * A reusable saved address ("address book" entry). Picking one autofills a
 * stop's name, address, and notes so common drop-off points don't have to be
 * retyped.
 */
export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  notes: string;
}

/** Map a YYYY-MM-DD date string to its weekday name (local time). */
export function weekdayOf(dateStr: string): DeliveryDay | null {
  if (!dateStr) return null;
  // Parse as local date (avoid UTC shifting the day).
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  const idx = (date.getDay() + 6) % 7; // 0 = Monday
  return DELIVERY_DAYS[idx] ?? null;
}
