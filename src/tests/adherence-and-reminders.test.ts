import { describe, it, expect } from 'vitest';
import {
  calculateAdherenceMetrics,
  evaluateProactiveReminders,
  formatTime12h,
} from '@/lib/adherence';
import { getCareCircleState } from '@/services/store';
import { dispatchProactiveEmail } from '@/services/email-service';

describe('Medication Adherence & Proactive Email Reminder Engine', () => {
  it('formats 24-hour times into accessible 12-hour strings', () => {
    expect(formatTime12h('07:00')).toBe('7:00 AM');
    expect(formatTime12h('13:30')).toBe('1:30 PM');
    expect(formatTime12h('00:15')).toBe('12:15 AM');
  });

  it('calculates daily adherence metrics and detects low refill stock', () => {
    const circle = getCareCircleState();
    const simulatedNow = new Date();
    simulatedNow.setHours(15, 0, 0, 0); // 3:00 PM

    const metrics = calculateAdherenceMetrics(
      circle.medications,
      circle.doseLogs,
      simulatedNow,
      30
    );

    expect(metrics.todayTotal).toBeGreaterThanOrEqual(5);
    expect(metrics.todayTaken).toBeGreaterThanOrEqual(2);
    expect(metrics.lowStockMedications.some((m) => m.name.includes('Shelcal'))).toBe(true);
  });

  it('identifies missed doses past Elder grace window and enforces idempotency', async () => {
    const circle = getCareCircleState();
    const simulatedEvening = new Date();
    simulatedEvening.setHours(20, 30, 0, 0); // 8:30 PM (past 1:30 PM and 7:00 PM meds)

    const candidates = evaluateProactiveReminders(
      circle.circleId,
      circle.medications,
      circle.doseLogs,
      circle.appointments,
      new Set(),
      30,
      simulatedEvening
    );

    expect(candidates.some((c) => c.category === 'missed_dose_escalation')).toBe(true);
    expect(candidates.some((c) => c.category === 'low_refill')).toBe(true);

    // Verify idempotency guard suppresses duplicate dispatches for the same key
    const uniqueKey = `test-idempotency-key-${Date.now()}`;
    const firstDispatch = await dispatchProactiveEmail({
      circle,
      category: 'upcoming_dose',
      idempotencyKey: uniqueKey,
      subject: 'Test Reminder',
      headline: 'Test Headline',
      bodyText: 'Test Body',
    });
    expect(firstDispatch.skippedDuplicate).toBe(false);

    const updatedCircle = getCareCircleState();
    const secondDispatch = await dispatchProactiveEmail({
      circle: updatedCircle,
      category: 'upcoming_dose',
      idempotencyKey: uniqueKey,
      subject: 'Test Reminder',
      headline: 'Test Headline',
      bodyText: 'Test Body',
    });
    expect(secondDispatch.skippedDuplicate).toBe(true);
  });
});
