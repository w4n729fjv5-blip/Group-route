import { useState } from "react";
import { Link } from "react-router-dom";
import {
  addCatalogItem,
  removeCatalogItem,
  resetCatalog,
  useCatalog,
} from "../data/catalog";

/** A few suggested emoji so adding an item stays quick on mobile. */
const ICON_CHOICES = [
  "🛏️", "🧖", "🟫", "👔", "🧻", "🍽️", "🦺", "🧽",
  "🧺", "🧥", "🧦", "🪟", "🚪", "🛁", "🧴", "📦",
];

/**
 * "Manage items" — the menu where you add and remove the linens and materials
 * that appear in every stop's dropdown. Changes are saved on this device.
 */
export default function CatalogManager() {
  const catalog = useCatalog();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [hint, setHint] = useState<string | null>(null);

  function handleAdd() {
    const added = addCatalogItem(name, icon);
    if (!added) {
      setHint(
        name.trim()
          ? `"${name.trim()}" is already in your list.`
          : "Type a name first."
      );
      return;
    }
    setName("");
    setHint(null);
  }

  function handleReset() {
    if (confirm("Reset your linen & material list back to the defaults?")) {
      resetCatalog();
      setHint(null);
    }
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Manage items</h1>
      </header>

      <main className="content">
        <p className="muted small">
          Add the linens and delivery materials you carry. They show up in the
          dropdown on every stop. Saved on this device.
        </p>

        <div className="card">
          <h2 className="card-title">Add a linen or material</h2>
          <div className="field">
            <span className="field-label">Icon</span>
            <div className="icon-grid" role="group" aria-label="Pick an icon">
              {ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`icon-choice${icon === choice ? " selected" : ""}`}
                  aria-pressed={icon === choice}
                  onClick={() => setIcon(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Pillowcases"
              onChange={(e) => {
                setName(e.target.value);
                setHint(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </label>

          <button type="button" className="btn primary block" onClick={handleAdd}>
            {icon} Add to list
          </button>
          {hint && <p className="saved-hint center">{hint}</p>}
        </div>

        <div className="section-header">
          <h2>Your items ({catalog.length})</h2>
          <button type="button" className="btn tiny" onClick={handleReset}>
            Reset to defaults
          </button>
        </div>

        {catalog.length === 0 ? (
          <div className="empty small">
            <p>Your list is empty. Add a linen or material above.</p>
          </div>
        ) : (
          <ul className="catalog-list">
            {catalog.map((item) => (
              <li key={item.name} className="catalog-row">
                <span className="catalog-label">
                  <span className="catalog-icon">{item.icon}</span>
                  {item.name}
                </span>
                <button
                  type="button"
                  className="btn tiny danger"
                  onClick={() => removeCatalogItem(item.name)}
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
