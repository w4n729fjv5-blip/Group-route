import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getSavedPlaces,
  removeSavedPlace,
  upsertSavedPlace,
} from "../data/addressBook";
import type { SavedPlace } from "../types";

/**
 * Manage saved addresses. Anything saved here autofills a stop (name, address,
 * notes) from the "Use a saved address" dropdown on the stop screen.
 */
export default function AddressBook() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => getSavedPlaces());
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!name.trim() || !address.trim()) return;
    setPlaces(upsertSavedPlace({ name, address, notes }));
    setName("");
    setAddress("");
    setNotes("");
  }

  function handleRemove(id: string) {
    setPlaces(removeSavedPlace(id));
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Addresses</h1>
      </header>

      <main className="content">
        <div className="card">
          <h2 className="card-title">Save an address</h2>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Riverside Hotel"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Address</span>
            <input
              type="text"
              autoComplete="street-address"
              value={address}
              placeholder="123 Main St, Springfield, IL"
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={2}
              value={notes}
              placeholder="Gate code, contact, dock instructions…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn primary block"
            onClick={handleAdd}
            disabled={!name.trim() || !address.trim()}
          >
            + Save address
          </button>
        </div>

        <div className="card">
          <h2 className="card-title">Saved addresses ({places.length})</h2>
          {places.length === 0 ? (
            <p className="muted">
              No saved addresses yet. Add one above, or save a stop's address
              from the stop screen.
            </p>
          ) : (
            <ul className="manage-list">
              {places.map((p) => (
                <li key={p.id} className="manage-row place-row">
                  <span className="place-text">
                    <span className="place-name">{p.name}</span>
                    <span className="place-address">{p.address}</span>
                    {p.notes && <span className="place-notes">{p.notes}</span>}
                  </span>
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => handleRemove(p.id)}
                    aria-label={`Remove ${p.name}`}
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
