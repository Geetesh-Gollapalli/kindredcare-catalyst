'use client';

import React, { useState } from 'react';
import { ELDER_LOCALE_TEXT, PillBadgeSvg, speakAloud } from './KindredCareBrand';
import type { ProfileMedItem } from './ElderProfileModal';

export interface ElderAppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  dateTimeLabel: string;
  isoStart: string;
  notes: string;
  postVisitOutcome?: string;
  checklist: Array<{ id: string; text: string; done: boolean }>;
}

export function ElderCompanionView({
  elderName,
  emergencyPhone,
  caretakerName,
  familyName,
  medications,
  appointments,
  familyEncouragementNote,
  meals,
  hydrationGlasses,
  currentFeeling,
  thyroidCountdownMins,
  autonomy,
  comfortMode,
  highContrast,
  onTakeMed,
  onUndoMed,
  onSnoozeMed,
  onSkipMed,
  onAskRefill,
  onToggleMeal,
  onSetHydration,
  onSelectFeeling,
  onToggleChecklist,
  onAddDoctorQuestion,
  onTriggerSos,
  onOpenMedicalId,
  onUpdateAutonomy,
  onToggleComfort,
  onToggleContrast,
  onToast,
}: {
  elderName: string;
  emergencyPhone: string;
  caretakerName: string;
  familyName: string;
  medications: ProfileMedItem[];
  appointments: ElderAppointmentItem[];
  familyEncouragementNote?: string;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  hydrationGlasses: number;
  currentFeeling: string;
  thyroidCountdownMins: number | null;
  autonomy: {
    graceMinutes: 15 | 30 | 60;
    allowFamilyEdits: boolean;
    shareVitals: boolean;
    language: 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Spanish';
  };
  comfortMode: boolean;
  highContrast: boolean;
  onTakeMed: (medId: string, confirmedMealKey?: 'breakfast' | 'lunch' | 'dinner') => void;
  onUndoMed: (medId: string) => void;
  onSnoozeMed: (medId: string) => void;
  onSkipMed: (medId: string, reason: string) => void;
  onAskRefill: (medId: string) => void;
  onToggleMeal: (meal: 'breakfast' | 'lunch' | 'dinner') => void;
  onSetHydration: (glasses: number) => void;
  onSelectFeeling: (feeling: string) => void;
  onToggleChecklist: (apptId: string, checkId: string) => void;
  onAddDoctorQuestion: (questionText: string) => void;
  onTriggerSos: () => void;
  onOpenMedicalId: () => void;
  onUpdateAutonomy: (patch: Partial<typeof autonomy>) => void;
  onToggleComfort: () => void;
  onToggleContrast: () => void;
  onToast: (msg: string) => void;
}) {
  const [subScreen, setSubScreen] = useState<'meds' | 'visits' | 'privacy'>('meds');
  const [showGuide, setShowGuide] = useState(true);
  const [showWeeklyPrnDrawer, setShowWeeklyPrnDrawer] = useState(false);
  const [mealPromptMed, setMealPromptMed] = useState<{
    med: ProfileMedItem;
    mealKey: 'breakfast' | 'lunch' | 'dinner';
  } | null>(null);
  const [doubleDoseMed, setDoubleDoseMed] = useState<ProfileMedItem | null>(null);
  const [skipModalMed, setSkipModalMed] = useState<ProfileMedItem | null>(null);
  const [doctorQuestionInput, setDoctorQuestionInput] = useState('');

  const t = ELDER_LOCALE_TEXT[autonomy.language] || ELDER_LOCALE_TEXT.English;

  const dailyMeds = medications.filter((m) => m.scheduleType === 'daily');
  const specialMeds = medications.filter((m) => m.scheduleType !== 'daily');
  const takenCount = dailyMeds.filter((m) => m.status === 'taken').length;
  const nextMed = dailyMeds.find((m) => m.status === 'pending' || m.status === 'snoozed');

  function handleElderTapTake(med: ProfileMedItem) {
    const rule = med.mealTiming.toLowerCase();
    if (rule.includes('breakfast') && !meals.breakfast) {
      setMealPromptMed({ med, mealKey: 'breakfast' });
      return;
    }
    if (rule.includes('lunch') && !meals.lunch) {
      setMealPromptMed({ med, mealKey: 'lunch' });
      return;
    }
    if (rule.includes('dinner') && !meals.dinner) {
      setMealPromptMed({ med, mealKey: 'dinner' });
      return;
    }
    onTakeMed(med.id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* =========================================================
          3 GIANT ELDER NAVIGATION BUTTONS (ZERO SIDEBAR CLUTTER)
          ========================================================= */}
      <nav
        aria-label="Elder Companion Navigation"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {[
          {
            id: 'meds',
            label: t.todaysMedsTab,
            sub: `${takenCount} of ${dailyMeds.length} completed today`,
          },
          {
            id: 'visits',
            label: t.doctorVisitsTab,
            sub: `${appointments.length} upcoming visits`,
          },
          {
            id: 'privacy',
            label: t.privacyHelpTab,
            sub: 'SOS Help & Privacy Switches',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubScreen(tab.id as 'meds' | 'visits' | 'privacy')}
            className={`hc-card flex flex-col justify-center rounded-2xl border px-5 py-4 text-left transition ${
              subScreen === tab.id
                ? 'border-[#0F524B] bg-[#0F524B] text-white shadow-md'
                : 'border-black/15 bg-white text-[#14171A] hover:bg-[#EFECE6]'
            }`}
          >
            <span className="text-lg font-bold leading-snug">{tab.label}</span>
            <span
              className={`mt-0.5 text-xs font-medium ${
                subScreen === tab.id ? 'text-white/85' : 'text-[#57606A]'
              }`}
            >
              {tab.sub}
            </span>
          </button>
        ))}
      </nav>

      {/* =========================================================
          FIRST-TIME SIMPLE 3-STEP WELCOME GUIDE FOR ELDER
          ========================================================= */}
      {showGuide && (
        <section className="hc-card rounded-2xl border border-[#0F524B]/25 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold text-[#0F524B]">
                Easy 3-Step Guide for {elderName}
              </span>
              <h2 className="mt-1.5 text-xl font-bold text-[#14171A]">{t.greeting}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  speakAloud(
                    `${t.greeting}. Step 1: Tap the green button after taking your medicine. Step 2: Tap Read Aloud anytime you want me to speak your medicine instructions. Step 3: Tap Privacy and Help if you feel unwell.`,
                    autonomy.language,
                    onToast
                  )
                }
                className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white"
              >
                🔊 Read Guide Aloud
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-xl border border-black/15 px-3.5 py-2.5 text-xs font-bold text-[#57606A]"
              >
                Hide Guide
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F6F5F1] p-3.5 text-sm">
              <strong className="text-[#0F524B]">1. Mark Your Pill:</strong> Tap the big
              green <strong>“I Took This Pill”</strong> button after swallowing your
              medicine.
            </div>
            <div className="rounded-xl bg-[#F6F5F1] p-3.5 text-sm">
              <strong className="text-[#0F524B]">2. Listen by Voice:</strong> Tap{' '}
              <strong>“Read Aloud to Me”</strong> on any card to hear what the pill is
              for.
            </div>
            <div className="rounded-xl bg-[#F6F5F1] p-3.5 text-sm">
              <strong className="text-[#0F524B]">3. Always in Control:</strong> Your nurse{' '}
              <strong>{caretakerName.split(' ')[0]}</strong> and{' '}
              <strong>{familyName.split(' ')[0]}</strong> are connected if you need help.
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          SCREEN 1: TODAY'S MEDICINES (CALM ELDER SANCTUARY)
          ========================================================= */}
      {subScreen === 'meds' && (
        <div className="space-y-6">
          {/* Active 45-Minute Empty-Stomach Tea/Breakfast Countdown */}
          {thyroidCountdownMins !== null && thyroidCountdownMins > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-500/40 bg-amber-50 px-5 py-4 text-amber-950">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  ⏳ Empty-Stomach Thyroid Absorption Timer Active
                </div>
                <div className="mt-0.5 text-base font-bold">
                  Please wait <strong>{thyroidCountdownMins} minutes</strong> before
                  drinking morning tea, coffee, or eating breakfast.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  speakAloud(
                    `Please wait ${thyroidCountdownMins} minutes before having tea or breakfast so your morning thyroid pill works properly.`,
                    autonomy.language,
                    onToast
                  )
                }
                className="rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white"
              >
                🔊 Speak Timer
              </button>
            </div>
          )}

          {/* GIANT NEXT MEDICINE CARD */}
          {nextMed ? (
            <section className="rounded-3xl bg-[#0F524B] p-6 text-white shadow-lg sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-amber-400 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#14171A]">
                    {t.nextDoseHeadline} • Scheduled at {nextMed.time}
                  </span>
                  <h2 className="text-2xl font-extrabold sm:text-3xl">
                    {nextMed.name} ({nextMed.dosage})
                  </h2>
                  <p className="text-base font-medium text-white/90">
                    <strong>Why you take this:</strong> {nextMed.purpose}
                  </p>
                  <p className="inline-block rounded-xl bg-white/15 px-3.5 py-2 text-sm font-bold text-amber-200">
                    🍽️ How to take: {nextMed.mealTiming} ({nextMed.colorName}{' '}
                    {nextMed.shape} pill • Imprint {nextMed.imprint})
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-2 shadow-md">
                  <PillBadgeSvg
                    colorName={nextMed.colorName}
                    shape={nextMed.shape}
                    imprint={nextMed.imprint}
                    size={68}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleElderTapTake(nextMed)}
                  className="rounded-2xl bg-white px-5 py-4 text-base font-extrabold text-[#0F524B] shadow-md transition hover:bg-amber-50"
                >
                  {t.takeNowBtn}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    speakAloud(
                      `${nextMed.name}, ${nextMed.dosage}. Purpose: ${nextMed.purpose}. Take ${nextMed.mealTiming}. Look for the ${nextMed.colorName} ${nextMed.shape} pill stamped with ${nextMed.imprint}.`,
                      autonomy.language,
                      onToast
                    )
                  }
                  className="rounded-2xl border-2 border-white/40 bg-white/10 px-5 py-4 text-base font-bold text-white transition hover:bg-white/20"
                >
                  {t.readAloudBtn}
                </button>
                <button
                  type="button"
                  onClick={() => onSnoozeMed(nextMed.id)}
                  className="rounded-2xl border-2 border-white/30 bg-transparent px-5 py-4 text-base font-bold text-white transition hover:bg-white/10"
                >
                  {t.snoozeBtn}
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl bg-[#0E6B50] p-6 text-white shadow-md sm:p-8">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase">
                ✓ All Daily Medicines Complete
              </span>
              <h2 className="mt-2 text-2xl font-extrabold">{t.allCaughtUp}</h2>
            </section>
          )}

          {/* 3-TAP DAILY MEALS, WATER & FEELING BAR */}
          <section className="hc-card rounded-2xl border border-black/10 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-[#14171A]">
              Quick Daily Check-In (Tap to Update)
            </h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              {/* Meals */}
              <div className="rounded-xl bg-[#F6F5F1] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  1. My Meals Today
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((mealKey) => (
                    <button
                      key={mealKey}
                      type="button"
                      onClick={() => onToggleMeal(mealKey)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        meals[mealKey]
                          ? 'bg-[#0E6B50] text-white shadow-xs'
                          : 'border border-black/15 bg-white text-[#14171A]'
                      }`}
                    >
                      {meals[mealKey] ? '✓ Had ' : '○ '}
                      {mealKey.charAt(0).toUpperCase() + mealKey.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water */}
              <div className="rounded-xl bg-[#F6F5F1] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    2. Water Intake
                  </span>
                  <span className="text-xs font-extrabold text-[#14171A]">
                    {hydrationGlasses} of 8 glasses
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetHydration(Math.min(8, hydrationGlasses + 1))}
                    className="flex-1 rounded-xl bg-[#0F524B] px-3 py-2 text-xs font-bold text-white"
                  >
                    💧 +1 Glass of Water
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetHydration(Math.max(0, hydrationGlasses - 1))}
                    className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                    aria-label="Decrease water glasses"
                  >
                    −
                  </button>
                </div>
              </div>

              {/* How I Feel */}
              <div className="rounded-xl bg-[#F6F5F1] p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  3. How Do You Feel Right Now?
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {[
                    { label: '😊 Good', val: 'Feeling Good' },
                    { label: '😵 Dizzy', val: 'Slightly Dizzy' },
                    { label: '🤢 Stomach', val: 'Mild Nausea' },
                    { label: '😴 Tired', val: 'Very Tired' },
                  ].map((f) => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => onSelectFeeling(f.val)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        currentFeeling === f.val
                          ? 'bg-[#14171A] text-white'
                          : 'border border-black/10 bg-white text-[#14171A]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAMILY ENCOURAGEMENT NOTE */}
          {familyEncouragementNote && (
            <div className="rounded-2xl border border-[#0F524B]/20 bg-[#0F524B]/[0.05] px-5 py-3.5 text-sm">
              <strong className="text-[#0F524B]">💌 Note from Family:</strong> “
              {familyEncouragementNote}”
            </div>
          )}

          {/* TODAY'S SCHEDULED DAILY MEDICINES LIST */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#14171A]">
              Today’s Daily Medicine Schedule ({takenCount}/{dailyMeds.length} Taken)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {dailyMeds.map((m) => {
                const isTaken = m.status === 'taken';
                const isLow = m.stock <= 7;
                return (
                  <article
                    key={m.id}
                    className={`hc-card flex flex-col justify-between rounded-2xl border p-5 transition ${
                      isTaken
                        ? 'border-[#0E6B50]/35 bg-[#0E6B50]/[0.04]'
                        : 'border-black/12 bg-white shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <PillBadgeSvg
                            colorName={m.colorName}
                            shape={m.shape}
                            imprint={m.imprint}
                            size={52}
                          />
                          <div>
                            <h4 className="text-lg font-bold text-[#14171A]">{m.name}</h4>
                            <div className="text-xs font-semibold text-[#57606A]">
                              {m.dosage} • {m.colorName} {m.shape} ({m.imprint})
                            </div>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isTaken
                              ? 'bg-[#0E6B50] text-white'
                              : m.status === 'skipped'
                                ? 'bg-amber-600 text-white'
                                : m.status === 'snoozed'
                                  ? 'bg-sky-700 text-white'
                                  : 'bg-[#EFECE6] text-[#14171A]'
                          }`}
                        >
                          {isTaken
                            ? `✓ Taken (${m.takenAt || 'Today'})`
                            : m.status === 'skipped'
                              ? 'Skipped'
                              : m.status === 'snoozed'
                                ? '⏰ Snoozed 15m'
                                : `Due ${m.time}`}
                        </span>
                      </div>

                      <div className="mt-3.5 rounded-xl bg-[#F6F5F1] p-3.5 text-sm">
                        <div className="font-bold text-[#0F524B]">
                          Why you take this: {m.purpose}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[#14171A]">
                          When: {m.mealTiming}
                        </div>
                      </div>

                      {isLow && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/50 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950">
                          <span>📦 Only {m.stock} pills left in box</span>
                          <button
                            type="button"
                            onClick={() => onAskRefill(m.id)}
                            className="rounded-lg bg-amber-800 px-3 py-1 text-white"
                          >
                            Ask Family to Order More
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {isTaken ? (
                        <button
                          type="button"
                          onClick={() => setDoubleDoseMed(m)}
                          className="flex-1 rounded-xl border border-[#0E6B50]/40 bg-white px-4 py-2.5 text-xs font-bold text-[#0E6B50]"
                        >
                          ✓ Already Taken • Tap if Mistake
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleElderTapTake(m)}
                            className="flex-1 rounded-xl bg-[#0F524B] px-4 py-2.5 text-sm font-bold text-white"
                          >
                            ✓ I Took This Pill
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkipModalMed(m)}
                            className="rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs font-bold text-[#57606A]"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          speakAloud(
                            `${m.name}, ${m.dosage}. ${m.purpose}. Take ${m.mealTiming}.`,
                            autonomy.language,
                            onToast
                          )
                        }
                        className="rounded-xl border border-[#0F524B]/30 bg-[#0F524B]/5 px-3.5 py-2.5 text-xs font-bold text-[#0F524B]"
                      >
                        🔊 Read
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* SEPARATE DRAWER FOR WEEKLY (SUNDAY) & AS-NEEDED (PRN) MEDICINES */}
          {specialMeds.length > 0 && (
            <section className="hc-card rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#14171A]">
                    Weekly &amp; As-Needed Medicines (Not Every Day)
                  </h3>
                  <p className="text-xs text-[#57606A]">
                    Kept separate so you never mix them up with your daily pills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeeklyPrnDrawer(!showWeeklyPrnDrawer)}
                  className="rounded-xl border border-black/15 bg-[#F6F5F1] px-4 py-2 text-xs font-bold"
                >
                  {showWeeklyPrnDrawer ? 'Hide Weekly / As-Needed' : 'Show Weekly & Acidity Pills'}
                </button>
              </div>

              {showWeeklyPrnDrawer && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {specialMeds.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <PillBadgeSvg
                          colorName={m.colorName}
                          shape={m.shape}
                          imprint={m.imprint}
                          size={44}
                        />
                        <div>
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                            {m.scheduleType === 'weekly'
                              ? 'Sundays Only'
                              : 'Only If Needed (Max 1/day)'}
                          </span>
                          <h4 className="mt-0.5 text-sm font-bold">{m.name}</h4>
                          <div className="text-xs text-[#57606A]">{m.purpose}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onTakeMed(m.id)}
                          disabled={m.status === 'taken'}
                          className="flex-1 rounded-lg bg-[#14171A] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {m.status === 'taken' ? '✓ Taken Today' : 'Log Dose Now'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            speakAloud(
                              `${m.name}. ${m.purpose}. ${m.mealTiming}.`,
                              autonomy.language,
                              onToast
                            )
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                        >
                          🔊 Read
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* =========================================================
          SCREEN 2: MY DOCTOR VISITS (SIMPLE PLAIN-LANGUAGE VIEW)
          ========================================================= */}
      {subScreen === 'visits' && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {appointments.map((appt) => (
              <article
                key={appt.id}
                className="hc-card rounded-2xl border border-black/12 bg-white p-6 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-[#0F524B]/10 px-3 py-1 text-xs font-bold text-[#0F524B]">
                      📅 {appt.dateTimeLabel}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-[#14171A]">
                      {appt.doctorName} — {appt.specialty}
                    </h3>
                    <p className="text-sm font-medium text-[#57606A]">
                      📍 {appt.clinicName} ({appt.clinicAddress})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakAloud(
                        `Upcoming doctor visit with ${appt.doctorName}, ${appt.specialty}, on ${appt.dateTimeLabel} at ${appt.clinicName}. ${appt.notes}`,
                        autonomy.language,
                        onToast
                      )
                    }
                    className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    🔊 Read Visit Details
                  </button>
                </div>

                <div className="mt-4 rounded-xl bg-[#F6F5F1] p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    Simple Things to Remember Before Going:
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {appt.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => onToggleChecklist(appt.id, item.id)}
                          className="h-5 w-5 accent-[#0F524B]"
                        />
                        <span className={item.done ? 'line-through text-[#57606A]' : ''}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Ask a Question for the Doctor */}
          <section className="hc-card rounded-2xl border border-black/12 bg-white p-6">
            <h3 className="text-lg font-bold text-[#14171A]">
              Have a Question for Your Doctor?
            </h3>
            <p className="text-xs text-[#57606A]">
              Write it here so {caretakerName.split(' ')[0]} and{' '}
              {familyName.split(' ')[0]} include it on your clinic sheet.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={doctorQuestionInput}
                onChange={(e) => setDoctorQuestionInput(e.target.value)}
                placeholder="e.g., Can I reduce my evening blood pressure pill?"
                className="flex-1 rounded-xl border border-black/15 px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!doctorQuestionInput.trim()) return;
                  onAddDoctorQuestion(doctorQuestionInput.trim());
                  setDoctorQuestionInput('');
                }}
                className="rounded-xl bg-[#0F524B] px-6 py-3 text-sm font-bold text-white"
              >
                Save Question for Doctor
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          SCREEN 3: MY PRIVACY & HELP ("MY CARE, MY CHOICE")
          ========================================================= */}
      {subScreen === 'privacy' && (
        <div className="space-y-6">
          {/* Emergency SOS & Medical ID */}
          <section className="rounded-2xl border-2 border-red-300 bg-red-50/70 p-6">
            <h3 className="text-xl font-bold text-red-950">
              Need Immediate Help or Feeling Unwell?
            </h3>
            <p className="mt-1 text-sm text-red-900">
              Pressing the red button immediately emails and alerts{' '}
              <strong>{caretakerName}</strong> and <strong>{familyName}</strong> ({emergencyPhone}).
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onTriggerSos}
                className="rounded-2xl bg-red-700 px-6 py-4 text-base font-extrabold text-white shadow-md hover:bg-red-800"
              >
                {t.sosBtn}
              </button>
              <button
                type="button"
                onClick={onOpenMedicalId}
                className="rounded-2xl border border-red-300 bg-white px-5 py-4 text-sm font-bold text-red-900"
              >
                🪪 Show My Emergency Medical ID Card
              </button>
            </div>
          </section>

          {/* Simple Yes/No Elder Autonomy Switches */}
          <section className="hc-card rounded-2xl border border-black/12 bg-white p-6 space-y-5">
            <div>
              <span className="rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold uppercase text-[#0F524B]">
                My Care, My Choice
              </span>
              <h3 className="mt-1.5 text-xl font-bold text-[#14171A]">
                Your Personal Comfort &amp; Privacy Settings
              </h3>
              <p className="text-xs text-[#57606A]">
                You are always in charge of your health information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F6F5F1] p-4">
                <label className="block text-sm font-bold text-[#14171A]">
                  1. My Preferred Language &amp; Voice
                </label>
                <select
                  value={autonomy.language}
                  onChange={(e) =>
                    onUpdateAutonomy({
                      language: e.target.value as typeof autonomy.language,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm font-bold"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Telugu">తెలుగు (Telugu)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Spanish">Español (Spanish)</option>
                </select>
              </div>

              <div className="rounded-xl bg-[#F6F5F1] p-4">
                <label className="block text-sm font-bold text-[#14171A]">
                  2. How Long Before Alerting Family If I’m Late Taking a Pill?
                </label>
                <select
                  value={autonomy.graceMinutes}
                  onChange={(e) =>
                    onUpdateAutonomy({
                      graceMinutes: Number(e.target.value) as 15 | 30 | 60,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm font-bold"
                >
                  <option value={15}>Give me 15 minutes first</option>
                  <option value={30}>Give me 30 minutes first</option>
                  <option value={60}>Give me 1 full hour first</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                <div>
                  <div className="text-sm font-bold text-[#14171A]">
                    3. Allow Family Members to Change My Medicine Times?
                  </div>
                  <div className="text-xs text-[#57606A]">
                    When OFF, only you and Nurse {caretakerName.split(' ')[0]} can change
                    schedules. Family can still view and order refills.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomy.allowFamilyEdits}
                  onChange={(e) =>
                    onUpdateAutonomy({ allowFamilyEdits: e.target.checked })
                  }
                  className="h-6 w-6 accent-[#0F524B]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                <div>
                  <div className="text-sm font-bold text-[#14171A]">
                    4. Share My Daily Blood Pressure &amp; Sugar Numbers with Family?
                  </div>
                  <div className="text-xs text-[#57606A]">
                    When OFF, family only sees “Readings Within Safe Range” instead of exact
                    numbers.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomy.shareVitals}
                  onChange={(e) => onUpdateAutonomy({ shareVitals: e.target.checked })}
                  className="h-6 w-6 accent-[#0F524B]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onToggleComfort}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  comfortMode
                    ? 'border-[#0F524B] bg-[#0F524B] text-white'
                    : 'border-black/15 bg-white text-[#14171A]'
                }`}
              >
                {comfortMode ? '✓ Extra-Large Text ON' : 'Aa Turn On Extra-Large Text'}
              </button>
              <button
                type="button"
                onClick={onToggleContrast}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  highContrast
                    ? 'border-black bg-black text-white'
                    : 'border-black/15 bg-white text-[#14171A]'
                }`}
              >
                {highContrast ? '✓ High Contrast ON' : '◐ Turn On High Contrast'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          MODAL 1: MEAL-FIRST SAFETY GUARD PROMPT
          ========================================================= */}
      {mealPromptMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold uppercase text-amber-950">
              🍽️ Gentle Food-First Safety Check
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#14171A]">
              Have you finished your {mealPromptMed.mealKey} yet?
            </h3>
            <p className="mt-1.5 text-sm text-[#57606A]">
              <strong>{mealPromptMed.med.name}</strong> is meant to be taken{' '}
              <strong>{mealPromptMed.med.mealTiming.toLowerCase()}</strong> so it does not
              upset your stomach.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onTakeMed(mealPromptMed.med.id, mealPromptMed.mealKey);
                  setMealPromptMed(null);
                }}
                className="w-full rounded-xl bg-[#0F524B] px-4 py-3 text-sm font-bold text-white"
              >
                ✓ Yes, I Had {mealPromptMed.mealKey} — Log My Pill Now
              </button>
              <button
                type="button"
                onClick={() => {
                  onSnoozeMed(mealPromptMed.med.id);
                  setMealPromptMed(null);
                }}
                className="w-full rounded-xl border border-black/15 bg-[#F6F5F1] px-4 py-3 text-sm font-bold text-[#14171A]"
              >
                ⏰ Not Yet — Remind Me in 15 Minutes After I Eat
              </button>
              <button
                type="button"
                onClick={() => setMealPromptMed(null)}
                className="w-full py-2 text-xs font-bold text-[#57606A]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: DOUBLE-DOSE GUARD + MISTAKEN TAP UNDO
          ========================================================= */}
      {doubleDoseMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold uppercase text-red-800">
              🛡️ Double-Dose Protection Guard
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#14171A]">
              Wait — {doubleDoseMed.name} Was Already Marked Taken!
            </h3>
            <p className="mt-1.5 text-sm text-[#57606A]">
              You already confirmed taking <strong>{doubleDoseMed.name}</strong> at{' '}
              <strong>{doubleDoseMed.takenAt || 'earlier today'}</strong>. Please do not
              take a second pill.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => setDoubleDoseMed(null)}
                className="w-full rounded-xl bg-[#0F524B] px-4 py-3 text-sm font-bold text-white"
              >
                ✓ Okay, Keep Safe (Do Not Take Another Pill)
              </button>
              <button
                type="button"
                onClick={() => {
                  onUndoMed(doubleDoseMed.id);
                  setDoubleDoseMed(null);
                }}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-800"
              >
                ↩ I Tapped by Mistake Earlier — Undo &amp; Restore 1 Pill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: SKIP REASON SELECTOR
          ========================================================= */}
      {skipModalMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#14171A]">
              Why are you skipping {skipModalMed.name}?
            </h3>
            <p className="mt-1 text-xs text-[#57606A]">
              We will let Nurse {caretakerName.split(' ')[0]} know so she can help.
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Felt slightly dizzy',
                'Waiting to eat meal first',
                'Out of tablets / needs refill',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    onSkipMed(skipModalMed.id, reason);
                    setSkipModalMed(null);
                  }}
                  className="w-full rounded-xl border border-black/15 bg-[#F6F5F1] px-4 py-3 text-left text-sm font-bold text-[#14171A] hover:bg-[#EFECE6]"
                >
                  {reason}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSkipModalMed(null)}
                className="w-full py-2 text-xs font-bold text-[#57606A]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
