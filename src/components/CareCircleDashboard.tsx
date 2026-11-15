'use client';

import React, { useState } from 'react';
import {
  Pill,
  Sparkles,
  Mail,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  CalendarPlus,
  Download,
  Send,
  ShieldAlert,
  FileText,
  Activity,
  MessageSquarePlus,
  Upload,
  ExternalLink,
  Lock,
} from 'lucide-react';
import type { AdherenceMetrics } from '@/lib/adherence';
import { formatTime12h, getLocalDateKey } from '@/lib/adherence';
import {
  buildGoogleCalendarAppointmentUrl,
  buildGoogleCalendarMedicationUrl,
  buildGoogleMapsDirectionsUrl,
  generateAppointmentIcsContent,
} from '@/services/google-integrations';
import type {
  CareCircleState,
  CareRole,
  DoctorVisitBrief,
  DrugSafetyReport,
  EmailReminderCategory,
  MealTiming,
  TimeOfDaySlot,
  VitalType,
} from '@/types/domain';
import type { ExtractedPrescriptionResult } from '@/services/ai-engine';

interface CareCircleDashboardProps {
  circle: CareCircleState;
  metrics: AdherenceMetrics;
  currentRole: CareRole;
  onRefresh: () => Promise<void>;
  onDoseAction: (params: {
    medicationId: string;
    status: 'taken' | 'skipped' | 'snoozed';
    reason?: string;
  }) => Promise<void>;
  announcePolite: (msg: string) => void;
}

type DashboardTab = 'medications' | 'ai_intelligence' | 'email_reminders' | 'appointments_vitals';

const SAMPLE_PRESCRIPTIONS = [
  {
    label: 'Cardiology Rx: Ecosprin 75mg + Pantocid 40mg',
    text: 'Rx: 1) Tab Ecosprin 75mg (Gastro-resistant Aspirin) - 1 tablet once daily at 14:00 after lunch for cardiovascular protection. 2) Tab Pantocid 40mg (Pantoprazole) - 1 tablet at 06:30 on empty stomach before breakfast.',
  },
  {
    label: 'Neurology & Sleep Rx: Mecobalamin 1500mcg',
    text: 'Rx: Tab Methycobal 1500mcg (Methylcobalamin Vitamin B12) - 1 tablet once daily at 13:00 after lunch to support nerve health in diabetic patients on Metformin.',
  },
];

