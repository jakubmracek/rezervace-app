import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { event_id, label, starts_at, ends_at, capacity } = await req.json()

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('slots')
    .insert({ event_id, label, starts_at: starts_at || null, ends_at: ends_at || null, capacity })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}