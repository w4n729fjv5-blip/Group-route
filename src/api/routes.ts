import type {
  DeliveryDay,
  LineItem,
  Route,
  RouteWithStops,
  Stop,
} from "../types";

// Local, offline storage for routes & stops — everything lives in the browser's
// localStorage. No accounts, no server, no network. Data stays on this device.
//
// The functions stay async (returning resolved promises) so the screens don't
// need to care whether storage is local or remote.

const STORAGE_KEY = "linen-route-creator/v1";

interface Database {
  routes: Route[];
  stops: Stop[];
}

/** Generate a unique id. Uses crypto.randomUUID when available, else a fallback. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Read the whole database from localStorage, tolerating missing/corrupt data. */
function read(): Database {
  if (typeof localStorage === "undefined") return { routes: [], stops: [] };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { routes: [], stops: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      routes: Array.isArray(parsed.routes) ? parsed.routes : [],
      stops: Array.isArray(parsed.stops) ? parsed.stops : [],
    };
  } catch {
    // Corrupt data — start fresh rather than crashing the app.
    return { routes: [], stops: [] };
  }
}

/** Write the whole database back to localStorage. */
function write(db: Database): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Fetch all routes (without stops), newest first. */
export async function listRoutes(): Promise<Route[]> {
  const { routes } = read();
  return [...routes].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Fetch a single route together with its ordered stops. */
export async function getRouteWithStops(
  routeId: string
): Promise<RouteWithStops | null> {
  const db = read();
  const route = db.routes.find((r) => r.id === routeId);
  if (!route) return null;
  const stops = db.stops
    .filter((s) => s.route_id === routeId)
    .sort((a, b) => a.position - b.position);
  return { ...route, stops };
}

/** Create a new empty route and return it. */
export async function createRoute(
  name: string,
  deliveryDay: DeliveryDay | null
): Promise<Route> {
  const db = read();
  const route: Route = {
    id: newId(),
    name,
    delivery_day: deliveryDay,
    notes: "",
    created_at: new Date().toISOString(),
  };
  db.routes.push(route);
  write(db);
  return route;
}

/** Update mutable fields on a route. */
export async function updateRoute(
  routeId: string,
  patch: Partial<Pick<Route, "name" | "delivery_day" | "notes">>
): Promise<void> {
  const db = read();
  const route = db.routes.find((r) => r.id === routeId);
  if (!route) return;
  Object.assign(route, patch);
  write(db);
}

/** Delete a route and all of its stops. */
export async function deleteRoute(routeId: string): Promise<void> {
  const db = read();
  db.routes = db.routes.filter((r) => r.id !== routeId);
  db.stops = db.stops.filter((s) => s.route_id !== routeId);
  write(db);
}

/** Add a stop to the end of a route and return it. */
export async function createStop(
  routeId: string,
  position: number
): Promise<Stop> {
  const db = read();
  const stop: Stop = {
    id: newId(),
    route_id: routeId,
    name: "",
    address: "",
    notes: "",
    position,
    items: [] as LineItem[],
  };
  db.stops.push(stop);
  write(db);
  return stop;
}

/** Update mutable fields on a stop. */
export async function updateStop(
  stopId: string,
  patch: Partial<Pick<Stop, "name" | "address" | "notes" | "position" | "items">>
): Promise<void> {
  const db = read();
  const stop = db.stops.find((s) => s.id === stopId);
  if (!stop) return;
  Object.assign(stop, patch);
  write(db);
}

/** Delete a single stop. */
export async function deleteStop(stopId: string): Promise<void> {
  const db = read();
  db.stops = db.stops.filter((s) => s.id !== stopId);
  write(db);
}

/** Persist a new ordering by writing each stop's position. */
export async function persistStopOrder(stops: Stop[]): Promise<void> {
  const db = read();
  const order = new Map(stops.map((s, index) => [s.id, index]));
  for (const stop of db.stops) {
    const pos = order.get(stop.id);
    if (pos !== undefined) stop.position = pos;
  }
  write(db);
}
