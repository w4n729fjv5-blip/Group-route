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
import { iconFor } from "../data/catalog";
import type { Material } from "../types";

interface MaterialsContextValue {
  materials: Material[];
  loading: boolean;
  /** Re-read the catalog from storage. */
  refresh: () => Promise<void>;
  /** Icon for an item name, falling back to a box for unknown items. */
  iconFor: (name: string) => string;
}

const MaterialsContext = createContext<MaterialsContextValue | null>(null);

/**
 * Loads the editable materials catalog once and shares it with the whole app.
 * Seeds the default list on first run (when storage is empty).
 */
export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let list = await listMaterials();
    if (list.length === 0) {
      // First run: populate the catalog with the default linens & materials.
      list = await seedDefaultMaterials();
    }
    setMaterials(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<MaterialsContextValue>(
    () => ({
      materials,
      loading,
      refresh,
      iconFor: (name: string) => iconFor(materials, name),
    }),
    [materials, loading, refresh]
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
