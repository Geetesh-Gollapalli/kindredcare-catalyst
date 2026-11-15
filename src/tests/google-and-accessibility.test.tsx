import { describe, it, expect } from 'vitest';
import {
  buildGoogleCalendarUrl,
  buildGoogleMapsUrl,
  generateAppointmentIcsString,
  CalendarAppointmentInput,
} from '@/utils/google-integrations';
import { ensureSafeCircleState, ELDER_LOCALE_TEXT } from '@/components/KindredCareBrand';

describe('Google Calendar, Maps, ICS & Crash-Free State Normalization', () => {
  const sampleAppointment: CalendarAppointmentInput = {
    id: 'apt-test-1',
    doctorName: 'Dr. Anand Verma',
    specialty: 'Endocrinologist',
    date: '2026-11-18',
    time: '11:00',
    location: 'Apollo Sugar Clinic, Jubilee Hills',
    reason: 'HbA1c & Thyroid TSH Review',
    prepChecklist: [
      { id: 'c1', text: 'Bring 7-day glucose diary', completed: true },
      { id: 'c2', text: 'Fasting blood sample completed', completed: false },
    ],
    notes: 'Discuss evening metformin tolerance',
  };

  it('includes valid UTC dates= parameter in Google Calendar deep-link', () => {
    const url = buildGoogleCalendarUrl(sampleAppointment, 'Smt. Kamala Devi');
    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    // Must contain dates=20261118T110000Z%2F20261118T114500Z
    expect(url).toMatch(/dates=20261118T110000Z%2F20261118T114500Z/);
  });

  it('builds valid Google Maps search URL', () => {
    const mapsUrl = buildGoogleMapsUrl(sampleAppointment.location || '');
    expect(mapsUrl).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(mapsUrl).toContain('Apollo');
  });

  it('generates valid RFC 5545 VCALENDAR .ics payload', () => {
    const ics = generateAppointmentIcsString(sampleAppointment, 'Smt. Kamala Devi');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART:20261118T110000Z');
    expect(ics).toContain('DTEND:20261118T114500Z');
    expect(ics).toContain('SUMMARY:Smt. Kamala Devi - Dr. Anand Verma (Endocrinologist)');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('normalizes partial or malformed CareCircleState without crashing', () => {
    const normalized = ensureSafeCircleState({
      circleCode: 'KC-2026',
      elderName: 'Test Elder',
    });
    expect(normalized.circleCode).toBe('KC-2026');
    expect(normalized.elderName).toBe('Test Elder');
    expect(Array.isArray(normalized.medications)).toBe(true);
    expect(Array.isArray(normalized.appointments)).toBe(true);
    expect(Array.isArray(normalized.doseLogs)).toBe(true);
    expect(normalized.autonomySettings.shareVitalsWithFamily).toBe(true);
  });

  it('provides multilingual voice guidance strings for all 5 locales', () => {
    expect(ELDER_LOCALE_TEXT.English.greeting).toBeTruthy();
    expect(ELDER_LOCALE_TEXT.Hindi.greeting).toBeTruthy();
    expect(ELDER_LOCALE_TEXT.Telugu.greeting).toBeTruthy();
    expect(ELDER_LOCALE_TEXT.Tamil.greeting).toBeTruthy();
    expect(ELDER_LOCALE_TEXT.Spanish.greeting).toBeTruthy();
  });
});
