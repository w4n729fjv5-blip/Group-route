import { useState } from "react";
import { Link } from "react-router-dom";
import { iconForMaterial, useMaterials } from "../lib/settings";
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
 * Pick what to deliver at a stop. A dropdown adds any linen/material from the
 * catalog (managed on the Materials screen); each added item gets a quantity
 * stepper. Custom one-off items can be typed in too. Items at quantity 0 are
 * removed.
 */
export default function ItemPicker({ items, onChange }: Props) {
  const materials = useMaterials();
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
    const idx = indexOfItem(items, trimmed);
    if (idx >= 0) {
      // Already on the stop — bump the quantity so re-picking still feels useful.
      setQuantity(trimmed, items[idx].quantity + 1);
    } else {
      onChange([...items, { name: trimmed, quantity: 1 }]);
    }
  }

  function addCustom() {
    addByName(customName);
    setCustomName("");
  }

  // Catalog materials not yet on this stop — the options offered in the dropdown.
  const availableMaterials = materials.filter(
    (m) => indexOfItem(items, m.name) < 0
  );

  return (
    <div className="item-picker">
      <div className="field">
        <span className="field-label">Add a linen or material</span>
        <select
          className="item-select"
          value=""
          onChange={(e) => {
            if (e.target.value) addByName(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            {availableMaterials.length > 0
              ? "Choose from catalog…"
              : "All catalog items added"}
          </option>
          {availableMaterials.map((m) => (
            <option key={m.name} value={m.name}>
              {m.icon} {m.name}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <p className="muted small">
          No items yet. Pick from the dropdown above or add a custom item.
        </p>
      ) : (
        items.map((it) => (
          <ItemRow
            key={it.name}
            label={`${iconForMaterial(it.name)} ${it.name}`}
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

      <Link to="/settings" className="manage-link">
        Manage materials catalog →
      </Link>
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
  const active = quantity > 0;
  return (
    <div className={`item-row${active ? " active" : ""}`}>
      <span className="item-label">{label}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onSet(Math.max(0, quantity - 1))}
          disabled={quantity <= 0}
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
      </div>
    </div>
  );
}
