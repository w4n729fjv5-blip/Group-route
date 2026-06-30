import { useState } from "react";
import { Link } from "react-router-dom";
import type { LineItem, Material } from "../types";

interface Props {
  items: LineItem[];
  /** The live master list of linens & materials to choose from. */
  materials: Material[];
  onChange: (items: LineItem[]) => void;
}

/** Find an item by case-insensitive name. */
function indexOfItem(items: LineItem[], name: string): number {
  return items.findIndex(
    (it) => it.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
}

/** Look up an icon for an item name from the live materials list. */
function iconFor(materials: Material[], name: string): string {
  const match = materials.find(
    (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return match ? match.icon : "📦";
}

/**
 * Lets the user add linens & materials to a stop from a dropdown, adjust each
 * quantity with steppers, and add one-off custom items. Items with quantity 0
 * are removed from the list.
 */
export default function ItemPicker({ items, materials, onChange }: Props) {
  const [picker, setPicker] = useState("");
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
    if (indexOfItem(items, trimmed) >= 0) return; // already added
    onChange([...items, { name: trimmed, quantity: 1 }]);
  }

  function handlePick(value: string) {
    setPicker("");
    if (value) addByName(value);
  }

  function addCustom() {
    addByName(customName);
    setCustomName("");
  }

  // Materials not yet added are the dropdown's choices.
  const addedNames = new Set(items.map((it) => it.name.trim().toLowerCase()));
  const available = materials.filter(
    (m) => !addedNames.has(m.name.trim().toLowerCase())
  );

  return (
    <div className="item-picker">
      {/* Dropdown to add a linen / material from the master list. */}
      <div className="field">
        <span className="field-label">Add a linen or material</span>
        <select
          className="item-select"
          value={picker}
          onChange={(e) => handlePick(e.target.value)}
        >
          <option value="">
            {available.length > 0
              ? "Choose a linen or material…"
              : "All materials added"}
          </option>
          {available.map((m) => (
            <option key={m.id} value={m.name}>
              {m.icon} {m.name}
            </option>
          ))}
        </select>
        {materials.length === 0 && (
          <p className="muted small">
            No materials defined yet.{" "}
            <Link to="/materials">Add linens &amp; materials</Link> to populate
            this list.
          </p>
        )}
      </div>

      {/* Quantity steppers for items already on this stop. */}
      {items.length === 0 ? (
        <p className="muted small">No items added yet.</p>
      ) : (
        items.map((it) => (
          <ItemRow
            key={it.name}
            label={`${iconFor(materials, it.name)} ${it.name}`}
            quantity={it.quantity}
            onSet={(q) => setQuantity(it.name, q)}
          />
        ))
      )}

      {/* One-off custom item not in the master list. */}
      <div className="add-custom">
        <input
          type="text"
          inputMode="text"
          placeholder="Add a one-off custom item…"
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
      </div>
    </div>
  );
}
