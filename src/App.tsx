import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { Route } from './lib/types'
import Auth from './components/Auth'
import RouteList from './components/RouteList'
import RouteEditor from './components/RouteEditor'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [openRouteId, setOpenRouteId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setOpenRouteId(null)
        setRoutes([])
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Show the login screen until we have a session (or Supabase isn't set up).
  if (!authReady && isSupabaseConfigured) {
    return <div className="spinner" />
  }
  if (!session) return <Auth />

  const openRoute = routes.find((r) => r.id === openRouteId) ?? null

  return (
    <div className="app">
      {openRoute ? (
        <RouteEditor
          route={openRoute}
          onBack={() => setOpenRouteId(null)}
          onRouteMetaChange={(patch) =>
            setRoutes((prev) =>
              prev.map((r) => (r.id === openRoute.id ? { ...r, ...patch } : r)),
            )
          }
        />
      ) : (
        <RouteList routes={routes} setRoutes={setRoutes} onOpen={(r) => setOpenRouteId(r.id)} />
      )}
    </div>
  )
}
