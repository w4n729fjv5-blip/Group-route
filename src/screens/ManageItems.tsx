import { useState } from "react";
import { Link } from "react-router-dom";
import {
  addCatalogItem,
  type CatalogItem,
  getCatalog,
  removeCatalogItem,
} from "../data/catalog";

/**
 * Manage the catalog of linens & delivery materials. New types added here show
 * up in the "Add linen / material" dropdown on every stop.
 */
export default function ManageItems() {
  const [items, setItems] = useState<CatalogItem[]>(() => getCatalog());
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems(addCatalogItem(trimmed, icon));
    setName("");
    setIcon("");
  }

  function handleRemove(itemName: string) {
    setItems(removeCatalogItem(itemName));
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
        <div className="card">
          <h2 className="card-title">Add a linen or material</h2>
          <div className="field-row">
            <label className="field icon-field">
              <span className="field-label">Icon</span>
              <input
                type="text"
                value={icon}
                placeholder="🧺"
                maxLength={4}
                onChange={(e) => setIcon(e.target.value)}
              />
            </label>
            <label className="field grow">
              <span className="field-label">Name</span>
              <input
                type="text"
                value={name}
                placeholder="e.g. Duvet covers"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
            </label>
          </div>
          <button type="button" className="btn primary block" onClick={handleAdd}>
            + Add item type
          </button>
          <p className="muted small">
            Tip: the icon is optional — leave it blank for a default 📦.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Current items ({items.length})</h2>
          {items.length === 0 ? (
            <p className="muted">No item types yet. Add your first above.</p>
          ) : (
            <ul className="manage-list">
              {items.map((it) => (
                <li key={it.name} className="manage-row">
                  <span className="item-label">
                    {it.icon} {it.name}
                  </span>
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => handleRemove(it.name)}
                    aria-label={`Remove ${it.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
