import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRouteWithStops, updateStop } from "../api/routes";
import ItemPicker from "../components/ItemPicker";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import { getPlaces, makeId, setPlaces, usePlaces } from "../lib/settings";
import type { LineItem, Stop } from "../types";

/** Edit a single stop: name, address, notes, and items. */
export default function StopEditor() {
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>();

  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);

  const places = usePlaces();
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
      const route = await getRouteWithStops(routeId);
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
  function patchField(
    patch: Partial<Pick<Stop, "name" | "address" | "notes" | "items">>,
    immediate = false
  ) {
    if (!stop) return;
    const next = { ...stop, ...patch };
    setStop(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = () => void persist(patch);
    if (immediate) run();
    else saveTimer.current = setTimeout(run, 500);
  }

  async function persist(
    patch: Partial<Pick<Stop, "name" | "address" | "notes" | "items">>
  ) {
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

  /** Auto-fill the stop from a saved address, keeping anything already typed. */
  function applySavedPlace(placeId: string) {
    if (!stop) return;
    const place = places.find((p) => p.id === placeId);
    if (!place) return;
    const patch: Partial<Pick<Stop, "name" | "address" | "notes">> = {
      address: place.address,
    };
    if (!stop.name.trim()) patch.name = place.label;
    if (!stop.notes.trim() && place.notes) patch.notes = place.notes;
    patchField(patch, true);
  }

  /** Save this stop's current address to the reusable address book. */
  function saveCurrentAddress() {
    if (!stop) return;
    const address = stop.address.trim();
    if (!address) return;
    const existing = getPlaces();
    const already = existing.some(
      (p) => p.address.trim().toLowerCase() === address.toLowerCase()
    );
    if (!already) {
      setPlaces([
        ...existing,
        {
          id: makeId(),
          label: stop.name.trim() || address,
          address,
          notes: stop.notes.trim(),
        },
      ]);
    }
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2000);
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

          {places.length > 0 && (
            <label className="field">
              <span className="field-label">Use a saved address</span>
              <select
                className="item-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) applySavedPlace(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  Auto-fill from saved addresses…
                </option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.address}
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
              list="saved-addresses"
              value={stop.address}
              placeholder="123 Main St, Springfield, IL"
              onChange={(e) => patchField({ address: e.target.value })}
            />
            <datalist id="saved-addresses">
              {places.map((p) => (
                <option key={p.id} value={p.address}>
                  {p.label}
                </option>
              ))}
            </datalist>
            <button
              type="button"
              className="btn small save-address"
              onClick={saveCurrentAddress}
              disabled={!stop.address.trim()}
            >
              {addressSaved ? "Saved to address book ✓" : "＋ Save this address"}
            </button>
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
          <h2 className="card-title">Items to deliver</h2>
          <ItemPicker items={stop.items} onChange={setItems} />
        </div>

        {savedAt && <p className="saved-hint center">Saved ✓</p>}
      </main>
    </div>
  );
}
