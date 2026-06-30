import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";
import { localStore } from "../lib/localStore";
import type {
  DeliveryDay,
  LineItem,
  Route,
  RouteWithStops,
  Stop,
} from "../types";

// Data access for routes & stops.
//
// Two backends are supported:
//  - LOCAL (default): browser localStorage, so the app works with zero setup.
//  - SUPABASE (optional): cloud sync across devices, enabled by setting the
//    VITE_SUPABASE_* env vars. See README.
//
// Every exported function picks the active backend, so screens never need to
// know which one is in use.

const ROUTES = "routes";
const STOPS = "stops";

/** Fetch all routes (without stops), newest first. */
export async function listRoutes(): Promise<Route[]> {
  if (!isSupabaseConfigured) return localStore.listRoutes();
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ROUTES)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Route[];
}

/** Fetch a single route together with its ordered stops. */
export async function getRouteWithStops(
  routeId: string
): Promise<RouteWithStops | null> {
  if (!isSupabaseConfigured) return localStore.getRouteWithStops(routeId);
  const sb = requireSupabase();
  const { data: route, error: routeErr } = await sb
    .from(ROUTES)
    .select("*")
    .eq("id", routeId)
    .maybeSingle();
  if (routeErr) throw routeErr;
  if (!route) return null;

  const { data: stops, error: stopsErr } = await sb
    .from(STOPS)
    .select("*")
    .eq("route_id", routeId)
    .order("position", { ascending: true });
  if (stopsErr) throw stopsErr;

  return { ...(route as Route), stops: (stops ?? []) as Stop[] };
}

/** Create a new empty route and return it. */
export async function createRoute(
  name: string,
  deliveryDay: DeliveryDay | null
): Promise<Route> {
  if (!isSupabaseConfigured) return localStore.createRoute(name, deliveryDay);
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ROUTES)
    .insert({ name, delivery_day: deliveryDay, delivery_date: null, notes: "" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Route;
}

/** Update mutable fields on a route. */
export async function updateRoute(
  routeId: string,
  patch: Partial<Pick<Route, "name" | "delivery_day" | "delivery_date" | "notes">>
): Promise<void> {
  if (!isSupabaseConfigured) return localStore.updateRoute(routeId, patch);
  const sb = requireSupabase();
  const { error } = await sb.from(ROUTES).update(patch).eq("id", routeId);
  if (error) throw error;
}

/** Delete a route. Stops are removed via ON DELETE CASCADE. */
export async function deleteRoute(routeId: string): Promise<void> {
  if (!isSupabaseConfigured) return localStore.deleteRoute(routeId);
  const sb = requireSupabase();
  const { error } = await sb.from(ROUTES).delete().eq("id", routeId);
  if (error) throw error;
}

/** Add a stop to the end of a route and return it. */
export async function createStop(
  routeId: string,
  position: number
): Promise<Stop> {
  if (!isSupabaseConfigured) return localStore.createStop(routeId, position);
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(STOPS)
    .insert({
      route_id: routeId,
      name: "",
      address: "",
      notes: "",
      position,
      items: [] as LineItem[],
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Stop;
}

/** Update mutable fields on a stop. */
export async function updateStop(
  stopId: string,
  patch: Partial<Pick<Stop, "name" | "address" | "notes" | "position" | "items">>
): Promise<void> {
  if (!isSupabaseConfigured) return localStore.updateStop(stopId, patch);
  const sb = requireSupabase();
  const { error } = await sb.from(STOPS).update(patch).eq("id", stopId);
  if (error) throw error;
}

/** Delete a single stop. */
export async function deleteStop(stopId: string): Promise<void> {
  if (!isSupabaseConfigured) return localStore.deleteStop(stopId);
  const sb = requireSupabase();
  const { error } = await sb.from(STOPS).delete().eq("id", stopId);
  if (error) throw error;
}

/** Persist a new ordering by writing each stop's position. */
export async function persistStopOrder(stops: Stop[]): Promise<void> {
  if (!isSupabaseConfigured) return localStore.persistStopOrder(stops);
  const sb = requireSupabase();
  await Promise.all(
    stops.map((stop, index) =>
      sb.from(STOPS).update({ position: index }).eq("id", stop.id)
    )
  );
}
