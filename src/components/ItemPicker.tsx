import { useState } from "react";
import { Link } from "react-router-dom";
import { useMaterials } from "../lib/store";
import type { LineItem } from "../types";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

/** Case-insensitive index of an item by name. */
function indexOfItem(items: LineItem[], name: string): number {
  return items.findIndex(
    (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
}

/** Icon for a material name from the catalog; box for anything custom. */
function useIconLookup() {
  const materials = useMaterials();
  return (name: string) => {
    const m = materials.find(
      (x) => x.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return m ? m.icon : "📦";
  };
}

/**
 * Build a delivery's item list. Pick any linen/material from the catalog via
 * the dropdown to add it, then adjust quantities with the steppers. The
 * catalog itself is managed on the Materials screen.
 */
export default function ItemPicker({ items, onChange }: Props) {
  const materials = useMaterials();
  const iconFor = useIconLookup();
  const [pick, setPick] = useState("");

  function setQuantity(name: string, quantity: number) {
    const idx = indexOfItem(items, name);
    const next = [...items];
    if (quantity <= 0) {
      if (idx >= 0) next.splice(idx, 1);
    } else if (idx >= 0) {
      next[idx] = { ...next[idx], quantity };
    } else {
      next.push({ name, quantity });
    }
    onChange(next);
  }

  function addFromDropdown(name: string) {
    if (!name) return;
    if (indexOfItem(items, name) < 0) {
      onChange([...items, { name, quantity: 1 }]);
    }
    setPick("");
  }

  // Materials not yet added to this delivery — the dropdown's options.
  const chosen = new Set(items.map((it) => it.name.trim().toLowerCase()));
  const available = materials.filter((m) => !chosen.has(m.name.toLowerCase()));

  return (
    <div className="item-picker">
      {items.length === 0 ? (
        <p className="muted small">
          No items yet. Choose linens or materials from the menu below.
        </p>
      ) : (
        items.map((it) => (
          <div className="item-row active" key={it.name}>
            <span className="item-label">
              {iconFor(it.name)} {it.name}
            </span>
            <div className="stepper">
              <button
                type="button"
                aria-label={`Decrease ${it.name}`}
                onClick={() => setQuantity(it.name, it.quantity - 1)}
              >
                −
              </button>
              <span className="qty" aria-live="polite">
                {it.quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase ${it.name}`}
                onClick={() => setQuantity(it.name, it.quantity + 1)}
              >
                +
              </button>
              <button
                type="button"
                className="item-remove"
                aria-label={`Remove ${it.name}`}
                onClick={() => setQuantity(it.name, 0)}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      <div className="add-row">
        <select
          className="material-select"
          value={pick}
          onChange={(e) => addFromDropdown(e.target.value)}
        >
          <option value="">
            {available.length ? "+ Add linen or material…" : "All materials added"}
          </option>
          {available.map((m) => (
            <option key={m.id} value={m.name}>
              {m.icon} {m.name}
            </option>
          ))}
        </select>
      </div>

      <p className="muted small">
        Need a different item?{" "}
        <Link to="/materials" className="inline-link">
          Manage materials
        </Link>
      </p>
    </div>
  );
}
