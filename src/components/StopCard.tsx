import { Link } from "react-router-dom";
import { iconForItem } from "../data/catalog";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import type { Stop } from "../types";

/** Format an ISO date (YYYY-MM-DD) as a short readable label, e.g. "Mon, Jun 30". */
function formatDate(iso: string | null): string {
  if (!iso) return "";
  // Parse as local date (avoid timezone shifting an all-day date).
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  stop: Stop;
  routeId: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

/** A single stop shown in the route editor, with reorder/navigate controls. */
export default function StopCard({
  stop,
  routeId,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const hasAddress = stop.address.trim().length > 0;
  const itemCount = stop.items.reduce((sum, it) => sum + it.quantity, 0);
  const dateLabel = formatDate(stop.delivery_date);

  return (
    <div className="stop-card">
      <div className="stop-order">
        <button
          type="button"
          aria-label="Move stop up"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          ↑
        </button>
        <span className="stop-num">{index + 1}</span>
        <button
          type="button"
          aria-label="Move stop down"
          onClick={onMoveDown}
          disabled={index === total - 1}
        >
          ↓
        </button>
      </div>

      <div className="stop-body">
        <Link
          to={`/routes/${routeId}/stops/${stop.id}`}
          className="stop-main"
        >
          <span className="stop-name">
            {stop.name.trim() || "Untitled stop"}
          </span>
          {dateLabel && <span className="stop-date">📅 {dateLabel}</span>}
          {hasAddress ? (
            <span className="stop-address">{stop.address}</span>
          ) : (
            <span className="stop-address muted">No address yet</span>
          )}
          {stop.items.length > 0 && (
            <span className="stop-items">
              {stop.items.map((it) => (
                <span key={it.name} className="item-pill">
                  {iconForItem(it.name)} {it.name} ×{it.quantity}
                </span>
              ))}
            </span>
          )}
          {itemCount === 0 && (
            <span className="stop-items muted">No items yet</span>
          )}
        </Link>

        <div className="stop-actions">
          {hasAddress && (
            <>
              <a
                className="btn tiny"
                href={appleStopUrl(stop.address)}
                target="_blank"
                rel="noreferrer"
              >
                 Maps
              </a>
              <a
                className="btn tiny"
                href={googleStopUrl(stop.address)}
                target="_blank"
                rel="noreferrer"
              >
                Google
              </a>
            </>
          )}
          <button
            type="button"
            className="btn tiny danger"
            onClick={onDelete}
            aria-label="Delete stop"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
