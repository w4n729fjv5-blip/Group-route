import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRouteWithStops, updateStop } from "../api/routes";
import ItemPicker from "../components/ItemPicker";
import { getSavedPlaces, upsertSavedPlace } from "../data/addressBook";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import type { LineItem, SavedPlace, Stop } from "../types";

/** Edit a single stop: name, address, notes, and items. */
export default function StopEditor() {
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>();

  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>(() => getSavedPlaces());
  const [bookMsg, setBookMsg] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest not-yet-saved edits, flushed on unmount so navigating away quickly
  // never drops the last keystroke.
  const pendingPatch = useRef<
    Partial<Pick<Stop, "name" | "address" | "notes" | "items">>
  >({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, stopId]);

  // Flush any pending debounced save when leaving the screen.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (Object.keys(pendingPatch.current).length > 0) {
        void persist(pendingPatch.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = () => {
      void persist(pendingPatch.current);
      pendingPatch.current = {};
    };
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

  /** Autofill name/address/notes from a saved address-book entry. */
  function applySavedPlace(placeId: string) {
    const place = places.find((p) => p.id === placeId);
    if (!place || !stop) return;
    const patch = {
      name: place.name,
      address: place.address,
      // Keep any notes already typed; only fill if empty.
      notes: stop.notes.trim() ? stop.notes : place.notes,
    };
    setStop({ ...stop, ...patch });
    // We just wrote a full snapshot of the text fields; drop any stale pending
    // edit so the unmount flush can't re-apply old text over it.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingPatch.current = {};
    void persist(patch);
    setBookMsg(`Filled from “${place.name}”`);
  }

  /** Save the current stop's name/address/notes into the address book. */
  function saveToBook() {
    if (!stop || !stop.name.trim() || !stop.address.trim()) return;
    setPlaces(
      upsertSavedPlace({
        name: stop.name,
        address: stop.address,
        notes: stop.notes,
      })
    );
    setBookMsg(`Saved “${stop.name.trim()}” to your addresses`);
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
          {places.length > 0 && (
            <label className="field">
              <span className="field-label">Use a saved address</span>
              <select
                value=""
                onChange={(e) => {
                  applySavedPlace(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  Pick to autofill name & address…
                </option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.address}
                  </option>
                ))}
              </select>
            </label>
          )}

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
            <span className="field-label">Address</span>
            <input
              type="text"
              inputMode="text"
              autoComplete="street-address"
              list="saved-address-list"
              value={stop.address}
              placeholder="123 Main St, Springfield, IL"
              onChange={(e) => patchField({ address: e.target.value })}
            />
            <datalist id="saved-address-list">
              {places.map((p) => (
                <option key={p.id} value={p.address}>
                  {p.name}
                </option>
              ))}
            </datalist>
          </label>

          <div className="address-actions">
            <button
              type="button"
              className="btn small"
              onClick={saveToBook}
              disabled={!stop.name.trim() || !stop.address.trim()}
            >
              ☆ Save address for reuse
            </button>
            <Link to="/addresses" className="inline-link">
              Manage addresses
            </Link>
          </div>
          {bookMsg && <p className="saved-hint">{bookMsg}</p>}

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
