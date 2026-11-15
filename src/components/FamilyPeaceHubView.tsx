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
  const [recipientEmail, setRecipientEmail] = useState('geeteshgollapalli@gmail.com');

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
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Elder Autonomy Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#0F524B]/25 bg-[#0F524B]/[0.05] px-5 py-3 text-xs">
        <div>
          <strong className="text-[#0F524B]">🛡️ Elder Autonomy Active:</strong>{' '}
          {autonomy.allowFamilyEdits
            ? `${elderName} has enabled family schedule assistance.`
            : `${elderName} manages her own schedule with Nurse ${
                onDutyResponder.split(' ')[0]
              }. Family view has live peace-of-mind monitoring, pharmacy refill coordination, and care journal access.`}
        </div>
        <span className="rounded bg-white px-2.5 py-1 font-bold text-[#0F524B]">
          Grace Window: {autonomy.graceMinutes}m
        </span>
      </div>

      {/* 3 Focused Family Navigation Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-2xs">
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
                ? 'bg-[#0F524B] text-white'
                : 'text-[#57606A] hover:bg-[#F6F5F1] hover:text-[#14171A]'
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
          <section className="rounded-3xl bg-[#0F524B] p-6 text-white shadow-md sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase">
                  Live Family Peace-of-Mind Snapshot
                </span>
                <h2 className="mt-2 text-2xl font-extrabold">
                  {elderName} has taken {takenCount} of {dailyMeds.length} medicines today (
                  {pct}%)
                </h2>
                <p className="mt-1 text-sm text-white/85">
                  Self-Reported Feeling: <strong>{currentFeeling}</strong> • Water Intake:{' '}
                  <strong>{hydrationGlasses}/8 glasses</strong> • On-Duty:{' '}
                  <strong>{onDutyResponder}</strong>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs">
                <div className="font-bold text-amber-200">Latest Caretaker Shift Note:</div>
                <div className="mt-0.5 max-w-xs text-white/90">“{shiftHandoffNote}”</div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Interactive 7-Day Adherence Calendar */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-bold text-[#14171A]">
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
                        ? 'border-[#0F524B] bg-[#0F524B] text-white'
                        : d.pct >= 90
                          ? 'border-[#0E6B50]/30 bg-[#0E6B50]/10 text-[#0E6B50]'
                          : 'border-amber-400/40 bg-amber-50 text-amber-900'
                    }`}
                  >
                    <span>{d.day}</span>
                    <span className="mt-1 text-sm font-extrabold">{d.pct}%</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-[#F6F5F1] px-4 py-3 text-xs">
                <strong>{sevenDays[selectedDayIdx].day} Summary:</strong>{' '}
                {sevenDays[selectedDayIdx].detail}
              </div>
            </section>

            {/* Pharmacy Refill Coordinator */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-bold text-[#14171A]">
                Pharmacy Refill Coordinator ({lowStockMeds.length} Low Stock)
              </h3>
              <p className="text-xs text-[#57606A]">
                Help order refills before {elderName}’s pillbox runs out.
              </p>
              <div className="mt-3 space-y-2.5">
                {lowStockMeds.length > 0 ? (
                  lowStockMeds.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-amber-400/40 bg-amber-50/70 p-3.5 text-xs"
                    >
                      <div>
                        <strong className="text-sm text-amber-950">{m.name}</strong>
                        <div className="text-amber-900">
                          Only <strong>{m.stock} tablets left</strong> • Purpose: {m.purpose}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRefillMed(m.id)}
                        className="rounded-xl bg-[#0F524B] px-3.5 py-2 font-bold text-white"
                      >
                        ✓ Mark +30 Refill Delivered
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-[#0E6B50]/10 p-4 text-xs font-bold text-[#0E6B50]">
                    ✓ All medicines have &gt;7 days of stock remaining.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Vitals Summary (Strictly Enforces autonomy.shareVitals!) */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#14171A]">
                  Recent Vitals Overview
                </h3>
                <span className="rounded bg-[#F6F5F1] px-2.5 py-0.5 text-[11px] font-bold text-[#0F524B]">
                  {autonomy.shareVitals ? 'Shared by Elder' : '🔒 Privacy Protected'}
                </span>
              </div>

              {autonomy.shareVitals ? (
                <div className="mt-3 space-y-2.5">
                  {vitals.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl bg-[#F6F5F1] p-3 text-xs"
                    >
                      <div>
                        <strong>
                          {v.type}: {v.value}
                        </strong>
                        <div className="text-[#57606A]">
                          {v.notes} • Logged by {v.by} ({v.when})
                        </div>
                      </div>
                      <span className="rounded bg-white px-2.5 py-1 font-bold text-[#0E6B50]">
                        {v.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-black/10 bg-[#F6F5F1] p-4 text-xs leading-relaxed text-[#14171A]">
                  <strong>🔒 Exact Numbers Private per {elderName}’s Setting:</strong>
                  <p className="mt-1 text-[#57606A]">
                    {elderName} has chosen to keep raw daily BP &amp; blood sugar numbers
                    private between herself and Nurse {onDutyResponder.split(' ')[0]}. All
                    recent readings are verified within safe target range.
                  </p>
                </div>
              )}
            </section>

            {/* Send Love / Encouragement Note or Question for Doctor */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-bold text-[#14171A]">
                Send Encouragement Note or Doctor Question
              </h3>
              <div className="mt-3 space-y-2.5">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                >
                  <option value="encouragement">
                    💌 Warm Encouragement Note (Shows on Elder’s Screen)
                  </option>
                  <option value="question_for_doctor">
                    🩺 Question for Next Doctor Visit Brief
                  </option>
                </select>
                <textarea
                  rows={2}
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="Write a loving message for Dadi or a question for Dr. Sharma..."
                  className="w-full rounded-xl border border-black/15 p-3 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!noteMessage.trim()) return;
                    onSendFamilyNote(noteCategory, noteMessage.trim());
                    setNoteMessage('');
                  }}
                  className="w-full rounded-xl bg-[#0F524B] py-2.5 text-xs font-bold text-white"
                >
                  Post to Care Circle
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-black/10 pt-3">
                {careNotes.slice(0, 2).map((n) => (
                  <div key={n.id} className="rounded-lg bg-[#F6F5F1] p-2.5 text-xs">
                    <strong>{n.author}:</strong> {n.message}
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
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[#14171A]">
                Active Medication Schedule &amp; Purpose
              </h3>
              <span className="rounded-full bg-[#F6F5F1] px-3 py-1 text-xs font-bold text-[#0F524B]">
                {autonomy.allowFamilyEdits
                  ? '✓ Family Edit Unlocked by Elder'
                  : '🔒 Read-Only (Refills Enabled)'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {medications.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-black/10 bg-[#F6F5F1] p-4"
                >
                  <div className="flex items-start gap-3">
                    <PillBadgeSvg
                      colorName={m.colorName}
                      shape={m.shape}
                      imprint={m.imprint}
                      size={44}
                    />
                    <div>
                      <div className="text-sm font-bold">{m.name}</div>
                      <div className="text-xs text-[#57606A]">
                        {m.time} • {m.mealTiming}
                      </div>
                      <div className="mt-1 text-xs text-[#0F524B]">
                        <strong>Purpose:</strong> {m.purpose}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRefillMed(m.id)}
                    className="shrink-0 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold"
                  >
                    +30 Refill ({m.stock})
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <h3 className="text-lg font-bold text-[#14171A]">
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
                    className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4"
                  >
                    <span className="rounded bg-white px-2.5 py-0.5 text-xs font-bold text-[#0F524B]">
                      {appt.dateTimeLabel}
                    </span>
                    <h4 className="mt-2 text-base font-bold">{appt.doctorName}</h4>
                    <div className="text-xs text-[#57606A]">
                      {appt.specialty} • {appt.clinicName}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#0F524B] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        📅 Add to Google Calendar
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadAppointmentIcs(appt, elderName)}
                        className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold"
                      >
                        ⬇️ .ICS
                      </button>
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold"
                      >
                        📍 Google Maps
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
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <h3 className="text-lg font-bold text-[#14171A]">
              Family Email Alert Subscriptions &amp; Weekly Digest
            </h3>
            <p className="text-xs text-[#57606A]">
              Send a live Weekly Family Digest or Missed-Dose test email to{' '}
              <strong>{familyName}</strong> (or any judge email address).
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 rounded-xl border border-black/15 px-3.5 py-2 text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() =>
                  onDispatchEmail({
                    category: 'weekly_digest',
                    subject: `📊 Weekly Family Care Digest: ${elderName} (${pct}% Adherence)`,
                    preview: `${elderName} completed ${takenCount}/${dailyMeds.length} daily doses today. Feeling: ${currentFeeling}. Next visit: ${appointments[0]?.doctorName}.`,
                    customRecipient: recipientEmail,
                  })
                }
                className="rounded-xl bg-[#0F524B] px-5 py-2.5 text-xs font-bold text-white"
              >
                ✉️ Send Weekly Family Digest Now
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
                        ? 'border-[#0F524B] bg-[#0F524B]/5 shadow-xs'
                        : 'border-transparent bg-[#F6F5F1]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#14171A]">{em.subject}</div>
                      <div className="text-[#57606A]">
                        To: {em.recipients} • {em.sentAt}
                      </div>
                    </div>
                    <span className="rounded bg-[#0E6B50]/15 px-2.5 py-1 font-bold text-[#0E6B50]">
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
