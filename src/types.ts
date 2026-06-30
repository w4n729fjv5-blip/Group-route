// Shared domain types for the Linen Delivery Organizer.
//
// The app is local-first: everything is stored in the browser (localStorage),
// so it works instantly with no account or server setup.

/** A line item to deliver, e.g. { name: "Napkins", quantity: 50 }. */
export interface LineItem {
  name: string;
  quantity: number;
}

/**
 * A single delivery. Deliveries are grouped by `date` on the schedule screen,
 * so all deliveries on the same day form that day's route.
 */
export interface Delivery {
  id: string;
  /** ISO date string, "YYYY-MM-DD". Empty string means "no date yet". */
  date: string;
  /** Customer / location name, e.g. "Riverside Hotel" (optional). */
  name: string;
  /** Full street address used for maps navigation. */
  address: string;
  /** Items to deliver here. */
  items: LineItem[];
  /** Free-form notes (gate codes, contact, instructions). */
  notes: string;
  /** Order within its day, for routing. Lower comes first. */
  position: number;
}

/**
 * A linen or delivery material in the master catalog. The user manages this
 * list (add / rename / delete) from the Materials menu, and picks from it when
 * building a delivery.
 */
export interface Material {
  id: string;
  name: string;
  /** Emoji shown next to the material for quick visual scanning. */
  icon: string;
}

/**
 * A reusable address. Saved addresses power the autofill on the delivery
 * screen: start typing and matching saved addresses appear to complete it.
 */
export interface SavedAddress {
  id: string;
  /** Short label, e.g. "Riverside Hotel". */
  label: string;
  /** Full street address. */
  address: string;
}
