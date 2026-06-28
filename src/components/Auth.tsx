import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Mode = 'signin' | 'signup'

/**
 * Email + password sign-in / create-account screen. A successful
 * signInWithPassword (or signUp when email confirmation is disabled) creates a
 * Supabase session, which App.tsx picks up via onAuthStateChange.
 */
export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function friendly(message: string): string {
    const m = message.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Wrong email or password.'
    if (m.includes('user already registered')) return 'That email already has an account — try signing in.'
    if (m.includes('password should be at least')) return 'Password must be at least 6 characters.'
    if (m.includes('email not confirmed')) return 'Please confirm your email first, then sign in.'
    return message
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setWorking(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) setError(friendly(error.message))
      // On success, onAuthStateChange in App.tsx swaps in the app.
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) {
        setError(friendly(error.message))
      } else if (!data.session) {
        // Email confirmation is enabled on the Supabase project.
        setInfo('Account created. Check your email to confirm it, then sign in.')
        setMode('signin')
      }
      // If data.session exists, confirmation is off and we're already logged in.
    }
    setWorking(false)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setInfo(null)
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <img className="logo" src="/icon.svg" alt="" />
        <h1>Linen Routes</h1>
        <p className="muted small">
          Plan delivery routes, save them, and open every stop in Apple or Google Maps.
        </p>

        {!isSupabaseConfigured && (
          <p className="error" style={{ marginTop: 16 }}>
            Supabase isn’t configured yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file (see the
            README), then restart the app.
          </p>
        )}

        <form onSubmit={submit} className="stack" style={{ marginTop: 20 }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={working || !isSupabaseConfigured}
          >
            {working
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}
        </form>

        <p className="muted small" style={{ marginTop: 16 }}>
          {mode === 'signin' ? "Don’t have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '4px 10px' }}
            onClick={switchMode}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
