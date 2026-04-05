'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddSlotForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slot, setSlot] = useState({ label: '', starts_at: '', ends_at: '', capacity: 1 })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, ...slot }),
    })
    setSlot({ label: '', starts_at: '', ends_at: '', capacity: 1 })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline mt-2">
      + Přidat termín
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 mt-3 space-y-3 bg-gray-50">
      <input
        type="text"
        placeholder="Popisek, např. Úterý 11. 11., 14:00–14:20"
        value={slot.label}
        onChange={(e) => setSlot({ ...slot, label: e.target.value })}
        required
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500">Začátek</label>
          <input
            type="datetime-local"
            value={slot.starts_at}
            onChange={(e) => setSlot({ ...slot, starts_at: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Konec</label>
          <input
            type="datetime-local"
            value={slot.ends_at}
            onChange={(e) => setSlot({ ...slot, ends_at: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Kapacita</label>
          <input
            type="number"
            min={1}
            value={slot.capacity}
            onChange={(e) => setSlot({ ...slot, capacity: parseInt(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ukládám…' : 'Přidat'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:underline">
          Zrušit
        </button>
      </div>
    </form>
  )
}