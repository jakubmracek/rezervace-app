'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { Slot, Event, EventField } from '@/lib/types'

interface Props {
  params: { slug: string }
}

export default function BookingPage({ params }: Props) {
  const [event, setEvent] = useState<Event | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [fields, setFields] = useState<EventField[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('slug', params.slug)
      .eq('active', true)
      .single()

    if (!ev) { setLoading(false); return }
    setEvent(ev)

    const { data: sl } = await supabase
      .from('slots')
      .select('*')
      .eq('event_id', ev.id)
      .order('starts_at', { ascending: true })

    setSlots((sl as Slot[]) ?? [])

    const { data: fl } = await supabase
      .from('event_fields')
      .select('*')
      .eq('event_id', ev.id)
      .order('sort_order')

    setFields((fl as EventField[]) ?? [])
    setLoading(false)

    // Realtime – posloucháme změny v tabulce slots pro tuto událost
    supabase
      .channel(`slots-${ev.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'slots', filter: `event_id=eq.${ev.id}` },
        (payload) => {
          setSlots((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as Slot) : s))
          )
        }
      )
      .subscribe()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !event) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot_id: selectedSlot.id,
        event_id: event.id,
        data: formData,
      }),
    })

    const result = await res.json()
    if (!res.ok || result.error) {
      setError(result.error || 'Chyba při rezervaci. Zkuste to znovu.')
    } else {
      setSuccess(true)
      // Stáhnout ICS
      const link = document.createElement('a')
      link.href = `/api/export/ics/slot/${selectedSlot.id}?event_id=${event.id}`
      link.download = 'termin.ics'
      link.click()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Načítám…
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Událost nebyla nalezena nebo je uzavřená.
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-10 shadow text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Rezervace potvrzena</h2>
          <p className="text-gray-600 mb-2">
            Termín: <strong>{selectedSlot?.label}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Potvrzení bylo odesláno na váš e-mail a soubor .ics byl stažen.
          </p>
        </div>
      </div>
    )
  }

  const freeSlots = slots.filter((s) => s.reserved_count < s.capacity)

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.description && (
          <p className="text-gray-600 mt-2">{event.description}</p>
        )}
      </div>

      {!selectedSlot ? (
        <div>
          <h2 className="font-semibold mb-4 text-gray-700">Vyberte termín</h2>
          {!freeSlots.length ? (
            <p className="text-red-500 text-center py-8">Všechny termíny jsou obsazeny.</p>
          ) : (
            <div className="space-y-3">
              {freeSlots.map((slot) => {
                const free = slot.capacity - slot.reserved_count
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className="w-full text-left bg-white border-2 border-transparent hover:border-blue-500 rounded-xl px-5 py-4 shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{slot.label}</span>
                      <span className="text-sm text-green-600">
                        {slot.capacity === 1
                          ? 'Volný'
                          : `${free} z ${slot.capacity} volných`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-400 hover:text-gray-700 text-sm"
            >
              ← Zpět
            </button>
            <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-700 font-medium flex-1">
              {selectedSlot.label}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.field_type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field.field_type}
                    required={field.required}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Rezervuji…' : 'Potvrdit rezervaci'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
