import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { slot_id, event_id, data } = await req.json()

  if (!slot_id || !event_id || !data) {
    return NextResponse.json({ error: 'Chybí povinná pole.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Atomická rezervace přes RPC funkci (zabraňuje přebukování)
  const { data: result, error } = await admin.rpc('make_reservation', {
    p_slot_id: slot_id,
    p_event_id: event_id,
    p_data: data,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (result?.error) return NextResponse.json({ error: result.error }, { status: 409 })

  // Pošli potvrzovací e-mail, pokud máme e-mail adresu
  const emailField = data.email
  if (emailField) {
    try {
      const { data: event } = await admin
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single()

      const { data: slot } = await admin
        .from('slots')
        .select('*')
        .eq('id', slot_id)
        .single()

      if (event && slot) {
        await sendConfirmationEmail({
          event,
          slot,
          recipientEmail: emailField,
          recipientName: data.name ?? data.jmeno,
        })
      }
    } catch (emailErr) {
      // E-mail selhal – rezervace je ale platná, neblokujeme
      console.error('Email send failed:', emailErr)
    }
  }

  return NextResponse.json({ success: true, reservation_id: result.reservation_id })
}
