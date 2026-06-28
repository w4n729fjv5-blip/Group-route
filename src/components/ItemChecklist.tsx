import { useState } from 'react'
import { PRESET_ITEMS, type StopItem } from '../lib/types'

interface Props {
  items: StopItem[]
  onChange: (items: StopItem[]) => void
}

/**
 * Linen checklist for a stop: tap a preset chip to add/remove it, adjust
 * quantities with steppers, and add free-text custom items.
 */
export default function ItemChecklist({ items, onChange }: Props) {
  const [custom, setCustom] = useState('')

  const hasType = (type: string) =>
    items.some((i) => i.type.toLowerCase() === type.toLowerCase())

  function togglePreset(type: string) {
    if (hasType(type)) {
      onChange(items.filter((i) => i.type.toLowerCase() !== type.toLowerCase()))
    } else {
      onChange([...items, { type, qty: 1, note: '' }])
    }
  }

  function setQty(idx: number, qty: number) {
    if (qty < 1) return
    onChange(items.map((it, i) => (i === idx ? { ...it, qty } : it)))
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  function addCustom() {
    const name = custom.trim()
    if (!name) return
    if (!hasType(name)) onChange([...items, { type: name, qty: 1, note: '' }])
    setCustom('')
  }

  return (
    <div className="stack">
      <div>
        <label>Linens needed</label>
        <div className="chips">
          {PRESET_ITEMS.map((type) => (
            <button
              key={type}
              type="button"
              className={`chip${hasType(type) ? ' active' : ''}`}
              onClick={() => togglePreset(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="card" style={{ margin: 0, padding: '4px 12px' }}>
          {items.map((it, idx) => (
            <div className="item-row" key={`${it.type}-${idx}`}>
              <span className="item-name">{it.type}</span>
              <div className="qty">
                <button type="button" onClick={() => setQty(idx, it.qty - 1)} aria-label="Decrease">
                  −
                </button>
                <span className="val">{it.qty}</span>
                <button type="button" onClick={() => setQty(idx, it.qty + 1)} aria-label="Increase">
                  +
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '6px 10px' }}
                  onClick={() => removeItem(idx)}
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row">
        <input
          className="grow"
          placeholder="Add custom item (e.g. bath mats)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <button type="button" className="btn-ghost" onClick={addCustom}>
          Add
        </button>
      </div>
    </div>
  )
}
