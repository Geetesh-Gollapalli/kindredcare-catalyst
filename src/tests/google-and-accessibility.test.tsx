import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import {
  buildGoogleCalendarAppointmentUrl,
  buildGoogleCalendarMedicationUrl,
  buildGoogleMapsDirectionsUrl,
  generateAppointmentIcsContent,
} from '@/services/google-integrations';
import { getCareCircleState } from '@/services/store';
import { calculateAdherenceMetrics } from '@/lib/adherence';
import { ElderSanctuaryView } from '@/components/ElderSanctuaryView';
import { CareCircleDashboard } from '@/components/CareCircleDashboard';
import { PasscodeAccessModal } from '@/components/PasscodeAccessModal';

describe('Google Services Integration & WCAG Accessibility Audits (axe-core)', () => {
  it('generates valid Google Calendar, Google Maps, and RFC-5545 ICS payloads', () => {
    const circle = getCareCircleState();
    const appt = circle.appointments[0];
    const med = circle.medications[0];

    const gcalApptUrl = buildGoogleCalendarAppointmentUrl(appt, circle.elderName);
    expect(gcalApptUrl).toContain('https://calendar.google.com/calendar/render');
    expect(gcalApptUrl).toContain('Dr.+Rajesh+Sharma');

    const gcalMedUrl = buildGoogleCalendarMedicationUrl(med, circle.elderName);
    expect(gcalMedUrl).toContain('RRULE%3AFREQ%3DDAILY');

    const mapsUrl = buildGoogleMapsDirectionsUrl(appt.clinicName, appt.clinicAddress);
    expect(mapsUrl).toContain('https://www.google.com/maps/dir/');

    const ics = generateAppointmentIcsContent(appt, circle.elderName);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
  });

  it('passes axe-core WCAG accessibility audit on ElderSanctuaryView with zero violations', async () => {
    const circle = getCareCircleState();
    const metrics = calculateAdherenceMetrics(circle.medications, circle.doseLogs);

    const { container } = render(
      <ElderSanctuaryView
        circle={circle}
        metrics={metrics}
        onDoseAction={async () => {}}
        onUpdateAutonomy={async () => {}}
        onTriggerSOS={async () => {}}
        announcePolite={() => {}}
      />
    );

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('passes axe-core WCAG accessibility audit on CareCircleDashboard with zero violations', async () => {
    const circle = getCareCircleState();
    const metrics = calculateAdherenceMetrics(circle.medications, circle.doseLogs);

    const { container } = render(
      <CareCircleDashboard
        circle={circle}
        metrics={metrics}
        currentRole="caretaker"
        onRefresh={async () => {}}
        onDoseAction={async () => {}}
        announcePolite={() => {}}
      />
    );

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('passes axe-core WCAG accessibility audit on PasscodeAccessModal with zero violations', async () => {
    const { container } = render(
      <PasscodeAccessModal
        isOpen={true}
        currentRole="elder"
        onClose={() => {}}
        onAuthenticated={() => {}}
      />
    );

    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
