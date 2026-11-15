import type { Appointment, Medication } from '@/types/domain';

/**
 * Generates a direct Google Calendar event creation URL for a medical appointment.
 */
export function buildGoogleCalendarAppointmentUrl(
  appt: Appointment,
  elderName: string
): string {
  const start = new Date(appt.dateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour appointment

  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const prepList =
    appt.prepChecklist.length > 0
      ? `\n\nPreparation Checklist:\n${appt.prepChecklist.map((i) => `- [${i.completed ? 'x' : ' '}] ${i.text}`).join('\n')}`
      : '';

  const details = `KindredCare Medical Appointment for ${elderName}\nDoctor: ${appt.doctorName} (${appt.specialty})\nClinic: ${appt.clinicName}\nNotes: ${appt.notes}${prepList}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${elderName}: ${appt.doctorName} (${appt.specialty})`,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details,
    location: `${appt.clinicName}, ${appt.clinicAddress}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a direct Google Calendar recurring reminder URL for a daily medication.
 */
export function buildGoogleCalendarMedicationUrl(
  med: Medication,
  elderName: string
): string {
  const now = new Date();
  const [hours, minutes] = med.scheduledTime.split(':').map(Number);
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours || 8,
    minutes || 0,
    0
  );
  const end = new Date(start.getTime() + 15 * 60 * 1000);

  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `💊 ${elderName}: ${med.name} (${med.dosage})`,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details: `Purpose: ${med.purpose}\nTiming: ${med.mealTiming.replace('_', ' ')}\nInstructions: ${med.instructions}\nPrescribed by: ${med.prescribedBy}`,
    recur: 'RRULE:FREQ=DAILY',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a Google Maps Directions URL for clinic or pharmacy navigation.
 */
export function buildGoogleMapsDirectionsUrl(
  clinicName: string,
  clinicAddress: string
): string {
  const destination = `${clinicName}, ${clinicAddress}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Generates an RFC-5545 compliant .ics calendar file payload for downloading into any calendar app.
 */
export function generateAppointmentIcsContent(
  appt: Appointment,
  elderName: string
): string {
  const start = new Date(appt.dateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KindredCare AI//Elderly Care Ecosystem//EN',
    'BEGIN:VEVENT',
    `UID:appt-${appt.id}@kindredcare.health`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${elderName} - ${appt.doctorName} (${appt.specialty})`,
    `LOCATION:${appt.clinicName}, ${appt.clinicAddress}`,
    `DESCRIPTION:${appt.notes.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
