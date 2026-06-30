import { useState } from "react";
import { Link } from "react-router-dom";
import {
  makeId,
  setMaterials,
  setPlaces,
  useMaterials,
  usePlaces,
  type Material,
  type SavedPlace,
} from "../lib/settings";

/**
 * Settings: the two menus the operator manages directly —
 *  - Materials catalog: the linens/materials offered in every stop's item
 *    dropdown.
 *  - Saved addresses: reusable delivery locations that auto-fill a stop.
 * Both are stored on the device and update every screen instantly.
 */
export default function Settings() {
  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">Settings</h1>
      </header>
      <main className="content">
        <MaterialsSection />
        <PlacesSection />
      </main>
    </div>
  );
}

// Materials catalog ---------------------------------------------------------
function MaterialsSection() {
  const materials = useMaterials();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = materials.some(
      (m) => m.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setName("");
      setIcon("");
      return;
    }
    const next: Material = { name: trimmed, icon: icon.trim() || "📦" };
    setMaterials([...materials, next]);
    setName("");
    setIcon("");
  }

  function rename(index: number, value: string) {
    const next = materials.map((m, i) =>
      i === index ? { ...m, name: value } : m
    );
    setMaterials(next);
  }

  function changeIcon(index: number, value: string) {
    const next = materials.map((m, i) =>
      i === index ? { ...m, icon: value } : m
    );
    setMaterials(next);
  }

  function remove(index: number) {
    setMaterials(materials.filter((_, i) => i !== index));
  }

  return (
    <div className="card">
      <h2 className="card-title">Linens & materials</h2>
      <p className="muted small">
        These appear in the “Add a linen or material” dropdown on every stop.
      </p>

      <div className="material-list">
        {materials.map((m, i) => (
          <div key={i} className="material-row">
            <input
              className="material-icon"
              type="text"
              aria-label={`Icon for ${m.name}`}
              value={m.icon}
              maxLength={2}
              onChange={(e) => changeIcon(i, e.target.value)}
            />
            <input
              className="material-name"
              type="text"
              aria-label="Material name"
              value={m.name}
              onChange={(e) => rename(i, e.target.value)}
            />
            <button
              type="button"
              className="btn tiny danger"
              onClick={() => remove(i)}
              aria-label={`Remove ${m.name}`}
            >
              Remove
            </button>
          </div>
        ))}
        {materials.length === 0 && (
          <p className="muted small">No materials yet — add your first below.</p>
        )}
      </div>

      <div className="material-add">
        <input
          className="material-icon"
          type="text"
          placeholder="🛏️"
          aria-label="New material icon"
          value={icon}
          maxLength={2}
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          className="material-name"
          type="text"
          placeholder="New material name"
          aria-label="New material name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn small primary" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

// Saved addresses -----------------------------------------------------------
function PlacesSection() {
  const places = usePlaces();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    const trimmedLabel = label.trim();
    const trimmedAddress = address.trim();
    if (!trimmedLabel || !trimmedAddress) return;
    const next: SavedPlace = {
      id: makeId(),
      label: trimmedLabel,
      address: trimmedAddress,
      notes: notes.trim(),
    };
    setPlaces([...places, next]);
    setLabel("");
    setAddress("");
    setNotes("");
  }

  function remove(id: string) {
    setPlaces(places.filter((p) => p.id !== id));
  }

  return (
    <div className="card">
      <h2 className="card-title">Saved addresses</h2>
      <p className="muted small">
        Save the places you deliver to so a stop’s address auto-fills with one
        tap.
      </p>

      <div className="place-list">
        {places.map((p) => (
          <div key={p.id} className="place-row">
            <div className="place-info">
              <span className="place-label">{p.label}</span>
              <span className="place-address">{p.address}</span>
              {p.notes && <span className="place-notes muted">{p.notes}</span>}
            </div>
            <button
              type="button"
              className="btn tiny danger"
              onClick={() => remove(p.id)}
              aria-label={`Remove ${p.label}`}
            >
              Remove
            </button>
          </div>
        ))}
        {places.length === 0 && (
          <p className="muted small">
            No saved addresses yet. Add one here, or save one from a stop.
          </p>
        )}
      </div>

      <div className="field">
        <span className="field-label">Place name</span>
        <input
          type="text"
          placeholder="e.g. Riverside Hotel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="field">
        <span className="field-label">Address</span>
        <input
          type="text"
          autoComplete="street-address"
          placeholder="123 Main St, Springfield, IL"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="field">
        <span className="field-label">Default notes (optional)</span>
        <input
          type="text"
          placeholder="Gate code, contact person…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button type="button" className="btn primary block" onClick={add}>
        Save address
      </button>
    </div>
  );
}
