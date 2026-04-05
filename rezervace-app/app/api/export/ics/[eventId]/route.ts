import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'
import { generateAdminICS, generateUserICS } from '@/lib/ics'

// Hromadný ICS pro admina – všechny termíny události
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Nepřihlášen', { status: 401 })

  const admin = createSupabaseAdmin()

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single()

  if (!event) return new NextResponse('Událost nenalezena', { status: 404 })

  const { data: slots } = await admin
    .from('slots')
    .select('*')
    .eq('event_id', params.eventId)
    .order('starts_at', { ascending: true })

  const ics = generateAdminICS(event, slots ?? [])

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="terminy-${event.slug}.ics"`,
    },
  })
}
