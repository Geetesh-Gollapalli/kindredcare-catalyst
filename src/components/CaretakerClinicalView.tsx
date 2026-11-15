'use client';

import React, { useState } from 'react';
import { PillBadgeSvg } from './KindredCareBrand';
import AnimatedList from './AnimatedList';
import type { ProfileAuditEntry, ProfileMedItem } from './ElderProfileModal';
import type { ElderAppointmentItem } from './ElderCompanionView';
import type { DrugSafetyReport, PillShape } from '@/types/domain';

export interface CaretakerVitalItem {
  id: string;
  type: string;
  value: string;
  status: 'normal' | 'elevated' | 'attention';
  notes: string;
  when: string;
  by: string;
}

export interface CaretakerEmailItem {
  id: string;
  category: string;
  subject: string;
  recipients: string;
  preview: string;
  sentAt: string;
  status: string;
  previewUrl?: string;
}

export function buildValidGoogleCalendarUrl(appt: ElderAppointmentItem, elderName: string) {
  const start = new Date(appt.isoStart || Date.now() + 86400000);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const dates = `${fmt(start)}/${fmt(end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${elderName}: ${appt.doctorName} (${appt.specialty})`
  )}&dates=${dates}&location=${encodeURIComponent(
    `${appt.clinicName}, ${appt.clinicAddress}`
  )}&details=${encodeURIComponent(appt.notes)}`;
}

export function downloadAppointmentIcs(appt: ElderAppointmentItem, elderName: string) {
  const start = new Date(appt.isoStart || Date.now() + 86400000);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KindredCare AI//Care Circle KC-2026//EN',
    'BEGIN:VEVENT',
    `UID:${appt.id}@kindredcare.health`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${elderName} — ${appt.doctorName} (${appt.specialty})`,
    `LOCATION:${appt.clinicName}, ${appt.clinicAddress}`,
    `DESCRIPTION:${appt.notes.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${appt.doctorName.replace(/\s+/g, '_')}_Visit.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CaretakerClinicalView({
  elderName,
  elderAge,
  bloodGroup,
  allergies,
  currentFeeling,
  onDutyResponder,
  shiftHandoffNote,
  lastHandoffAt,
  graceMinutes,
  medications,
  appointments,
  vitals,
  emails,
  auditLog,
  drugSafetyReport,
  aiDoctorBrief,
  onTakeMed,
  onUndoMed,
  onAddOrEditMed,
  onRefillMed,
  onDeleteMed,
  onRunDrugSafetyAi,
  onSaveShiftHandoff,
  onAddVital,
  onAddAppointment,
  onToggleChecklist,
  onSavePostVisitOutcome,
  onRefreshAiDoctorBrief,
  onDispatchEmail,
  onRunAutoScanEmails,
  onOpenFridgeSheet,
  onToast,
  activeTab,
  onTabChange,
}: {
  elderName: string;
  elderAge: number;
  bloodGroup: string;
  allergies: string[];
  currentFeeling: string;
  onDutyResponder: string;
  shiftHandoffNote: string;
  lastHandoffAt: string;
  graceMinutes: number;
  medications: ProfileMedItem[];
  appointments: ElderAppointmentItem[];
  vitals: CaretakerVitalItem[];
  emails: CaretakerEmailItem[];
  auditLog: ProfileAuditEntry[];
  drugSafetyReport: DrugSafetyReport | null;
  aiDoctorBrief: {
    providerUsed: string;
    adherenceSummary: string;
    vitalsHighlights: string[];
    suggestedQuestionsForDoctor: string[];
  } | null;
  onTakeMed: (medId: string) => void;
  onUndoMed: (medId: string) => void;
  onAddOrEditMed: (med: ProfileMedItem, isEdit: boolean) => void;
  onRefillMed: (medId: string) => void;
  onDeleteMed: (medId: string) => void;
  onRunDrugSafetyAi: () => Promise<void>;
  onSaveShiftHandoff: (responder: string, note: string) => void;
  onAddVital: (type: string, value: string, notes: string) => void;
  onAddAppointment: (appt: Omit<ElderAppointmentItem, 'id'>) => void;
  onToggleChecklist: (apptId: string, checkId: string) => void;
  onSavePostVisitOutcome: (apptId: string, outcomeText: string) => void;
  onRefreshAiDoctorBrief: () => Promise<void>;
  onDispatchEmail: (params: {
    category: string;
    subject: string;
    preview: string;
    customRecipient?: string;
  }) => Promise<void>;
  onRunAutoScanEmails: (customRecipient?: string) => Promise<void>;
  onOpenFridgeSheet: () => void;
  onToast: (msg: string) => void;
  activeTab?: 'shift' | 'meds' | 'appts' | 'emails';
  onTabChange?: (tab: 'shift' | 'meds' | 'appts' | 'emails') => void;
}) {
  const [internalTab, setInternalTab] = useState<'shift' | 'meds' | 'appts' | 'emails'>('shift');
  const tab = activeTab ?? internalTab;
  const setTab = (next: 'shift' | 'meds' | 'appts' | 'emails') => {
    setInternalTab(next);
    onTabChange?.(next);
  };
  const [medFilter, setMedFilter] = useState<'all' | 'daily' | 'weekly' | 'prn' | 'low'>('all');

  // Shift Handoff State
  const [responderInput, setResponderInput] = useState(onDutyResponder);
  const [handoffInput, setHandoffInput] = useState(shiftHandoffNote);

  // Vitals Form State
  const [vitalType, setVitalType] = useState('Blood Pressure');
  const [vitalVal, setVitalVal] = useState('');
  const [vitalNotes, setVitalNotes] = useState('');

  // Add/Edit Medication Modal State
  const [editingMed, setEditingMed] = useState<{
    med: ProfileMedItem;
    isEdit: boolean;
  } | null>(null);
  const [askingAiPurpose, setAskingAiPurpose] = useState(false);

  // AI Rx Scanner Modal State
  const [showRxScanner, setShowRxScanner] = useState(false);
  const [rxInputText, setRxInputText] = useState(
    'Tab. Ecosprin 75mg (Gastro-Resistant Aspirin) — 1 tablet daily at 2:00 PM after lunch for cardioprotection'
  );
  const [rxScanning, setRxScanning] = useState(false);
  const [rxExtractedDraft, setRxExtractedDraft] = useState<{
    providerUsed: string;
    safetyNote: string;
    med: ProfileMedItem;
  } | null>(null);

  // Appointment & Outcome Modals
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [newApptDoc, setNewApptDoc] = useState('');
  const [newApptSpec, setNewApptSpec] = useState('');
  const [newApptClinic, setNewApptClinic] = useState('');
  const [newApptDt, setNewApptDt] = useState('Next Tuesday • 11:00 AM');
  const [newApptPrep, setNewApptPrep] = useState('Carry latest lab reports & pillbox');
  const [outcomeModalAppt, setOutcomeModalAppt] = useState<ElderAppointmentItem | null>(null);
  const [outcomeInput, setOutcomeInput] = useState(
    'Continued current regimen; recheck evening BP in 14 days.'
  );

  // Email Preview & Recipient
  const [customRecipient, setCustomRecipient] = useState('geeteshgollapalli@gmail.com');
  const [previewEmail, setPreviewEmail] = useState<CaretakerEmailItem | null>(null);
  const [runningSafetyAi, setRunningSafetyAi] = useState(false);
  const [runningBriefAi, setRunningBriefAi] = useState(false);

  const dailyMeds = medications.filter((m) => m.scheduleType === 'daily');
  const takenCount = dailyMeds.filter((m) => m.status === 'taken').length;
  const pct = dailyMeds.length ? Math.round((takenCount / dailyMeds.length) * 100) : 100;
  const lowStockMeds = medications.filter((m) => m.stock <= 7);

  const filteredMeds = medications.filter((m) => {
    if (medFilter === 'low') return m.stock <= 7;
    if (medFilter !== 'all') return m.scheduleType === medFilter;
    return true;
  });

  async function handleRunRxScan() {
    if (!rxInputText.trim()) return;
    setRxScanning(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_prescription',
          prescriptionText: rxInputText,
        }),
      });
      const data = await res.json();
      const first = data?.scanned?.medications?.[0];
      if (first) {
        setRxExtractedDraft({
          providerUsed: data.scanned.providerUsed || 'Google Gemma 4 (Adaption Labs)',
          safetyNote: data.scanned.safetyNote || 'Verified geriatric dosing & meal rule.',
          med: {
            id: `med-${Date.now()}`,
            name: first.name,
            genericName: first.genericName || first.name,
            dosage: first.dosage,
            purpose: first.purpose,
            scheduleType: 'daily',
            time: first.scheduledTime || '14:00',
            mealTiming:
              first.mealTiming === 'empty_stomach'
                ? 'Empty stomach, 45m before food'
                : 'After lunch (with food)',
            colorName: 'Pale Yellow',
            shape: 'round',
            imprint: first.name.slice(0, 4).toUpperCase(),
            stock: 30,
            status: 'pending',
          },
        });
      }
    } finally {
      setRxScanning(false);
    }
  }

  async function askAiPurposeForModal() {
    if (!editingMed?.med.name.trim()) return;
    setAskingAiPurpose(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_purpose',
          medicationName: editingMed.med.name,
          dosage: editingMed.med.dosage,
        }),
      });
      const data = await res.json();
      if (data?.purpose) {
        setEditingMed((prev) =>
          prev
            ? {
                ...prev,
                med: {
                  ...prev.med,
                  purpose: data.purpose,
                  genericName: data.genericName || prev.med.genericName,
                  mealTiming: data.mealTiming || prev.med.mealTiming,
                },
              }
            : null
        );
        onToast(`✨ AI filled purpose for ${editingMed.med.name}`);
      }
    } finally {
      setAskingAiPurpose(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* =========================================================
          4 FOCUSED CLINICAL TABS FOR CARETAKER
          ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-2 shadow-2xs">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'shift', label: '1. Shift & Daily Administration' },
            { id: 'meds', label: `2. Medications & AI Safety (${medications.length})` },
            { id: 'appts', label: `3. Appointments & AI Brief (${appointments.length})` },
            { id: 'emails', label: `4. Proactive Email Engine (${emails.length})` },
          ].map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id as typeof tab)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                tab === tItem.id
                  ? 'bg-[#0F524B] text-white shadow-xs'
                  : 'text-[#57606A] hover:bg-[#F6F5F1] hover:text-[#14171A]'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenFridgeSheet}
          className="rounded-xl border border-black/15 bg-[#F6F5F1] px-3.5 py-2 text-xs font-bold text-[#14171A]"
        >
          🖨️ Printable Fridge Sheet
        </button>
      </div>

      {/* =========================================================
          TAB 1: SHIFT & DAILY ADMINISTRATION
          ========================================================= */}
      {tab === 'shift' && (
        <div className="space-y-6">
          {/* Active Symptom-to-Medication Clinical Correlation Banner */}
          {currentFeeling !== 'Feeling Good' && (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded bg-red-700 px-2.5 py-0.5 text-xs font-bold uppercase text-white">
                    🩺 Active Symptom-to-Drug Clinical Correlation
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-red-950">
                    {elderName} reported “{currentFeeling}” today
                  </h3>
                  <p className="mt-0.5 text-xs text-red-900">
                    {currentFeeling === 'Slightly Dizzy'
                      ? 'Correlation Alert: Review evening Amlopres 5 (Amlodipine 5mg) — known to cause postural blood pressure drops in patients >70 yrs. Check sitting & standing BP before administering evening dose.'
                      : 'Correlation Alert: Review morning Glycomet SR 500 (Metformin) & meal timing — verify full meal intake and hydration.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVitalType('Blood Pressure');
                    setVitalVal('114/72 mmHg');
                    setVitalNotes(`Checked after "${currentFeeling}" report`);
                    onToast('Pre-filled BP check in Vitals Logger below.');
                  }}
                  className="rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white"
                >
                  + Log Immediate BP Check
                </button>
              </div>
            </div>
          )}

          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#57606A]">Today’s Adherence</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0F524B]">{pct}%</div>
              <div className="text-xs text-[#57606A]">
                {takenCount} of {dailyMeds.length} daily doses confirmed
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#57606A]">Low Refill Alerts</div>
              <div className="mt-1 text-2xl font-extrabold text-amber-700">
                {lowStockMeds.length}
              </div>
              <div className="text-xs text-[#57606A]">
                {lowStockMeds.map((m) => m.name).join(', ') || 'All stocked'}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#57606A]">Patient Feeling</div>
              <div className="mt-1 text-lg font-extrabold text-[#14171A]">
                {currentFeeling}
              </div>
              <div className="text-xs text-[#57606A]">Grace window: {graceMinutes}m</div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#57606A]">On-Duty Responder</div>
              <div className="mt-1 text-base font-extrabold text-[#14171A]">
                {onDutyResponder.split(' (')[0]}
              </div>
              <div className="text-xs text-[#57606A]">Updated: {lastHandoffAt}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 cols: Live Today's Dose Administration Table */}
            <div className="lg:col-span-2 rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-bold text-[#14171A]">
                Today’s Medication Administration &amp; Stock Control
              </h3>
              <div className="mt-4 space-y-2.5">
                {medications.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#F6F5F1] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <PillBadgeSvg
                        colorName={m.colorName}
                        shape={m.shape}
                        imprint={m.imprint}
                        size={42}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#14171A]">{m.name}</span>
                          <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold">
                            {m.time}
                          </span>
                          {m.stock <= 7 && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
                              LOW: {m.stock} LEFT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#57606A]">
                          {m.purpose} • <strong>{m.mealTiming}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status === 'taken' ? (
                        <>
                          <span className="rounded-lg bg-[#0E6B50]/15 px-2.5 py-1 text-xs font-bold text-[#0E6B50]">
                            ✓ Taken ({m.takenAt})
                          </span>
                          <button
                            type="button"
                            onClick={() => onUndoMed(m.id)}
                            className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-[#57606A]"
                          >
                            Undo
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTakeMed(m.id)}
                          className="rounded-lg bg-[#0F524B] px-3.5 py-1.5 text-xs font-bold text-white"
                        >
                          ✓ Confirm Dose
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRefillMed(m.id)}
                        className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold text-[#14171A]"
                      >
                        +30 Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Shift Handoff + Vitals Logger */}
            <div className="space-y-6">
              {/* Shift Handoff */}
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <h3 className="text-base font-bold text-[#14171A]">
                  Caretaker Shift Handoff
                </h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      On-Duty Responder
                    </label>
                    <select
                      value={responderInput}
                      onChange={(e) => setResponderInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                    >
                      <option value="Ananya Rao (Primary Caretaker)">
                        Ananya Rao (Primary Caretaker)
                      </option>
                      <option value="Geetesh Gollapalli (Family Evening Shift)">
                        Geetesh Gollapalli (Family Evening Shift)
                      </option>
                      <option value="Nurse Priya (Night Relief)">
                        Nurse Priya (Night Relief)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      Clinical Shift Note
                    </label>
                    <textarea
                      rows={2}
                      value={handoffInput}
                      onChange={(e) => setHandoffInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveShiftHandoff(responderInput, handoffInput)}
                    className="w-full rounded-xl bg-[#0F524B] py-2.5 text-xs font-bold text-white"
                  >
                    Save Timestamped Shift Handoff
                  </button>
                </div>
              </div>

              {/* Log Vital Reading */}
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <h3 className="text-base font-bold text-[#14171A]">
                  Log Clinical Vital Reading
                </h3>
                <div className="mt-3 space-y-2.5">
                  <select
                    value={vitalType}
                    onChange={(e) => setVitalType(e.target.value)}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                  >
                    <option value="Blood Pressure">Blood Pressure (mmHg)</option>
                    <option value="Blood Glucose">Blood Glucose (mg/dL)</option>
                    <option value="Heart Rate">Heart Rate (bpm)</option>
                    <option value="SpO2 Oxygen">SpO2 Oxygen (%)</option>
                  </select>
                  <input
                    type="text"
                    value={vitalVal}
                    onChange={(e) => setVitalVal(e.target.value)}
                    placeholder="e.g., 124/78 mmHg or 112 mg/dL"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={vitalNotes}
                    onChange={(e) => setVitalNotes(e.target.value)}
                    placeholder="Context (e.g., Fasting / After walk)"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!vitalVal.trim()) return;
                      onAddVital(vitalType, vitalVal.trim(), vitalNotes.trim());
                      setVitalVal('');
                      setVitalNotes('');
                    }}
                    className="w-full rounded-xl bg-[#14171A] py-2.5 text-xs font-bold text-white"
                  >
                    + Save Vital Reading
                  </button>
                </div>

                <div className="mt-4 space-y-2 border-t border-black/10 pt-3">
                  {vitals.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg bg-[#F6F5F1] px-3 py-2 text-xs"
                    >
                      <div>
                        <strong>
                          {v.type}: {v.value}
                        </strong>
                        <div className="text-[11px] text-[#57606A]">{v.notes}</div>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          v.status === 'attention'
                            ? 'bg-red-100 text-red-800'
                            : v.status === 'elevated'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-[#0E6B50]/15 text-[#0E6B50]'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: MEDICATIONS, EDIT CRUD, AI RX SCANNER & SAFETY GUARD
          ========================================================= */}
      {tab === 'meds' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Medicines' },
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly (Sunday)' },
                { id: 'prn', label: 'As-Needed (PRN)' },
                { id: 'low', label: `Low Stock (${lowStockMeds.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMedFilter(f.id as typeof medFilter)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                    medFilter === f.id
                      ? 'bg-[#14171A] text-white'
                      : 'border border-black/10 bg-white text-[#57606A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowRxScanner(true)}
                className="rounded-xl border border-[#0F524B] bg-[#0F524B]/5 px-4 py-2.5 text-xs font-bold text-[#0F524B]"
              >
                📷 AI Prescription Scanner (Gemma 4)
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingMed({
                    isEdit: false,
                    med: {
                      id: `med-${Date.now()}`,
                      name: '',
                      genericName: '',
                      dosage: '',
                      purpose: '',
                      scheduleType: 'daily',
                      time: '14:00',
                      mealTiming: 'After lunch',
                      colorName: 'White',
                      shape: 'round',
                      imprint: 'RX',
                      stock: 30,
                      status: 'pending',
                    },
                  })
                }
                className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white"
              >
                + Add Medication
              </button>
            </div>
          </div>

          {/* Medication Cards with EDIT, +30 Refill, Remove */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredMeds.map((m) => (
              <article
                key={m.id}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PillBadgeSvg
                      colorName={m.colorName}
                      shape={m.shape}
                      imprint={m.imprint}
                      size={48}
                    />
                    <div>
                      <h4 className="text-base font-bold text-[#14171A]">{m.name}</h4>
                      <div className="text-xs text-[#57606A]">
                        {m.genericName} • {m.dosage}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-md bg-[#F6F5F1] px-2.5 py-1 text-xs font-bold uppercase text-[#0F524B]">
                    {m.scheduleType} • {m.time}
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-[#F6F5F1] p-3 text-xs">
                  <div>
                    <strong className="text-[#0F524B]">Purpose:</strong> {m.purpose}
                  </div>
                  <div className="mt-1">
                    <strong>Meal Rule:</strong> {m.mealTiming} • <strong>Stock:</strong>{' '}
                    {m.stock} pills
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMed({ med: { ...m }, isEdit: true })}
                    className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[#14171A] hover:bg-[#F6F5F1]"
                  >
                    ✏️ Edit Schedule / Purpose
                  </button>
                  <button
                    type="button"
                    onClick={() => onRefillMed(m.id)}
                    className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold text-[#0F524B]"
                  >
                    +30 Refill
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMed(m.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Live AI Drug-Interaction & Food-Timing Safety Guard */}
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-[#0F524B]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F524B]">
                  {drugSafetyReport?.providerUsed ||
                    'Google Gemma 4 (Adaption Labs) + Gemini 3 Flash'}
                </span>
                <h3 className="mt-1 text-lg font-bold text-[#14171A]">
                  AI Drug-Interaction &amp; Absorption Safety Guard
                </h3>
                <p className="text-xs text-[#57606A]">
                  Analyzes {elderName}’s active medications and allergies (
                  {allergies.join(', ')}) for absorption conflicts.
                </p>
              </div>
              <button
                type="button"
                disabled={runningSafetyAi}
                onClick={async () => {
                  setRunningSafetyAi(true);
                  try {
                    await onRunDrugSafetyAi();
                  } finally {
                    setRunningSafetyAi(false);
                  }
                }}
                className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {runningSafetyAi
                  ? '⏳ Analyzing with Gemma 4...'
                  : '✨ Re-Analyze Active Schedule with AI'}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(drugSafetyReport?.interactions || []).map((inter, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-[#14171A]">{inter.summary}</strong>
                    <span className="rounded bg-white px-2.5 py-0.5 text-xs font-bold uppercase text-[#0F524B]">
                      {inter.medicationsInvolved.join(' + ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#57606A]">{inter.clinicalMechanism}</p>
                  <p className="mt-1 text-xs font-semibold text-[#0E6B50]">
                    ✓ Spacing Rule: {inter.spacingRecommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Medication Change Audit Log */}
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <h3 className="text-base font-bold text-[#14171A]">
              Medication Schedule &amp; Care Audit Log
            </h3>
            <div className="mt-3 space-y-2">
              {auditLog.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F6F5F1] px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <strong className="text-[#0F524B]">{a.actor}:</strong> {a.note}
                  </div>
                  <span className="font-semibold text-[#57606A]">{a.when}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          TAB 3: APPOINTMENTS, GOOGLE LINKS & AI DOCTOR VISIT BRIEF
          ========================================================= */}
      {tab === 'appts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#14171A]">
              Upcoming Doctor Visits &amp; Post-Visit Outcomes
            </h3>
            <button
              type="button"
              onClick={() => setShowAddAppt(true)}
              className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white"
            >
              + Schedule Appointment
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {appointments.map((appt) => {
              const gcalUrl = buildValidGoogleCalendarUrl(appt, elderName);
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${appt.clinicName}, ${appt.clinicAddress}`
              )}`;

              return (
                <article
                  key={appt.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 shadow-2xs"
                >
                  <span className="rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold text-[#0F524B]">
                    {appt.dateTimeLabel}
                  </span>
                  <h4 className="mt-2 text-lg font-bold text-[#14171A]">
                    {appt.doctorName}
                  </h4>
                  <div className="text-xs font-semibold text-[#57606A]">
                    {appt.specialty} • {appt.clinicName}
                  </div>
                  <p className="mt-2 text-xs text-[#57606A]">{appt.notes}</p>

                  {/* Post-Visit Outcome Badge (if recorded) */}
                  {appt.postVisitOutcome && (
                    <div className="mt-3 rounded-xl border border-[#0E6B50]/30 bg-[#0E6B50]/10 p-3 text-xs">
                      <strong className="text-[#0E6B50]">✓ Recorded Visit Outcome:</strong>{' '}
                      {appt.postVisitOutcome}
                    </div>
                  )}

                  {/* Prep Checklist */}
                  <div className="mt-3 space-y-1.5">
                    {appt.checklist.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={c.done}
                          onChange={() => onToggleChecklist(appt.id, c.id)}
                          className="h-4 w-4 accent-[#0F524B]"
                        />
                        <span className={c.done ? 'line-through text-[#57606A]' : ''}>
                          {c.text}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#0F524B] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      📅 Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadAppointmentIcs(appt, elderName)}
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold"
                    >
                      ⬇️ .ICS Invite
                    </button>
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-bold"
                    >
                      📍 Google Maps
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setOutcomeModalAppt(appt);
                        setOutcomeInput(
                          appt.postVisitOutcome ||
                            'Continued current regimen; recheck evening BP in 14 days.'
                        );
                      }}
                      className="rounded-lg border border-[#0F524B]/30 bg-[#0F524B]/5 px-3 py-1.5 text-xs font-bold text-[#0F524B]"
                    >
                      📝 Log Visit Outcome
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* AI Pre-Appointment Clinical Brief */}
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-[#0F524B]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F524B]">
                  {aiDoctorBrief?.providerUsed ||
                    'Google Gemma 4 (Adaption Labs) + Gemini 3 Flash'}
                </span>
                <h3 className="mt-1 text-lg font-bold text-[#14171A]">
                  Pre-Appointment Doctor Visit Brief — {elderName} ({elderAge}y, {bloodGroup})
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={runningBriefAi}
                  onClick={async () => {
                    setRunningBriefAi(true);
                    try {
                      await onRefreshAiDoctorBrief();
                    } finally {
                      setRunningBriefAi(false);
                    }
                  }}
                  className="rounded-xl bg-[#0F524B] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {runningBriefAi
                    ? '⏳ Generating with AI...'
                    : '✨ Refresh Brief with Gemma 4 AI'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
                >
                  🖨️ Print Brief
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-[#F6F5F1] p-4 text-xs leading-relaxed">
              <p>
                <strong>Adherence Summary:</strong>{' '}
                {aiDoctorBrief?.adherenceSummary ||
                  `${elderName} is at ${pct}% daily adherence today (${takenCount}/${dailyMeds.length} doses). Current feeling: ${currentFeeling}.`}
              </p>
              <div>
                <strong>Vitals Highlights:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {(
                    aiDoctorBrief?.vitalsHighlights ||
                    vitals.map((v) => `${v.type}: ${v.value} (${v.notes})`)
                  ).map((vh, i) => (
                    <li key={i}>{vh}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Questions Flagged for Physician:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {(
                    aiDoctorBrief?.suggestedQuestionsForDoctor || [
                      'Should evening Amlopres 5mg be adjusted if afternoon systolic BP is below 115 mmHg?',
                    ]
                  ).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          TAB 4: PROACTIVE EMAIL REMINDER ENGINE (NODEMAILER SMTP)
          ========================================================= */}
      {tab === 'emails' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#14171A]">
                  Proactive Email Reminder Engine (Idempotent SMTP Dispatcher)
                </h3>
                <p className="text-xs text-[#57606A]">
                  Automatically dispatches email alerts for overdue doses (after{' '}
                  {graceMinutes}m grace window), upcoming medications, low refills, and
                  doctor appointments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRunAutoScanEmails(customRecipient)}
                className="rounded-xl bg-[#0F524B] px-5 py-2.5 text-xs font-bold text-white"
              >
                ⚡ Run Proactive Auto-Scan Now
              </button>
            </div>

            {/* Recipient Email Input for Live Judge Testing */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-xs font-bold text-[#14171A]">
                Target Recipient Email (Edit to test live delivery):
              </label>
              <input
                type="email"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                className="flex-1 rounded-xl border border-black/15 px-3.5 py-2 text-xs font-semibold"
              />
            </div>

            {/* 6 Instant Trigger Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                {
                  cat: 'upcoming_dose',
                  label: '⏰ Send Upcoming Dose Reminder',
                  subject: '⏰ Upcoming Dose Reminder: Shelcal 500 at 1:30 PM',
                  preview:
                    'Take 1 sky-blue oval tablet after lunch (spaced 6h from morning Thyronorm).',
                },
                {
                  cat: 'missed_dose_escalation',
                  label: `⚠️ Send Missed Dose Alert (${graceMinutes}m Grace)`,
                  subject: `⚠️ Missed Dose Escalation (${graceMinutes}m Grace Elapsed): Shelcal 500`,
                  preview: `${elderName} has not confirmed her 1:30 PM Shelcal 500 dose after her ${graceMinutes}-minute grace window.`,
                },
                {
                  cat: 'appointment_reminder',
                  label: '📅 Send 24h Appointment Reminder',
                  subject: '📅 Doctor Appointment Reminder: Dr. Rajesh Sharma Tomorrow',
                  preview:
                    'Apollo Senior Heart Centre • Prep checklist & Google Maps directions included.',
                },
                {
                  cat: 'low_refill',
                  label: '💊 Send Low-Refill Pharmacy Alert',
                  subject: '💊 Refill Warning: Shelcal 500 (4 Tablets Remaining)',
                  preview:
                    'Supply is below threshold (7 tablets). Please coordinate pharmacy refill.',
                },
                {
                  cat: 'weekly_digest',
                  label: '📊 Send Weekly Family Care Digest',
                  subject: `📊 Weekly Family Care Digest: ${elderName} (${pct}% Adherence)`,
                  preview:
                    '6-day adherence summary, resting BP 124/78 mmHg, and upcoming cardiology visit brief.',
                },
                {
                  cat: 'elder_sos',
                  label: '🚨 Send Priority Care SOS Test',
                  subject: `🚨 PRIORITY CARE ALERT: ${elderName} Requested Check-In`,
                  preview: 'Immediate callback or check-in requested from Elder Companion.',
                },
              ].map((trig) => (
                <button
                  key={trig.cat}
                  type="button"
                  onClick={() =>
                    onDispatchEmail({
                      category: trig.cat,
                      subject: trig.subject,
                      preview: trig.preview,
                      customRecipient,
                    })
                  }
                  className="rounded-xl border border-black/15 bg-[#F6F5F1] px-3.5 py-2.5 text-left text-xs font-bold text-[#14171A] hover:bg-[#EFECE6]"
                >
                  {trig.label}
                </button>
              ))}
            </div>
          </section>

          {/* Dispatched Emails Outbox Log (React Bits AnimatedList) */}
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <h3 className="text-base font-bold text-[#14171A]">
              Dispatched Email Outbox &amp; Delivery Audit ({emails.length})
            </h3>
            <div className="mt-3">
              <AnimatedList
                items={emails}
                maxHeight={340}
                showGradients={true}
                enableArrowNavigation={true}
                renderItem={(em: CaretakerEmailItem, _idx: number, isSelected: boolean) => (
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition-all ${
                      isSelected
                        ? 'border-[#0F524B] bg-[#0F524B]/5 shadow-xs'
                        : 'border-black/10 bg-[#F6F5F1]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#14171A]">{em.subject}</div>
                      <div className="text-[#57606A]">
                        To: {em.recipients} • {em.sentAt}
                      </div>
                      <div className="mt-0.5 text-[#57606A]">{em.preview}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#0E6B50]/15 px-2.5 py-1 font-bold text-[#0E6B50]">
                        {em.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewEmail(em)}
                        className="rounded-lg border border-black/15 bg-white px-3 py-1.5 font-bold"
                      >
                        Preview HTML
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD OR EDIT MEDICATION (WITH "ASK AI PURPOSE")
          ========================================================= */}
      {editingMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#14171A]">
              {editingMed.isEdit ? `Edit ${editingMed.med.name}` : 'Add New Medication'}
            </h3>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold">Medicine Name</label>
                  <input
                    type="text"
                    value={editingMed.med.name}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, name: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold">Dosage</label>
                  <input
                    type="text"
                    value={editingMed.med.dosage}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, dosage: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold">
                    For what purpose is the patient taking this medicine?
                  </label>
                  <button
                    type="button"
                    disabled={askingAiPurpose}
                    onClick={askAiPurposeForModal}
                    className="text-xs font-bold text-[#0F524B] underline"
                  >
                    {askingAiPurpose ? 'Asking AI...' : '✨ Ask AI Purpose'}
                  </button>
                </div>
                <input
                  type="text"
                  value={editingMed.med.purpose}
                  onChange={(e) =>
                    setEditingMed({
                      ...editingMed,
                      med: { ...editingMed.med, purpose: e.target.value },
                    })
                  }
                  placeholder="e.g., Controls blood pressure and protects heart health"
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold">Schedule Type</label>
                  <select
                    value={editingMed.med.scheduleType}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: {
                          ...editingMed.med,
                          scheduleType: e.target.value as 'daily' | 'weekly' | 'prn',
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-2.5 py-2 text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="prn">As-Needed (PRN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold">Time (24h)</label>
                  <input
                    type="time"
                    value={editingMed.med.time === 'As Needed' ? '14:00' : editingMed.med.time}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, time: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold">Stock Count</label>
                  <input
                    type="number"
                    value={editingMed.med.stock}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, stock: Number(e.target.value) || 0 },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-2.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold">Meal Timing</label>
                  <input
                    type="text"
                    value={editingMed.med.mealTiming}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, mealTiming: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold">Pill Color</label>
                  <select
                    value={editingMed.med.colorName}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, colorName: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-2.5 py-2 text-xs"
                  >
                    <option value="White">White</option>
                    <option value="Sky Blue">Sky Blue</option>
                    <option value="Soft Yellow">Soft Yellow</option>
                    <option value="Rose Pink">Rose Pink</option>
                    <option value="Amber Gold">Amber Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold">Pill Shape</label>
                  <select
                    value={editingMed.med.shape}
                    onChange={(e) =>
                      setEditingMed({
                        ...editingMed,
                        med: { ...editingMed.med, shape: e.target.value as PillShape },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-2.5 py-2 text-xs"
                  >
                    <option value="round">Round</option>
                    <option value="oval">Oval</option>
                    <option value="capsule">Capsule</option>
                    <option value="diamond">Diamond</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMed(null)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingMed.med.name.trim()) return;
                  onAddOrEditMed(editingMed.med, editingMed.isEdit);
                  setEditingMed(null);
                }}
                className="rounded-xl bg-[#0F524B] px-5 py-2 text-xs font-bold text-white"
              >
                {editingMed.isEdit ? 'Save Changes' : 'Add to Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: LIVE AI PRESCRIPTION SCANNER (GEMMA 4 + GEMINI)
          ========================================================= */}
      {showRxScanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <span className="rounded bg-[#0F524B]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F524B]">
              Google Gemma 4 (gemma-4-31b-it) + Gemini 3 Flash
            </span>
            <h3 className="mt-1 text-xl font-bold text-[#14171A]">
              AI Prescription &amp; Pill Bottle Scanner
            </h3>
            <p className="mt-1 text-xs text-[#57606A]">
              Paste any prescription line below (or select a sample) to dynamically extract
              the drug, dosage, purpose, and meal rule.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                'Tab. Ecosprin 75mg — 1 tab daily after lunch for heart protection',
                'Tab. Telma 40mg (Telmisartan) — 1 tab morning 8:00 AM for blood pressure',
                'Cap. Pantocid DSR — 1 cap empty stomach 7:30 AM before breakfast for acidity',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRxInputText(sample)}
                  className="rounded-lg border border-black/10 bg-[#F6F5F1] px-2.5 py-1 text-[11px] font-semibold hover:bg-[#EFECE6]"
                >
                  Sample {idx + 1}: {sample.slice(0, 26)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rxInputText}
              onChange={(e) => setRxInputText(e.target.value)}
              className="mt-3 w-full rounded-xl border border-black/15 p-3 text-xs"
            />

            <button
              type="button"
              disabled={rxScanning}
              onClick={handleRunRxScan}
              className="mt-3 w-full rounded-xl bg-[#0F524B] py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {rxScanning
                ? '⏳ Extracting with Gemma 4 AI...'
                : '✨ Extract Medication & Purpose with AI'}
            </button>

            {rxExtractedDraft && (
              <div className="mt-4 rounded-xl border border-[#0E6B50]/30 bg-[#0E6B50]/10 p-4 text-xs">
                <div className="font-bold text-[#0E6B50]">
                  ✓ Extracted via {rxExtractedDraft.providerUsed}
                </div>
                <div className="mt-1 text-sm font-bold text-[#14171A]">
                  {rxExtractedDraft.med.name} ({rxExtractedDraft.med.dosage})
                </div>
                <div className="mt-0.5">
                  <strong>Purpose:</strong> {rxExtractedDraft.med.purpose}
                </div>
                <div className="mt-0.5">
                  <strong>Schedule:</strong> {rxExtractedDraft.med.time} •{' '}
                  {rxExtractedDraft.med.mealTiming}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAddOrEditMed(rxExtractedDraft.med, false);
                    setRxExtractedDraft(null);
                    setShowRxScanner(false);
                  }}
                  className="mt-3 w-full rounded-lg bg-[#14171A] py-2 text-xs font-bold text-white"
                >
                  ✓ Confirm &amp; Import to Active Schedule
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRxScanner(false)}
              className="mt-3 w-full py-1.5 text-xs font-bold text-[#57606A]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: SCHEDULE NEW APPOINTMENT
          ========================================================= */}
      {showAddAppt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#14171A]">
              Schedule Doctor Appointment
            </h3>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={newApptDoc}
                onChange={(e) => setNewApptDoc(e.target.value)}
                placeholder="Doctor Name (e.g., Dr. Arvind Patel)"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newApptSpec}
                onChange={(e) => setNewApptSpec(e.target.value)}
                placeholder="Specialty (e.g., Ophthalmology)"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newApptClinic}
                onChange={(e) => setNewApptClinic(e.target.value)}
                placeholder="Clinic & Address (e.g., LV Prasad Eye Institute, Hyderabad)"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newApptDt}
                onChange={(e) => setNewApptDt(e.target.value)}
                placeholder="Date & Time Label"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newApptPrep}
                onChange={(e) => setNewApptPrep(e.target.value)}
                placeholder="Preparation Checklist Item"
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAppt(false)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newApptDoc.trim()) return;
                  onAddAppointment({
                    doctorName: newApptDoc.trim(),
                    specialty: newApptSpec.trim() || 'General Medicine',
                    clinicName: newApptClinic.trim() || 'Apollo Senior Clinic',
                    clinicAddress: newApptClinic.trim() || 'Hyderabad',
                    dateTimeLabel: newApptDt.trim(),
                    isoStart: new Date(Date.now() + 3 * 86400000).toISOString(),
                    notes: 'Scheduled via Caretaker Station.',
                    checklist: [
                      {
                        id: `chk-${Date.now()}`,
                        text: newApptPrep.trim() || 'Bring active medication list',
                        done: false,
                      },
                    ],
                  });
                  setShowAddAppt(false);
                }}
                className="rounded-xl bg-[#0F524B] px-5 py-2 text-xs font-bold text-white"
              >
                Save Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: LOG POST-VISIT OUTCOME
          ========================================================= */}
      {outcomeModalAppt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#14171A]">
              Log Post-Visit Outcome — {outcomeModalAppt.doctorName}
            </h3>
            <textarea
              rows={3}
              value={outcomeInput}
              onChange={(e) => setOutcomeInput(e.target.value)}
              className="mt-3 w-full rounded-xl border border-black/15 p-3 text-xs"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOutcomeModalAppt(null)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSavePostVisitOutcome(outcomeModalAppt.id, outcomeInput.trim());
                  setOutcomeModalAppt(null);
                }}
                className="rounded-xl bg-[#0F524B] px-5 py-2 text-xs font-bold text-white"
              >
                Save Outcome to Card &amp; Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: PREVIEW RENDERED HTML EMAIL
          ========================================================= */}
      {previewEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-[#0F524B] p-5 text-white">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                KindredCare AI • Care Circle KC-2026
              </div>
              <h3 className="mt-1 text-lg font-bold">{previewEmail.subject}</h3>
            </div>
            <div className="p-6 text-xs space-y-2.5">
              <div>
                <strong>Recipients:</strong> {previewEmail.recipients}
              </div>
              <div>
                <strong>Delivery Status:</strong> {previewEmail.status} ({previewEmail.sentAt})
              </div>
              <div className="rounded-xl bg-[#F6F5F1] p-4 text-sm text-[#14171A]">
                {previewEmail.preview}
              </div>
              {previewEmail.previewUrl && (
                <a
                  href={previewEmail.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-bold text-[#0F524B] underline"
                >
                  Open Live SMTP Message Preview URL ↗
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="mt-4 w-full rounded-xl bg-[#14171A] py-2.5 font-bold text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
