import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { generateUserICS } from '@/lib/ics'

// ICS pro jednoho uživatele – konkrétní slot
// GET /api/export/ics/slot/[slotId]?event_id=...
export async function GET(
  req: NextRequest,
  { params }: { params: { slotId: string } }
) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return new NextResponse('Chybí event_id', { status: 400 })

  const admin = createSupabaseAdmin()

  const { data: slot } = await admin
    .from('slots')
    .select('*')
    .eq('id', params.slotId)
    .single()

  if (!slot) return new NextResponse('Termín nenalezen', { status: 404 })

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return new NextResponse('Událost nenalezena', { status: 404 })

  const ics = generateUserICS(event, slot)

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="termin.ics"`,
    },
  })
}
