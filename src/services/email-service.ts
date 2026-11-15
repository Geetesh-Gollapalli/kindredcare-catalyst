import nodemailer from 'nodemailer';
import type {
  CareCircleState,
  EmailReminderCategory,
  EmailReminderLog,
} from '@/types/domain';
import {
  evaluateProactiveReminders,
  formatTime12h,
  getLocalDateKey,
} from '@/lib/adherence';
import { recordEmailReminderInStore } from '@/services/store';
import { buildGoogleMapsDirectionsUrl } from '@/services/google-integrations';

interface DispatchEmailParams {
  circle: CareCircleState;
  category: EmailReminderCategory;
  idempotencyKey: string;
  subject: string;
  headline: string;
  bodyText: string;
  actionLabel?: string;
  actionUrl?: string;
  customRecipientEmail?: string;
}

let cachedTestAccount: nodemailer.TestAccount | null = null;

async function getSmtpTransport(): Promise<{
  transporter: nodemailer.Transporter | null;
  transportMode: 'gmail_smtp' | 'ethereal_smtp' | 'local_audit';
}> {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return { transporter, transportMode: 'gmail_smtp' };
  }

  if (process.env.NODE_ENV === 'test') {
    return { transporter: null, transportMode: 'local_audit' };
  }

  try {
    if (!cachedTestAccount) {
      cachedTestAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ethereal timeout')), 2500)
        ),
      ]);
    }
    const transporter = nodemailer.createTransport({
      host: cachedTestAccount.smtp.host,
      port: cachedTestAccount.smtp.port,
      secure: cachedTestAccount.smtp.secure,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });
    return { transporter, transportMode: 'ethereal_smtp' };
  } catch {
    return { transporter: null, transportMode: 'local_audit' };
  }
}

