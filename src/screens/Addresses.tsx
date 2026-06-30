import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createSavedAddress,
  deleteSavedAddress,
  listSavedAddresses,
  updateSavedAddress,
} from "../api/addresses";
import type { SavedAddress } from "../types";

/**
 * Manage the address book. Saved addresses appear in the stop editor so the
 * user can pick one and have the stop's name + address auto-filled.
 */
export default function Addresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAddresses(await listSavedAddresses());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const trimmedAddr = address.trim();
    if (!trimmedAddr) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createSavedAddress(
        { label: label.trim(), address: trimmedAddr, notes: "" },
        addresses.length
      );
      setAddresses((prev) => [...prev, created]);
      setLabel("");
      setAddress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save address.");
    } finally {
      setAdding(false);
    }
  }

  function editLocal(id: string, patch: Partial<SavedAddress>) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }

  async function persist(id: string, patch: Partial<SavedAddress>) {
    editLocal(id, patch);
    try {
      await updateSavedAddress(id, patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save address.");
    }
  }

  async function handleDelete(a: SavedAddress) {
    const name = a.label.trim() || a.address;
    if (!confirm(`Remove "${name}" from your saved addresses?`)) return;
    try {
      await deleteSavedAddress(a.id);
      setAddresses((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete address.");
    }
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Saved Addresses</h1>
      </header>

      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <div className="card">
          <h2 className="card-title">Save an address</h2>
          <p className="muted small">
            Saved addresses auto-fill the stop name and address when you pick
            them in a delivery.
          </p>
          <label className="field">
            <span className="field-label">Label (optional)</span>
            <input
              type="text"
              placeholder="e.g. Riverside Hotel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Address</span>
            <input
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St, Springfield, IL"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            onClick={() => void handleAdd()}
            disabled={adding || !address.trim()}
          >
            + Save address
          </button>
        </div>

        <div className="section-header">
          <h2>Address book ({addresses.length})</h2>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : addresses.length === 0 ? (
          <div className="empty small">
            <p>No saved addresses yet. Add one above.</p>
          </div>
        ) : (
          <ul className="address-list">
            {addresses.map((a) => (
              <li key={a.id} className="card address-card">
                <label className="field">
                  <span className="field-label">Label</span>
                  <input
                    type="text"
                    value={a.label}
                    placeholder="Label"
                    onChange={(e) => editLocal(a.id, { label: e.target.value })}
                    onBlur={(e) =>
                      persist(a.id, { label: e.target.value.trim() })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">Address</span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={a.address}
                    placeholder="Address"
                    onChange={(e) =>
                      editLocal(a.id, { address: e.target.value })
                    }
                    onBlur={(e) =>
                      persist(a.id, { address: e.target.value.trim() })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn tiny danger"
                  onClick={() => handleDelete(a)}
                  aria-label={`Delete ${a.label || a.address}`}
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
