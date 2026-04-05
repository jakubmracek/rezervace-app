import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Event } from '@/lib/types'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Rezervační systém</h1>
        <Link
          href="/admin/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nová událost
        </Link>
      </div>

      {!events?.length ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow">
          Zatím žádné události. Vytvoř první.
        </div>
      ) : (
        <div className="space-y-3">
          {(events as Event[]).map((event) => (
            <Link
              key={event.id}
              href={`/admin/${event.id}`}
              className="block bg-white rounded-xl p-5 shadow hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{event.name}</p>
                  <p className="text-sm text-gray-400">
                    /{event.slug} &nbsp;·&nbsp;{' '}
                    {new Date(event.created_at).toLocaleDateString('cs')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    event.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {event.active ? 'aktivní' : 'archivovaná'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
