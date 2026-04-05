import { Slot, Event } from './types'

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// ICS pro jednoho uživatele po rezervaci
export function generateUserICS(event: Event, slot: Slot): string {
  const now = formatICSDate(new Date().toISOString())
  const uid = `${slot.id}@zsvilekula.cz`

  const dtstart = slot.starts_at ? formatICSDate(slot.starts_at) : now
  const dtend = slot.ends_at ? formatICSDate(slot.ends_at) : now

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZS Vilekula//Rezervace//CS',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${event.name} – ${slot.label}`,
    event.description ? `DESCRIPTION:${event.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

// Hromadný ICS se všemi sloty pro admina
export function generateAdminICS(event: Event, slots: Slot[]): string {
  const now = formatICSDate(new Date().toISOString())

  const events = slots.map((slot) => {
    const dtstart = slot.starts_at ? formatICSDate(slot.starts_at) : now
    const dtend = slot.ends_at ? formatICSDate(slot.ends_at) : now
    const free = slot.capacity - slot.reserved_count

    return [
      'BEGIN:VEVENT',
      `UID:${slot.id}@zsvilekula.cz`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${event.name} – ${slot.label} (${free}/${slot.capacity} volných)`,
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZS Vilekula//Rezervace Admin//CS',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
