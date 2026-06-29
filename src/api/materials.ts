import { requireSupabase } from "../lib/supabase";
import { DEFAULT_MATERIALS } from "../data/catalog";
import type { Material } from "../types";

// CRUD helpers for the editable catalog of linens & delivery materials.
// Stored in the Supabase `materials` table so the list syncs across devices.

const MATERIALS = "materials";

/** Fetch every material, alphabetically. */
export async function listMaterials(): Promise<Material[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(MATERIALS)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Material[];
}

/** Insert the default catalog. Used once to seed an empty materials table. */
export async function seedDefaultMaterials(): Promise<Material[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(MATERIALS)
    .insert(DEFAULT_MATERIALS)
    .select("*");
  if (error) throw error;
  return (data ?? []) as Material[];
}

/** Add a new material and return it. */
export async function createMaterial(
  name: string,
  icon: string
): Promise<Material> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(MATERIALS)
    .insert({ name, icon })
    .select("*")
    .single();
  if (error) throw error;
  return data as Material;
}

/** Update a material's name and/or icon. */
export async function updateMaterial(
  id: string,
  patch: Partial<Pick<Material, "name" | "icon">>
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(MATERIALS).update(patch).eq("id", id);
  if (error) throw error;
}

/** Remove a material from the catalog. */
export async function deleteMaterial(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(MATERIALS).delete().eq("id", id);
  if (error) throw error;
}
