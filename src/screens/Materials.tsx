import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
} from "../api/materials";
import { ICON_CHOICES } from "../data/catalog";
import type { Material } from "../types";

/**
 * Manage the master list of linens & delivery materials: add, rename, change
 * icon, and delete. This list feeds the "add item" dropdown in the stop editor.
 */
export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_CHOICES[0]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setMaterials(await listMaterials());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (
      materials.some((m) => m.name.trim().toLowerCase() === name.toLowerCase())
    ) {
      setError(`"${name}" is already in the list.`);
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const created = await createMaterial(name, newIcon, materials.length);
      setMaterials((prev) => [...prev, created]);
      setNewName("");
      setNewIcon(ICON_CHOICES[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add material.");
    } finally {
      setAdding(false);
    }
  }

  /** Update local state only (used while typing a name). */
  function editLocal(id: string, patch: Partial<Material>) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }

  /** Update local state and persist immediately (used for discrete changes). */
  async function patchMaterial(id: string, patch: Partial<Material>) {
    editLocal(id, patch);
    try {
      await updateMaterial(id, patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save material.");
    }
  }

  async function handleDelete(material: Material) {
    if (!confirm(`Remove "${material.name}" from the materials list?`)) return;
    try {
      await deleteMaterial(material.id);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete material.");
    }
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Linens & Materials</h1>
      </header>

      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <div className="card">
          <h2 className="card-title">Add a linen or material</h2>
          <div className="material-add">
            <select
              className="icon-select"
              aria-label="Icon"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
            >
              {ICON_CHOICES.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="e.g. Bath towels"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
            <button
              type="button"
              className="btn primary small"
              onClick={() => void handleAdd()}
              disabled={adding || !newName.trim()}
            >
              Add
            </button>
          </div>
        </div>

        <div className="section-header">
          <h2>All materials ({materials.length})</h2>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : materials.length === 0 ? (
          <div className="empty small">
            <p>No materials yet. Add your first one above.</p>
          </div>
        ) : (
          <ul className="material-list">
            {materials.map((m) => (
              <li key={m.id} className="material-row">
                <select
                  className="icon-select"
                  aria-label={`Icon for ${m.name}`}
                  value={m.icon}
                  onChange={(e) => patchMaterial(m.id, { icon: e.target.value })}
                >
                  {[m.icon, ...ICON_CHOICES.filter((i) => i !== m.icon)].map(
                    (icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="text"
                  className="material-name"
                  value={m.name}
                  onChange={(e) => editLocal(m.id, { name: e.target.value })}
                  onBlur={(e) => patchMaterial(m.id, { name: e.target.value.trim() })}
                />
                <button
                  type="button"
                  className="btn tiny danger"
                  onClick={() => handleDelete(m)}
                  aria-label={`Delete ${m.name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
