'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FileUploadIcon, PrinterIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { PillBadgeSvg } from './KindredCareBrand';
import HoldButton from './HoldButton';
import AnimatedList from './AnimatedList';
import type { PillShape } from '@/types/domain';

export interface ProfileMedItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  purpose: string;
  scheduleType: 'daily' | 'weekly' | 'prn';
  time: string;
  mealTiming: string;
  colorName: string;
  shape: PillShape;
  imprint: string;
  stock: number;
  status: 'taken' | 'pending' | 'skipped' | 'snoozed';
  takenAt?: string | null;
}

export interface ProfileAuditEntry {
  id: string;
  when: string;
  actor: string;
  role: string;
  note: string;
}

export function ElderProfileModal({
  open,
  onClose,
  onOpenOnboarding,
  onDeleteProfile,
  elderName,
  elderAge,
  bloodGroup,
  allergies,
  conditions,
  mobilityNotes,
  primaryDoctor,
  emergencyPhone,
  routine,
  caretaker,
  family,
  autonomy,
  currentFeeling,
  hydrationGlasses,
  meals,
  medications,
  auditLog,
}: {
  open: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
  onDeleteProfile?: () => void;
  elderName: string;
  elderAge: number;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  mobilityNotes: string;
  primaryDoctor: string;
  emergencyPhone: string;
  routine: {
    wakeTime: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    bedTime: string;
  };
  caretaker: {
    name: string;
    shift: string;
    email: string;
    handoffNote: string;
    lastVitalSummary: string;
  };
  family: {
    name: string;
    relation: string;
    email: string;
    lastNoteSummary: string;
  };
  autonomy: {
    graceMinutes: number;
    allowFamilyEdits: boolean;
    shareVitals: boolean;
    language: string;
  };
  currentFeeling: string;
  hydrationGlasses: number;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  medications: ProfileMedItem[];
  auditLog: ProfileAuditEntry[];
}) {
  if (!open) return null;

  const takenCount = medications.filter((m) => m.status === 'taken').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="modal-print-container max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <span className="inline-block rounded-md border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-violet-300">
              Care Circle • Patient &amp; Care Team Dossier
            </span>
            <h2 id="profile-modal-title" className="mt-1 text-2xl font-bold text-[#f5f5f5]">
              {elderName} ({elderAge} yrs • Blood Group {bloodGroup})
            </h2>
            <p className="text-xs text-zinc-400">
              Complete health details, medication purposes, and live Caretaker &amp; Family
              progress tracking.
            </p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/15 px-3.5 py-2 text-xs font-bold text-violet-200 hover:bg-[#5227FF]/25"
            >
              <HugeiconsIcon icon={FileUploadIcon} size={14} strokeWidth={1.8} />
              Upload PDF / Edit Profile
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-[#f5f5f5] hover:bg-zinc-800"
            >
              <HugeiconsIcon icon={PrinterIcon} size={14} strokeWidth={1.8} />
              Print Dossier
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-700"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
              Close
            </button>
          </div>
        </div>

        {/* 1. Elder Health & Daily Routine Summary */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-red-300">
              Critical Allergies &amp; Blood Group
            </div>
            <div className="mt-1 text-xl font-extrabold text-red-100">
              {bloodGroup} • {allergies.join(', ') || 'None'}
            </div>
            <div className="mt-1 text-xs text-red-200">
              Emergency Phone: <strong>{emergencyPhone}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Conditions &amp; Primary Doctor
            </div>
            <div className="mt-1 text-sm font-bold text-[#f5f5f5]">
              {conditions.join(' • ')}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Physician: <strong className="text-zinc-200">{primaryDoctor}</strong>
            </div>
            {mobilityNotes && (
              <div className="mt-1 text-[11px] text-zinc-400">
                Comfort Note: {mobilityNotes}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Daily Routine &amp; Autonomy
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-200">
              Wake {routine.wakeTime} • Bkfst {routine.breakfastTime} • Lunch{' '}
              {routine.lunchTime} • Dinner {routine.dinnerTime} • Bed {routine.bedTime}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-200">
              <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-semibold">
                Voice: {autonomy.language}
              </span>
              <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-semibold">
                Grace: {autonomy.graceMinutes}m
              </span>
              <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-semibold">
                Family Edit: {autonomy.allowFamilyEdits ? 'Allowed' : 'Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. WHO IS UPDATING & CHECKING DAILY PROGRESS (Elder + Caretaker + Family) */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#f5f5f5]">
            Care Circle Team — Daily Progress Tracking
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {/* Elder Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded border border-[#5227FF]/40 bg-[#5227FF]/15 px-2 py-0.5 text-[11px] font-bold text-violet-300">
                  ELDER (CENTER OF CARE)
                </span>
                <span className="text-xs font-bold text-violet-300">Active Today</span>
              </div>
              <h4 className="mt-2 text-base font-bold text-[#f5f5f5]">{elderName}</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Self-logs daily pills, meals, water intake, and post-dose feelings.
              </p>
              <div className="mt-3 space-y-1 border-t border-zinc-800 pt-2.5 text-xs text-zinc-300">
                <div>
                  <strong className="text-white">Doses Confirmed:</strong> {takenCount} of{' '}
                  {medications.length}
                </div>
                <div>
                  <strong className="text-white">Self-Reported Feeling:</strong> {currentFeeling}
                </div>
                <div>
                  <strong className="text-white">Hydration &amp; Meals:</strong> {hydrationGlasses}
                  /8 glasses •{' '}
                  {[
                    meals.breakfast && 'Bkfst Done',
                    meals.lunch && 'Lunch Done',
                    meals.dinner && 'Dinner Done',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'No meals checked yet'}
                </div>
              </div>
            </div>

            {/* Caretaker Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                  CARETAKER (CLINICAL LOGS)
                </span>
                <span className="text-xs font-bold text-amber-200">On Duty</span>
              </div>
              <h4 className="mt-2 text-base font-bold text-[#f5f5f5]">{caretaker.name}</h4>
              <p className="mt-0.5 text-xs text-zinc-400">{caretaker.shift}</p>
              <div className="mt-3 space-y-1 border-t border-zinc-800 pt-2.5 text-xs text-zinc-300">
                <div>
                  <strong className="text-white">Latest Vital Logged:</strong>{' '}
                  {caretaker.lastVitalSummary}
                </div>
                <div>
                  <strong className="text-white">Shift Handoff Note:</strong> “
                  {caretaker.handoffNote}”
                </div>
                <div className="text-zinc-400">Alert Email: {caretaker.email}</div>
              </div>
            </div>

            {/* Family Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded border border-sky-500/40 bg-sky-950/50 px-2 py-0.5 text-[11px] font-bold text-sky-200">
                  FAMILY (REFILLS &amp; MONITOR)
                </span>
                <span className="text-xs font-bold text-sky-200">Subscribed</span>
              </div>
              <h4 className="mt-2 text-base font-bold text-[#f5f5f5]">{family.name}</h4>
              <p className="mt-0.5 text-xs text-zinc-400">{family.relation}</p>
              <div className="mt-3 space-y-1 border-t border-zinc-800 pt-2.5 text-xs text-zinc-300">
                <div>
                  <strong className="text-white">Latest Family Support:</strong> “
                  {family.lastNoteSummary}”
                </div>
                <div>
                  <strong className="text-white">Permissions:</strong>{' '}
                  {autonomy.allowFamilyEdits
                    ? 'Full Schedule Edit + Refills'
                    : 'Monitoring, Refills & Care Notes'}
                </div>
                <div className="text-zinc-400">Alert Email: {family.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPLETE MEDICATIONS & PURPOSE DIRECTORY */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#f5f5f5]">
            Active Medications &amp; Clinical Purpose ({medications.length})
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {medications.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
              >
                <PillBadgeSvg
                  colorName={m.colorName}
                  shape={m.shape}
                  imprint={m.imprint}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#f5f5f5]">{m.name}</span>
                    <span className="rounded border border-[#5227FF]/40 bg-[#5227FF]/15 px-2 py-0.5 text-[11px] font-bold text-violet-200">
                      {m.time} • {m.scheduleType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {m.genericName} • {m.dosage} • Stock: <strong className="text-zinc-200">{m.stock} left</strong>
                  </div>
                  <div className="mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300">
                    <strong className="text-violet-300">Purpose:</strong> {m.purpose}
                    <div className="mt-0.5 text-[11px] text-zinc-400">
                      Rule: {m.mealTiming}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. CHRONOLOGICAL CARE TEAM ACTIVITY LOG (React Bits AnimatedList) */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#f5f5f5]">
            Recent Updates &amp; Daily Progress Checks Across Care Circle
          </h3>
          <div className="mt-2.5">
            <AnimatedList
              items={auditLog}
              maxHeight={260}
              showGradients={true}
              enableArrowNavigation={true}
              displayScrollbar={true}
              renderItem={(a: ProfileAuditEntry, _idx: number, isSelected: boolean) => (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition-all ${
                    isSelected
                      ? 'border-[#5227FF] bg-[#5227FF]/15 shadow-xs'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <div>
                    <span className="font-bold text-violet-300">{a.actor}:</span>{' '}
                    <span className="text-[#f5f5f5]">{a.note}</span>
                  </div>
                  <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-semibold text-zinc-400">
                    {a.when}
                  </span>
                </div>
              )}
            />
          </div>
        </div>

        {/* 5. PROFILE DELETE / CARE CIRCLE RESET (React Bits HoldButton) */}
        <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/40 bg-red-950/30 p-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-300">
              Danger Zone • Delete Profile &amp; Reset Care Circle
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Press and hold for 2 seconds to permanently delete this profile and restart first-time setup.
            </p>
          </div>
          <HoldButton
            doneLabel="Deleted"
            backgroundColor="#27272a"
            fillColor="#5227FF"
            textColor="#f5f5f5"
            fillTextColor="#ffffff"
            size="md"
            radius={14}
            fillDirection="right"
            holdTime={2000}
            releaseTime={200}
            pressScale={0.97}
            wave
            waveAmplitude={6}
            glow
            resetAfter={1200}
            onHold={() => {
              onDeleteProfile?.();
            }}
          >
            Hold to delete
          </HoldButton>
        </div>
      </div>
    </div>
  );
}
