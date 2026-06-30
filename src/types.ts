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
  /** Specific delivery date (ISO `YYYY-MM-DD`), or null if unscheduled. */
  delivery_date: string | null;
}

/** An entry in the editable master list of linens & delivery materials. */
export interface Material {
  id: string;
  name: string;
  /** Emoji shown next to the material for quick visual scanning. */
  icon: string;
  /** Display order in pickers and the management screen. */
  position: number;
}

/** A reusable address book entry used to auto-fill a stop's address. */
export interface SavedAddress {
  id: string;
  /** Short label, e.g. "Riverside Hotel". */
  label: string;
  /** Full street address. */
  address: string;
  /** Optional default notes copied to the stop. */
  notes: string;
  /** Display order in the address book. */
  position: number;
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
  /** Route-level notes. */
  notes: string;
  created_at: string;
}

/** A route together with its ordered stops. */
export interface RouteWithStops extends Route {
  stops: Stop[];
}
