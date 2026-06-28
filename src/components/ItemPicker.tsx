import { useState } from "react";
import { CATALOG, iconForItem } from "../data/catalog";
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
 * Lets the user pick catalog items (with quantity steppers) and add custom
 * items. Items with quantity 0 are removed from the list.
 */
export default function ItemPicker({ items, onChange }: Props) {
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

  function quantityOf(name: string): number {
    const idx = indexOfItem(items, name);
    return idx >= 0 ? items[idx].quantity : 0;
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    if (indexOfItem(items, name) >= 0) {
      setCustomName("");
      return;
    }
    onChange([...items, { name, quantity: 1 }]);
    setCustomName("");
  }

  // Custom items are anything not in the preset catalog.
  const catalogNames = new Set(CATALOG.map((c) => c.name.toLowerCase()));
  const customItems = items.filter(
    (it) => !catalogNames.has(it.name.trim().toLowerCase())
  );

  return (
    <div className="item-picker">
      {CATALOG.map((cat) => {
        const qty = quantityOf(cat.name);
        return (
          <ItemRow
            key={cat.name}
            label={`${cat.icon} ${cat.name}`}
            quantity={qty}
            onSet={(q) => setQuantity(cat.name, q)}
          />
        );
      })}

      {customItems.map((it) => (
        <ItemRow
          key={it.name}
          label={`${iconForItem(it.name)} ${it.name}`}
          quantity={it.quantity}
          onSet={(q) => setQuantity(it.name, q)}
        />
      ))}

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
