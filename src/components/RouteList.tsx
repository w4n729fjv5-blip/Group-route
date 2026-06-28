import { useEffect, useState } from 'react'
import type { Route } from '../lib/types'
import * as db from '../lib/db'
import { supabase } from '../lib/supabase'

interface Props {
  routes: Route[]
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>
  onOpen: (route: Route) => void
}

/** Landing screen: list of saved routes with create / delete. */
export default function RouteList({ routes, setRoutes, onOpen }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    db.listRoutes()
      .then((r) => !cancelled && setRoutes(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [setRoutes])

  async function createRoute() {
    setCreating(true)
    setError(null)
    try {
      const route = await db.createRoute('New route')
      setRoutes((prev) => [route, ...prev])
      onOpen(route)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Delete this route and all its stops?')) return
    const prev = routes
    setRoutes((r) => r.filter((x) => x.id !== id))
    try {
      await db.deleteRoute(id)
    } catch (err) {
      setRoutes(prev)
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Linen Routes</h1>
          <div className="sub">Plan, save & navigate your deliveries</div>
        </div>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      <button
        className="btn-primary btn-block"
        onClick={createRoute}
        disabled={creating}
        style={{ marginBottom: 18 }}
      >
        {creating ? 'Creating…' : '+ New route'}
      </button>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="spinner" />
      ) : routes.length === 0 ? (
        <div className="empty">
          <p>No routes yet.</p>
          <p className="small">Tap “New route” to plan your first delivery run.</p>
        </div>
      ) : (
        routes.map((route) => (
          <div
            key={route.id}
            className="route-item"
            role="button"
            tabIndex={0}
            onClick={() => onOpen(route)}
            onKeyDown={(e) => e.key === 'Enter' && onOpen(route)}
          >
            <div className="grow">
              <div className="title">{route.name || 'Untitled route'}</div>
              <div className="meta">
                {route.delivery_day ? (
                  <span className="pill day">{route.delivery_day}</span>
                ) : (
                  <span className="pill">No day set</span>
                )}
              </div>
            </div>
            <button className="btn-danger" onClick={(e) => remove(e, route.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  )
}
