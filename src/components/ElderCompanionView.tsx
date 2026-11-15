'use client';

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlarmClockIcon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  MedicalFileIcon,
  SecurityCheckIcon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons';
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
  activeTab,
  onTabChange,
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
  activeTab?: 'meds' | 'visits' | 'privacy';
  onTabChange?: (tab: 'meds' | 'visits' | 'privacy') => void;
}) {
  const [internalSubScreen, setInternalSubScreen] = useState<'meds' | 'visits' | 'privacy'>('meds');
  const subScreen = activeTab ?? internalSubScreen;
  const setSubScreen = (next: 'meds' | 'visits' | 'privacy') => {
    setInternalSubScreen(next);
    onTabChange?.(next);
  };
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
    <div className="mx-auto max-w-4xl space-y-6 pb-16 text-[#f5f5f5]">
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
                ? 'border-[#5227FF] bg-[#5227FF] text-white shadow-md'
                : 'border-zinc-800 bg-zinc-950 text-[#f5f5f5] hover:bg-zinc-900'
            }`}
          >
            <span className="text-lg font-bold leading-snug">{tab.label}</span>
            <span
              className={`mt-0.5 text-xs font-medium ${
                subScreen === tab.id ? 'text-white/85' : 'text-zinc-400'
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
        <section className="hc-card rounded-2xl border border-[#5227FF]/35 bg-zinc-950 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-md border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold text-violet-300">
                Easy 3-Step Guide for {elderName}
              </span>
              <h2 className="mt-1.5 text-xl font-bold text-[#f5f5f5]">{t.greeting}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  speakAloud(
                    `${t.greeting}. Step 1: Tap the primary button after taking your medicine. Step 2: Tap Read Aloud anytime you want me to speak your medicine instructions. Step 3: Tap Privacy and Help if you feel unwell.`,
                    autonomy.language,
                    onToast
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5227FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6d4aff]"
              >
                <HugeiconsIcon icon={VolumeHighIcon} size={14} strokeWidth={1.8} />
                Read Guide Aloud
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Hide Guide
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-sm text-zinc-300">
              <strong className="text-violet-300">1. Mark Your Pill:</strong> Tap the large{' '}
              <strong className="text-white">“I Took This Pill”</strong> button after swallowing
              your medicine.
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-sm text-zinc-300">
              <strong className="text-violet-300">2. Listen by Voice:</strong> Tap{' '}
              <strong className="text-white">“Read Aloud to Me”</strong> on any card to hear what
              the pill is for.
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-sm text-zinc-300">
              <strong className="text-violet-300">3. Always in Control:</strong> Caretaker{' '}
              <strong className="text-white">{caretakerName.split(' ')[0]}</strong> and{' '}
              <strong className="text-white">{familyName.split(' ')[0]}</strong> are connected if
              you need help.
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/50 px-5 py-4 text-amber-100">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <HugeiconsIcon icon={AlarmClockIcon} size={14} strokeWidth={1.8} />
                  Empty-Stomach Thyroid Absorption Timer Active
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
              >
                <HugeiconsIcon icon={VolumeHighIcon} size={14} strokeWidth={1.8} />
                Speak Timer
              </button>
            </div>
          )}

          {/* GIANT NEXT MEDICINE CARD */}
          {nextMed ? (
            <section className="rounded-3xl border border-[#5227FF]/50 bg-gradient-to-br from-[#5227FF]/35 via-zinc-950 to-zinc-950 p-6 text-white shadow-lg sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-amber-400 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-black">
                    {t.nextDoseHeadline} • Scheduled at {nextMed.time}
                  </span>
                  <h2 className="text-2xl font-extrabold sm:text-3xl">
                    {nextMed.name} ({nextMed.dosage})
                  </h2>
                  <p className="text-base font-medium text-zinc-200">
                    <strong>Why you take this:</strong> {nextMed.purpose}
                  </p>
                  <p className="inline-block rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm font-bold text-amber-300">
                    How to take: {nextMed.mealTiming} ({nextMed.colorName}{' '}
                    {nextMed.shape} pill • Imprint {nextMed.imprint})
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-2 shadow-md">
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5227FF] px-5 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-[#6d4aff]"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-base font-bold text-white transition hover:bg-zinc-800"
                >
                  <HugeiconsIcon icon={VolumeHighIcon} size={18} strokeWidth={1.8} />
                  {t.readAloudBtn}
                </button>
                <button
                  type="button"
                  onClick={() => onSnoozeMed(nextMed.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-base font-bold text-zinc-200 transition hover:bg-zinc-900"
                >
                  <HugeiconsIcon icon={AlarmClockIcon} size={18} strokeWidth={1.8} />
                  {t.snoozeBtn}
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-[#5227FF]/45 bg-gradient-to-br from-[#5227FF]/30 via-zinc-950 to-zinc-950 p-6 text-white shadow-md sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5227FF]/50 bg-[#5227FF]/25 px-3 py-1 text-xs font-bold uppercase text-violet-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} />
                All Daily Medicines Complete
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#f5f5f5]">{t.allCaughtUp}</h2>
            </section>
          )}

          {/* 3-TAP DAILY MEALS, WATER & FEELING BAR */}
          <section className="hc-card rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xs">
            <h3 className="text-base font-bold text-[#f5f5f5]">
              Quick Daily Check-In (Tap to Update)
            </h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              {/* Meals */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
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
                          ? 'bg-[#5227FF] text-white shadow-xs'
                          : 'border border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {meals[mealKey] ? 'Done: ' : 'Pending: '}
                      {mealKey.charAt(0).toUpperCase() + mealKey.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    2. Water Intake
                  </span>
                  <span className="text-xs font-extrabold text-[#f5f5f5]">
                    {hydrationGlasses} of 8 glasses
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetHydration(Math.min(8, hydrationGlasses + 1))}
                    className="flex-1 rounded-xl bg-[#5227FF] px-3 py-2 text-xs font-bold text-white hover:bg-[#6d4aff]"
                  >
                    +1 Glass of Water
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetHydration(Math.max(0, hydrationGlasses - 1))}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                    aria-label="Decrease water glasses"
                  >
                    -
                  </button>
                </div>
              </div>

              {/* How I Feel */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
                  3. How Do You Feel Right Now?
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Feeling Good', val: 'Feeling Good' },
                    { label: 'Slightly Dizzy', val: 'Slightly Dizzy' },
                    { label: 'Stomach Upset', val: 'Mild Nausea' },
                    { label: 'Very Tired', val: 'Very Tired' },
                  ].map((f) => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => onSelectFeeling(f.val)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        currentFeeling === f.val
                          ? 'bg-[#5227FF] text-white'
                          : 'border border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
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
            <div className="rounded-2xl border border-[#5227FF]/35 bg-[#5227FF]/10 px-5 py-3.5 text-sm text-zinc-200">
              <strong className="text-violet-300">Note from Family:</strong> “
              {familyEncouragementNote}”
            </div>
          )}

          {/* TODAY'S SCHEDULED DAILY MEDICINES LIST */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#f5f5f5]">
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
                        ? 'border-[#5227FF]/50 bg-[#5227FF]/10'
                        : 'border-zinc-800 bg-zinc-950 shadow-xs'
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
                            <h4 className="text-lg font-bold text-[#f5f5f5]">{m.name}</h4>
                            <div className="text-xs font-semibold text-zinc-400">
                              {m.dosage} • {m.colorName} {m.shape} ({m.imprint})
                            </div>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isTaken
                              ? 'bg-[#5227FF] text-white'
                              : m.status === 'skipped'
                                ? 'bg-amber-500 text-black'
                                : m.status === 'snoozed'
                                  ? 'bg-sky-500 text-black'
                                  : 'bg-zinc-800 text-zinc-200'
                          }`}
                        >
                          {isTaken
                            ? `Taken (${m.takenAt || 'Today'})`
                            : m.status === 'skipped'
                              ? 'Skipped'
                              : m.status === 'snoozed'
                                ? 'Snoozed 15m'
                                : `Due ${m.time}`}
                        </span>
                      </div>

                      <div className="mt-3.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-sm">
                        <div className="font-bold text-violet-300">
                          Why you take this: {m.purpose}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-zinc-300">
                          When: {m.mealTiming}
                        </div>
                      </div>

                      {isLow && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/50 px-3.5 py-2 text-xs font-bold text-amber-200">
                          <span>Only {m.stock} pills left in box</span>
                          <button
                            type="button"
                            onClick={() => onAskRefill(m.id)}
                            className="rounded-lg bg-amber-500 px-3 py-1 text-black hover:bg-amber-400"
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
                          className="flex-1 rounded-xl border border-[#5227FF]/40 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-violet-200 hover:bg-zinc-800"
                        >
                          Already Taken • Tap if Mistake
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleElderTapTake(m)}
                            className="flex-1 rounded-xl bg-[#5227FF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6d4aff]"
                          >
                            I Took This Pill
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkipModalMed(m)}
                            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
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
                        className="inline-flex items-center gap-1 rounded-xl border border-[#5227FF]/35 bg-[#5227FF]/15 px-3.5 py-2.5 text-xs font-bold text-violet-200 hover:bg-[#5227FF]/25"
                      >
                        <HugeiconsIcon icon={VolumeHighIcon} size={14} strokeWidth={1.8} />
                        Read
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* SEPARATE DRAWER FOR WEEKLY (SUNDAY) & AS-NEEDED (PRN) MEDICINES */}
          {specialMeds.length > 0 && (
            <section className="hc-card rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#f5f5f5]">
                    Weekly &amp; As-Needed Medicines (Not Every Day)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Kept separate so you never mix them up with your daily pills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeeklyPrnDrawer(!showWeeklyPrnDrawer)}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                >
                  {showWeeklyPrnDrawer ? 'Hide Weekly / As-Needed' : 'Show Weekly & Acidity Pills'}
                </button>
              </div>

              {showWeeklyPrnDrawer && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {specialMeds.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <PillBadgeSvg
                          colorName={m.colorName}
                          shape={m.shape}
                          imprint={m.imprint}
                          size={44}
                        />
                        <div>
                          <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                            {m.scheduleType === 'weekly'
                              ? 'Sundays Only'
                              : 'Only If Needed (Max 1/day)'}
                          </span>
                          <h4 className="mt-0.5 text-sm font-bold text-[#f5f5f5]">{m.name}</h4>
                          <div className="text-xs text-zinc-400">{m.purpose}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onTakeMed(m.id)}
                          disabled={m.status === 'taken'}
                          className="flex-1 rounded-lg bg-[#5227FF] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {m.status === 'taken' ? 'Taken Today' : 'Log Dose Now'}
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
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-200"
                        >
                          <HugeiconsIcon icon={VolumeHighIcon} size={13} strokeWidth={1.8} />
                          Read
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
                className="hc-card rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5227FF]/40 bg-[#5227FF]/15 px-3 py-1 text-xs font-bold text-violet-200">
                      <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={1.8} />
                      {appt.dateTimeLabel}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-[#f5f5f5]">
                      {appt.doctorName} — {appt.specialty}
                    </h3>
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                      <HugeiconsIcon icon={Location01Icon} size={14} strokeWidth={1.8} />
                      {appt.clinicName} ({appt.clinicAddress})
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5227FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6d4aff]"
                  >
                    <HugeiconsIcon icon={VolumeHighIcon} size={14} strokeWidth={1.8} />
                    Read Visit Details
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Simple Things to Remember Before Going:
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {appt.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-zinc-200"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => onToggleChecklist(appt.id, item.id)}
                          className="h-5 w-5 accent-[#5227FF]"
                        />
                        <span className={item.done ? 'line-through text-zinc-500' : ''}>
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
          <section className="hc-card rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-lg font-bold text-[#f5f5f5]">
              Have a Question for Your Doctor?
            </h3>
            <p className="text-xs text-zinc-400">
              Write it here so {caretakerName.split(' ')[0]} and{' '}
              {familyName.split(' ')[0]} include it on your clinic sheet.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={doctorQuestionInput}
                onChange={(e) => setDoctorQuestionInput(e.target.value)}
                placeholder="e.g., Can I reduce my evening blood pressure pill?"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-[#f5f5f5] placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!doctorQuestionInput.trim()) return;
                  onAddDoctorQuestion(doctorQuestionInput.trim());
                  setDoctorQuestionInput('');
                }}
                className="rounded-xl bg-[#5227FF] px-6 py-3 text-sm font-bold text-white hover:bg-[#6d4aff]"
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
          <section className="rounded-2xl border border-red-500/40 bg-red-950/35 p-6">
            <h3 className="text-xl font-bold text-red-100">
              Need Immediate Help or Feeling Unwell?
            </h3>
            <p className="mt-1 text-sm text-red-200">
              Pressing the red button immediately emails and alerts{' '}
              <strong>{caretakerName}</strong> and <strong>{familyName}</strong> ({emergencyPhone}).
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onTriggerSos}
                className="rounded-2xl bg-red-600 px-6 py-4 text-base font-extrabold text-white shadow-md hover:bg-red-500"
              >
                {t.sosBtn}
              </button>
              <button
                type="button"
                onClick={onOpenMedicalId}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-400/40 bg-zinc-950 px-5 py-4 text-sm font-bold text-red-200 hover:bg-zinc-900"
              >
                <HugeiconsIcon icon={MedicalFileIcon} size={16} strokeWidth={1.8} />
                Show My Emergency Medical ID Card
              </button>
            </div>
          </section>

          {/* Simple Yes/No Elder Autonomy Switches */}
          <section className="hc-card space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div>
              <span className="rounded-md border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold uppercase text-violet-300">
                My Care, My Choice
              </span>
              <h3 className="mt-1.5 text-xl font-bold text-[#f5f5f5]">
                Your Personal Comfort &amp; Privacy Settings
              </h3>
              <p className="text-xs text-zinc-400">
                You are always in charge of your health information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <label className="block text-sm font-bold text-[#f5f5f5]">
                  1. My Preferred Language &amp; Voice
                </label>
                <select
                  value={autonomy.language}
                  onChange={(e) =>
                    onUpdateAutonomy({
                      language: e.target.value as typeof autonomy.language,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-bold text-[#f5f5f5]"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Telugu">తెలుగు (Telugu)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Spanish">Español (Spanish)</option>
                </select>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <label className="block text-sm font-bold text-[#f5f5f5]">
                  2. How Long Before Alerting Family If I’m Late Taking a Pill?
                </label>
                <select
                  value={autonomy.graceMinutes}
                  onChange={(e) =>
                    onUpdateAutonomy({
                      graceMinutes: Number(e.target.value) as 15 | 30 | 60,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-bold text-[#f5f5f5]"
                >
                  <option value={15}>Give me 15 minutes first</option>
                  <option value={30}>Give me 30 minutes first</option>
                  <option value={60}>Give me 1 full hour first</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div>
                  <div className="text-sm font-bold text-[#f5f5f5]">
                    3. Allow Family Members to Change My Medicine Times?
                  </div>
                  <div className="text-xs text-zinc-400">
                    When OFF, only you and {caretakerName.split(' ')[0]} can change
                    schedules. Family can still view and order refills.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomy.allowFamilyEdits}
                  onChange={(e) =>
                    onUpdateAutonomy({ allowFamilyEdits: e.target.checked })
                  }
                  className="h-6 w-6 accent-[#5227FF]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div>
                  <div className="text-sm font-bold text-[#f5f5f5]">
                    4. Share My Daily Blood Pressure &amp; Sugar Numbers with Family?
                  </div>
                  <div className="text-xs text-zinc-400">
                    When OFF, family only sees “Readings Within Safe Range” instead of exact
                    numbers.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomy.shareVitals}
                  onChange={(e) => onUpdateAutonomy({ shareVitals: e.target.checked })}
                  className="h-6 w-6 accent-[#5227FF]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onToggleComfort}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  comfortMode
                    ? 'border-[#5227FF] bg-[#5227FF] text-white'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {comfortMode ? 'Extra-Large Text ON' : 'Aa Turn On Extra-Large Text'}
              </button>
              <button
                type="button"
                onClick={onToggleContrast}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                  highContrast
                    ? 'border-white bg-white text-black'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {highContrast ? 'High Contrast ON' : 'Turn On High Contrast'}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl">
            <span className="rounded-md border border-amber-500/40 bg-amber-950/60 px-2.5 py-1 text-xs font-bold uppercase text-amber-200">
              Gentle Food-First Safety Check
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#f5f5f5]">
              Have you finished your {mealPromptMed.mealKey} yet?
            </h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              <strong className="text-zinc-200">{mealPromptMed.med.name}</strong> is meant to be
              taken <strong className="text-zinc-200">{mealPromptMed.med.mealTiming.toLowerCase()}</strong> so
              it does not upset your stomach.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onTakeMed(mealPromptMed.med.id, mealPromptMed.mealKey);
                  setMealPromptMed(null);
                }}
                className="w-full rounded-xl bg-[#5227FF] px-4 py-3 text-sm font-bold text-white hover:bg-[#6d4aff]"
              >
                Yes, I Had {mealPromptMed.mealKey} — Log My Pill Now
              </button>
              <button
                type="button"
                onClick={() => {
                  onSnoozeMed(mealPromptMed.med.id);
                  setMealPromptMed(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
              >
                Not Yet — Remind Me in 15 Minutes After I Eat
              </button>
              <button
                type="button"
                onClick={() => setMealPromptMed(null)}
                className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-950/60 px-2.5 py-1 text-xs font-bold uppercase text-red-200">
              <HugeiconsIcon icon={SecurityCheckIcon} size={14} strokeWidth={1.8} />
              Double-Dose Protection Guard
            </span>
            <h3 className="mt-2 text-xl font-bold text-[#f5f5f5]">
              Wait — {doubleDoseMed.name} Was Already Marked Taken!
            </h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              You already confirmed taking <strong className="text-zinc-200">{doubleDoseMed.name}</strong> at{' '}
              <strong className="text-zinc-200">{doubleDoseMed.takenAt || 'earlier today'}</strong>. Please do not
              take a second pill.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => setDoubleDoseMed(null)}
                className="w-full rounded-xl bg-[#5227FF] px-4 py-3 text-sm font-bold text-white hover:bg-[#6d4aff]"
              >
                Okay, Keep Safe (Do Not Take Another Pill)
              </button>
              <button
                type="button"
                onClick={() => {
                  onUndoMed(doubleDoseMed.id);
                  setDoubleDoseMed(null);
                }}
                className="w-full rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-200 hover:bg-red-950/60"
              >
                I Tapped by Mistake Earlier — Undo &amp; Restore 1 Pill
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl">
            <h3 className="text-xl font-bold text-[#f5f5f5]">
              Why are you skipping {skipModalMed.name}?
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              We will let {caretakerName.split(' ')[0]} know so they can assist.
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm font-bold text-[#f5f5f5] hover:bg-zinc-800"
                >
                  {reason}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSkipModalMed(null)}
                className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200"
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
