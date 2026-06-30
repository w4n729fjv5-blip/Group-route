import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRouteWithStops, updateStop } from "../api/routes";
import { listMaterials } from "../api/materials";
import { createSavedAddress, listSavedAddresses } from "../api/addresses";
import ItemPicker from "../components/ItemPicker";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import type { LineItem, Material, SavedAddress, Stop } from "../types";

type StopPatch = Partial<
  Pick<Stop, "name" | "address" | "notes" | "items" | "delivery_date">
>;

/** Edit a single stop: date, items, address, and notes. */
export default function StopEditor() {
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>();

  const [stop, setStop] = useState<Stop | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, stopId]);

  async function load() {
    if (!routeId || !stopId) return;
    setLoading(true);
    setError(null);
    try {
      const [route, mats, addrs] = await Promise.all([
        getRouteWithStops(routeId),
        listMaterials(),
        listSavedAddresses(),
      ]);
      setMaterials(mats);
      setSavedAddresses(addrs);
      const found = route?.stops.find((s) => s.id === stopId) ?? null;
      if (!found) {
        setError("Stop not found.");
      } else {
        setStop(found);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stop.");
    } finally {
      setLoading(false);
    }
  }

  /** Update local state now; persist the patch after a short debounce. */
  function patchField(patch: StopPatch, immediate = false) {
    if (!stop) return;
    const next = { ...stop, ...patch };
    setStop(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = () => void persist(patch);
    if (immediate) run();
    else saveTimer.current = setTimeout(run, 500);
  }

  async function persist(patch: StopPatch) {
    if (!stopId) return;
    try {
      await updateStop(stopId, patch);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save stop.");
    }
  }

  function setItems(items: LineItem[]) {
    // Items change on discrete taps, so save immediately.
    patchField({ items }, true);
  }

  /** Apply a saved address: fill the address and (if empty) the stop name. */
  function applySavedAddress(id: string) {
    if (!stop || !id) return;
    const picked = savedAddresses.find((a) => a.id === id);
    if (!picked) return;
    const patch: StopPatch = { address: picked.address };
    if (!stop.name.trim() && picked.label.trim()) patch.name = picked.label;
    if (!stop.notes.trim() && picked.notes.trim()) patch.notes = picked.notes;
    patchField(patch, true);
  }

  /** Add the stop's current address to the reusable address book. */
  async function saveCurrentAddress() {
    if (!stop) return;
    const address = stop.address.trim();
    if (!address) return;
    const exists = savedAddresses.some(
      (a) => a.address.trim().toLowerCase() === address.toLowerCase()
    );
    if (exists) {
      setAddressSaved(true);
      return;
    }
    try {
      const created = await createSavedAddress(
        { label: stop.name.trim(), address, notes: "" },
        savedAddresses.length
      );
      setSavedAddresses((prev) => [...prev, created]);
      setAddressSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save address.");
    }
  }

  const backTo = `/routes/${routeId}`;

  if (loading) {
    return (
      <div className="screen">
        <header className="appbar">
          <Link to={backTo} className="back-link">
            ‹ Route
          </Link>
          <h1 className="appbar-title">Stop</h1>
        </header>
        <main className="content">
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="screen">
        <header className="appbar">
          <Link to={backTo} className="back-link">
            ‹ Route
          </Link>
          <h1 className="appbar-title">Stop</h1>
        </header>
        <main className="content">
          <div className="banner error">{error ?? "Stop not found."}</div>
        </main>
      </div>
    );
  }

  const hasAddress = stop.address.trim().length > 0;
  const addressInBook = savedAddresses.some(
    (a) =>
      a.address.trim().toLowerCase() === stop.address.trim().toLowerCase()
  );

  return (
    <div className="screen">
      <header className="appbar">
        <Link to={backTo} className="back-link" aria-label="Back to route">
          ‹ Route
        </Link>
        <h1 className="appbar-title">{stop.name.trim() || "Stop"}</h1>
      </header>

      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <div className="card">
          <label className="field">
            <span className="field-label">Stop name</span>
            <input
              type="text"
              value={stop.name}
              placeholder="e.g. Riverside Hotel"
              onChange={(e) => patchField({ name: e.target.value })}
            />
          </label>

          <label className="field">
            <span className="field-label">Delivery date</span>
            <input
              type="date"
              value={stop.delivery_date ?? ""}
              onChange={(e) =>
                patchField({ delivery_date: e.target.value || null }, true)
              }
            />
          </label>

          {savedAddresses.length > 0 && (
            <label className="field">
              <span className="field-label">Use a saved address</span>
              <select
                className="item-select"
                value=""
                onChange={(e) => {
                  applySavedAddress(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Pick from address book…</option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label.trim() ? `${a.label} — ${a.address}` : a.address}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span className="field-label">Address</span>
            <input
              type="text"
              inputMode="text"
              autoComplete="street-address"
              list="saved-address-list"
              value={stop.address}
              placeholder="123 Main St, Springfield, IL"
              onChange={(e) => {
                setAddressSaved(false);
                patchField({ address: e.target.value });
              }}
            />
            <datalist id="saved-address-list">
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.address}>
                  {a.label}
                </option>
              ))}
            </datalist>
            {hasAddress && !addressInBook && (
              <button
                type="button"
                className="btn small save-address-btn"
                onClick={() => void saveCurrentAddress()}
              >
                ＋ Save to address book
              </button>
            )}
            {(addressInBook || addressSaved) && hasAddress && (
              <span className="saved-hint">In address book ✓</span>
            )}
          </label>

          {hasAddress && (
            <div className="nav-buttons">
              <a
                className="btn block"
                href={appleStopUrl(stop.address)}
                target="_blank"
                rel="noreferrer"
              >
                 Navigate in Apple Maps
              </a>
              <a
                className="btn block"
                href={googleStopUrl(stop.address)}
                target="_blank"
                rel="noreferrer"
              >
                Navigate in Google Maps
              </a>
            </div>
          )}

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={3}
              value={stop.notes}
              placeholder="Gate code, contact person, drop-off instructions…"
              onChange={(e) => patchField({ notes: e.target.value })}
            />
          </label>
        </div>

        <div className="card">
          <h2 className="card-title">Delivery items</h2>
          <ItemPicker
            items={stop.items}
            materials={materials}
            onChange={setItems}
          />
        </div>

        {savedAt && <p className="saved-hint center">Saved ✓</p>}
      </main>
    </div>
  );
}
