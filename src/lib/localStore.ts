// Offline, zero-setup storage backend. Routes and stops are kept in the
// browser's localStorage so the app works immediately with no account or
// database. The public API mirrors the Supabase backend in ../api/routes so the
// screens don't care which one is active.
//
// Everything here is synchronous under the hood but exposed as Promises to keep
// the call sites identical to the cloud backend.

import type {
  DeliveryDay,
  LineItem,
  Route,
  RouteWithStops,
  Stop,
} from "../types";

const KEY = "linen.data.v1";

interface DB {
  routes: Route[];
  stops: Stop[];
}

function newId(): string {
  // crypto.randomUUID is available in every modern browser.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function read(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DB>;
      return {
        routes: (parsed.routes ?? []).map(normalizeRoute),
        stops: parsed.stops ?? [],
      };
    }
  } catch {
    // Corrupt or unavailable storage falls back to empty.
  }
  return { routes: [], stops: [] };
}

/** Backfill fields added in later versions so old saved data keeps working. */
function normalizeRoute(r: Route): Route {
  return { ...r, delivery_date: r.delivery_date ?? null };
}

function write(db: DB): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const localStore = {
  async listRoutes(): Promise<Route[]> {
    return read().routes.sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  },

  async getRouteWithStops(routeId: string): Promise<RouteWithStops | null> {
    const db = read();
    const route = db.routes.find((r) => r.id === routeId);
    if (!route) return null;
    const stops = db.stops
      .filter((s) => s.route_id === routeId)
      .sort((a, b) => a.position - b.position);
    return { ...route, stops };
  },

  async createRoute(
    name: string,
    deliveryDay: DeliveryDay | null
  ): Promise<Route> {
    const db = read();
    const route: Route = {
      id: newId(),
      name,
      delivery_day: deliveryDay,
      delivery_date: null,
      notes: "",
      created_at: new Date().toISOString(),
    };
    db.routes.push(route);
    write(db);
    return route;
  },

  async updateRoute(
    routeId: string,
    patch: Partial<Pick<Route, "name" | "delivery_day" | "delivery_date" | "notes">>
  ): Promise<void> {
    const db = read();
    const route = db.routes.find((r) => r.id === routeId);
    if (route) Object.assign(route, patch);
    write(db);
  },

  async deleteRoute(routeId: string): Promise<void> {
    const db = read();
    db.routes = db.routes.filter((r) => r.id !== routeId);
    db.stops = db.stops.filter((s) => s.route_id !== routeId);
    write(db);
  },

  async createStop(routeId: string, position: number): Promise<Stop> {
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
  },

  async updateStop(
    stopId: string,
    patch: Partial<Pick<Stop, "name" | "address" | "notes" | "position" | "items">>
  ): Promise<void> {
    const db = read();
    const stop = db.stops.find((s) => s.id === stopId);
    if (stop) Object.assign(stop, patch);
    write(db);
  },

  async deleteStop(stopId: string): Promise<void> {
    const db = read();
    db.stops = db.stops.filter((s) => s.id !== stopId);
    write(db);
  },

  async persistStopOrder(stops: Stop[]): Promise<void> {
    const db = read();
    stops.forEach((s, index) => {
      const stop = db.stops.find((x) => x.id === s.id);
      if (stop) stop.position = index;
    });
    write(db);
  },
};