export function CareCircleDashboard({
  circle,
  metrics,
  currentRole,
  onRefresh,
  onDoseAction,
  announcePolite,
}: CareCircleDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('medications');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Add Medication Form State
  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medPurpose, setMedPurpose] = useState('');
  const [medSlot, setMedSlot] = useState<TimeOfDaySlot>('morning');
  const [medTime, setMedTime] = useState('09:00');
  const [medMeal, setMedMeal] = useState<MealTiming>('after_meal');
  const [medStock, setMedStock] = useState(30);
  const [medInstructions, setMedInstructions] = useState('Take with a full glass of water.');

  // AI Intelligence State
  const [rxInputText, setRxInputText] = useState(SAMPLE_PRESCRIPTIONS[0].text);
  const [rxImageBase64, setRxImageBase64] = useState<string | undefined>(undefined);
  const [rxImageName, setRxImageName] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ExtractedPrescriptionResult | null>(null);
  const [safetyReport, setSafetyReport] = useState<DrugSafetyReport | null>(null);
  const [doctorBrief, setDoctorBrief] = useState<DoctorVisitBrief | null>(null);

  // Proactive Email State
  const [recipientEmail, setRecipientEmail] = useState('geeteshgollapalli@gmail.com');
  const [emailSending, setEmailSending] = useState<string | null>(null);

  // Appointments & Vitals State
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptSpecialty, setApptSpecialty] = useState('');
  const [apptClinic, setApptClinic] = useState('');
  const [apptAddress, setApptAddress] = useState('');
  const [apptDateTime, setApptDateTime] = useState('');
  const [apptPrepText, setApptPrepText] = useState('Bring current medication list');

  const [vitalType, setVitalType] = useState<VitalType>('blood_pressure');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalUnit, setVitalUnit] = useState('mmHg');
  const [vitalNotes, setVitalNotes] = useState('');

  const [noteMessage, setNoteMessage] = useState('');
  const [noteCategory, setNoteCategory] = useState<
    'observation' | 'symptom' | 'encouragement' | 'question_for_doctor'
  >('observation');

  const todayKey = getLocalDateKey(new Date());
  const todayLogs = circle.doseLogs.filter((l) => l.dateKey === todayKey);

  const canEditSchedule =
    currentRole === 'caretaker' ||
    currentRole === 'elder' ||
    (currentRole === 'family' && circle.autonomySettings.allowFamilyScheduleEdits);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    announcePolite(text);
    setTimeout(() => setFeedbackBanner(null), 6000);
  };

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: medName,
          genericName: medGeneric,
          dosage: medDosage,
          purpose: medPurpose,
          slot: medSlot,
          scheduledTime: medTime,
          mealTiming: medMeal,
          stockCount: Number(medStock),
          instructions: medInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not add medication.');
        return;
      }
      setMedName('');
      setMedGeneric('');
      setMedDosage('');
      setMedPurpose('');
      setShowAddMed(false);
      await onRefresh();
      showToast('success', `Added ${data.medication.name} to ${circle.elderName}'s daily schedule.`);
    } catch {
      showToast('error', 'Failed to save medication.');
    }
  };

  const handleDeleteMedication = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/medications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not remove medication.');
        return;
      }
      await onRefresh();
      showToast('success', `Removed ${name} from active schedule.`);
    } catch {
      showToast('error', 'Error deleting medication.');
    }
  };

  const handlePrescriptionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRxImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRxImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunAIScan = async () => {
    setAiLoading('scan');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_prescription',
          prescriptionText: rxInputText,
          imageBase64DataUrl: rxImageBase64,
        }),
      });
      const data = await res.json();
      if (data.scanned) {
        setScannedResult(data.scanned);
        showToast(
          'success',
          `Extracted ${data.scanned.medications.length} medication(s) via ${data.scanned.providerUsed}.`
        );
      }
    } catch {
      showToast('error', 'AI Prescription scan encountered an error.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleImportScannedMed = async (
    med: ExtractedPrescriptionResult['medications'][number]
  ) => {
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: med.name,
          genericName: med.genericName,
          dosage: med.dosage,
          purpose: med.purpose,
          plainExplanation: med.plainExplanation,
          slot: med.slot,
          scheduledTime: med.scheduledTime,
          mealTiming: med.mealTiming,
          instructions: med.instructions,
          sideEffectsWatch: med.sideEffectsWatch || [],
          stockCount: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Permission denied to import medication.');
        return;
      }
      await onRefresh();
      showToast('success', `Imported ${med.name} (${med.dosage}) into daily schedule!`);
    } catch {
      showToast('error', 'Failed to import scanned medication.');
    }
  };

  const handleRunDrugSafetyGuard = async () => {
    setAiLoading('safety');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drug_safety' }),
      });
      const data = await res.json();
      if (data.report) {
        setSafetyReport(data.report);
        showToast('success', `Completed Drug-Interaction & Food-Timing analysis.`);
      }
    } catch {
      showToast('error', 'Failed to run drug interaction analysis.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateDoctorBrief = async () => {
    setAiLoading('brief');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'doctor_brief' }),
      });
      const data = await res.json();
      if (data.brief) {
        setDoctorBrief(data.brief);
        showToast('success', `Generated Pre-Appointment Clinical Brief.`);
      }
    } catch {
      showToast('error', 'Failed to generate Doctor Visit Brief.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleTriggerEmailReminder = async (
    category: EmailReminderCategory | 'auto_scan',
    targetId?: string
  ) => {
    setEmailSending(category);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          targetId,
          customRecipientEmail: recipientEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to trigger email reminder.');
        return;
      }
      await onRefresh();
      const count = data.dispatched?.length || 0;
      showToast(
        'success',
        count > 0
          ? `Dispatched ${count} proactive email notification(s) to ${recipientEmail}!`
          : `Auto-scan complete (${data.skippedDuplicatesCount || 0} duplicate alerts suppressed by idempotency guard).`
      );
    } catch {
      showToast('error', 'Error dispatching email reminder.');
    } finally {
      setEmailSending(null);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: apptDoctor,
          specialty: apptSpecialty,
          clinicName: apptClinic,
          clinicAddress: apptAddress,
          dateTime: new Date(apptDateTime).toISOString(),
          notes: 'Scheduled via Care Circle Command Center',
          prepChecklist: apptPrepText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text, idx) => ({
              id: `prep-${Date.now()}-${idx}`,
              text,
              completed: false,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not schedule appointment.');
        return;
      }
      setShowAddAppt(false);
      setApptDoctor('');
      setApptSpecialty('');
      setApptClinic('');
      setApptAddress('');
      await onRefresh();
      showToast('success', `Scheduled appointment with ${data.appointment.doctorName}.`);
    } catch {
      showToast('error', 'Failed to create appointment.');
    }
  };

  const handleTogglePrepChecklist = async (appointmentId: string, prepItemId: string) => {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, prepItemId }),
    });
    await onRefresh();
  };

  const handleDownloadIcs = (appt: CareCircleState['appointments'][number]) => {
    const ics = generateAppointmentIcsContent(appt, circle.elderName);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appt.doctorName.replace(/\s+/g, '_')}_Appointment.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalValue.trim()) return;
    const res = await fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: vitalType,
        value: vitalValue,
        unit: vitalUnit,
        notes: vitalNotes,
      }),
    });
    if (res.ok) {
      setVitalValue('');
      setVitalNotes('');
      await onRefresh();
      showToast('success', 'Recorded vital sign reading.');
    }
  };

  const handleAddCareNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteMessage.trim()) return;
    const res = await fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'care_note',
        message: noteMessage,
        category: noteCategory,
      }),
    });
    if (res.ok) {
      setNoteMessage('');
      await onRefresh();
      showToast('success', 'Added note to Shared Care Circle Journal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Summary Cards */}
      <section
        aria-label="Care Circle Adherence Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Today&apos;s Dose Completion
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-teal-800">
              {metrics.todayTaken} / {metrics.todayTotal}
            </span>
            <span className="rounded-xl bg-teal-100 px-2.5 py-1 text-xs font-extrabold text-teal-900">
              {metrics.todayPercentage}% Today
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            7-Day Rolling Adherence: <strong>{metrics.sevenDayPercentage}%</strong> ({metrics.streakDays}-day streak)
          </p>
        </div>

        <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Elder Autonomy Policy
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {circle.autonomySettings.escalationGraceMinutes}m Grace
            </span>
            <span className="rounded-xl bg-indigo-100 px-2.5 py-1 text-xs font-extrabold text-indigo-950">
              {circle.autonomySettings.allowFamilyScheduleEdits ? 'Family Edit: ON' : 'Family Edit: OFF'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {circle.elderName} controls alert escalation & edit permissions.
          </p>
        </div>

        <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Refill & Inventory Watch
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-800">
              {metrics.lowStockMedications.length}
            </span>
            <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-950">
              Low Stock Alert
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {metrics.lowStockMedications.length > 0
              ? `Refill needed: ${metrics.lowStockMedications.map((m) => m.name).join(', ')}`
              : 'All pill inventories above threshold.'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Proactive Email Alerts
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-800">
              {circle.emailReminders.length}
            </span>
            <span className="rounded-xl bg-blue-100 px-2.5 py-1 text-xs font-extrabold text-blue-950">
              Idempotent SMTP
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Connected to Care Circle ({circle.members.length} members notified).
          </p>
        </div>
      </section>

      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border-2 px-5 py-3.5 text-sm font-bold flex items-center justify-between ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Accessible Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Care Circle Management Sections"
        className="flex flex-wrap gap-2 rounded-2xl bg-slate-200/80 p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'medications'}
          onClick={() => setActiveTab('medications')}
          className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
            activeTab === 'medications'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Pill className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>1. Medications & Adherence ({circle.medications.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ai_intelligence'}
          onClick={() => setActiveTab('ai_intelligence')}
          className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
            activeTab === 'ai_intelligence'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Sparkles className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>2. Google AI Care Intelligence</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'email_reminders'}
          onClick={() => setActiveTab('email_reminders')}
          className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
            activeTab === 'email_reminders'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Mail className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>3. Proactive Email Reminders ({circle.emailReminders.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'appointments_vitals'}
          onClick={() => setActiveTab('appointments_vitals')}
          className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
            activeTab === 'appointments_vitals'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <Calendar className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>4. Appointments, Vitals & Notes</span>
        </button>
      </div>

      {/* TAB 1: MEDICATIONS & ADHERENCE */}
      {activeTab === 'medications' && (
        <section aria-label="Medication Schedule Management" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border-2 border-slate-200 p-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Active Medication Schedule & Adherence
              </h2>
              <p className="text-sm text-slate-600">
                Manage daily prescriptions, monitor real-time dose confirmation, and track pill
                inventory.
              </p>
            </div>

            {canEditSchedule ? (
              <button
                type="button"
                onClick={() => setShowAddMed(!showAddMed)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-3 text-sm font-extrabold text-white shadow-md transition"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>{showAddMed ? 'Close Form' : 'Add Medication'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-bold text-amber-950">
                <Lock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <span>
                  Family Observer Mode: Schedule edits locked by {circle.elderName}&apos;s Autonomy Policy
                </span>
              </div>
            )}
          </div>

          {showAddMed && canEditSchedule && (
            <form
              onSubmit={(e) => void handleCreateMedication(e)}
              className="rounded-3xl bg-white border-2 border-teal-500 p-6 shadow-lg space-y-4"
            >
              <h3 className="text-lg font-extrabold text-slate-900">
                Add New Prescription to {circle.elderName}&apos;s Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="med-name" className="block text-xs font-bold text-slate-700 mb-1">
                    Medicine Brand Name *
                  </label>
                  <input
                    id="med-name"
                    type="text"
                    required
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="e.g., Telma 40"
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="med-generic" className="block text-xs font-bold text-slate-700 mb-1">
                    Generic Composition
                  </label>
                  <input
                    id="med-generic"
                    type="text"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    placeholder="e.g., Telmisartan 40mg"
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="med-dosage" className="block text-xs font-bold text-slate-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    id="med-dosage"
                    type="text"
                    required
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="e.g., 40 mg (1 tablet)"
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="med-slot" className="block text-xs font-bold text-slate-700 mb-1">
                    Routine Time Slot *
                  </label>
                  <select
                    id="med-slot"
                    value={medSlot}
                    onChange={(e) => setMedSlot(e.target.value as TimeOfDaySlot)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="med-time" className="block text-xs font-bold text-slate-700 mb-1">
                    Scheduled Time (24h) *
                  </label>
                  <input
                    id="med-time"
                    type="time"
                    required
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="med-meal" className="block text-xs font-bold text-slate-700 mb-1">
                    Meal Timing *
                  </label>
                  <select
                    id="med-meal"
                    value={medMeal}
                    onChange={(e) => setMedMeal(e.target.value as MealTiming)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
                  >
                    <option value="after_meal">After Meal</option>
                    <option value="before_meal">Before Meal</option>
                    <option value="with_meal">With Meal</option>
                    <option value="empty_stomach">Empty Stomach</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="med-purpose" className="block text-xs font-bold text-slate-700 mb-1">
                    Plain-Language Purpose (for Elder) *
                  </label>
                  <input
                    id="med-purpose"
                    type="text"
                    required
                    value={medPurpose}
                    onChange={(e) => setMedPurpose(e.target.value)}
                    placeholder="e.g., Keeps blood pressure calm and steady"
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="med-stock" className="block text-xs font-bold text-slate-700 mb-1">
                    Current Pill Stock Count
                  </label>
                  <input
                    id="med-stock"
                    type="number"
                    min={1}
                    max={500}
                    value={medStock}
                    onChange={(e) => setMedStock(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="med-instructions" className="block text-xs font-bold text-slate-700 mb-1">
                  Dosing Instructions
                </label>
                <input
                  id="med-instructions"
                  type="text"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMed(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 px-6 py-2.5 text-sm font-extrabold text-white"
                >
                  Save Medication to Schedule
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4">
            {circle.medications.map((med) => {
              const log = todayLogs.find((l) => l.medicationId === med.id);
              const status = log?.status || 'pending';
              const isLow = med.stockCount <= med.refillThreshold;

              return (
                <div
                  key={med.id}
                  className="rounded-2xl bg-white border-2 border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white">
                        {formatTime12h(med.scheduledTime)} ({med.slot.toUpperCase()})
                      </span>
                      <span className="rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-900">
                        {med.mealTiming.replace('_', ' ')}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                          isLow
                            ? 'bg-amber-100 text-amber-950 border border-amber-400'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Stock: {med.stockCount} pills {isLow ? '⚠️ Refill Soon' : ''}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900">
                      {med.name}{' '}
                      <span className="text-sm font-bold text-teal-800">({med.dosage})</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      {med.genericName} • {med.purpose} • Prescribed by {med.prescribedBy}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {status === 'taken' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 border border-emerald-400 px-3.5 py-2 text-xs font-extrabold text-emerald-950">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        Taken ({log?.loggedByName})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void onDoseAction({ medicationId: med.id, status: 'taken' })
                        }
                        className="rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-extrabold text-white transition"
                      >
                        ✓ Mark Taken
                      </button>
                    )}

                    <a
                      href={buildGoogleCalendarMedicationUrl(med, circle.elderName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <CalendarPlus className="h-4 w-4 text-blue-700" aria-hidden="true" />
                      Google Calendar
                    </a>

                    {canEditSchedule && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteMedication(med.id, med.name)}
                        aria-label={`Delete ${med.name}`}
                        className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 p-2 text-red-700 transition"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: GOOGLE AI CARE INTELLIGENCE */}
      {activeTab === 'ai_intelligence' && (
        <section aria-label="Google AI Care Intelligence" className="space-y-6">
          {/* 1. Multimodal Prescription Scanner */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-0.5 text-xs font-extrabold text-teal-900">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Google Gemma 4 (gemma-4-31b-it) + Gemini 2.5 Flash Multimodal
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                  AI Prescription & Pill Bottle Scanner
                </h2>
                <p className="text-sm text-slate-600">
                  Upload a photo of a prescription/bottle or select a clinical prescription note to
                  extract structured schedules automatically.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRESCRIPTIONS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setRxInputText(sample.text)}
                  className="rounded-xl bg-slate-100 hover:bg-teal-50 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 transition"
                >
                  📄 Load Sample: {sample.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label
                  htmlFor="rx-text-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Prescription Clinical Text / OCR Notes
                </label>
                <textarea
                  id="rx-text-input"
                  rows={3}
                  value={rxInputText}
                  onChange={(e) => setRxInputText(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-300 p-3.5 text-sm font-medium text-slate-900"
                  placeholder="Paste prescription text or upload a photo..."
                />
              </div>

              <div className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                <div>
                  <label
                    htmlFor="rx-image-upload"
                    className="block text-xs font-extrabold text-slate-800 mb-1 cursor-pointer"
                  >
                    📷 Optional Prescription Photo (Multimodal Vision)
                  </label>
                  <input
                    id="rx-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePrescriptionImageUpload}
                    className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                  />
                  {rxImageName && (
                    <p className="mt-2 text-xs font-bold text-teal-800">
                      Attached: {rxImageName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleRunAIScan()}
                  disabled={aiLoading === 'scan'}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-3 text-sm font-extrabold text-white shadow transition"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {aiLoading === 'scan'
                    ? 'Analyzing with Google Gemma 4...'
                    : 'Extract Medications with AI'}
                </button>
              </div>
            </div>

            {scannedResult && (
              <div className="rounded-2xl bg-teal-50/70 border-2 border-teal-300 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-teal-950">
                    ✨ Extracted {scannedResult.medications.length} Medication(s) • Engine:{' '}
                    <span className="underline">{scannedResult.providerUsed}</span>
                  </div>
                  <span className="text-xs font-bold text-teal-800">
                    {scannedResult.safetyNote}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scannedResult.medications.map((med, idx) => (
                    <div
                      key={`${med.name}-${idx}`}
                      className="rounded-xl bg-white border border-teal-200 p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-base text-slate-900">
                            {med.name} ({med.dosage})
                          </span>
                          <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-900">
                            {med.scheduledTime} ({med.slot})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{med.plainExplanation}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleImportScannedMed(med)}
                        className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 px-3 py-2 text-xs font-extrabold text-white transition"
                      >
                        + Add {med.name} to Active Schedule
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Drug Interaction Guard & 3. Doctor Visit Brief */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-extrabold text-amber-950">
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    Pharmacological Safety Engine
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  AI Drug-Interaction & Food-Timing Guard
                </h3>
                <p className="text-sm text-slate-600">
                  Audits all {circle.medications.length} active prescriptions and allergies (
                  {circle.allergies.join(', ')}) for chelation conflicts, CYP3A4 food warnings, and
                  safe spacing.
                </p>

                {safetyReport && (
                  <div className="mt-4 space-y-3 pt-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-500">
                      Analyzed by: {safetyReport.providerUsed}
                    </div>
                    {safetyReport.interactions.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-amber-50/80 border border-amber-300 p-3.5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase text-amber-950">
                            {item.medicationsInvolved.join(' + ')}
                          </span>
                          <span className="rounded bg-amber-200 px-2 py-0.5 text-[11px] font-extrabold text-amber-950">
                            {item.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{item.summary}</div>
                        <p className="text-xs text-slate-700">{item.clinicalMechanism}</p>
                        <p className="text-xs font-bold text-teal-900">
                          ✓ Action: {item.spacingRecommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleRunDrugSafetyGuard()}
                disabled={aiLoading === 'safety'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-extrabold text-white transition"
              >
                <ShieldAlert className="h-4 w-4 text-teal-400" aria-hidden="true" />
                {aiLoading === 'safety'
                  ? 'Auditing Drug Interactions...'
                  : 'Run AI Drug-Interaction & Spacing Audit'}
              </button>
            </div>

            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-extrabold text-indigo-950">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Clinical Synthesis
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Pre-Appointment Doctor Visit Brief Generator
                </h3>
                <p className="text-sm text-slate-600">
                  Synthesizes {circle.elderName}&apos;s 7-day adherence, skipped-dose reasons, recent
                  vitals, and family care notes into a doctor-ready summary.
                </p>

                {doctorBrief && (
                  <div className="mt-4 space-y-3 pt-2 border-t border-slate-200 text-xs">
                    <div className="font-bold text-slate-500">
                      Generated via {doctorBrief.providerUsed}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {doctorBrief.adherenceSummary}
                    </p>
                    <div>
                      <div className="font-extrabold text-slate-900 mb-1">
                        Suggested Questions for Next Appointment:
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {doctorBrief.suggestedQuestionsForDoctor.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateDoctorBrief()}
                disabled={aiLoading === 'brief'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 px-5 py-3 text-sm font-extrabold text-white transition"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {aiLoading === 'brief'
                  ? 'Synthesizing Clinical Brief...'
                  : 'Generate Doctor Visit Brief'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: PROACTIVE EMAIL REMINDERS & ESCALATION */}
      {activeTab === 'email_reminders' && (
        <section aria-label="Proactive Email Reminder Engine" className="space-y-6">
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Proactive Email Reminder & Escalation Engine
                </h2>
                <p className="text-sm text-slate-600">
                  Automatically sends email reminders for upcoming doses, missed medications (after{' '}
                  {circle.autonomySettings.escalationGraceMinutes}m grace), doctor appointments, and
                  low refill stock with strict idempotency.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <label htmlFor="recipient-email-input" className="sr-only">
                  Recipient Email for Live Dispatch
                </label>
                <input
                  id="recipient-email-input"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email for live test..."
                  className="rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 min-w-[250px]"
                />
                <button
                  type="button"
                  onClick={() => void handleTriggerEmailReminder('auto_scan')}
                  disabled={emailSending !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-sm font-extrabold text-white shadow transition"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {emailSending === 'auto_scan' ? 'Scanning...' : 'Run Proactive Auto-Scan'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleTriggerEmailReminder('missed_dose_escalation')}
                disabled={emailSending !== null}
                className="rounded-2xl border-2 border-red-200 bg-red-50/70 hover:bg-red-100 p-4 text-left transition space-y-1"
              >
                <div className="text-xs font-extrabold uppercase text-red-800">
                  Tier 1 Escalation
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  ⚠️ Send Missed-Dose Family Alert
                </div>
                <p className="text-xs text-slate-600">
                  Triggers when a dose passes {circle.autonomySettings.escalationGraceMinutes}m
                  grace window.
                </p>
              </button>

              <button
                type="button"
                onClick={() => void handleTriggerEmailReminder('upcoming_dose')}
                disabled={emailSending !== null}
                className="rounded-2xl border-2 border-teal-200 bg-teal-50/70 hover:bg-teal-100 p-4 text-left transition space-y-1"
              >
                <div className="text-xs font-extrabold uppercase text-teal-800">
                  Gentle Nudge
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  ⏰ Send Upcoming Dose Reminder
                </div>
                <p className="text-xs text-slate-600">
                  Proactive email 15–30m before scheduled medication time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => void handleTriggerEmailReminder('appointment_reminder')}
                disabled={emailSending !== null}
                className="rounded-2xl border-2 border-blue-200 bg-blue-50/70 hover:bg-blue-100 p-4 text-left transition space-y-1"
              >
                <div className="text-xs font-extrabold uppercase text-blue-800">
                  Clinic Prep + Maps
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  📅 Send Doctor Appointment Email
                </div>
                <p className="text-xs text-slate-600">
                  Includes prep checklist & Google Maps clinic directions link.
                </p>
              </button>

              <button
                type="button"
                onClick={() => void handleTriggerEmailReminder('low_refill')}
                disabled={emailSending !== null}
                className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 hover:bg-amber-100 p-4 text-left transition space-y-1"
              >
                <div className="text-xs font-extrabold uppercase text-amber-900">
                  Inventory Guard
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  💊 Send Low-Refill Stock Warning
                </div>
                <p className="text-xs text-slate-600">
                  Alerts caretaker that Shelcal 500 has only 4 tablets left.
                </p>
              </button>
            </div>
          </div>

          {/* Email Outbox & Audit Trail */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Proactive Email Delivery Outbox & Idempotency Audit Log ({circle.emailReminders.length})
            </h3>
            <div className="space-y-3">
              {circle.emailReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-teal-900 px-2.5 py-0.5 text-xs font-bold text-white uppercase">
                        {rem.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Key: {rem.idempotencyKey}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        • {new Date(rem.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      {rem.subject}
                    </div>
                    <p className="text-xs text-slate-700">{rem.bodyPreview}</p>
                    <div className="text-xs text-slate-500">
                      Recipients: <strong>{rem.recipientEmails.join(', ')}</strong> • Transport:{' '}
                      <code className="font-mono">{rem.transport}</code>
                    </div>
                  </div>

                  {rem.previewUrl && (
                    <a
                      href={rem.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2.5 text-xs font-extrabold text-white shadow transition"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      View Live Rendered Email
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: APPOINTMENTS, VITALS & SHARED CARE JOURNAL */}
      {activeTab === 'appointments_vitals' && (
        <section aria-label="Appointments, Vitals and Shared Care Journal" className="space-y-6">
          {/* Appointments Section */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Upcoming Doctor Appointments & Preparation Checklists
                </h2>
                <p className="text-sm text-slate-600">
                  Integrated with Google Calendar, RFC-5545 .ics export, and Google Maps clinic
                  navigation.
                </p>
              </div>
              {canEditSchedule && (
                <button
                  type="button"
                  onClick={() => setShowAddAppt(!showAddAppt)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-xs font-extrabold text-white transition"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{showAddAppt ? 'Close Form' : 'Schedule Appointment'}</span>
                </button>
              )}
            </div>

            {showAddAppt && (
              <form
                onSubmit={(e) => void handleCreateAppointment(e)}
                className="rounded-2xl bg-slate-50 border-2 border-teal-500 p-5 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="appt-doc" className="block text-xs font-bold text-slate-700 mb-1">
                      Doctor Name *
                    </label>
                    <input
                      id="appt-doc"
                      type="text"
                      required
                      value={apptDoctor}
                      onChange={(e) => setApptDoctor(e.target.value)}
                      placeholder="Dr. Arvind Kumar"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="appt-spec" className="block text-xs font-bold text-slate-700 mb-1">
                      Specialty *
                    </label>
                    <input
                      id="appt-spec"
                      type="text"
                      required
                      value={apptSpecialty}
                      onChange={(e) => setApptSpecialty(e.target.value)}
                      placeholder="Ophthalmology / Retina Check"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="appt-dt" className="block text-xs font-bold text-slate-700 mb-1">
                      Date & Time *
                    </label>
                    <input
                      id="appt-dt"
                      type="datetime-local"
                      required
                      value={apptDateTime}
                      onChange={(e) => setApptDateTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="appt-clinic" className="block text-xs font-bold text-slate-700 mb-1">
                      Hospital / Clinic Name *
                    </label>
                    <input
                      id="appt-clinic"
                      type="text"
                      required
                      value={apptClinic}
                      onChange={(e) => setApptClinic(e.target.value)}
                      placeholder="LV Prasad Eye Institute"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="appt-addr" className="block text-xs font-bold text-slate-700 mb-1">
                      Clinic Address *
                    </label>
                    <input
                      id="appt-addr"
                      type="text"
                      required
                      value={apptAddress}
                      onChange={(e) => setApptAddress(e.target.value)}
                      placeholder="Banjara Hills, Hyderabad"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="appt-prep" className="block text-xs font-bold text-slate-700 mb-1">
                      Prep Checklist (comma-separated)
                    </label>
                    <input
                      id="appt-prep"
                      type="text"
                      value={apptPrepText}
                      onChange={(e) => setApptPrepText(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-extrabold text-white"
                >
                  Save Appointment
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circle.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-2xl border-2 border-slate-200 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-extrabold text-blue-950">
                        📅 {new Date(appt.dateTime).toLocaleDateString()} at{' '}
                        {new Date(appt.dateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {appt.doctorName}
                    </h3>
                    <div className="text-xs font-bold text-teal-800">{appt.specialty}</div>
                    <div className="text-xs text-slate-600">
                      📍 {appt.clinicName} — {appt.clinicAddress}
                    </div>

                    <div className="pt-2 space-y-1.5">
                      <div className="text-xs font-extrabold uppercase text-slate-500">
                        Pre-Visit Preparation Checklist:
                      </div>
                      {appt.prepChecklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => void handleTogglePrepChecklist(appt.id, item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-700"
                          />
                          <span className={item.completed ? 'line-through text-slate-400' : ''}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                    <a
                      href={buildGoogleCalendarAppointmentUrl(appt, circle.elderName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 px-3 py-2 text-xs font-bold text-teal-950"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      Google Calendar
                    </a>

                    <a
                      href={buildGoogleMapsDirectionsUrl(appt.clinicName, appt.clinicAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 px-3 py-2 text-xs font-bold text-blue-950"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Google Maps
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownloadIcs(appt)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      .ICS File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals & Shared Care Journal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vitals Log */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h3 className="text-xl font-extrabold text-slate-900">
                  Daily Vitals & Routine Tracker
                </h3>
              </div>

              <form onSubmit={(e) => void handleAddVital(e)} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  aria-label="Vital Type"
                  value={vitalType}
                  onChange={(e) => {
                    const t = e.target.value as VitalType;
                    setVitalType(t);
                    setVitalUnit(
                      t === 'blood_pressure'
                        ? 'mmHg'
                        : t === 'blood_glucose'
                          ? 'mg/dL'
                          : t === 'hydration'
                            ? 'glasses'
                            : 'bpm'
                    );
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                >
                  <option value="blood_pressure">Blood Pressure</option>
                  <option value="blood_glucose">Blood Glucose</option>
                  <option value="heart_rate">Heart Rate</option>
                  <option value="hydration">Hydration</option>
                </select>
                <input
                  type="text"
                  aria-label="Vital Value"
                  value={vitalValue}
                  onChange={(e) => setVitalValue(e.target.value)}
                  placeholder={`Value (${vitalUnit})`}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-extrabold text-white"
                >
                  + Log Vital
                </button>
              </form>

              <div className="space-y-2.5">
                {circle.vitals.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-extrabold uppercase text-slate-500">
                        {v.type.replace('_', ' ')}
                      </div>
                      <div className="text-base font-extrabold text-slate-900">
                        {v.value} <span className="text-xs font-normal">{v.unit}</span>
                      </div>
                      {v.notes && <div className="text-xs text-slate-600">{v.notes}</div>}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{v.recordedBy}</div>
                      <div>{new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Care Circle Journal */}
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-indigo-700" aria-hidden="true" />
                <h3 className="text-xl font-extrabold text-slate-900">
                  Shared Care Circle Journal
                </h3>
              </div>

              <form onSubmit={(e) => void handleAddCareNote(e)} className="space-y-2.5">
                <div className="flex gap-2">
                  <select
                    aria-label="Care Note Category"
                    value={noteCategory}
                    onChange={(e) =>
                      setNoteCategory(e.target.value as typeof noteCategory)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                  >
                    <option value="observation">Daily Observation</option>
                    <option value="encouragement">Family Encouragement ❤️</option>
                    <option value="symptom">Symptom Note</option>
                    <option value="question_for_doctor">Question for Doctor</option>
                  </select>
                  <input
                    type="text"
                    aria-label="Care Note Message"
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    placeholder="Share an update with the Care Circle..."
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-700 hover:bg-indigo-800 px-4 py-2 text-xs font-extrabold text-white"
                  >
                    Post
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                {circle.careNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">
                        {note.authorName} ({note.role.toUpperCase()})
                      </span>
                      <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
                        {note.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800">{note.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
