import type { Stop, StopItem } from '../lib/types'
import AddressInput from './AddressInput'
import ItemChecklist from './ItemChecklist'

interface Props {
  stop: Stop
  index: number
  total: number
  onPatch: (patch: Partial<Stop>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}

/** One editable delivery stop: name, address, linen checklist, and notes. */
export default function StopCard({ stop, index, total, onPatch, onMove, onDelete }: Props) {
  return (
    <div className="card">
      <div className="stop-head">
        <span className="stop-num">{index + 1}</span>
        <input
          className="grow"
          placeholder="Stop name (e.g. Grand Hotel)"
          value={stop.label}
          onChange={(e) => onPatch({ label: e.target.value })}
        />
        <div className="drag-btns">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="stack">
        <div>
          <label>Address</label>
          <AddressInput
            value={stop.address}
            onChange={(address, lat, lng) => onPatch({ address, lat, lng })}
          />
        </div>

        <ItemChecklist
          items={stop.items}
          onChange={(items: StopItem[]) => onPatch({ items })}
        />

        <div>
          <label>Notes</label>
          <textarea
            placeholder="Gate code, contact, drop-off instructions…"
            value={stop.notes}
            onChange={(e) => onPatch({ notes: e.target.value })}
          />
        </div>

        <button type="button" className="btn-danger" onClick={onDelete}>
          Remove stop
        </button>
      </div>
    </div>
  )
}
