/** The five preset linen item types, plus 'custom' for anything else. */
export const PRESET_ITEMS = [
  'linens',
  'carpets',
  'uniforms',
  'napkins',
  'tablecloths',
] as const

export type PresetItem = (typeof PRESET_ITEMS)[number]

export const DELIVERY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type DeliveryDay = (typeof DELIVERY_DAYS)[number]

/** A single line item on a stop's checklist. */
export interface StopItem {
  /** Preset name (e.g. 'napkins') or a free-text custom label. */
  type: string
  qty: number
  note?: string
}

export interface Stop {
  id: string
  route_id: string
  user_id: string
  position: number
  label: string
  address: string
  lat: number | null
  lng: number | null
  notes: string
  items: StopItem[]
  created_at?: string
}

export interface Route {
  id: string
  user_id: string
  name: string
  delivery_day: string | null
  created_at?: string
  updated_at?: string
}
