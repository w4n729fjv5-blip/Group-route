import { useEffect, useRef, useState } from 'react'
import { searchAddress, type GeocodeResult } from '../lib/geocode'
import { useDebouncedCallback } from '../lib/useDebouncedCallback'

interface Props {
  value: string
  onChange: (address: string, lat: number | null, lng: number | null) => void
  placeholder?: string
}

/**
 * Text input with a Photon-powered address suggestion dropdown. Typing fetches
 * suggestions (debounced); picking one fills the address and its coordinates.
 * Editing the text after a pick clears the stored coordinates so we never
 * navigate to a stale point.
 */
export default function AddressInput({ value, onChange, placeholder }: Props) {
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  const runSearch = useDebouncedCallback((q: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    searchAddress(q, ctrl.signal)
      .then((r) => {
        setResults(r)
        setOpen(true)
        setActive(-1)
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setResults([])
      })
      .finally(() => setLoading(false))
  }, 300)

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handleType(text: string) {
    // Clear coordinates: the typed text no longer matches a chosen suggestion.
    onChange(text, null, null)
    if (text.trim().length >= 3) runSearch(text)
    else {
      setResults([])
      setOpen(false)
    }
  }

  function pick(r: GeocodeResult) {
    onChange(r.label, r.lat, r.lng)
    setOpen(false)
    setResults([])
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="autocomplete" ref={boxRef}>
      <input
        value={value}
        placeholder={placeholder ?? 'Search address…'}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && (results.length > 0 || loading) && (
        <div className="suggestions">
          {loading && results.length === 0 && (
            <div className="suggestion muted">Searching…</div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.lat},${r.lng},${i}`}
              className={`suggestion${i === active ? ' active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(r)
              }}
            >
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
