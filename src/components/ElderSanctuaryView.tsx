'use client';

import React, { useState } from 'react';
import {
  Volume2,
  Mic,
  CheckCircle2,
  Clock,
  SkipForward,
  AlertTriangle,
  CalendarPlus,
  Sparkles,
  Shield,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Pill,
  HeartPulse,
  PhoneCall,
} from 'lucide-react';
import type {
  AdherenceMetrics,
} from '@/lib/adherence';
import {
  formatTime12h,
  getLocalDateKey,
  SLOT_ORDER,
} from '@/lib/adherence';
import { buildGoogleCalendarMedicationUrl } from '@/services/google-integrations';
import type {
  CareCircleState,
  ElderAutonomySettings,
  Medication,
  TimeOfDaySlot,
} from '@/types/domain';

interface ElderSanctuaryViewProps {
  circle: CareCircleState;
  metrics: AdherenceMetrics;
  onDoseAction: (params: {
    medicationId: string;
    status: 'taken' | 'skipped' | 'snoozed';
    reason?: string;
  }) => Promise<void>;
  onUpdateAutonomy: (patch: Partial<ElderAutonomySettings>) => Promise<void>;
  onTriggerSOS: (customMessage?: string) => Promise<void>;
  announcePolite: (msg: string) => void;
}

const SKIP_REASONS = [
  'Felt slightly dizzy or lightheaded',
  'Waiting to eat my meal first',
  'Stomach felt unsettled',
  'Doctor advised holding dose today',
  'Out of tablets — waiting for refill',
];

