import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  // Jen pro přihlášeného admina
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

  const { data: fields } = await admin
    .from('event_fields')
    .select('*')
    .eq('event_id', params.eventId)
    .order('sort_order')

  const { data: reservations } = await admin
    .from('reservations')
    .select('*, slot:slots(label, starts_at)')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: true })

  // Sestavení CSV
  const fieldKeys = (fields ?? []).map((f: any) => f.key)
  const fieldLabels = (fields ?? []).map((f: any) => f.label)

  const header = ['Termín', 'Datum rezervace', ...fieldLabels]

  const rows = (reservations ?? []).map((r: any) => {
    const slotLabel = r.slot?.label ?? ''
    const createdAt = new Date(r.created_at).toLocaleString('cs')
    const fieldValues = fieldKeys.map((key: string) => r.data[key] ?? '')
    return [slotLabel, createdAt, ...fieldValues]
  })

  function csvEscape(val: string) {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const csvLines = [header, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n')

  const bom = '\uFEFF' // UTF-8 BOM pro správné zobrazení v Excelu
  const filename = `rezervace-${event.slug}.csv`

  return new NextResponse(bom + csvLines, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
