import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { compareDates, dayLabel, todayISO } from "../lib/dates";
import {
  exceedsGoogleLimit,
  googleRouteUrl,
  GOOGLE_MAX_WAYPOINTS,
} from "../lib/maps";
import { createDelivery, deleteDelivery, useDeliveries } from "../lib/store";
import type { Delivery } from "../types";

/** Home screen: every delivery, grouped into a route per day. */
export default function Schedule() {
  const navigate = useNavigate();
  const deliveries = useDeliveries();

  // Group by date, sort days chronologically, and order each day by position.
  const days = useMemo(() => {
    const byDate = new Map<string, Delivery[]>();
    for (const d of deliveries) {
      const list = byDate.get(d.date) ?? [];
      list.push(d);
      byDate.set(d.date, list);
    }
    return [...byDate.entries()]
      .sort((a, b) => compareDates(a[0], b[0]))
      .map(([date, list]) => ({
        date,
        deliveries: [...list].sort((a, b) => a.position - b.position),
      }));
  }, [deliveries]);

  function addForToday() {
    const d = createDelivery(todayISO());
    navigate(`/delivery/${d.id}`);
  }

  function handleDelete(d: Delivery) {
    if (!confirm("Delete this delivery?")) return;
    deleteDelivery(d.id);
  }

  return (
    <div className="screen">
      <header className="appbar">
        <h1>🧺 Linen Deliveries</h1>
        <button type="button" className="btn primary" onClick={addForToday}>
          + Add delivery
        </button>
      </header>

      <nav className="menu-bar">
        <Link to="/materials" className="menu-link">
          🧴 Materials
        </Link>
        <Link to="/addresses" className="menu-link">
          📍 Addresses
        </Link>
      </nav>

      <main className="content">
        {deliveries.length === 0 ? (
          <div className="empty">
            <p className="empty-emoji">🚚</p>
            <p>No deliveries yet.</p>
            <button type="button" className="btn primary" onClick={addForToday}>
              Add your first delivery
            </button>
          </div>
        ) : (
          days.map((day) => {
            const addresses = day.deliveries.map((d) => d.address);
            const routeUrl = googleRouteUrl(addresses);
            const overflow = exceedsGoogleLimit(addresses);
            return (
              <section key={day.date || "no-date"} className="day-group">
                <div className="day-heading-row">
                  <h2 className="day-heading">{dayLabel(day.date)}</h2>
                  <span className="day-count">
                    {day.deliveries.length} stop
                    {day.deliveries.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ul className="route-list">
                  {day.deliveries.map((d, i) => (
                    <li key={d.id} className="route-row">
                      <button
                        type="button"
                        className="route-open"
                        onClick={() => navigate(`/delivery/${d.id}`)}
                      >
                        <span className="stop-index">{i + 1}</span>
                        <span className="route-text">
                          <span className="route-name">
                            {d.name || d.address || "Untitled delivery"}
                          </span>
                          {d.name && d.address && (
                            <span className="route-sub">{d.address}</span>
                          )}
                          {d.items.length > 0 && (
                            <span className="route-items">
                              {d.items
                                .map((it) => `${it.name} ×${it.quantity}`)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn tiny danger"
                        onClick={() => handleDelete(d)}
                        aria-label="Delete delivery"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>

                {routeUrl && (
                  <div className="day-actions">
                    <a
                      className="btn block"
                      href={routeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🗺️ Navigate this day in Google Maps
                    </a>
                    {overflow && (
                      <p className="muted small">
                        Google Maps supports up to {GOOGLE_MAX_WAYPOINTS + 1}{" "}
                        stops per link; later stops may be dropped.
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
