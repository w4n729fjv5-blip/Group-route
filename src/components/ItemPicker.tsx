import { useState } from "react";
import { useMaterials } from "../materials/MaterialsContext";
import type { LineItem } from "../types";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

/** Find an item by case-insensitive name. */
function indexOfItem(items: LineItem[], name: string): number {
  return items.findIndex(
    (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
}

/**
 * Build a stop's delivery list. Pick linens & materials from a dropdown (sourced
 * from the editable catalog), adjust quantities with steppers, and add one-off
 * custom items. Items with quantity 0 are removed.
 */
export default function ItemPicker({ items, onChange }: Props) {
  const { materials, iconFor } = useMaterials();
  const [customName, setCustomName] = useState("");

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

  function addByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (indexOfItem(items, trimmed) >= 0) return; // already on the list
    onChange([...items, { name: trimmed, quantity: 1 }]);
  }

  function addCustom() {
    addByName(customName);
    setCustomName("");
  }

  // Materials from the catalog that aren't already on this stop.
  const onStop = new Set(items.map((it) => it.name.trim().toLowerCase()));
  const available = materials.filter(
    (m) => !onStop.has(m.name.trim().toLowerCase())
  );

  return (
    <div className="item-picker">
      <label className="field">
        <span className="field-label">Add linen or material</span>
        <select
          className="material-select"
          value=""
          onChange={(e) => {
            if (e.target.value) addByName(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="">＋ Choose from catalog…</option>
          {available.map((m) => (
            <option key={m.id} value={m.name}>
              {m.icon} {m.name}
            </option>
          ))}
          {available.length === 0 && (
            <option value="" disabled>
              All catalog materials added
            </option>
          )}
        </select>
      </label>

      {items.length === 0 ? (
        <p className="muted small">
          No items yet. Pick from the dropdown above or add a custom item.
        </p>
      ) : (
        items.map((it) => (
          <ItemRow
            key={it.name}
            label={`${iconFor(it.name)} ${it.name}`}
            quantity={it.quantity}
            onSet={(q) => setQuantity(it.name, q)}
          />
        ))
      )}

      <div className="add-custom">
        <input
          type="text"
          inputMode="text"
          placeholder="Add custom item…"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn small" onClick={addCustom}>
          Add
        </button>
      </div>
    </div>
  );
}

function ItemRow({
  label,
  quantity,
  onSet,
}: {
  label: string;
  quantity: number;
  onSet: (q: number) => void;
}) {
  return (
    <div className="item-row active">
      <span className="item-label">{label}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onSet(Math.max(0, quantity - 1))}
        >
          −
        </button>
        <span className="qty" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onSet(quantity + 1)}
        >
          +
        </button>
        <button
          type="button"
          className="item-remove"
          aria-label={`Remove ${label}`}
          onClick={() => onSet(0)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
