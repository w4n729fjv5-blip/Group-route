import { useState } from "react";
import { Link } from "react-router-dom";
import { iconForItem, useCatalog } from "../data/catalog";
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
 * Lets the user add delivery items to a stop:
 *  - a dropdown to add any linen/material from the catalog,
 *  - quantity steppers for each added item,
 *  - a free-text box for one-off custom items,
 *  - a link to the "Manage items" screen to edit the catalog itself.
 *
 * Items with quantity 0 are removed from the stop.
 */
export default function ItemPicker({ items, onChange }: Props) {
  const catalog = useCatalog();
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
    if (indexOfItem(items, trimmed) >= 0) return; // already on the stop
    onChange([...items, { name: trimmed, quantity: 1 }]);
  }

  function addCustom() {
    addByName(customName);
    setCustomName("");
  }

  // Catalog items not yet added to this stop — these populate the dropdown.
  const addedNames = new Set(items.map((it) => it.name.trim().toLowerCase()));
  const available = catalog.filter(
    (c) => !addedNames.has(c.name.trim().toLowerCase())
  );

  return (
    <div className="item-picker">
      {/* Dropdown to quickly add a linen / material from the catalog. */}
      <div className="item-add-row">
        <select
          className="item-select"
          aria-label="Add a linen or material"
          value=""
          onChange={(e) => {
            addByName(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            ➕ Add a linen or material…
          </option>
          {available.map((c) => (
            <option key={c.name} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
          {available.length === 0 && (
            <option value="" disabled>
              Everything in your list is already added
            </option>
          )}
        </select>
        <Link to="/items" className="btn small">
          Manage
        </Link>
      </div>

      {/* Items currently on this stop, with quantity steppers. */}
      {items.length === 0 ? (
        <p className="muted small no-items">
          No items yet — add some from the dropdown above.
        </p>
      ) : (
        items.map((it) => (
          <ItemRow
            key={it.name}
            label={`${iconForItem(it.name)} ${it.name}`}
            quantity={it.quantity}
            onSet={(q) => setQuantity(it.name, q)}
          />
        ))
      )}

      {/* One-off custom item not worth saving to the catalog. */}
      <div className="add-custom">
        <input
          type="text"
          inputMode="text"
          placeholder="Add a one-off item…"
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