function buildAccessibleEmailHtml(params: {
  elderName: string;
  circleCode: string;
  category: EmailReminderCategory;
  headline: string;
  bodyText: string;
  actionLabel?: string;
  actionUrl?: string;
}): string {
  const badgeColor =
    params.category === 'elder_sos' || params.category === 'missed_dose_escalation'
      ? '#b91c1c'
      : params.category === 'low_refill'
        ? '#b45309'
        : '#5227FF';

  const actionButtonHtml =
    params.actionLabel && params.actionUrl
      ? `<div style="margin-top:20px;">
           <a href="${params.actionUrl}" style="display:inline-block;padding:12px 22px;background:${badgeColor};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">
             ${params.actionLabel}
           </a>
         </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:2px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:${badgeColor};color:#ffffff;padding:18px 24px;">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">
        KindredCare AI • Care Circle ${params.circleCode}
      </div>
      <h1 style="margin:6px 0 0;font-size:22px;line-height:1.3;">${params.headline}</h1>
    </div>
    <div style="padding:24px;font-size:17px;line-height:1.6;">
      <p style="margin-top:0;"><strong>Care Profile:</strong> ${params.elderName}</p>
      <p>${params.bodyText}</p>
      ${actionButtonHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="font-size:13px;color:#475569;margin:0;">
        Sent proactively by KindredCare AI Elderly Care & Medication Ecosystem. Respecting ${params.elderName}'s autonomy settings.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches a single proactive reminder email with idempotency protection.
 */
export async function dispatchProactiveEmail(
  params: DispatchEmailParams
): Promise<{ log: EmailReminderLog; skippedDuplicate: boolean }> {
  const existing = params.circle.emailReminders.find(
    (r) => r.idempotencyKey === params.idempotencyKey
  );
  if (existing) {
    return { log: existing, skippedDuplicate: true };
  }

  const recipientMembers = params.circle.members.filter((m) => {
    if (params.category === 'missed_dose_escalation' || params.category === 'elder_sos') {
      return m.receiveMissedAlerts;
    }
    if (params.category === 'appointment_reminder') {
      return m.receiveAppointmentReminders;
    }
    if (params.category === 'low_refill') {
      return m.receiveRefillAlerts;
    }
    return true;
  });

  const recipientEmails = params.customRecipientEmail
    ? [params.customRecipientEmail]
    : Array.from(new Set(recipientMembers.map((m) => m.email)));

  const recipientNames = recipientMembers.map((m) => `${m.name} (${m.role})`);

  const html = buildAccessibleEmailHtml({
    elderName: params.circle.elderName,
    circleCode: params.circle.circleCode,
    category: params.category,
    headline: params.headline,
    bodyText: params.bodyText,
    actionLabel: params.actionLabel,
    actionUrl: params.actionUrl,
  });

  const { transporter, transportMode } = await getSmtpTransport();
  let previewUrl: string | undefined;
  let status: 'sent' | 'simulated_preview' = 'simulated_preview';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          '"KindredCare AI Alerts" <alerts@kindredcare.health>',
        to: recipientEmails.join(', '),
        subject: params.subject,
        text: `${params.headline}\n\nCare Profile: ${params.circle.elderName} (${params.circle.circleCode})\n\n${params.bodyText}`,
        html,
      });
      status = 'sent';
      const maybeUrl = nodemailer.getTestMessageUrl(info);
      if (typeof maybeUrl === 'string') {
        previewUrl = maybeUrl;
      }
    } catch {
      status = 'simulated_preview';
    }
  }

  const logEntry: EmailReminderLog = {
    id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    idempotencyKey: params.idempotencyKey,
    circleId: params.circle.circleId,
    category: params.category,
    subject: params.subject,
    recipientEmails,
    recipientNames,
    bodyPreview: params.bodyText,
    status,
    transport: transportMode,
    previewUrl,
    sentAt: new Date().toISOString(),
  };

  await recordEmailReminderInStore(logEntry);
  return { log: logEntry, skippedDuplicate: false };
}

/**
 * Triggers a specific category reminder or runs a full automated scan of overdue/upcoming items.
 */
export async function triggerProactiveReminderWorkflow(params: {
  circle: CareCircleState;
  category:
    | EmailReminderCategory
    | 'auto_scan';
  targetId?: string;
  customRecipientEmail?: string;
  customMessage?: string;
}): Promise<{ dispatched: EmailReminderLog[]; skippedCount: number }> {
  const { circle, category, targetId, customRecipientEmail, customMessage } = params;
  const todayKey = getLocalDateKey(new Date());
  const dispatched: EmailReminderLog[] = [];
  let skippedCount = 0;

  if (category === 'auto_scan') {
    const sentKeys = new Set(circle.emailReminders.map((r) => r.idempotencyKey));
    const candidates = evaluateProactiveReminders(
      circle.circleId,
      circle.medications,
      circle.doseLogs,
      circle.appointments,
      sentKeys,
      circle.autonomySettings.escalationGraceMinutes
    );

    for (const candidate of candidates) {
      const res = await dispatchProactiveEmail({
        circle,
        category: candidate.category,
        idempotencyKey: candidate.idempotencyKey,
        subject: `[KindredCare] ${candidate.title}`,
        headline: candidate.title,
        bodyText: candidate.description,
        customRecipientEmail,
      });
      if (res.skippedDuplicate) {
        skippedCount += 1;
      } else {
        dispatched.push(res.log);
      }
    }
    return { dispatched, skippedCount };
  }

  if (category === 'elder_sos') {
    const res = await dispatchProactiveEmail({
      circle,
      category: 'elder_sos',
      idempotencyKey: `${circle.circleId}:elder_sos:${Date.now()}`,
      subject: `PRIORITY CARE ALERT: ${circle.elderName} Requested Immediate Check-In`,
      headline: `${circle.elderName} Pressed "I Need Help / Feeling Unwell"`,
      bodyText:
        customMessage ||
        `${circle.elderName} triggered a Priority Care Check-In from their Elder Sanctuary screen. Please call ${circle.emergencyPhone} or check on them immediately.`,
      customRecipientEmail,
    });
    dispatched.push(res.log);
    return { dispatched, skippedCount: 0 };
  }

  if (category === 'missed_dose_escalation' || category === 'upcoming_dose') {
    const med =
      circle.medications.find((m) => m.id === targetId) || circle.medications[0];
    if (!med) return { dispatched, skippedCount: 0 };

    const isMissed = category === 'missed_dose_escalation';
    const res = await dispatchProactiveEmail({
      circle,
      category,
      idempotencyKey: `${circle.circleId}:${category}:${med.id}:${todayKey}:${customRecipientEmail ? Date.now() : 'std'}`,
      subject: isMissed
        ? `Missed Dose Escalation: ${circle.elderName} — ${med.name} (${med.dosage})`
        : `Upcoming Medication Reminder: ${med.name} at ${formatTime12h(med.scheduledTime)}`,
      headline: isMissed
        ? `Missed Medication Escalation (${circle.autonomySettings.escalationGraceMinutes}m Grace Elapsed)`
        : `Time Soon for ${med.name} (${med.dosage})`,
      bodyText: isMissed
        ? `${circle.elderName}'s scheduled ${formatTime12h(med.scheduledTime)} dose of ${med.name} (${med.dosage}) has not been marked taken after their ${circle.autonomySettings.escalationGraceMinutes}-minute personal grace window. Purpose: ${med.purpose}. Instructions: ${med.instructions}`
        : `Gentle reminder for ${circle.elderName}: Take ${med.name} (${med.dosage}) at ${formatTime12h(med.scheduledTime)} (${med.mealTiming.replace('_', ' ')}). ${med.plainExplanation}`,
      customRecipientEmail,
    });
    if (res.skippedDuplicate) skippedCount += 1;
    else dispatched.push(res.log);
    return { dispatched, skippedCount };
  }

  if (category === 'appointment_reminder') {
    const appt =
      circle.appointments.find((a) => a.id === targetId) || circle.appointments[0];
    if (!appt) return { dispatched, skippedCount: 0 };

    const mapsUrl = buildGoogleMapsDirectionsUrl(appt.clinicName, appt.clinicAddress);
    const checklistStr = appt.prepChecklist.map((c) => `• ${c.text}`).join(' | ');
    const res = await dispatchProactiveEmail({
      circle,
      category: 'appointment_reminder',
      idempotencyKey: `${circle.circleId}:appointment_reminder:${appt.id}:${todayKey}:${customRecipientEmail ? Date.now() : 'std'}`,
      subject: `Doctor Appointment Reminder: ${appt.doctorName} (${appt.specialty})`,
      headline: `Upcoming Appointment with ${appt.doctorName}`,
      bodyText: `${circle.elderName} has an upcoming ${appt.specialty} appointment at ${appt.clinicName} (${appt.clinicAddress}) on ${new Date(appt.dateTime).toLocaleString()}. Preparation Checklist: ${checklistStr || 'Bring medication list'}.`,
      actionLabel: 'Open Clinic in Google Maps',
      actionUrl: mapsUrl,
      customRecipientEmail,
    });
    if (res.skippedDuplicate) skippedCount += 1;
    else dispatched.push(res.log);
    return { dispatched, skippedCount };
  }

  if (category === 'low_refill') {
    const lowMed =
      circle.medications.find((m) => m.id === targetId) ||
      circle.medications.find((m) => m.stockCount <= m.refillThreshold) ||
      circle.medications[0];
    if (!lowMed) return { dispatched, skippedCount: 0 };

    const res = await dispatchProactiveEmail({
      circle,
      category: 'low_refill',
      idempotencyKey: `${circle.circleId}:low_refill:${lowMed.id}:${todayKey}:${customRecipientEmail ? Date.now() : 'std'}`,
      subject: `Low Pill Inventory Alert: ${lowMed.name} (${lowMed.stockCount} doses remaining)`,
      headline: `Refill Needed for ${lowMed.name}`,
      bodyText: `${circle.elderName}'s supply of ${lowMed.name} (${lowMed.dosage}) is down to ${lowMed.stockCount} tablets (threshold: ${lowMed.refillThreshold}). Prescribed by ${lowMed.prescribedBy}. Please arrange a pharmacy refill so no daily doses are missed.`,
      customRecipientEmail,
    });
    if (res.skippedDuplicate) skippedCount += 1;
    else dispatched.push(res.log);
    return { dispatched, skippedCount };
  }

  return { dispatched, skippedCount };
}
