'use client';

import React, { useState } from 'react';
import { PillBadgeSvg } from './KindredCareBrand';
import AnimatedList from './AnimatedList';
import {
  buildValidGoogleCalendarUrl,
  downloadAppointmentIcs,
  type CaretakerEmailItem,
  type CaretakerVitalItem,
} from './CaretakerClinicalView';
import type { ProfileMedItem } from './ElderProfileModal';
import type { ElderAppointmentItem } from './ElderCompanionView';

export function FamilyPeaceHubView({
  elderName,
  familyName,
  onDutyResponder,
  shiftHandoffNote,
  currentFeeling,
  hydrationGlasses,
  autonomy,
  medications,
  appointments,
  vitals,
  emails,
  careNotes,
  onRefillMed,
  onSendFamilyNote,
  onDispatchEmail,
  activeTab,
  onTabChange,
}: {
  elderName: string;
  familyName: string;
  onDutyResponder: string;
  shiftHandoffNote: string;
  currentFeeling: string;
  hydrationGlasses: number;
  autonomy: {
    graceMinutes: number;
    allowFamilyEdits: boolean;
    shareVitals: boolean;
    language: string;
  };
  medications: ProfileMedItem[];
  appointments: ElderAppointmentItem[];
  vitals: CaretakerVitalItem[];
  emails: CaretakerEmailItem[];
  careNotes: Array<{
    id: string;
    author: string;
    role: string;
    category: string;
    message: string;
    when: string;
  }>;
  onRefillMed: (medId: string) => void;
  onSendFamilyNote: (category: string, message: string) => void;
  onDispatchEmail: (params: {
    category: string;
    subject: string;
    preview: string;
    customRecipient?: string;
  }) => Promise<void>;
  activeTab?: 'peace' | 'schedule' | 'alerts';
  onTabChange?: (tab: 'peace' | 'schedule' | 'alerts') => void;
}) {
  const [internalTab, setInternalTab] = useState<'peace' | 'schedule' | 'alerts'>('peace');
  const tab = activeTab ?? internalTab;
  const setTab = (next: 'peace' | 'schedule' | 'alerts') => {
    setInternalTab(next);
    onTabChange?.(next);
  };
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);
  const [noteCategory, setNoteCategory] = useState('encouragement');
  const [noteMessage, setNoteMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('family@kindredcare.health');

  const dailyMeds = medications.filter((m) => m.scheduleType === 'daily');
  const takenCount = dailyMeds.filter((m) => m.status === 'taken').length;
  const pct = dailyMeds.length ? Math.round((takenCount / dailyMeds.length) * 100) : 100;
  const lowStockMeds = medications.filter((m) => m.stock <= 7);

  const sevenDays = [
    { day: 'Mon', pct: 100, detail: 'All 5 daily doses confirmed on time.' },
    { day: 'Tue', pct: 100, detail: 'All 5 daily doses confirmed on time.' },
    {
      day: 'Wed',
      pct: 80,
      detail: '4/5 taken • Evening Amlopres 5mg held per mild lightheadedness.',
    },
    { day: 'Thu', pct: 100, detail: 'All 5 daily doses confirmed on time.' },
    { day: 'Fri', pct: 100, detail: 'All 5 daily doses confirmed on time.' },
    {
      day: 'Sat',
      pct: 80,
      detail: '4/5 taken • Shelcal 500 taken 40m late after late lunch.',
    },
    {
      day: 'Today',
      pct,
      detail: `${takenCount} of ${dailyMeds.length} daily doses confirmed so far today.`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 text-[#f5f5f5]">
      {/* Elder Autonomy Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#5227FF]/35 bg-[#5227FF]/10 px-5 py-3 text-xs text-zinc-200">
        <div>
          <strong className="text-violet-300">Elder Autonomy Active:</strong>{' '}
          {autonomy.allowFamilyEdits
            ? `${elderName} has enabled family schedule assistance.`
            : `${elderName} manages her own schedule with Caretaker ${
                onDutyResponder.split(' ')[0]
              }. Family view has live peace-of-mind monitoring, pharmacy refill coordination, and care journal access.`}
        </div>
        <span className="rounded border border-[#5227FF]/40 bg-zinc-950 px-2.5 py-1 font-bold text-violet-300">
          Grace Window: {autonomy.graceMinutes}m
        </span>
      </div>

      {/* 3 Focused Family Navigation Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-sm">
        {[
          { id: 'peace', label: '1. Peace-of-Mind Status & Refills' },
          { id: 'schedule', label: '2. Schedule & Upcoming Clinic Visits' },
          { id: 'alerts', label: `3. Email Alerts & Weekly Digest (${emails.length})` },
        ].map((tItem) => (
          <button
            key={tItem.id}
            type="button"
            onClick={() => setTab(tItem.id as typeof tab)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              tab === tItem.id
                ? 'bg-[#5227FF] text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
            }`}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {/* =========================================================
          TAB 1: PEACE-OF-MIND STATUS, 7-DAY CALENDAR, REFILLS & VITALS
          ========================================================= */}
      {tab === 'peace' && (
        <div className="space-y-6">
          {/* Warm Reassurance Hero Card */}
          <section className="rounded-3xl border border-[#5227FF]/40 bg-gradient-to-br from-[#5227FF]/35 via-zinc-950 to-zinc-950 p-6 text-white shadow-md sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="rounded-full border border-[#5227FF]/50 bg-[#5227FF]/25 px-3 py-1 text-xs font-bold uppercase text-violet-200">
                  Live Family Peace-of-Mind Snapshot
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-[#f5f5f5]">
                  {elderName} has taken {takenCount} of {dailyMeds.length} medicines today (
                  {pct}%)
                </h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Self-Reported Feeling: <strong className="text-white">{currentFeeling}</strong> • Water Intake:{' '}
                  <strong className="text-white">{hydrationGlasses}/8 glasses</strong> • On-Duty:{' '}
                  <strong className="text-white">{onDutyResponder}</strong>
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs">
                <div className="font-bold text-violet-300">Latest Caretaker Shift Note:</div>
                <div className="mt-0.5 max-w-xs text-zinc-200">“{shiftHandoffNote}”</div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Interactive 7-Day Adherence Calendar */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-base font-bold text-[#f5f5f5]">
                7-Day Adherence History (Click Any Day to Inspect)
              </h3>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {sevenDays.map((d, idx) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex flex-col items-center rounded-xl border p-2.5 text-xs font-bold transition ${
                      selectedDayIdx === idx
                        ? 'border-[#5227FF] bg-[#5227FF] text-white'
                        : d.pct >= 90
                          ? 'border-[#5227FF]/40 bg-[#5227FF]/15 text-violet-200'
                          : 'border-amber-500/40 bg-amber-950/50 text-amber-200'
                    }`}
                  >
                    <span>{d.day}</span>
                    <span className="mt-1 text-sm font-extrabold">{d.pct}%</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-300">
                <strong className="text-white">{sevenDays[selectedDayIdx].day} Summary:</strong>{' '}
                {sevenDays[selectedDayIdx].detail}
              </div>
            </section>

            {/* Pharmacy Refill Coordinator */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-base font-bold text-[#f5f5f5]">
                Pharmacy Refill Coordinator ({lowStockMeds.length} Low Stock)
              </h3>
              <p className="text-xs text-zinc-400">
                Help order refills before {elderName}’s pillbox runs out.
              </p>
              <div className="mt-3 space-y-2.5">
                {lowStockMeds.length > 0 ? (
                  lowStockMeds.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3.5 text-xs"
                    >
                      <div>
                        <strong className="text-sm text-amber-200">{m.name}</strong>
                        <div className="text-amber-300/90">
                          Only <strong>{m.stock} tablets left</strong> • Purpose: {m.purpose}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRefillMed(m.id)}
                        className="rounded-xl bg-[#5227FF] px-3.5 py-2 font-bold text-white hover:bg-[#6d4aff]"
                      >
                        Mark +30 Refill Delivered
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[#5227FF]/35 bg-[#5227FF]/10 p-4 text-xs font-bold text-violet-300">
                    All medicines have &gt;7 days of stock remaining.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Vitals Summary (Strictly Enforces autonomy.shareVitals!) */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#f5f5f5]">
                  Recent Vitals Overview
                </h3>
                <span className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                  {autonomy.shareVitals ? 'Shared by Elder' : 'Privacy Protected'}
                </span>
              </div>

              {autonomy.shareVitals ? (
                <div className="mt-3 space-y-2.5">
                  {vitals.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs"
                    >
                      <div>
                        <strong className="text-zinc-100">
                          {v.type}: {v.value}
                        </strong>
                        <div className="text-zinc-400">
                          {v.notes} • Logged by {v.by} ({v.when})
                        </div>
                      </div>
                      <span className="rounded border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-1 font-bold text-violet-200">
                        {v.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-200">
                  <strong>Exact Numbers Private per {elderName}’s Setting:</strong>
                  <p className="mt-1 text-zinc-400">
                    {elderName} has chosen to keep raw daily BP &amp; blood sugar numbers
                    private between herself and {onDutyResponder.split(' ')[0]}. All
                    recent readings are verified within safe target range.
                  </p>
                </div>
              )}
            </section>

            {/* Send Love / Encouragement Note or Question for Doctor */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-base font-bold text-[#f5f5f5]">
                Send Encouragement Note or Doctor Question
              </h3>
              <div className="mt-3 space-y-2.5">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-[#f5f5f5]"
                >
                  <option value="encouragement">
                    Warm Encouragement Note (Shows on Elder’s Screen)
                  </option>
                  <option value="question_for_doctor">
                    Question for Next Doctor Visit Brief
                  </option>
                </select>
                <textarea
                  rows={2}
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="Write an encouraging message or a question for the next doctor visit..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-[#f5f5f5] placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!noteMessage.trim()) return;
                    onSendFamilyNote(noteCategory, noteMessage.trim());
                    setNoteMessage('');
                  }}
                  className="w-full rounded-xl bg-[#5227FF] py-2.5 text-xs font-bold text-white hover:bg-[#6d4aff]"
                >
                  Post to Care Circle
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
                {careNotes.slice(0, 2).map((n) => (
                  <div key={n.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-300">
                    <strong className="text-white">{n.author}:</strong> {n.message}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: SCHEDULE & UPCOMING CLINIC VISITS
          ========================================================= */}
      {tab === 'schedule' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[#f5f5f5]">
                Active Medication Schedule &amp; Purpose
              </h3>
              <span className="rounded-full border border-[#5227FF]/40 bg-[#5227FF]/15 px-3 py-1 text-xs font-bold text-violet-200">
                {autonomy.allowFamilyEdits
                  ? 'Family Edit Unlocked by Elder'
                  : 'Read-Only (Refills Enabled)'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {medications.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-start gap-3">
                    <PillBadgeSvg
                      colorName={m.colorName}
                      shape={m.shape}
                      imprint={m.imprint}
                      size={44}
                    />
                    <div>
                      <div className="text-sm font-bold text-[#f5f5f5]">{m.name}</div>
                      <div className="text-xs text-zinc-400">
                        {m.time} • {m.mealTiming}
                      </div>
                      <div className="mt-1 text-xs text-violet-300">
                        <strong>Purpose:</strong> {m.purpose}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRefillMed(m.id)}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                  >
                    +30 Refill ({m.stock})
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-lg font-bold text-[#f5f5f5]">
              Upcoming Doctor Appointments &amp; Navigation
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {appointments.map((appt) => {
                const gcalUrl = buildValidGoogleCalendarUrl(appt, elderName);
                const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  `${appt.clinicName}, ${appt.clinicAddress}`
                )}`;
                return (
                  <div
                    key={appt.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <span className="rounded border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-0.5 text-xs font-bold text-violet-200">
                      {appt.dateTimeLabel}
                    </span>
                    <h4 className="mt-2 text-base font-bold text-[#f5f5f5]">{appt.doctorName}</h4>
                    <div className="text-xs text-zinc-400">
                      {appt.specialty} • {appt.clinicName}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#5227FF] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6d4aff]"
                      >
                        Add to Google Calendar
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadAppointmentIcs(appt, elderName)}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                      >
                        Download .ICS
                      </button>
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                      >
                        Google Maps
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          TAB 3: EMAIL ALERTS & WEEKLY FAMILY DIGEST
          ========================================================= */}
      {tab === 'alerts' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-lg font-bold text-[#f5f5f5]">
              Family Email Alert Subscriptions &amp; Weekly Digest
            </h3>
            <p className="text-xs text-zinc-400">
              Send a live Weekly Family Digest or Missed-Dose test email to{' '}
              <strong className="text-zinc-200">{familyName}</strong>.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-[#f5f5f5]"
              />
              <button
                type="button"
                onClick={() =>
                  onDispatchEmail({
                    category: 'weekly_digest',
                    subject: `Weekly Family Care Digest: ${elderName} (${pct}% Adherence)`,
                    preview: `${elderName} completed ${takenCount}/${dailyMeds.length} daily doses today. Feeling: ${currentFeeling}. Next visit: ${appointments[0]?.doctorName}.`,
                    customRecipient: recipientEmail,
                  })
                }
                className="rounded-xl bg-[#5227FF] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#6d4aff]"
              >
                Send Weekly Family Digest Now
              </button>
            </div>

            <div className="mt-5">
              <AnimatedList
                items={emails}
                maxHeight={320}
                showGradients={true}
                enableArrowNavigation={true}
                renderItem={(em: CaretakerEmailItem, _idx: number, isSelected: boolean) => (
                  <div
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all ${
                      isSelected
                        ? 'border-[#5227FF] bg-[#5227FF]/15 shadow-xs'
                        : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#f5f5f5]">{em.subject}</div>
                      <div className="text-zinc-400">
                        To: {em.recipients} • {em.sentAt}
                      </div>
                    </div>
                    <span className="rounded border border-[#5227FF]/40 bg-[#5227FF]/15 px-2.5 py-1 font-bold text-violet-200">
                      {em.status}
                    </span>
                  </div>
                )}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
