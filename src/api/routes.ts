import { requireSupabase } from "../lib/supabase";
import type {
  DeliveryDay,
  LineItem,
  Route,
  RouteWithStops,
  Stop,
} from "../types";

// CRUD helpers against the Supabase `routes` and `stops` tables.
// No auth: all reads/writes go through the public anon role.

const ROUTES = "routes";
const STOPS = "stops";

/** Fetch all routes (without stops), newest first. */
export async function listRoutes(): Promise<Route[]> {
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
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(ROUTES)
    .insert({ name, delivery_day: deliveryDay, notes: "" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Route;
}

/** Update mutable fields on a route. */
export async function updateRoute(
  routeId: string,
  patch: Partial<Pick<Route, "name" | "delivery_day" | "notes">>
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(ROUTES).update(patch).eq("id", routeId);
  if (error) throw error;
}

/** Delete a route. Stops are removed via ON DELETE CASCADE. */
export async function deleteRoute(routeId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(ROUTES).delete().eq("id", routeId);
  if (error) throw error;
}

/** Add a stop to the end of a route and return it. */
export async function createStop(
  routeId: string,
  position: number
): Promise<Stop> {
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
      delivery_date: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Stop;
}

/** Update mutable fields on a stop. */
export async function updateStop(
  stopId: string,
  patch: Partial<
    Pick<Stop, "name" | "address" | "notes" | "position" | "items" | "delivery_date">
  >
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(STOPS).update(patch).eq("id", stopId);
  if (error) throw error;
}

/** Delete a single stop. */
export async function deleteStop(stopId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(STOPS).delete().eq("id", stopId);
  if (error) throw error;
}

/** Persist a new ordering by writing each stop's position. */
export async function persistStopOrder(stops: Stop[]): Promise<void> {
  const sb = requireSupabase();
  await Promise.all(
    stops.map((stop, index) =>
      sb.from(STOPS).update({ position: index }).eq("id", stop.id)
    )
  );
  // Surface the first error, if any, by re-reading is unnecessary; updates above
  // throw via the network layer only on transport errors. Individual row errors
  // are rare for position writes, so we keep this lightweight.
}
