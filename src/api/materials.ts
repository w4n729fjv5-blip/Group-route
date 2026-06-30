import { requireSupabase } from "../lib/supabase";
import { DEFAULT_MATERIALS } from "../data/catalog";
import type { Material } from "../types";

// CRUD helpers for the editable master list of linens & delivery materials.
// No auth: all reads/writes go through the public anon role.

const MATERIALS = "materials";

/**
 * Fetch all materials ordered for display. The first time the app runs the
 * table is empty, so we seed it with the defaults and return those.
 */
export async function listMaterials(): Promise<Material[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(MATERIALS)
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;

  const materials = (data ?? []) as Material[];
  if (materials.length === 0) {
    return seedDefaultMaterials();
  }
  return materials;
}

/** Insert the default materials and return them (used on first run). */
async function seedDefaultMaterials(): Promise<Material[]> {
  const sb = requireSupabase();
  const rows = DEFAULT_MATERIALS.map((m, i) => ({
    name: m.name,
    icon: m.icon,
    position: i,
  }));
  const { data, error } = await sb.from(MATERIALS).insert(rows).select("*");
  if (error) throw error;
  return ((data ?? []) as Material[]).sort((a, b) => a.position - b.position);
}

/** Create a material at the end of the list and return it. */
export async function createMaterial(
  name: string,
  icon: string,
  position: number
): Promise<Material> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(MATERIALS)
    .insert({ name, icon, position })
    .select("*")
    .single();
  if (error) throw error;
  return data as Material;
}

/** Update mutable fields on a material. */
export async function updateMaterial(
  id: string,
  patch: Partial<Pick<Material, "name" | "icon" | "position">>
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(MATERIALS).update(patch).eq("id", id);
  if (error) throw error;
}

/** Delete a material from the master list. */
export async function deleteMaterial(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(MATERIALS).delete().eq("id", id);
  if (error) throw error;
}
