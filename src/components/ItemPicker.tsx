import { useState } from "react";
import { Link } from "react-router-dom";
import { getCatalog, iconForItem } from "../data/catalog";
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
 * Lets the user build a stop's delivery list:
 *  - a DROPDOWN to add any linen / material from the catalog,
 *  - quantity steppers on each added item (drop to 0 to remove),
 *  - a custom "type your own" field for one-off items.
 *
 * The catalog itself is edited on the "Manage items" screen; this reads the
 * current catalog so new item types appear in the dropdown automatically.
 */
export default function ItemPicker({ items, onChange }: Props) {
  const [customName, setCustomName] = useState("");
  // Read once per mount; the manage screen is a separate route, so returning
  // here remounts and picks up catalog changes.
  const [catalog] = useState(() => getCatalog());

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

  function addCustom() {
    addByName(customName);
    setCustomName("");
  }

  // Catalog entries not yet on this stop — these populate the dropdown.
  const available = catalog.filter((c) => indexOfItem(items, c.name) < 0);

  return (
    <div className="item-picker">
      {items.length === 0 && (
        <p className="muted small">No items yet. Add some below.</p>
      )}

      {items.map((it) => (
        <ItemRow
          key={it.name}
          label={`${iconForItem(it.name)} ${it.name}`}
          quantity={it.quantity}
          onSet={(q) => setQuantity(it.name, q)}
        />
      ))}

      <label className="field add-dropdown">
        <span className="field-label">Add linen / material</span>
        <select
          value=""
          onChange={(e) => {
            addByName(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            {available.length > 0
              ? "Choose from the list…"
              : "All catalog items added"}
          </option>
          {available.map((c) => (
            <option key={c.name} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="add-custom">
        <input
          type="text"
          inputMode="text"
          placeholder="Or type a one-off item…"
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

      <p className="muted small">
        Need a new linen or material type?{" "}
        <Link to="/items" className="inline-link">
          Manage items
        </Link>
        .
      </p>
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
