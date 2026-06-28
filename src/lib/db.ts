import { supabase } from './supabase'
import type { Route, Stop, StopItem } from './types'

/** All routes for the signed-in user, newest first. */
export async function listRoutes(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createRoute(name: string): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoute(
  id: string,
  patch: Partial<Pick<Route, 'name' | 'delivery_day'>>,
): Promise<void> {
  const { error } = await supabase.from('routes').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase.from('routes').delete().eq('id', id)
  if (error) throw error
}

/** Stops for a route, in delivery order. */
export async function listStops(routeId: string): Promise<Stop[]> {
  const { data, error } = await supabase
    .from('stops')
    .select('*')
    .eq('route_id', routeId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(normalizeStop)
}

export async function createStop(routeId: string, position: number): Promise<Stop> {
  const { data, error } = await supabase
    .from('stops')
    .insert({ route_id: routeId, position })
    .select()
    .single()
  if (error) throw error
  return normalizeStop(data)
}

export type StopPatch = Partial<
  Pick<Stop, 'label' | 'address' | 'lat' | 'lng' | 'notes' | 'position'> & {
    items: StopItem[]
  }
>

export async function updateStop(id: string, patch: StopPatch): Promise<void> {
  const { error } = await supabase.from('stops').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteStop(id: string): Promise<void> {
  const { error } = await supabase.from('stops').delete().eq('id', id)
  if (error) throw error
}

/** Persist the order of every stop after a reorder. */
export async function persistOrder(stops: Stop[]): Promise<void> {
  await Promise.all(stops.map((s, i) => updateStop(s.id, { position: i })))
}

/** Guard against null jsonb / missing fields coming back from the DB. */
function normalizeStop(raw: Record<string, unknown>): Stop {
  return {
    ...(raw as unknown as Stop),
    items: Array.isArray(raw.items) ? (raw.items as StopItem[]) : [],
    notes: (raw.notes as string) ?? '',
    label: (raw.label as string) ?? '',
    address: (raw.address as string) ?? '',
  }
}
