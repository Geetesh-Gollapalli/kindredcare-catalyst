'use client';

import React from 'react';
import { PillBadgeSvg } from './KindredCareBrand';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="modal-print-container max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-black/15 bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <span className="inline-block rounded-md bg-[#0F524B]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
              Care Circle KC-2026 • Patient &amp; Care Team Dossier
            </span>
            <h2 id="profile-modal-title" className="mt-1 text-2xl font-bold text-[#14171A]">
              {elderName} ({elderAge} yrs • Blood Group {bloodGroup})
            </h2>
            <p className="text-xs text-[#57606A]">
              Complete health details, medication purposes, and live Caretaker &amp; Family
              progress tracking.
            </p>
          </div>
          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="rounded-xl border border-[#0F524B]/30 bg-[#0F524B]/5 px-3.5 py-2 text-xs font-bold text-[#0F524B] hover:bg-[#0F524B]/10"
            >
              📄 Upload PDF / Edit Health Profile
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border border-black/15 px-3.5 py-2 text-xs font-bold text-[#14171A] hover:bg-[#F6F5F1]"
            >
              🖨️ Print Dossier
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#14171A] px-3.5 py-2 text-xs font-bold text-white"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* 1. Elder Health & Daily Routine Summary */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-red-800">
              Critical Allergies &amp; Blood Group
            </div>
            <div className="mt-1 text-xl font-extrabold text-red-900">
              {bloodGroup} • {allergies.join(', ') || 'None'}
            </div>
            <div className="mt-1 text-xs text-red-800">
              Emergency Phone: <strong>{emergencyPhone}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
              Conditions &amp; Primary Doctor
            </div>
            <div className="mt-1 text-sm font-bold text-[#14171A]">
              {conditions.join(' • ')}
            </div>
            <div className="mt-1 text-xs text-[#57606A]">
              Physician: <strong>{primaryDoctor}</strong>
            </div>
            {mobilityNotes && (
              <div className="mt-1 text-[11px] text-[#57606A]">
                Comfort Note: {mobilityNotes}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
              Daily Routine &amp; Autonomy
            </div>
            <div className="mt-1 text-xs font-semibold text-[#14171A]">
              Wake {routine.wakeTime} • Bkfst {routine.breakfastTime} • Lunch{' '}
              {routine.lunchTime} • Dinner {routine.dinnerTime} • Bed {routine.bedTime}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-white px-2 py-0.5 font-semibold">
                Voice: {autonomy.language}
              </span>
              <span className="rounded bg-white px-2 py-0.5 font-semibold">
                Grace: {autonomy.graceMinutes}m
              </span>
              <span className="rounded bg-white px-2 py-0.5 font-semibold">
                Family Edit: {autonomy.allowFamilyEdits ? 'Allowed' : 'Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. WHO IS UPDATING & CHECKING DAILY PROGRESS (Elder + Caretaker + Family) */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#14171A]">
            Care Circle Team — Who Is Updating &amp; Checking Daily Progress
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {/* Elder Card */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#0F524B]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F524B]">
                  ELDER (CENTER OF CARE)
                </span>
                <span className="text-xs font-bold text-[#0E6B50]">● Active Today</span>
              </div>
              <h4 className="mt-2 text-base font-bold">{elderName}</h4>
              <p className="mt-1 text-xs text-[#57606A]">
                Self-logs daily pills, meals, water intake, and post-dose feelings.
              </p>
              <div className="mt-3 space-y-1 border-t border-black/10 pt-2.5 text-xs">
                <div>
                  <strong>Doses Confirmed:</strong> {takenCount} of {medications.length}
                </div>
                <div>
                  <strong>Self-Reported Feeling:</strong> {currentFeeling}
                </div>
                <div>
                  <strong>Hydration &amp; Meals:</strong> {hydrationGlasses}/8 glasses •{' '}
                  {[
                    meals.breakfast && 'Bkfst ✓',
                    meals.lunch && 'Lunch ✓',
                    meals.dinner && 'Dinner ✓',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'No meals checked yet'}
                </div>
              </div>
            </div>

            {/* Caretaker Card */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                  CARETAKER (UPDATING PROGRESS)
                </span>
                <span className="text-xs font-bold text-[#0E6B50]">● On Duty</span>
              </div>
              <h4 className="mt-2 text-base font-bold">{caretaker.name}</h4>
              <p className="mt-0.5 text-xs text-[#57606A]">{caretaker.shift}</p>
              <div className="mt-3 space-y-1 border-t border-black/10 pt-2.5 text-xs">
                <div>
                  <strong>Latest Vital Logged:</strong> {caretaker.lastVitalSummary}
                </div>
                <div>
                  <strong>Shift Handoff Note:</strong> “{caretaker.handoffNote}”
                </div>
                <div className="text-[#57606A]">Alert Email: {caretaker.email}</div>
              </div>
            </div>

            {/* Family Card */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[11px] font-bold text-sky-900">
                  FAMILY (CHECKING &amp; REFILLS)
                </span>
                <span className="text-xs font-bold text-[#0E6B50]">● Subscribed</span>
              </div>
              <h4 className="mt-2 text-base font-bold">{family.name}</h4>
              <p className="mt-0.5 text-xs text-[#57606A]">{family.relation}</p>
              <div className="mt-3 space-y-1 border-t border-black/10 pt-2.5 text-xs">
                <div>
                  <strong>Latest Family Support:</strong> “{family.lastNoteSummary}”
                </div>
                <div>
                  <strong>Permissions:</strong>{' '}
                  {autonomy.allowFamilyEdits
                    ? 'Full Schedule Edit + Refills'
                    : 'Monitoring, Refills & Care Notes'}
                </div>
                <div className="text-[#57606A]">Alert Email: {family.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPLETE MEDICATIONS & PURPOSE DIRECTORY */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#14171A]">
            Active Medications &amp; Why Each Medicine Is Taken ({medications.length})
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {medications.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-black/10 bg-[#F6F5F1] p-3.5"
              >
                <PillBadgeSvg
                  colorName={m.colorName}
                  shape={m.shape}
                  imprint={m.imprint}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#14171A]">{m.name}</span>
                    <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-[#0F524B]">
                      {m.time} • {m.scheduleType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[#57606A]">
                    {m.genericName} • {m.dosage} • Stock: <strong>{m.stock} left</strong>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs">
                    <strong className="text-[#0F524B]">Purpose:</strong> {m.purpose}
                    <div className="mt-0.5 text-[11px] text-[#57606A]">
                      Rule: {m.mealTiming}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. CHRONOLOGICAL CARE TEAM ACTIVITY LOG */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#14171A]">
            Recent Updates &amp; Daily Progress Checks Across Care Circle
          </h3>
          <div className="mt-2.5 space-y-2">
            {auditLog.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs"
              >
                <div>
                  <span className="font-bold text-[#0F524B]">{a.actor}:</span>{' '}
                  <span className="text-[#14171A]">{a.note}</span>
                </div>
                <span className="rounded bg-[#F6F5F1] px-2 py-0.5 font-semibold text-[#57606A]">
                  {a.when}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
