import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { name, description } = await req.json()

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('events')
    .update({ name, description })
    .eq('id', params.eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}