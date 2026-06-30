import { useState } from "react";
import { Link } from "react-router-dom";
import { saveMaterials, uid, useMaterials } from "../lib/store";
import type { Material } from "../types";

// A few emoji to choose from when adding a material.
const ICON_CHOICES = [
  "🛏️", "🧖", "🪟", "👔", "🧻", "🍽️", "🥽", "🚪", "🧺", "🧦", "🎽", "📦",
];

/** Manage the master list of linens & delivery materials. */
export default function Materials() {
  const materials = useMaterials();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (
      materials.some((m) => m.name.trim().toLowerCase() === trimmed.toLowerCase())
    ) {
      setName("");
      return;
    }
    const next: Material = { id: uid("m"), name: trimmed, icon };
    saveMaterials([...materials, next]);
    setName("");
  }

  function rename(id: string, newName: string) {
    saveMaterials(
      materials.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );
  }

  function setMaterialIcon(id: string, newIcon: string) {
    saveMaterials(
      materials.map((m) => (m.id === id ? { ...m, icon: newIcon } : m))
    );
  }

  function remove(id: string) {
    saveMaterials(materials.filter((m) => m.id !== id));
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to schedule">
          ‹ Schedule
        </Link>
        <h1 className="appbar-title">Materials</h1>
      </header>

      <main className="content">
        <p className="muted">
          These linens and materials appear in the dropdown when you build a
          delivery. Add, rename, or remove them here.
        </p>

        <div className="card">
          <h2 className="card-title">Add a material</h2>
          <div className="add-material">
            <select
              className="icon-select"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              aria-label="Icon"
            >
              {ICON_CHOICES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="e.g. Bath mats"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <button type="button" className="btn primary" onClick={add}>
              Add
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Your materials ({materials.length})</h2>
          {materials.length === 0 ? (
            <p className="muted small">No materials yet. Add one above.</p>
          ) : (
            <ul className="material-list">
              {materials.map((m) => (
                <li key={m.id} className="material-row">
                  <select
                    className="icon-select"
                    value={ICON_CHOICES.includes(m.icon) ? m.icon : ""}
                    onChange={(e) => setMaterialIcon(m.id, e.target.value)}
                    aria-label={`Icon for ${m.name}`}
                  >
                    {!ICON_CHOICES.includes(m.icon) && (
                      <option value={m.icon}>{m.icon}</option>
                    )}
                    {ICON_CHOICES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="material-name"
                    value={m.name}
                    onChange={(e) => rename(m.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => remove(m.id)}
                    aria-label={`Remove ${m.name}`}
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
