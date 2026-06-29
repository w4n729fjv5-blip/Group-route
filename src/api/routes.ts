import { newId, readJSON, writeJSON } from "../lib/localdb";
import type {
  DeliveryDay,
  LineItem,
  Route,
  RouteWithStops,
  Stop,
} from "../types";

// CRUD helpers for routes and stops, backed by browser localStorage.
// Everything runs locally on this device — no account or server needed.

const ROUTES_KEY = "routes";
const STOPS_KEY = "stops";

function allRoutes(): Route[] {
  return readJSON<Route[]>(ROUTES_KEY, []);
}

function allStops(): Stop[] {
  return readJSON<Stop[]>(STOPS_KEY, []);
}

/** Fetch all routes (without stops), newest first. */
export async function listRoutes(): Promise<Route[]> {
  return [...allRoutes()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

/** Fetch a single route together with its ordered stops. */
export async function getRouteWithStops(
  routeId: string
): Promise<RouteWithStops | null> {
  const route = allRoutes().find((r) => r.id === routeId);
  if (!route) return null;
  const stops = allStops()
    .filter((s) => s.route_id === routeId)
    .sort((a, b) => a.position - b.position);
  return { ...route, stops };
}

/** Create a new empty route and return it. */
export async function createRoute(
  name: string,
  deliveryDay: DeliveryDay | null
): Promise<Route> {
  const route: Route = {
    id: newId(),
    name,
    delivery_day: deliveryDay,
    notes: "",
    created_at: new Date().toISOString(),
  };
  writeJSON(ROUTES_KEY, [...allRoutes(), route]);
  return route;
}

/** Update mutable fields on a route. */
export async function updateRoute(
  routeId: string,
  patch: Partial<Pick<Route, "name" | "delivery_day" | "notes">>
): Promise<void> {
  const next = allRoutes().map((r) =>
    r.id === routeId ? { ...r, ...patch } : r
  );
  writeJSON(ROUTES_KEY, next);
}

/** Delete a route and all of its stops. */
export async function deleteRoute(routeId: string): Promise<void> {
  writeJSON(
    ROUTES_KEY,
    allRoutes().filter((r) => r.id !== routeId)
  );
  writeJSON(
    STOPS_KEY,
    allStops().filter((s) => s.route_id !== routeId)
  );
}

/** Add a stop to the end of a route and return it. */
export async function createStop(
  routeId: string,
  position: number
): Promise<Stop> {
  const stop: Stop = {
    id: newId(),
    route_id: routeId,
    name: "",
    address: "",
    date: "",
    notes: "",
    position,
    items: [] as LineItem[],
  };
  writeJSON(STOPS_KEY, [...allStops(), stop]);
  return stop;
}

/** Update mutable fields on a stop. */
export async function updateStop(
  stopId: string,
  patch: Partial<
    Pick<Stop, "name" | "address" | "date" | "notes" | "position" | "items">
  >
): Promise<void> {
  const next = allStops().map((s) =>
    s.id === stopId ? { ...s, ...patch } : s
  );
  writeJSON(STOPS_KEY, next);
}

/** Delete a single stop. */
export async function deleteStop(stopId: string): Promise<void> {
  writeJSON(
    STOPS_KEY,
    allStops().filter((s) => s.id !== stopId)
  );
}

/** Persist a new ordering by writing each stop's position. */
export async function persistStopOrder(stops: Stop[]): Promise<void> {
  const order = new Map(stops.map((s, index) => [s.id, index]));
  const next = allStops().map((s) =>
    order.has(s.id) ? { ...s, position: order.get(s.id)! } : s
  );
  writeJSON(STOPS_KEY, next);
}
