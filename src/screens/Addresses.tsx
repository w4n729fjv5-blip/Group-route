import { useState } from "react";
import { Link } from "react-router-dom";
import { saveAddresses, uid, useAddresses } from "../lib/store";
import type { SavedAddress } from "../types";

/** Manage saved addresses that power autofill on the delivery screen. */
export default function Addresses() {
  const addresses = useAddresses();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  function add() {
    const a = address.trim();
    if (!a) return;
    const next: SavedAddress = {
      id: uid("addr"),
      label: label.trim(),
      address: a,
    };
    saveAddresses([...addresses, next]);
    setLabel("");
    setAddress("");
  }

  function update(id: string, fields: Partial<SavedAddress>) {
    saveAddresses(
      addresses.map((x) => (x.id === id ? { ...x, ...fields } : x))
    );
  }

  function remove(id: string) {
    saveAddresses(addresses.filter((x) => x.id !== id));
  }

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to schedule">
          ‹ Schedule
        </Link>
        <h1 className="appbar-title">Addresses</h1>
      </header>

      <main className="content">
        <p className="muted">
          Save the addresses you deliver to. When you type an address on a
          delivery, matching saved addresses appear so you can autofill them in
          one tap.
        </p>

        <div className="card">
          <h2 className="card-title">Save an address</h2>
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
              placeholder="123 Main St, Springfield, IL"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
          </label>
          <button type="button" className="btn primary block" onClick={add}>
            Save address
          </button>
        </div>

        <div className="card">
          <h2 className="card-title">Saved addresses ({addresses.length})</h2>
          {addresses.length === 0 ? (
            <p className="muted small">
              No saved addresses yet. Add one above, or save one straight from a
              delivery.
            </p>
          ) : (
            <ul className="address-list">
              {addresses.map((a) => (
                <li key={a.id} className="address-row">
                  <input
                    type="text"
                    className="address-label"
                    placeholder="Label"
                    value={a.label}
                    onChange={(e) => update(a.id, { label: e.target.value })}
                  />
                  <input
                    type="text"
                    className="address-text"
                    placeholder="Address"
                    value={a.address}
                    onChange={(e) => update(a.id, { address: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => remove(a.id)}
                    aria-label={`Remove ${a.label || a.address}`}
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
