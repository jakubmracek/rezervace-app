import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Ověř přihlášení
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { name, slug, description, slots, fields } = await req.json()

  if (!name || !slug || !slots?.length) {
    return NextResponse.json({ error: 'Chybí povinná pole.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Vytvoř událost
  const { data: event, error: eventError } = await admin
    .from('events')
    .insert({ name, slug, description })
    .select()
    .single()

  if (eventError) {
    if (eventError.code === '23505') {
      return NextResponse.json({ error: `Slug "${slug}" je již použit.` }, { status: 400 })
    }
    return NextResponse.json({ error: eventError.message }, { status: 500 })
  }

  // Vytvoř termíny
  const slotRows = slots.map((s: any) => ({
    event_id: event.id,
    label: s.label,
    starts_at: s.starts_at || null,
    ends_at: s.ends_at || null,
    capacity: s.capacity ?? 1,
  }))

  const { error: slotsError } = await admin.from('slots').insert(slotRows)
  if (slotsError) return NextResponse.json({ error: slotsError.message }, { status: 500 })

  // Vytvoř pole formuláře
  if (fields?.length) {
    const fieldRows = fields.map((f: any, i: number) => ({
      event_id: event.id,
      key: f.key,
      label: f.label,
      field_type: f.field_type ?? 'text',
      required: f.required ?? true,
      sort_order: i,
    }))
    const { error: fieldsError } = await admin.from('event_fields').insert(fieldRows)
    if (fieldsError) return NextResponse.json({ error: fieldsError.message }, { status: 500 })
  }

  return NextResponse.json(event)
}
