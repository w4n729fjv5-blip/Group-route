import { useState } from "react";
import { Link } from "react-router-dom";
import { createMaterial, deleteMaterial } from "../api/materials";
import { ICON_CHOICES } from "../data/catalog";
import { useMaterials } from "../materials/MaterialsContext";

/**
 * Manage the catalog of linens & delivery materials: add new ones (with an
 * emoji) and remove ones you don't use. The list feeds the "Add linen or
 * material" dropdown on every stop.
 */
export default function Materials() {
  const { materials, loading, refresh } = useMaterials();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (
      materials.some(
        (m) => m.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError(`"${trimmed}" is already in the catalog.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMaterial(trimmed, icon || "📦");
      setName("");
      setIcon(ICON_CHOICES[0]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add material.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Remove "${label}" from the catalog?`)) return;
    setError(null);
    try {
      await deleteMaterial(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove material.");
    }
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Linens &amp; Materials</h1>
      </header>

      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <div className="card">
          <h2 className="card-title">Add a material</h2>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Pillowcases"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
          </label>

          <div className="field">
            <span className="field-label">Icon</span>
            <div className="icon-choices" role="group" aria-label="Pick an icon">
              {ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`icon-chip${icon === choice ? " selected" : ""}`}
                  aria-pressed={icon === choice}
                  onClick={() => setIcon(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn primary block"
            onClick={handleAdd}
            disabled={busy || !name.trim()}
          >
            + Add to catalog
          </button>
        </div>

        <div className="card">
          <h2 className="card-title">Catalog ({materials.length})</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : materials.length === 0 ? (
            <p className="muted">No materials yet — add your first above.</p>
          ) : (
            <ul className="material-list">
              {materials.map((m) => (
                <li key={m.id} className="material-row">
                  <span className="material-label">
                    <span className="material-icon">{m.icon}</span> {m.name}
                  </span>
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => handleDelete(m.id, m.name)}
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
