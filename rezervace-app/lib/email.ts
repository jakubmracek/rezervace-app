import { Resend } from 'resend'
import { Event, Slot } from './types'
import { generateUserICS } from './ics'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail({
  event,
  slot,
  recipientEmail,
  recipientName,
}: {
  event: Event
  slot: Slot
  recipientEmail: string
  recipientName?: string
}) {
  const icsContent = generateUserICS(event, slot)

  const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a5276;">Potvrzení rezervace – ${event.name}</h2>
      ${recipientName ? `<p>Dobrý den, ${recipientName},</p>` : '<p>Dobrý den,</p>'}
      <p>vaše rezervace byla úspěšně přijata.</p>
      <div style="background: #f4f6f7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <strong>Termín:</strong> ${slot.label}
      </div>
      <p>V příloze najdete soubor <strong>.ics</strong> pro přidání termínu do vašeho kalendáře.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999;">ZŠ Vilekula Teplice</p>
    </body>
    </html>
  `

  await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: recipientEmail,
    subject: `Potvrzení rezervace – ${event.name}`,
    html,
    attachments: [
      {
        filename: 'termin.ics',
        content: Buffer.from(icsContent).toString('base64'),
      },
    ],
  })
}
