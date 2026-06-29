import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listMaterials, seedDefaultMaterials } from "../api/materials";
import { DEFAULT_MATERIALS, iconFor } from "../data/catalog";
import type { Material } from "../types";

interface MaterialsContextValue {
  materials: Material[];
  loading: boolean;
  /** True when the DB table is missing and we're showing read-only defaults. */
  usingFallback: boolean;
  /** Re-read the catalog from the database. */
  refresh: () => Promise<void>;
  /** Icon for an item name, falling back to a box for unknown items. */
  iconFor: (name: string) => string;
}

const MaterialsContext = createContext<MaterialsContextValue | null>(null);

/** Synthetic catalog used when the materials table hasn't been created yet. */
const FALLBACK: Material[] = DEFAULT_MATERIALS.map((m, i) => ({
  ...m,
  id: `fallback-${i}`,
}));

/**
 * Loads the editable materials catalog once and shares it with the whole app.
 * Seeds the default list on first run, and degrades to an in-memory default
 * catalog if the `materials` table doesn't exist yet (so the rest of the app
 * keeps working until the updated schema is applied).
 */
export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const refresh = useCallback(async () => {
    try {
      let list = await listMaterials();
      if (list.length === 0) {
        // First run: populate the catalog with the default linens & materials.
        list = await seedDefaultMaterials();
      }
      setMaterials(list);
      setUsingFallback(false);
    } catch (e) {
      // Most likely the `materials` table hasn't been created yet. Fall back to
      // the built-in defaults so item selection still works.
      console.warn("Falling back to default materials catalog:", e);
      setMaterials(FALLBACK);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<MaterialsContextValue>(
    () => ({
      materials,
      loading,
      usingFallback,
      refresh,
      iconFor: (name: string) => iconFor(materials, name),
    }),
    [materials, loading, usingFallback, refresh]
  );

  return (
    <MaterialsContext.Provider value={value}>
      {children}
    </MaterialsContext.Provider>
  );
}

/** Access the shared materials catalog. */
export function useMaterials(): MaterialsContextValue {
  const ctx = useContext(MaterialsContext);
  if (!ctx) {
    throw new Error("useMaterials must be used within a MaterialsProvider");
  }
  return ctx;
}
