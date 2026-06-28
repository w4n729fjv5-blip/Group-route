import { useEffect, useRef, useState } from 'react'
import type { Route, Stop } from '../lib/types'
import { DELIVERY_DAYS } from '../lib/types'
import * as db from '../lib/db'
import { buildAppleMapsUrl, buildGoogleMapsUrl, stopIsLocatable } from '../lib/maps'
import { useDebouncedCallback } from '../lib/useDebouncedCallback'
import StopCard from './StopCard'

interface Props {
  route: Route
  onBack: () => void
  onRouteMetaChange: (patch: Partial<Route>) => void
}

/** Full editor for a single route: metadata, stops, and map export. */
export default function RouteEditor({ route, onBack, onRouteMetaChange }: Props) {
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Keep a ref to the latest stops so debounced savers read current values.
  const stopsRef = useRef<Stop[]>([])
  stopsRef.current = stops

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    db.listStops(route.id)
      .then((s) => {
        if (!cancelled) setStops(s)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [route.id])

  // -- route metadata (name / delivery day) ---------------------------------
  const saveRouteMeta = useDebouncedCallback((patch: Partial<Route>) => {
    db.updateRoute(route.id, patch).catch((e) => setError(e.message))
  }, 600)

  function patchRoute(patch: Partial<Route>) {
    onRouteMetaChange(patch)
    saveRouteMeta(patch)
  }

  // -- stops ----------------------------------------------------------------
  const saveStop = useDebouncedCallback((stopId: string) => {
    const s = stopsRef.current.find((x) => x.id === stopId)
    if (!s) return
    setSaving(true)
    db.updateStop(s.id, {
      label: s.label,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      notes: s.notes,
      items: s.items,
    })
      .catch((e) => setError(e.message))
      .finally(() => setSaving(false))
  }, 600)

  function patchStop(id: string, patch: Partial<Stop>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    saveStop(id)
  }

  async function addStop() {
    setError(null)
    try {
      const stop = await db.createStop(route.id, stops.length)
      setStops((prev) => [...prev, stop])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function deleteStop(id: string) {
    const prev = stops
    setStops((s) => s.filter((x) => x.id !== id))
    try {
      await db.deleteStop(id)
    } catch (e) {
      setStops(prev) // roll back on failure
      setError((e as Error).message)
    }
  }

  function moveStop(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= stops.length) return
    const reordered = [...stops]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const withPositions = reordered.map((s, i) => ({ ...s, position: i }))
    setStops(withPositions)
    db.persistOrder(withPositions).catch((e) => setError(e.message))
  }

  // -- export ---------------------------------------------------------------
  const googleUrl = buildGoogleMapsUrl(stops)
  const appleUrl = buildAppleMapsUrl(stops)
  const locatableCount = stops.filter(stopIsLocatable).length

  return (
    <div>
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack}>
          ‹ Routes
        </button>
        <span className="sub">{saving ? 'Saving…' : 'Saved'}</span>
      </div>

      <div className="card stack">
        <div>
          <label>Route name</label>
          <input
            value={route.name}
            placeholder="Route name"
            onChange={(e) => patchRoute({ name: e.target.value })}
          />
        </div>
        <div>
          <label>Delivery day</label>
          <select
            value={route.delivery_day ?? ''}
            onChange={(e) => patchRoute({ delivery_day: e.target.value || null })}
          >
            <option value="">— No day set —</option>
            {DELIVERY_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <label style={{ marginBottom: 10 }}>
          Open this route in Maps ({locatableCount} stop{locatableCount === 1 ? '' : 's'} with a
          location)
        </label>
        <div className="export-row">
          <a
            className="gmaps"
            href={googleUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={googleUrl ? undefined : 'true'}
          >
            Google Maps
          </a>
          <a
            className="amaps"
            href={appleUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={appleUrl ? undefined : 'true'}
          >
            Apple Maps
          </a>
        </div>
        {locatableCount === 0 && (
          <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
            Add an address to at least one stop to enable navigation.
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {stops.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={i}
              total={stops.length}
              onPatch={(patch) => patchStop(stop.id, patch)}
              onMove={(dir) => moveStop(i, dir)}
              onDelete={() => deleteStop(stop.id)}
            />
          ))}

          <button className="btn-primary btn-block" onClick={addStop}>
            + Add stop
          </button>
        </>
      )}
    </div>
  )
}
