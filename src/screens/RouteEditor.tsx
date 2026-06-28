import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createStop,
  deleteStop,
  getRouteWithStops,
  persistStopOrder,
  updateRoute,
} from "../api/routes";
import DaySelector from "../components/DaySelector";
import ExportBar from "../components/ExportBar";
import StopCard from "../components/StopCard";
import type { DeliveryDay, RouteWithStops, Stop } from "../types";

/** Edit a route: name, delivery day, ordered stops, and map export. */
export default function RouteEditor() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  const [route, setRoute] = useState<RouteWithStops | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Debounce timer for saving route name/notes as the user types.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  async function load() {
    if (!routeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRouteWithStops(routeId);
      if (!data) {
        setError("Route not found.");
      } else {
        setRoute(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load route.");
    } finally {
      setLoading(false);
    }
  }

  /** Update local route state immediately and persist the patch (debounced). */
  function patchRouteField(
    patch: Partial<Pick<RouteWithStops, "name" | "notes" | "delivery_day">>
  ) {
    if (!route) return;
    setRoute({ ...route, ...patch });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistRoutePatch(patch);
    }, 500);
  }

  async function persistRoutePatch(
    patch: Partial<Pick<RouteWithStops, "name" | "notes" | "delivery_day">>
  ) {
    if (!routeId) return;
    try {
      await updateRoute(routeId, patch);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save route.");
    }
  }

  function setDeliveryDay(day: DeliveryDay | null) {
    // Days save immediately (no debounce needed for a single tap).
    if (!route) return;
    setRoute({ ...route, delivery_day: day });
    void persistRoutePatch({ delivery_day: day });
  }

  async function handleAddStop() {
    if (!route) return;
    try {
      const stop = await createStop(route.id, route.stops.length);
      setRoute({ ...route, stops: [...route.stops, stop] });
      navigate(`/routes/${route.id}/stops/${stop.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add stop.");
    }
  }

  async function reorder(from: number, to: number) {
    if (!route) return;
    if (to < 0 || to >= route.stops.length) return;
    const stops = [...route.stops];
    const [moved] = stops.splice(from, 1);
    stops.splice(to, 0, moved);
    const renumbered: Stop[] = stops.map((s, i) => ({ ...s, position: i }));
    setRoute({ ...route, stops: renumbered });
    try {
      await persistStopOrder(renumbered);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder stops.");
    }
  }

  async function handleDeleteStop(stop: Stop) {
    if (!route) return;
    if (!confirm("Delete this stop?")) return;
    try {
      await deleteStop(stop.id);
      const remaining = route.stops
        .filter((s) => s.id !== stop.id)
        .map((s, i) => ({ ...s, position: i }));
      setRoute({ ...route, stops: remaining });
      await persistStopOrder(remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete stop.");
    }
  }

  if (loading) {
    return (
      <div className="screen">
        <Appbar />
        <main className="content">
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="screen">
        <Appbar />
        <main className="content">
          <div className="banner error">{error ?? "Route not found."}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <Appbar />
      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <div className="card">
          <label className="field">
            <span className="field-label">Route name</span>
            <input
              type="text"
              value={route.name}
              placeholder="e.g. Downtown hotels"
              onChange={(e) => patchRouteField({ name: e.target.value })}
            />
          </label>

          <div className="field">
            <span className="field-label">Delivery day</span>
            <DaySelector
              value={route.delivery_day}
              onChange={setDeliveryDay}
            />
          </div>

          <label className="field">
            <span className="field-label">Route notes</span>
            <textarea
              rows={2}
              value={route.notes}
              placeholder="Optional notes for the whole route"
              onChange={(e) => patchRouteField({ notes: e.target.value })}
            />
          </label>
          {savedAt && <p className="saved-hint">Saved ✓</p>}
        </div>

        <div className="section-header">
          <h2>Stops ({route.stops.length})</h2>
          <button type="button" className="btn primary" onClick={handleAddStop}>
            + Add stop
          </button>
        </div>

        {route.stops.length === 0 ? (
          <div className="empty small">
            <p>No stops yet. Add your first delivery stop.</p>
          </div>
        ) : (
          <div className="stop-list">
            {route.stops.map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                routeId={route.id}
                index={index}
                total={route.stops.length}
                onMoveUp={() => reorder(index, index - 1)}
                onMoveDown={() => reorder(index, index + 1)}
                onDelete={() => handleDeleteStop(stop)}
              />
            ))}
          </div>
        )}

        <ExportBar stops={route.stops} />
      </main>
    </div>
  );

  function Appbar() {
    return (
      <header className="appbar">
        <Link to="/" className="back-link" aria-label="Back to routes">
          ‹ Routes
        </Link>
        <h1 className="appbar-title">{route?.name || "Route"}</h1>
      </header>
    );
  }
}
