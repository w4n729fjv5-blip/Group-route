import {
  exceedsGoogleLimit,
  googleRouteUrl,
  navigableStops,
} from "../lib/maps";
import type { Stop } from "../types";

interface Props {
  stops: Stop[];
}

/**
 * Whole-route export. Google Maps gets a single multi-stop link. Apple Maps has
 * no multi-waypoint URL scheme, so per-stop Apple navigation lives on each
 * StopCard instead — we note that here.
 */
export default function ExportBar({ stops }: Props) {
  const routeUrl = googleRouteUrl(stops);
  const count = navigableStops(stops).length;
  const tooMany = exceedsGoogleLimit(stops);

  if (count === 0) {
    return (
      <div className="export-bar muted">
        Add an address to a stop to enable map export.
      </div>
    );
  }

  return (
    <div className="export-bar">
      <a
        className="btn primary block"
        href={routeUrl ?? "#"}
        target="_blank"
        rel="noreferrer"
      >
        🗺️ Open whole route in Google Maps
      </a>
      {tooMany && (
        <p className="export-warning">
          Google Maps supports up to ~10 stops per link. This route has more, so
          the link covers the first stops only — use each stop's navigate
          buttons for the rest.
        </p>
      )}
      <p className="muted small">
        Apple Maps can't open a multi-stop route from a link, so use the “
        Maps” button on each stop to navigate there one at a time.
      </p>
    </div>
  );
}
