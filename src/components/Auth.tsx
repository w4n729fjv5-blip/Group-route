import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Magic-link sign-in screen. Sends a one-tap login link to the user's email;
 * Supabase redirects back to this app and the session is detected automatically.
 */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
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

        {status === 'sent' ? (
          <p className="success" style={{ marginTop: 20 }}>
            Check your email — we sent a sign-in link to <strong>{email}</strong>. Open it
            on this device to continue.
          </p>
        ) : (
          <form onSubmit={sendLink} className="stack" style={{ marginTop: 20 }}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={status === 'sending' || !isSupabaseConfigured}
            >
              {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