export function ElderSanctuaryView({
  circle,
  metrics,
  onDoseAction,
  onUpdateAutonomy,
  onTriggerSOS,
  announcePolite,
}: ElderSanctuaryViewProps) {
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [aiExplainingId, setAiExplainingId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<
    Record<string, { text: string; provider: string }>
  >({});
  const [skippingMedId, setSkippingMedId] = useState<string | null>(null);
  const [selectedSkipReason, setSelectedSkipReason] = useState(SKIP_REASONS[0]);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosConfirmed, setSosConfirmed] = useState(false);

  const todayKey = getLocalDateKey(new Date());
  const todayLogs = circle.doseLogs.filter((l) => l.dateKey === todayKey);

  const speakAloud = (text: string) => {
    announcePolite(text);
    setSpeakingText(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingText(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeakingText(null), 4000);
    }
  };

  const handleReadTodaySummary = () => {
    const pendingMeds = circle.medications.filter((m) => {
      const log = todayLogs.find((l) => l.medicationId === m.id);
      return !log || log.status === 'pending' || log.status === 'snoozed';
    });

    const summary =
      pendingMeds.length === 0
        ? `Namaste ${circle.elderName}. Wonderful job! You have completed all ${metrics.todayTotal} of your scheduled medicines for today.`
        : `Namaste ${circle.elderName}. You have taken ${metrics.todayTaken} of ${metrics.todayTotal} medicines today. Next up is ${pendingMeds[0].name}, ${pendingMeds[0].dosage}, scheduled for ${formatTime12h(pendingMeds[0].scheduledTime)}. ${pendingMeds[0].plainExplanation}`;

    speakAloud(summary);
  };

  const handleExplainMedicine = async (med: Medication) => {
    setAiExplainingId(med.id);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_pill',
          medicationId: med.id,
          language: circle.autonomySettings.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiExplanations((prev) => ({
          ...prev,
          [med.id]: { text: data.explanation, provider: data.providerUsed },
        }));
        if (circle.autonomySettings.voiceReadoutEnabled) {
          speakAloud(data.explanation);
        }
      }
    } catch {
      speakAloud(med.plainExplanation);
    } finally {
      setAiExplainingId(null);
    }
  };

  const handleVoiceCommandSimulation = async (commandType: 'took_next' | 'when_appt' | 'read_schedule') => {
    if (commandType === 'read_schedule') {
      setVoiceStatus('Voice recognized: "Read my medicine schedule for today"');
      handleReadTodaySummary();
      return;
    }

    if (commandType === 'when_appt') {
      const nextAppt = circle.appointments[0];
      const msg = nextAppt
        ? `Your next doctor appointment is with ${nextAppt.doctorName} for ${nextAppt.specialty} at ${nextAppt.clinicName} on ${new Date(nextAppt.dateTime).toLocaleDateString()} at ${new Date(nextAppt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : 'You have no upcoming doctor appointments scheduled this week.';
      setVoiceStatus('Voice recognized: "When is my next doctor appointment?"');
      speakAloud(msg);
      return;
    }

    if (commandType === 'took_next') {
      const nextPending = circle.medications.find((m) => {
        const log = todayLogs.find((l) => l.medicationId === m.id);
        return !log || log.status !== 'taken';
      });
      if (nextPending) {
        setVoiceStatus(`Voice recognized: "I just took my ${nextPending.name}"`);
        await onDoseAction({ medicationId: nextPending.id, status: 'taken' });
        speakAloud(`Confirmed! Marked ${nextPending.name} as taken.`);
      } else {
        setVoiceStatus('All medicines for today are already marked taken!');
        speakAloud('All your medicines for today are already marked taken!');
      }
    }
  };

  const handleTriggerSOSClick = async () => {
    setSosSending(true);
    await onTriggerSOS(
      `${circle.elderName} pressed the Priority Help button in Elder Sanctuary Mode and requested an immediate family/caretaker check-in.`
    );
    setSosSending(false);
    setSosConfirmed(true);
    speakAloud(
      'Priority alert sent to your Caretaker Ananya and Family Circle via email. Someone will check on you shortly.'
    );
    setTimeout(() => setSosConfirmed(false), 8000);
  };

  const sortedMedications = [...circle.medications].sort((a, b) => {
    if (SLOT_ORDER[a.slot] !== SLOT_ORDER[b.slot]) {
      return SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot];
    }
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const getSlotBadge = (slot: TimeOfDaySlot) => {
    switch (slot) {
      case 'morning':
        return { label: 'Morning Routine', icon: Coffee, bg: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'afternoon':
        return { label: 'Afternoon Routine', icon: Sun, bg: 'bg-sky-100 text-sky-950 border-sky-300' };
      case 'evening':
        return { label: 'Evening Routine', icon: Sunset, bg: 'bg-orange-100 text-orange-950 border-orange-300' };
      case 'bedtime':
        return { label: 'Bedtime Routine', icon: Moon, bg: 'bg-indigo-100 text-indigo-950 border-indigo-300' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Elder Greeting, Voice Companion & SOS Banner */}
      <section
        aria-label="Daily Greeting and Voice Assistance"
        className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl border-2 border-teal-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/20 border border-teal-300/40 px-4 py-1 text-sm font-bold text-teal-100">
              <HeartPulse className="h-4 w-4 text-teal-300" aria-hidden="true" />
              Elder Sanctuary Mode • Center of Care
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Namaste, {circle.elderName}
            </h1>
            <p className="text-base sm:text-lg text-teal-100 max-w-2xl leading-relaxed">
              You have completed{' '}
              <strong className="text-white underline decoration-teal-300 underline-offset-4">
                {metrics.todayTaken} of {metrics.todayTotal} daily medicines
              </strong>{' '}
              today ({metrics.todayPercentage}% complete • {metrics.streakDays}-day healthy streak).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReadTodaySummary}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-5 py-4 text-base font-extrabold text-teal-950 shadow-lg hover:bg-teal-50 transition"
            >
              <Volume2 className="h-6 w-6 text-teal-700 shrink-0" aria-hidden="true" />
              <span>Read My Schedule Aloud</span>
            </button>

            <button
              type="button"
              onClick={() => void handleTriggerSOSClick()}
              disabled={sosSending}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-red-600 px-5 py-4 text-base font-extrabold text-white shadow-lg hover:bg-red-700 border-2 border-red-400 transition"
            >
              <PhoneCall className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>{sosSending ? 'Alerting Family...' : 'I Need Help / Feeling Unwell'}</span>
            </button>
          </div>
        </div>

        {/* Hands-Free Voice Check-in Bar */}
        <div className="mt-6 pt-5 border-t border-teal-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-300/30">
              <Mic className="h-5 w-5 text-teal-200" aria-hidden="true" />
            </span>
            <div>
              <div className="text-sm font-bold text-white">
                Hands-Free Voice Companion (Accessibility Shortcut)
              </div>
              <div className="text-xs text-teal-200">
                Tap a voice phrase below to speak or execute hands-free check-in:
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleVoiceCommandSimulation('took_next')}
              className="rounded-xl bg-teal-700/80 hover:bg-teal-600 border border-teal-400/40 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition"
            >
              🎙️ &ldquo;I took my next pill&rdquo;
            </button>
            <button
              type="button"
              onClick={() => void handleVoiceCommandSimulation('when_appt')}
              className="rounded-xl bg-teal-700/80 hover:bg-teal-600 border border-teal-400/40 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition"
            >
              🎙️ &ldquo;When is my doctor visit?&rdquo;
            </button>
            <button
              type="button"
              onClick={() => void handleVoiceCommandSimulation('read_schedule')}
              className="rounded-xl bg-teal-700/80 hover:bg-teal-600 border border-teal-400/40 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition"
            >
              🎙️ &ldquo;What medicines are left today?&rdquo;
            </button>
          </div>
        </div>

        {(speakingText || voiceStatus || sosConfirmed) && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-2xl bg-slate-950/60 border border-teal-400/40 p-4 text-sm font-semibold text-teal-100 flex items-start gap-3"
          >
            <Volume2 className="h-5 w-5 text-teal-300 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              {voiceStatus && <div className="text-teal-300 font-bold">{voiceStatus}</div>}
              {speakingText && <div>🔊 Speaking: &ldquo;{speakingText}&rdquo;</div>}
              {sosConfirmed && (
                <div className="text-red-300 font-bold">
                  🚨 Priority Care Email Dispatched to Ananya Rao (Caretaker) & Geetesh Gollapalli (Family).
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Daily Medication Timeline Cards */}
      <section aria-labelledby="elder-medications-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="elder-medications-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900"
            >
              Today&apos;s Medicine Schedule
            </h2>
            <p className="text-base text-slate-600">
              Clear visual pill guide with meal timing and one-tap confirmation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="elder-language-select"
              className="text-sm font-bold text-slate-700"
            >
              AI Explanation Language:
            </label>
            <select
              id="elder-language-select"
              value={circle.autonomySettings.preferredLanguage}
              onChange={(e) =>
                void onUpdateAutonomy({
                  preferredLanguage: e.target.value as ElderAutonomySettings['preferredLanguage'],
                })
              }
              className="rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Spanish">Spanish (Español)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {sortedMedications.map((med) => {
            const log = todayLogs.find((l) => l.medicationId === med.id);
            const status = log?.status || 'pending';
            const slotInfo = getSlotBadge(med.slot);
            const SlotIcon = slotInfo.icon;
            const isLowStock = med.stockCount <= med.refillThreshold;
            const aiExp = aiExplanations[med.id];

            return (
              <article
                key={med.id}
                aria-label={`${med.name} ${med.dosage} at ${formatTime12h(med.scheduledTime)}`}
                className={`rounded-3xl border-2 p-6 transition-all shadow-sm ${
                  status === 'taken'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : status === 'skipped'
                      ? 'border-amber-400 bg-amber-50/40'
                      : 'border-slate-200 bg-white hover:border-teal-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${slotInfo.bg}`}
                      >
                        <SlotIcon className="h-4 w-4" aria-hidden="true" />
                        {slotInfo.label} • {formatTime12h(med.scheduledTime)}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-800">
                        <Pill className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        {med.appearance.color} {med.appearance.shape}
                        {med.appearance.imprint ? ` (${med.appearance.imprint})` : ''}
                      </span>

                      <span className="inline-flex items-center rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-900">
                        🍽️ {med.mealTiming.replace('_', ' ').toUpperCase()}
                      </span>

                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 border border-amber-400 px-3 py-1 text-xs font-extrabold text-amber-950">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                          Low Stock: {med.stockCount} left
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900">
                        {med.name}{' '}
                        <span className="text-lg font-bold text-teal-800">
                          — {med.dosage}
                        </span>
                      </h3>
                      <p className="text-sm font-semibold text-slate-600">
                        {med.genericName} • Prescribed by {med.prescribedBy}
                      </p>
                    </div>

                    <p className="text-base text-slate-800 bg-slate-50 rounded-2xl p-4 border border-slate-200 leading-relaxed">
                      <strong>Why & How to Take:</strong> {med.plainExplanation}
                    </p>

                    {aiExp && (
                      <div className="rounded-2xl bg-teal-900 text-white p-4 space-y-1 border border-teal-600">
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4" aria-hidden="true" />
                          AI Companion ({circle.autonomySettings.preferredLanguage} •{' '}
                          {aiExp.provider})
                        </div>
                        <p className="text-base leading-relaxed">{aiExp.text}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          speakAloud(
                            `${med.name}, ${med.dosage}. Scheduled for ${formatTime12h(med.scheduledTime)}. ${med.plainExplanation}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 transition"
                      >
                        <Volume2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        Speak Instructions
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleExplainMedicine(med)}
                        disabled={aiExplainingId === med.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 px-3.5 py-2 text-sm font-bold text-teal-900 transition"
                      >
                        <Sparkles className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        {aiExplainingId === med.id
                          ? 'Generating Simple Guide...'
                          : `Explain in ${circle.autonomySettings.preferredLanguage}`}
                      </button>

                      <a
                        href={buildGoogleCalendarMedicationUrl(med, circle.elderName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 transition"
                      >
                        <CalendarPlus className="h-4 w-4 text-blue-700" aria-hidden="true" />
                        Add to Google Calendar
                      </a>
                    </div>
                  </div>

                  {/* Large Tactile Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
                    {status === 'taken' ? (
                      <div className="rounded-2xl bg-emerald-700 text-white p-4 text-center space-y-1 shadow-md">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-200" aria-hidden="true" />
                        <div className="text-lg font-extrabold">Taken Today ✓</div>
                        <div className="text-xs text-emerald-100">
                          Confirmed by {log?.loggedByName}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void onDoseAction({ medicationId: med.id, status: 'taken' });
                          speakAloud(`Wonderful! Marked ${med.name} as taken.`);
                        }}
                        className="w-full min-h-[60px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition"
                      >
                        <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                        <span>I Took This Pill</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          void onDoseAction({
                            medicationId: med.id,
                            status: 'snoozed',
                            reason: 'Snoozed for 15 minutes',
                          });
                          speakAloud(`Snoozed ${med.name} reminder for 15 minutes.`);
                        }}
                        className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 transition"
                      >
                        <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        <span>Snooze 15m</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSkippingMedId(skippingMedId === med.id ? null : med.id)
                        }
                        className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 transition"
                      >
                        <SkipForward className="h-4 w-4 text-rose-600" aria-hidden="true" />
                        <span>Skip Dose</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Skip Reason Drawer */}
                {skippingMedId === med.id && (
                  <div className="mt-4 pt-4 border-t-2 border-amber-200 bg-amber-50/70 rounded-2xl p-4 space-y-3">
                    <label
                      htmlFor={`skip-reason-${med.id}`}
                      className="block text-sm font-bold text-amber-950"
                    >
                      Why are you skipping {med.name} today? (Shared with your Care Circle & Doctor Brief)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        id={`skip-reason-${med.id}`}
                        value={selectedSkipReason}
                        onChange={(e) => setSelectedSkipReason(e.target.value)}
                        className="flex-1 rounded-xl border-2 border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                      >
                        {SKIP_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          void onDoseAction({
                            medicationId: med.id,
                            status: 'skipped',
                            reason: selectedSkipReason,
                          });
                          setSkippingMedId(null);
                          speakAloud(`Logged ${med.name} as skipped: ${selectedSkipReason}`);
                        }}
                        className="rounded-xl bg-amber-800 hover:bg-amber-900 px-5 py-2.5 text-sm font-bold text-white transition"
                      >
                        Confirm Skip & Notify Caretaker
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Elder Autonomy & Consent Controls ("My Care, My Choice") */}
      <section
        aria-labelledby="elder-autonomy-heading"
        className="rounded-3xl bg-white border-2 border-teal-200 p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shrink-0">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="elder-autonomy-heading"
              className="text-2xl font-extrabold text-slate-900"
            >
              My Care, My Choice — Personal Autonomy & Privacy Controls
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              You remain at the center of your healthcare decisions. Control how and when your
              family members are notified or allowed to edit your schedule.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border-2 border-slate-200 p-4 space-y-2">
            <label
              htmlFor="grace-window-select"
              className="block text-sm font-extrabold text-slate-900"
            >
              Personal Grace Period Before Family Alert
            </label>
            <p className="text-xs text-slate-600">
              Send me a gentle reminder first; only email family if unconfirmed after:
            </p>
            <select
              id="grace-window-select"
              value={circle.autonomySettings.escalationGraceMinutes}
              onChange={(e) =>
                void onUpdateAutonomy({
                  escalationGraceMinutes: Number(e.target.value) as 15 | 30 | 60,
                })
              }
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900"
            >
              <option value={15}>15 Minutes Grace Window</option>
              <option value={30}>30 Minutes Grace Window (Recommended)</option>
              <option value={60}>60 Minutes Grace Window</option>
            </select>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 p-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Family Schedule Edit Access
              </div>
              <p className="text-xs text-slate-600 mt-1">
                When off, Family Observers can view adherence but only you and your Primary
                Caretaker can alter medicine schedules.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={circle.autonomySettings.allowFamilyScheduleEdits}
              onClick={() =>
                void onUpdateAutonomy({
                  allowFamilyScheduleEdits:
                    !circle.autonomySettings.allowFamilyScheduleEdits,
                })
              }
              className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                circle.autonomySettings.allowFamilyScheduleEdits
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {circle.autonomySettings.allowFamilyScheduleEdits
                ? '✓ Family Edits Allowed'
                : '🔒 Locked to Elder & Caretaker Only'}
            </button>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 p-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Senior Comfort Mode (WCAG AAA)
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Enlarges all typography, increases touch target height to 52px+, and boosts
                visual contrast.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={circle.autonomySettings.seniorComfortMode}
              onClick={() =>
                void onUpdateAutonomy({
                  seniorComfortMode: !circle.autonomySettings.seniorComfortMode,
                })
              }
              className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                circle.autonomySettings.seniorComfortMode
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {circle.autonomySettings.seniorComfortMode
                ? '✓ Senior Comfort Mode Active'
                : 'Enable Senior Comfort Mode'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
