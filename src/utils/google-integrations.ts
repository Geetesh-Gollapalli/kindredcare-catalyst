import { Appointment, PrepChecklistItem } from '@/types/domain';

export type CalendarAppointmentInput = Partial<Appointment> & {
  doctorName: string;
  specialty: string;
  date?: string;
  time?: string;
  location?: string;
  reason?: string;
};

function parseAppointmentDateTime(apt: CalendarAppointmentInput): Date {
  if (apt.dateTime) {
    const isoParsed = new Date(apt.dateTime);
    if (!isNaN(isoParsed.getTime())) {
      return isoParsed;
    }
  }

  const dateStr = apt.date || '2026-11-18';
  const timeStr = apt.time || '11:00';

  let year = 2026;
  let month = 10; // November (0-indexed)
  let day = 18;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth();
      day = parsedDate.getDate();
    }
  }

  let hours = 10;
  let minutes = 0;
  const cleanTime = timeStr.trim();
  const ampmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(cleanTime);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1], 10);
    minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return new Date(Date.UTC(year, month, day, hours, minutes, 0));
}

function formatUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function formatChecklist(items?: Array<PrepChecklistItem | string>): string {
  if (!items || items.length === 0) return '';
  return items
    .map((item) => (typeof item === 'string' ? item : item.text))
    .join(', ');
}

export function buildGoogleCalendarUrl(apt: CalendarAppointmentInput, elderName: string): string {
  const start = parseAppointmentDateTime(apt);
  const end = new Date(start.getTime() + 45 * 60 * 1000); // 45 minute consultation slot

  const datesParam = `${formatUtcTimestamp(start)}/${formatUtcTimestamp(end)}`;
  const title = `${elderName} — ${apt.doctorName} (${apt.specialty})`;
  const locationStr =
    apt.location ||
    [apt.clinicName, apt.clinicAddress].filter(Boolean).join(', ');
  const checklistStr = formatChecklist(apt.prepChecklist);

  const details = [
    `Patient: ${elderName}`,
    `Doctor: ${apt.doctorName} (${apt.specialty})`,
    apt.reason ? `Reason: ${apt.reason}` : '',
    checklistStr ? `Prep Checklist: ${checklistStr}` : '',
    apt.notes ? `Clinical Notes: ${apt.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details,
    location: locationStr,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildGoogleMapsUrl(location: string): string {
  const query = encodeURIComponent((location || 'Apollo Hospital').trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function generateAppointmentIcsString(
  apt: CalendarAppointmentInput,
  elderName: string
): string {
  const start = parseAppointmentDateTime(apt);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const stamp = formatUtcTimestamp(new Date());

  const summary = `${elderName} - ${apt.doctorName} (${apt.specialty})`;
  const checklistStr = formatChecklist(apt.prepChecklist);
  const description = `Notes: ${apt.reason || apt.notes || ''}\\nPrep: ${checklistStr}`;
  const locationStr =
    apt.location ||
    [apt.clinicName, apt.clinicAddress].filter(Boolean).join(', ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KindredCare AI//Elderly Care Companion//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${apt.id || 'apt'}@kindredcare.ai`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatUtcTimestamp(start)}`,
    `DTEND:${formatUtcTimestamp(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${locationStr.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadAppointmentIcs(apt: CalendarAppointmentInput, elderName: string): void {
  if (typeof window === 'undefined') return;
  const icsContent = generateAppointmentIcsString(apt, elderName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDoc = apt.doctorName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const datePart = apt.date || (apt.dateTime ? apt.dateTime.slice(0, 10) : 'visit');
  link.setAttribute('download', `kindredcare-${safeDoc}-${datePart}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
