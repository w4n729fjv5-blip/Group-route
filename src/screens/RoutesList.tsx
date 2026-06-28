import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRoute,
  deleteRoute,
  exportBackup,
  importBackup,
  listRoutes,
} from "../api/routes";
import { DELIVERY_DAYS, type DeliveryDay, type Route } from "../types";

/** Home screen: lists saved routes grouped by delivery day. */
export default function RoutesList() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  /** Download all routes as a JSON backup file (fully offline). */
  async function handleExport() {
    setError(null);
    setNotice(null);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const a = document.createElement("a");
      a.href = url;
      a.download = `linen-routes-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice("Backup downloaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export backup.");
    }
  }

  /** Read a chosen backup file and merge it into local storage. */
  async function handleImportFile(file: File) {
    setError(null);
    setNotice(null);
    try {
      const text = await file.text();
      const result = await importBackup(JSON.parse(text));
      await load();
      setNotice(
        `Imported ${result.routes} route(s) and ${result.stops} stop(s).`
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't read that file. Make sure it's a Linen Routes backup."
      );
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
        {notice && <div className="banner success">{notice}</div>}
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

        {!loading && (
          <section className="backup-bar">
            <p className="muted small">
              Routes are saved on this device. Back them up to a file, or restore
              a backup here.
            </p>
            <div className="backup-actions">
              <button type="button" className="btn" onClick={handleExport}>
                ⬇️ Export backup
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => fileInput.current?.click()}
              >
                ⬆️ Import backup
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = ""; // allow re-importing the same file
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
