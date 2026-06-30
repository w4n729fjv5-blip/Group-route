import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AddressInput from "../components/AddressInput";
import ItemPicker from "../components/ItemPicker";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import {
  deleteDelivery,
  getAddresses,
  getDeliveries,
  rememberAddress,
  saveDelivery,
} from "../lib/store";
import type { Delivery, LineItem } from "../types";

/** Create/edit one delivery: date, address (autofill), items, and notes. */
export default function DeliveryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const found = getDeliveries().find((d) => d.id === id) ?? null;
    if (!found) setMissing(true);
    else setDelivery(found);
  }, [id]);

  /** Update local state and persist immediately (local writes are instant). */
  function patch(fields: Partial<Delivery>) {
    setDelivery((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...fields };
      saveDelivery(next);
      return next;
    });
    setSaved(true);
  }

  function setItems(items: LineItem[]) {
    patch({ items });
  }

  if (missing) {
    return (
      <div className="screen">
        <Appbar title="Delivery" />
        <main className="content">
          <div className="banner error">Delivery not found.</div>
        </main>
      </div>
    );
  }
  if (!delivery) {
    return (
      <div className="screen">
        <Appbar title="Delivery" />
        <main className="content">
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  const hasAddress = delivery.address.trim().length > 0;
  // Is this exact address already in the address book?
  const alreadySaved = getAddresses().some(
    (a) =>
      a.address.trim().toLowerCase() === delivery.address.trim().toLowerCase()
  );

  function handleDelete() {
    if (!delivery) return;
    if (!confirm("Delete this delivery?")) return;
    deleteDelivery(delivery.id);
    navigate("/");
  }

  function saveToAddressBook() {
    if (!delivery) return;
    rememberAddress(delivery.name || delivery.address, delivery.address);
    setSaved(true);
  }

  return (
    <div className="screen">
      <Appbar title={delivery.name || "Delivery"} />

      <main className="content">
        <div className="card">
          <label className="field">
            <span className="field-label">Date</span>
            <input
              type="date"
              value={delivery.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </label>

          <label className="field">
            <span className="field-label">Customer / location (optional)</span>
            <input
              type="text"
              value={delivery.name}
              placeholder="e.g. Riverside Hotel"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>

          <div className="field">
            <span className="field-label">Address</span>
            <AddressInput
              value={delivery.address}
              onChange={(address) => patch({ address })}
              onPickName={(name) => {
                // Only fill the name if it's still empty, so we don't clobber it.
                if (!delivery.name.trim()) patch({ name });
              }}
            />
            {hasAddress && !alreadySaved && (
              <button
                type="button"
                className="btn small ghost"
                onClick={saveToAddressBook}
              >
                ＋ Save to address book (for autofill)
              </button>
            )}
            {alreadySaved && (
              <span className="saved-hint">In address book ✓</span>
            )}
          </div>

          {hasAddress && (
            <div className="nav-buttons">
              <a
                className="btn block"
                href={appleStopUrl(delivery.address)}
                target="_blank"
                rel="noreferrer"
              >
                 Apple Maps
              </a>
              <a
                className="btn block"
                href={googleStopUrl(delivery.address)}
                target="_blank"
                rel="noreferrer"
              >
                Google Maps
              </a>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Delivery items</h2>
          <ItemPicker items={delivery.items} onChange={setItems} />
        </div>

        <div className="card">
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={3}
              value={delivery.notes}
              placeholder="Gate code, contact person, drop-off instructions…"
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
        </div>

        <button type="button" className="btn block danger" onClick={handleDelete}>
          Delete delivery
        </button>

        {saved && <p className="saved-hint center">Saved ✓</p>}
      </main>
    </div>
  );

  function Appbar({ title }: { title: string }) {
    return (
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to schedule">
          ‹ Schedule
        </Link>
        <h1 className="appbar-title">{title}</h1>
      </header>
    );
  }
}
