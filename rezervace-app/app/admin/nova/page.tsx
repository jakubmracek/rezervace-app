'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_FIELDS = [
  { key: 'name', label: 'Jméno a příjmení', field_type: 'text' as const, required: true },
  { key: 'email', label: 'E-mail', field_type: 'email' as const, required: true },
]

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const [slots, setSlots] = useState([
    { label: '', starts_at: '', ends_at: '', capacity: 1 },
  ])
  const [fields, setFields] = useState(DEFAULT_FIELDS)

  function slugify(str: string) {
    return str
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function addSlot() {
    setSlots([...slots, { label: '', starts_at: '', ends_at: '', capacity: 1 }])
  }

  function updateSlot(i: number, field: string, value: string | number) {
    const updated = [...slots]
    updated[i] = { ...updated[i], [field]: value }
    setSlots(updated)
  }

  function removeSlot(i: number) {
    setSlots(slots.filter((_, idx) => idx !== i))
  }

  function addField() {
    setFields([...fields, { key: '', label: '', field_type: 'text', required: true }])
  }

  function updateField(i: number, field: string, value: string | boolean) {
    const updated = [...fields]
    updated[i] = { ...updated[i], [field]: value }
    setFields(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, slots, fields }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Chyba při vytváření události.')
      setLoading(false)
      return
    }

    router.push(`/admin/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nová událost</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Základní info */}
        <section className="bg-white rounded-xl p-6 shadow space-y-4">
          <h2 className="font-semibold text-lg">Základní informace</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Název akce</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
              required
              placeholder="Tripartity jaro 2026"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">/rezervace/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="flex-1 border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Popis (volitelný)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </section>

        {/* Termíny */}
        <section className="bg-white rounded-xl p-6 shadow space-y-4">
          <h2 className="font-semibold text-lg">Termíny</h2>
          {slots.map((slot, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 relative">
              <button
                type="button"
                onClick={() => removeSlot(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>
              <input
                type="text"
                placeholder="Popisek, např. Úterý 11. 11., 14:00–14:20"
                value={slot.label}
                onChange={(e) => updateSlot(i, 'label', e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Začátek</label>
                  <input
                    type="datetime-local"
                    value={slot.starts_at}
                    onChange={(e) => updateSlot(i, 'starts_at', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Konec</label>
                  <input
                    type="datetime-local"
                    value={slot.ends_at}
                    onChange={(e) => updateSlot(i, 'ends_at', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Kapacita</label>
                  <input
                    type="number"
                    min={1}
                    value={slot.capacity}
                    onChange={(e) => updateSlot(i, 'capacity', parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addSlot}
            className="text-blue-600 hover:underline text-sm"
          >
            + Přidat termín
          </button>
        </section>

        {/* Pole formuláře */}
        <section className="bg-white rounded-xl p-6 shadow space-y-4">
          <h2 className="font-semibold text-lg">Pole formuláře</h2>
          {fields.map((field, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 items-end">
              <input
                type="text"
                placeholder="Klíč (email)"
                value={field.key}
                onChange={(e) => updateField(i, 'key', e.target.value)}
                required
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Popisek (E-mail)"
                value={field.label}
                onChange={(e) => updateField(i, 'label', e.target.value)}
                required
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={field.field_type}
                onChange={(e) => updateField(i, 'field_type', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="email">E-mail</option>
                <option value="tel">Telefon</option>
                <option value="textarea">Víceřádkový</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(i, 'required', e.target.checked)}
                  />
                  Povinné
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addField}
            className="text-blue-600 hover:underline text-sm"
          >
            + Přidat pole
          </button>
        </section>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Ukládám…' : 'Vytvořit událost'}
          </button>
          <a href="/admin" className="px-6 py-2 text-gray-600 hover:underline">
            Zrušit
          </a>
        </div>
      </form>
    </div>
  )
}
