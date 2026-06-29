import { Link } from "react-router-dom";
import { appleStopUrl, googleStopUrl } from "../lib/maps";
import { useMaterials } from "../materials/MaterialsContext";
import type { Stop } from "../types";

/** Format a 'YYYY-MM-DD' date as a short, human label, or '' if unset. */
function formatDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
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
  const { iconFor } = useMaterials();
  const hasAddress = stop.address.trim().length > 0;
  const itemCount = stop.items.reduce((sum, it) => sum + it.quantity, 0);
  const dateLabel = formatDate(stop.date);

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
            {dateLabel && <span className="stop-date">📅 {dateLabel}</span>}
          </span>
          {hasAddress ? (
            <span className="stop-address">{stop.address}</span>
          ) : (
            <span className="stop-address muted">No address yet</span>
          )}
          {stop.items.length > 0 && (
            <span className="stop-items">
              {stop.items.map((it) => (
                <span key={it.name} className="item-pill">
                  {iconFor(it.name)} {it.name} ×{it.quantity}
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
