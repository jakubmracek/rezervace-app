import AddSlotForm from './AddSlotForm'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'
import { Event, Slot, Reservation, EventField } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdmin()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single()

  if (!event) notFound()

  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('event_id', event.id)
    .order('starts_at', { ascending: true })

  const { data: reservations } = await admin
    .from('reservations')
    .select('*, slot:slots(label)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  const { data: fields } = await supabase
    .from('event_fields')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const publicUrl = `${appUrl}/rezervace/${event.slug}`

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-sm">
          ← Zpět
        </Link>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${
          event.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {event.active ? 'aktivní' : 'archivovaná'}
        </span>
      </div>

      {/* Veřejný odkaz */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-blue-600 font-medium">Odkaz pro uživatele</p>
          <p className="font-mono text-sm mt-1">{publicUrl}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={publicUrl}
            target="_blank"
            className="text-sm bg-white border px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            Otevřít
          </a>
        </div>
      </div>

      {/* Termíny */}
      <section className="bg-white rounded-xl p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Termíny</h2>
          <div className="flex gap-2">
            <a
              href={`/api/export/ics/${event.id}`}
              className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              📅 Export ICS
            </a>
            <a
              href={`/api/export/csv/${event.id}`}
              className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              📊 Export CSV
            </a>
          </div>
        </div>
        <div className="space-y-2">
          {(slots as Slot[])?.map((slot) => {
            const free = slot.capacity - slot.reserved_count
            return (
              <div key={slot.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
                <span>{slot.label}</span>
                <span className={`text-sm font-medium ${
                  free === 0 ? 'text-red-500' : 'text-green-600'
                }`}>
                  {free === 0 ? 'Obsazeno' : `${free} / ${slot.capacity} volných`}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Rezervace */}
      <section className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold text-lg mb-4">
          Rezervace ({reservations?.length ?? 0})
        </h2>
        {!reservations?.length ? (
          <p className="text-gray-400">Zatím žádné rezervace.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Termín</th>
                  {(fields as EventField[])?.map((f) => (
                    <th key={f.key} className="pb-2 pr-4">{f.label}</th>
                  ))}
                  <th className="pb-2">Datum rezervace</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(reservations as any[]).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4">{r.slot?.label}</td>
                    {(fields as EventField[])?.map((f) => (
                      <td key={f.key} className="py-2 pr-4">{r.data[f.key] ?? '–'}</td>
                    ))}
                    <td className="py-2 text-gray-400">
                      {new Date(r.created_at).toLocaleString('cs')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
