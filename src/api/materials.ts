import { newId, readJSON, writeJSON } from "../lib/localdb";
import { DEFAULT_MATERIALS } from "../data/catalog";
import type { Material } from "../types";

// CRUD helpers for the editable catalog of linens & delivery materials,
// backed by browser localStorage (local to this device).

const MATERIALS_KEY = "materials";

function allMaterials(): Material[] {
  return readJSON<Material[]>(MATERIALS_KEY, []);
}

/** Fetch every material, alphabetically. */
export async function listMaterials(): Promise<Material[]> {
  return [...allMaterials()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Insert the default catalog. Used once to seed an empty materials list. */
export async function seedDefaultMaterials(): Promise<Material[]> {
  const seeded: Material[] = DEFAULT_MATERIALS.map((m) => ({
    ...m,
    id: newId(),
  }));
  writeJSON(MATERIALS_KEY, seeded);
  return seeded;
}

/** Add a new material and return it. */
export async function createMaterial(
  name: string,
  icon: string
): Promise<Material> {
  const material: Material = { id: newId(), name, icon };
  writeJSON(MATERIALS_KEY, [...allMaterials(), material]);
  return material;
}

/** Update a material's name and/or icon. */
export async function updateMaterial(
  id: string,
  patch: Partial<Pick<Material, "name" | "icon">>
): Promise<void> {
  const next = allMaterials().map((m) =>
    m.id === id ? { ...m, ...patch } : m
  );
  writeJSON(MATERIALS_KEY, next);
}

/** Remove a material from the catalog. */
export async function deleteMaterial(id: string): Promise<void> {
  writeJSON(
    MATERIALS_KEY,
    allMaterials().filter((m) => m.id !== id)
  );
}
