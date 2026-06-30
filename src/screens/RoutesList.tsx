import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createRoute, deleteRoute, listRoutes } from "../api/routes";
import { DELIVERY_DAYS, type DeliveryDay, type Route } from "../types";

/** Home screen: lists saved routes grouped by delivery day. */
export default function RoutesList() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRoutes(await listRoutes());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load routes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const route = await createRoute("New route", null);
      navigate(`/routes/${route.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create route.");
      setCreating(false);
    }
  }

  async function handleDelete(route: Route) {
    if (!confirm(`Delete "${route.name}" and all its stops?`)) return;
    try {
      await deleteRoute(route.id);
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete route.");
    }
  }

  // Group routes by delivery day, with an "Unscheduled" bucket last.
  const groups: { label: string; key: DeliveryDay | "Unscheduled"; routes: Route[] }[] =
    [...DELIVERY_DAYS, "Unscheduled" as const].map((day) => ({
      label: day,
      key: day,
      routes: routes.filter((r) =>
        day === "Unscheduled" ? !r.delivery_day : r.delivery_day === day
      ),
    }));

  return (
    <div className="screen">
      <header className="appbar">
        <h1>Linen Routes</h1>
        <button
          type="button"
          className="btn primary"
          onClick={handleCreate}
          disabled={creating}
        >
          + New route
        </button>
      </header>

      <main className="content">
        {error && <div className="banner error">{error}</div>}

        <nav className="menu-links">
          <Link to="/materials" className="menu-link">
            🧺 Linens &amp; Materials
          </Link>
          <Link to="/addresses" className="menu-link">
            📍 Saved Addresses
          </Link>
        </nav>

        {loading && <p className="muted">Loading…</p>}

        {!loading && routes.length === 0 && (
          <div className="empty">
            <p className="empty-emoji">🧺</p>
            <p>No routes yet.</p>
            <button
              type="button"
              className="btn primary"
              onClick={handleCreate}
              disabled={creating}
            >
              Create your first route
            </button>
          </div>
        )}

        {!loading &&
          groups
            .filter((g) => g.routes.length > 0)
            .map((group) => (
              <section key={group.key} className="day-group">
                <h2 className="day-heading">{group.label}</h2>
                <ul className="route-list">
                  {group.routes.map((route) => (
                    <li key={route.id} className="route-row">
                      <button
                        type="button"
                        className="route-open"
                        onClick={() => navigate(`/routes/${route.id}`)}
                      >
                        <span className="route-name">{route.name}</span>
                      </button>
                      <button
                        type="button"
                        className="btn tiny danger"
                        onClick={() => handleDelete(route)}
                        aria-label={`Delete ${route.name}`}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
      </main>
    </div>
  );
}
