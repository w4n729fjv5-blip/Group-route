import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRouteWithStops, updateStop } from "../api/routes";
import AddressInput from "../components/AddressInput";
import ItemPicker from "../components/ItemPicker";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import type { LineItem, Stop } from "../types";

/** Edit a single stop: name, address, notes, and items. */
export default function StopEditor() {
  const { routeId, stopId } = useParams<{ routeId: string; stopId: string }>();

  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
    patch: Partial<Pick<Stop, "name" | "address" | "date" | "notes" | "items">>,
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
    patch: Partial<Pick<Stop, "name" | "address" | "date" | "notes" | "items">>
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

          <label className="field">
            <span className="field-label">Delivery date</span>
            <input
              type="date"
              value={stop.date}
              onChange={(e) => patchField({ date: e.target.value }, true)}
            />
          </label>

          <div className="field">
            <span className="field-label">Address</span>
            <AddressInput
              value={stop.address}
              placeholder="Start typing an address…"
              onChange={(address) => patchField({ address })}
              onSelect={(address) => patchField({ address }, true)}
            />
          </div>

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
          <ItemPicker items={stop.items} onChange={setItems} />
          <Link to="/materials" className="link-row">
            Manage linens &amp; materials →
          </Link>
        </div>

        {savedAt && <p className="saved-hint center">Saved ✓</p>}
      </main>
    </div>
  );
}
