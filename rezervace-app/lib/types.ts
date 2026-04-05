export interface Event {
  id: string
  slug: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export interface Slot {
  id: string
  event_id: string
  label: string
  starts_at: string | null
  ends_at: string | null
  capacity: number
  reserved_count: number
  created_at: string
}

export interface EventField {
  id: string
  event_id: string
  key: string
  label: string
  field_type: 'text' | 'email' | 'tel' | 'textarea'
  required: boolean
  sort_order: number
}

export interface Reservation {
  id: string
  event_id: string
  slot_id: string
  data: Record<string, string>
  created_at: string
  slot?: Slot
}

// Pomocný typ pro admin formulář
export interface NewEventForm {
  slug: string
  name: string
  description: string
  slots: Array<{
    label: string
    starts_at: string
    ends_at: string
    capacity: number
  }>
  fields: Array<{
    key: string
    label: string
    field_type: EventField['field_type']
    required: boolean
  }>
}
