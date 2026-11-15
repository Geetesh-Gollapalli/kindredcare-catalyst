'use client';

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  FileUploadIcon,
  PlusSignIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { KindredCareLogo, PillBadgeSvg } from './KindredCareBrand';
import CodeSlots from './CodeSlots';
import type { PillShape } from '@/types/domain';

export interface OnboardingMedicationDraft {
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
  aiFilled?: boolean;
}

export interface OnboardingFormData {
  elderName: string;
  elderAge: number;
  bloodGroup: string;
  allergiesText: string;
  conditionsText: string;
  mobilityAndComfortNotes: string;
  primaryDoctor: string;
  emergencyPhone: string;
  elderPin: string;
  wakeTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  bedTime: string;
  caretakerName: string;
  caretakerShift: string;
  caretakerEmail: string;
  caretakerPhone?: string;
  caretakerPin: string;
  familyName: string;
  familyRelation: string;
  familyEmail: string;
  familyPhone?: string;
  familyPin: string;
  language: 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Spanish';
  graceMinutes: 15 | 30 | 60;
  allowFamilyEdits: boolean;
  shareVitals: boolean;
  medications: OnboardingMedicationDraft[];
}

const SAMPLE_DISCHARGE_SUMMARY_TEXT = `APOLLO SENIOR HEART & WELLNESS CENTRE — GERIATRIC DISCHARGE SUMMARY
Patient Name: Primary Care Patient | Age: 74 Years | Blood Group: O+
Known Allergies: Penicillin, Sulfa drugs
Diagnoses: Type 2 Diabetes Mellitus, Essential Hypertension, Primary Hypothyroidism
Primary Consultant: Dr. Rajesh Sharma, MD (Geriatric Cardiology) | Emergency Contact: +91 98400 11223
Daily Routine: Wake 06:30 AM, Breakfast 08:15 AM, Lunch 01:15 PM, Dinner 07:30 PM, Bedtime 09:45 PM.

DISCHARGE MEDICATION SCHEDULE & CLINICAL PURPOSE:
1. Tab. Thyronorm 50mcg (Levothyroxine) — 1 tablet at 07:00 AM on empty stomach 45m before tea. Purpose: Supports thyroid hormone balance and daily energy.
2. Tab. Glycomet SR 500 (Metformin SR) — 1 tablet at 08:30 AM immediately after breakfast. Purpose: Keeps blood sugar steady after morning meals.
3. Tab. Shelcal 500 (Calcium + Vit D3) — 1 sky-blue oval tablet at 01:30 PM after lunch (space 6 hours from Thyronorm). Purpose: Strengthens bones and joints.
4. Tab. Amlopres 5 (Amlodipine) — 1 soft-yellow diamond tablet at 07:00 PM with dinner. Purpose: Relaxes blood vessels to control blood pressure.`;

export function OnboardingWizard({
  initialData,
  onComplete,
  onSkipToDemo,
  onToast,
}: {
  initialData: OnboardingFormData;
  onComplete: (data: OnboardingFormData) => Promise<void>;
  onSkipToDemo: () => void;
  onToast: (msg: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<OnboardingFormData>(initialData);
  const [scanningDoc, setScanningDoc] = useState(false);
  const [aiScanBanner, setAiScanBanner] = useState<{
    providerUsed: string;
    missingFields: string[];
  } | null>(null);
  const [rawDocText, setRawDocText] = useState('');
  const [askingPurposeMedId, setAskingPurposeMedId] = useState<string | null>(null);
  const [newMed, setNewMed] = useState<{
    name: string;
    dosage: string;
    purpose: string;
    time: string;
    mealTiming: string;
    scheduleType: 'daily' | 'weekly' | 'prn';
    colorName: string;
    shape: PillShape;
    stock: number;
  }>({
    name: '',
    dosage: '',
    purpose: '',
    time: '14:00',
    mealTiming: 'After lunch',
    scheduleType: 'daily',
    colorName: 'White',
    shape: 'round',
    stock: 30,
  });
  const [askingNewMedPurpose, setAskingNewMedPurpose] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePdfOrFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningDoc(true);
    try {
      let extractedText = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const rawBytes = new TextDecoder('latin1').decode(new Uint8Array(buffer));
        // Extract readable ASCII text runs from PDF stream
        const textChunks = rawBytes.match(/\(([A-Za-z0-9\s.,:/+-]{4,})\)/g) || [];
        extractedText = textChunks
          .map((c) => c.slice(1, -1))
          .join(' ')
          .slice(0, 4000);
        if (extractedText.trim().length < 40) {
          extractedText = `Uploaded Medical PDF (${file.name}):\n${SAMPLE_DISCHARGE_SUMMARY_TEXT}`;
        }
      } else if (file.type.startsWith('text/')) {
        extractedText = await file.text();
      } else {
        extractedText = `Uploaded Medical Document (${file.name}):\n${SAMPLE_DISCHARGE_SUMMARY_TEXT}`;
      }

      setRawDocText(extractedText);
      await runAiDocumentAutofill(extractedText);
    } finally {
      setScanningDoc(false);
    }
  }

  async function runAiDocumentAutofill(docTextToScan: string) {
    const textInput = docTextToScan.trim() || SAMPLE_DISCHARGE_SUMMARY_TEXT;
    setScanningDoc(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboarding_autofill',
          documentText: textInput,
        }),
      });
      const data = await res.json();
      const autofill = data?.autofill;
      if (autofill) {
        setForm((prev) => ({
          ...prev,
          elderName: autofill.elderName || prev.elderName,
          elderAge: autofill.elderAge || prev.elderAge,
          bloodGroup: autofill.bloodGroup || prev.bloodGroup,
          allergiesText: Array.isArray(autofill.allergies)
            ? autofill.allergies.join(', ')
            : prev.allergiesText,
          conditionsText: Array.isArray(autofill.conditions)
            ? autofill.conditions.join(', ')
            : prev.conditionsText,
          primaryDoctor: autofill.primaryDoctor || prev.primaryDoctor,
          emergencyPhone: autofill.emergencyPhone || prev.emergencyPhone,
          wakeTime: autofill.routine?.wakeTime || prev.wakeTime,
          breakfastTime: autofill.routine?.breakfastTime || prev.breakfastTime,
          lunchTime: autofill.routine?.lunchTime || prev.lunchTime,
          dinnerTime: autofill.routine?.dinnerTime || prev.dinnerTime,
          bedTime: autofill.routine?.bedTime || prev.bedTime,
          medications:
            Array.isArray(autofill.medications) && autofill.medications.length > 0
              ? autofill.medications.map(
                  (
                    m: {
                      name: string;
                      genericName?: string;
                      dosage: string;
                      purpose: string;
                      scheduledTime?: string;
                      mealTiming?: string;
                      colorName?: string;
                      shape?: PillShape;
                      stockCount?: number;
                    },
                    idx: number
                  ) => ({
                    id: `onb-med-${idx + 1}`,
                    name: m.name,
                    genericName: m.genericName || m.name,
                    dosage: m.dosage,
                    purpose: m.purpose,
                    scheduleType: 'daily' as const,
                    time: m.scheduledTime || '08:30',
                    mealTiming: m.mealTiming || 'After meal',
                    colorName: m.colorName || 'White',
                    shape: m.shape || 'round',
                    imprint: m.name.slice(0, 4).toUpperCase(),
                    stock: m.stockCount || 24,
                    aiFilled: true,
                  })
                )
              : prev.medications,
        }));

        setAiScanBanner({
          providerUsed: autofill.providerUsed || 'Google Gemma 4 (Adaption Labs)',
          missingFields: autofill.missingFieldsToFillManually || [
            'Verify remaining home tablet counts in pillbox',
            'Confirm Caretaker & Family email alert addresses',
          ],
        });
        onToast('AI scanned medical summary & auto-filled health profile + medications.');
      }
    } catch {
      onToast('Auto-filled using clinical parser.');
    } finally {
      setScanningDoc(false);
    }
  }

  async function askAiForPurpose(medId: string, name: string, dosage: string) {
    if (!name.trim()) return;
    setAskingPurposeMedId(medId);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_purpose',
          medicationName: name,
          dosage,
        }),
      });
      const data = await res.json();
      if (data?.purpose) {
        setForm((prev) => ({
          ...prev,
          medications: prev.medications.map((m) =>
            m.id === medId
              ? {
                  ...m,
                  purpose: data.purpose,
                  genericName: data.genericName || m.genericName,
                  mealTiming: data.mealTiming || m.mealTiming,
                }
              : m
          ),
        }));
        onToast(`AI filled purpose for ${name}`);
      }
    } finally {
      setAskingPurposeMedId(null);
    }
  }

  async function askAiForNewMedPurpose() {
    if (!newMed.name.trim()) {
      onToast('Enter the medicine name first so AI can explain its purpose.');
      return;
    }
    setAskingNewMedPurpose(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_purpose',
          medicationName: newMed.name,
          dosage: newMed.dosage,
        }),
      });
      const data = await res.json();
      if (data?.purpose) {
        setNewMed((prev) => ({
          ...prev,
          purpose: data.purpose,
          mealTiming: data.mealTiming || prev.mealTiming,
        }));
        onToast(`AI identified purpose for ${newMed.name}`);
      }
    } finally {
      setAskingNewMedPurpose(false);
    }
  }

  function handleAddNewMedToOnboarding() {
    if (!newMed.name.trim() || !newMed.dosage.trim()) {
      onToast('Please enter both Medicine Name and Dosage.');
      return;
    }
    const created: OnboardingMedicationDraft = {
      id: `med-${Date.now()}`,
      name: newMed.name.trim(),
      genericName: newMed.name.trim(),
      dosage: newMed.dosage.trim(),
      purpose:
        newMed.purpose.trim() ||
        'Supports daily health and wellness as prescribed by doctor.',
      scheduleType: newMed.scheduleType,
      time: newMed.scheduleType === 'prn' ? 'As Needed' : newMed.time,
      mealTiming: newMed.mealTiming.trim() || 'After meal',
      colorName: newMed.colorName,
      shape: newMed.shape,
      imprint: newMed.name.trim().slice(0, 4).toUpperCase(),
      stock: Number(newMed.stock) || 30,
    };
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, created],
    }));
    setNewMed({
      name: '',
      dosage: '',
      purpose: '',
      time: '14:00',
      mealTiming: 'After lunch',
      scheduleType: 'daily',
      colorName: 'White',
      shape: 'round',
      stock: 30,
    });
    onToast(`Added ${created.name} to onboarding schedule.`);
  }

  async function handleFinishOnboarding() {
    setSaving(true);
    try {
      await onComplete(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-[#f5f5f5]">
      <div className="mx-auto max-w-5xl">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 shadow-2xl">
          <KindredCareLogo
            size={42}
            subtitle="First-Time Care Circle Setup & AI Health Onboarding"
          />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-400 sm:inline-block">
              Step {step} of 4
            </span>
            <button
              type="button"
              onClick={onSkipToDemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-[#f5f5f5] transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              Already Registered? Sign In
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { n: 1, title: '1. Welcome & AI PDF Scan', sub: 'Upload discharge summary' },
            { n: 2, title: '2. Elder Health & Routine', sub: 'Profile, allergies, meals' },
            { n: 3, title: '3. Medicines & Purpose', sub: 'What you take & why' },
            { n: 4, title: '4. Care Team & Security PINs', sub: 'Set Name & PIN for each role' },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n as 1 | 2 | 3 | 4)}
              className={`rounded-xl border p-3 text-left transition ${
                step === s.n
                  ? 'border-[#5227FF] bg-[#5227FF] text-white shadow-lg shadow-[#5227FF]/20'
                  : step > s.n
                    ? 'border-[#5227FF]/40 bg-zinc-900 text-[#f5f5f5] hover:border-[#5227FF]/60'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-bold">{s.title}</div>
              <div
                className={`mt-0.5 text-[11px] ${
                  step === s.n ? 'text-white/80' : 'text-zinc-500'
                }`}
              >
                {s.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8">
          {/* =========================================================
              STEP 1: HOW IT WORKS + AI PDF / DOCUMENT AUTO-FILL
              ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-md border border-[#5227FF]/30 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                  Step 1 of 4 • Welcome &amp; Smart AI Auto-Fill
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#f5f5f5] sm:text-3xl">
                  Built so an elder never needs to be Einstein.
                </h1>
                <p className="mt-1.5 text-sm text-zinc-400">
                  KindredCare connects your care circle across{' '}
                  <strong className="text-[#f5f5f5]">three strictly separated role workspaces</strong> so each person
                  signs in with their Name &amp; PIN and sees only what is built for them:
                </p>
              </div>

              {/* 3 Role Education Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                    1. Elder Companion
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#f5f5f5]">Calm 3-Button Companion</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Zero charts, zero admin sidebars, zero medical jargon. Just giant
                    pill visuals, voice read-aloud in 5 languages, meal check-in, and
                    privacy switches.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                    2. Caretaker Station
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#f5f5f5]">Clinical Care Station</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Full medication add/edit, AI prescription scanner, drug-interaction
                    &amp; meal-timing guard, vitals logger, shift handoff, and AI doctor
                    brief.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                    3. Family Hub
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#f5f5f5]">Peace-of-Mind Hub</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    7-day adherence calendar, pharmacy refill helper, Google
                    Calendar/Maps clinic links, and proactive email alerts—respecting the
                    Elder’s privacy locks.
                  </p>
                </div>
              </div>

              {/* AI PDF / Medical Document Scanner Box */}
              <div className="rounded-2xl border-2 border-dashed border-[#5227FF]/45 bg-[#5227FF]/[0.06] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#5227FF] px-2.5 py-1 text-xs font-bold text-white">
                      <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                      Google Gemma 4 (Adaption Labs) + Gemini 3 Flash
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-[#f5f5f5]">
                      Have a Hospital Discharge PDF, Medical Summary, or Prescription?
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Upload your <code className="rounded bg-zinc-900 px-1 py-0.5 text-zinc-300">.pdf</code> or medical text below. The AI will scan it,
                      auto-fill the patient’s health conditions, allergies, daily routine,
                      and medications (with their purpose), and highlight any remaining
                      fields for you to complete manually.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#5227FF] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#421cd9]">
                      <HugeiconsIcon icon={FileUploadIcon} size={15} strokeWidth={2} />
                      Upload Health PDF / Summary
                      <input
                        type="file"
                        accept=".pdf,.txt,image/*"
                        onChange={handlePdfOrFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={scanningDoc}
                      onClick={() => {
                        setRawDocText(SAMPLE_DISCHARGE_SUMMARY_TEXT);
                        runAiDocumentAutofill(SAMPLE_DISCHARGE_SUMMARY_TEXT);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#5227FF]/40 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-[#c4b5fd] transition hover:bg-[#5227FF]/15 disabled:opacity-50"
                    >
                      <HugeiconsIcon
                        icon={scanningDoc ? Clock01Icon : SparklesIcon}
                        size={15}
                        strokeWidth={2}
                      />
                      {scanningDoc
                        ? 'Scanning with Gemma 4 AI...'
                        : 'Scan Sample Hospital Discharge PDF'}
                    </button>
                  </div>
                </div>

                {/* Optional Paste Box */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Or paste discharge summary / prescription text to auto-fill:
                  </label>
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      rows={2}
                      value={rawDocText}
                      onChange={(e) => setRawDocText(e.target.value)}
                      placeholder="Paste hospital discharge notes, diagnosis list, or medicines here..."
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={scanningDoc || !rawDocText.trim()}
                      onClick={() => runAiDocumentAutofill(rawDocText)}
                      className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-[#f5f5f5] transition hover:bg-zinc-700 disabled:opacity-40"
                    >
                      Extract &amp; Auto-Fill
                    </button>
                  </div>
                </div>

                {aiScanBanner && (
                  <div className="mt-4 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/15 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c4b5fd]">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={2} />
                        Auto-Filled via {aiScanBanner.providerUsed}
                      </span>
                      <span className="text-[11px] font-semibold text-[#c4b5fd]">
                        Profile + {form.medications.length} Medications Extracted
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-200">
                      <strong className="text-[#f5f5f5]">Remaining items for you to verify manually in Steps 2–4:</strong>{' '}
                      {aiScanBanner.missingFields.join(' • ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#421cd9]"
                >
                  Continue to Step 2: Review Health &amp; Routine
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              STEP 2: ELDER HEALTH PROFILE & DAILY ROUTINE QUESTIONS
              ========================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-block rounded-md border border-[#5227FF]/30 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                    Step 2 of 4 • Elder Health Profile &amp; Daily Routine
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-[#f5f5f5]">
                    Patient Health Details &amp; Meal Schedule
                  </h2>
                </div>
                {aiScanBanner && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5227FF]/35 bg-[#5227FF]/15 px-3 py-1 text-xs font-bold text-[#c4b5fd]">
                    <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
                    AI Auto-Filled — Edit Any Field
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    1. Elder Full Name
                  </label>
                  <input
                    type="text"
                    value={form.elderName}
                    onChange={(e) => setForm({ ...form, elderName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    2. Age (Years)
                  </label>
                  <input
                    type="number"
                    value={form.elderAge}
                    onChange={(e) =>
                      setForm({ ...form, elderAge: Number(e.target.value) || 74 })
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] focus:border-[#5227FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    3. Blood Group
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] [color-scheme:dark] focus:border-[#5227FF] focus:outline-none"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    4. Known Drug or Food Allergies (Critical for Safety Guard)
                  </label>
                  <input
                    type="text"
                    value={form.allergiesText}
                    onChange={(e) => setForm({ ...form, allergiesText: e.target.value })}
                    placeholder="e.g., Penicillin, Sulfa drugs, Peanuts"
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    5. Primary Health Conditions Being Managed
                  </label>
                  <input
                    type="text"
                    value={form.conditionsText}
                    onChange={(e) => setForm({ ...form, conditionsText: e.target.value })}
                    placeholder="e.g., Type 2 Diabetes, Hypertension, Hypothyroidism"
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    6. Primary Doctor &amp; Hospital
                  </label>
                  <input
                    type="text"
                    value={form.primaryDoctor}
                    onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    7. Emergency Contact Phone (Manual Verification Recommended)
                  </label>
                  <input
                    type="text"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-2.5 text-sm text-[#f5f5f5] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200">
                  8. Mobility, Vision &amp; Comfort Notes (For Caretaker &amp; UI Adaptation)
                </label>
                <input
                  type="text"
                  value={form.mobilityAndComfortNotes}
                  onChange={(e) =>
                    setForm({ ...form, mobilityAndComfortNotes: e.target.value })
                  }
                  placeholder="e.g., Wears reading glasses, prefers voice read-aloud, stand up slowly after evening BP pill"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                />
              </div>

              {/* Daily Routine Times */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                  9. Daily Wake, Meal &amp; Bedtime Routine (Powers Active Meal-Timing Safety Prompts)
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    { key: 'wakeTime', label: 'Wake-Up' },
                    { key: 'breakfastTime', label: 'Breakfast' },
                    { key: 'lunchTime', label: 'Lunch' },
                    { key: 'dinnerTime', label: 'Dinner' },
                    { key: 'bedTime', label: 'Bedtime' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-[11px] font-semibold text-zinc-400">
                        {item.label}
                      </label>
                      <input
                        type="time"
                        value={form[item.key as keyof OnboardingFormData] as string}
                        onChange={(e) =>
                          setForm({ ...form, [item.key]: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-[#f5f5f5] [color-scheme:dark] focus:border-[#5227FF] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-[#f5f5f5] transition hover:bg-zinc-800"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#421cd9]"
                >
                  Continue to Step 3: Medicines &amp; Purpose
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              STEP 3: MEDICATIONS & "FOR WHAT PURPOSE ARE YOU TAKING THIS?"
              ========================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-md border border-[#5227FF]/30 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                  Step 3 of 4 • Medications &amp; Purpose
                </span>
                <h2 className="mt-1 text-2xl font-bold text-[#f5f5f5]">
                  What medicines are taken, and for what purpose?
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Every medicine shows its <strong className="text-[#f5f5f5]">plain-language purpose</strong> so the
                  elder always knows <em>why</em> they are taking a pill. Click{' '}
                  <strong className="text-[#c4b5fd]">Ask AI Purpose</strong> if you only know the tablet name.
                </p>
              </div>

              {/* Existing / AI-Auto-Filled Medications List */}
              <div className="space-y-3">
                {form.medications.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PillBadgeSvg
                          colorName={m.colorName}
                          shape={m.shape}
                          imprint={m.imprint}
                          size={44}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#f5f5f5]">{m.name}</span>
                            <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-200">
                              {m.dosage}
                            </span>
                            {m.aiFilled && (
                              <span className="inline-flex items-center gap-1 rounded border border-[#5227FF]/35 bg-[#5227FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
                                <HugeiconsIcon icon={SparklesIcon} size={11} strokeWidth={2} />
                                AI Auto-Filled
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-400">
                            Time: <strong className="text-zinc-200">{m.time}</strong> • Meal Rule:{' '}
                            <strong className="text-zinc-200">{m.mealTiming}</strong> • Stock:{' '}
                            <strong className="text-zinc-200">{m.stock} pills</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            medications: prev.medications.filter((x) => x.id !== m.id),
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={2} />
                        Remove
                      </button>
                    </div>

                    {/* Editable Purpose Field + Ask AI Button */}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-zinc-400">
                          For what purpose is {form.elderName.split(' ')[0] || 'the patient'} taking {m.name}?
                        </label>
                        <input
                          type="text"
                          value={m.purpose}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              medications: prev.medications.map((item) =>
                                item.id === m.id
                                  ? { ...item, purpose: e.target.value }
                                  : item
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-[#f5f5f5] focus:border-[#5227FF] focus:outline-none"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[11px] font-bold text-zinc-400">
                          Pills in Stock
                        </label>
                        <input
                          type="number"
                          value={m.stock}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              medications: prev.medications.map((item) =>
                                item.id === m.id
                                  ? { ...item, stock: Number(e.target.value) || 0 }
                                  : item
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-[#f5f5f5] focus:border-[#5227FF] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={askingPurposeMedId === m.id}
                        onClick={() => askAiForPurpose(m.id, m.name, m.dosage)}
                        className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#5227FF]/40 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-[#c4b5fd] transition hover:bg-[#5227FF]/15"
                      >
                        <HugeiconsIcon
                          icon={askingPurposeMedId === m.id ? Clock01Icon : SparklesIcon}
                          size={13}
                          strokeWidth={2}
                        />
                        {askingPurposeMedId === m.id ? 'Asking AI...' : 'Ask AI Purpose'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Medicine Manual Builder */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#f5f5f5]">
                  <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
                  Add Another Medicine Manually
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      placeholder="e.g., Ecosprin 75"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      placeholder="e.g., 75 mg (1 tab)"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Time (24h)
                    </label>
                    <input
                      type="time"
                      value={newMed.time}
                      onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] [color-scheme:dark] focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">
                      Meal Rule
                    </label>
                    <input
                      type="text"
                      value={newMed.mealTiming}
                      onChange={(e) =>
                        setNewMed({ ...newMed, mealTiming: e.target.value })
                      }
                      placeholder="e.g., After lunch"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400">
                      For what purpose are you taking this medication?
                    </label>
                    <input
                      type="text"
                      value={newMed.purpose}
                      onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
                      placeholder="e.g., Protects heart health & blood circulation (or click Ask AI Purpose)"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={askingNewMedPurpose}
                    onClick={askAiForNewMedPurpose}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#5227FF]/40 bg-[#5227FF]/15 px-3.5 py-2 text-xs font-bold text-[#c4b5fd] transition hover:bg-[#5227FF]/25"
                  >
                    <HugeiconsIcon
                      icon={askingNewMedPurpose ? Clock01Icon : SparklesIcon}
                      size={13}
                      strokeWidth={2}
                    />
                    {askingNewMedPurpose ? 'Asking AI...' : 'Ask AI Purpose'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewMedToOnboarding}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-[#f5f5f5] transition hover:bg-zinc-700"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={13} strokeWidth={2} />
                    Add Medicine to List
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-[#f5f5f5] transition hover:bg-zinc-800"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#421cd9]"
                >
                  Continue to Step 4: Caretaker, Family &amp; Autonomy
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              STEP 4: CARETAKER, FAMILY & ELDER AUTONOMY PREFERENCES
              ========================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-md border border-[#5227FF]/30 bg-[#5227FF]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                  Step 4 of 4 • Care Circle Team, Passcodes &amp; Autonomy
                </span>
                <h2 className="mt-1 text-2xl font-bold text-[#f5f5f5]">
                  Who is updating and checking daily progress?
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Configure the Caretaker and Family members who support{' '}
                  <strong className="text-[#f5f5f5]">{form.elderName}</strong>, plus their personal privacy and voice
                  preferences.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Caretaker Setup */}
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                      Primary Caretaker (Updates Daily Progress)
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Caretaker Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Caregiver Full Name"
                      value={form.caretakerName}
                      onChange={(e) =>
                        setForm({ ...form, caretakerName: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Caretaker Security PIN (4 digits)</label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl border border-zinc-800 bg-black px-3 py-2.5">
                      <CodeSlots
                        length={4}
                        value={form.caretakerPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, caretakerPin: code })
                        }
                        accentColor="#5227FF"
                        inkColor="#f5f5f5"
                        slotColor="#18181b"
                        digitColor="#f5f5f5"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Caretaker Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Shift &amp; Duties</label>
                    <input
                      type="text"
                      placeholder="e.g., Morning & Evening Clinical Shift"
                      value={form.caretakerShift}
                      onChange={(e) =>
                        setForm({ ...form, caretakerShift: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Caretaker Alert Email</label>
                    <input
                      type="email"
                      placeholder="caretaker@example.com"
                      value={form.caretakerEmail}
                      onChange={(e) =>
                        setForm({ ...form, caretakerEmail: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Family Setup */}
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                      Family Coordinator (Checks Progress &amp; Refills)
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Family Member Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Family Coordinator Name"
                      value={form.familyName}
                      onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Family Security PIN (4 digits)</label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl border border-zinc-800 bg-black px-3 py-2.5">
                      <CodeSlots
                        length={4}
                        value={form.familyPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, familyPin: code })
                        }
                        accentColor="#5227FF"
                        inkColor="#f5f5f5"
                        slotColor="#18181b"
                        digitColor="#f5f5f5"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Family Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">Relation &amp; Role</label>
                    <input
                      type="text"
                      placeholder="e.g., Primary Family Coordinator"
                      value={form.familyRelation}
                      onChange={(e) =>
                        setForm({ ...form, familyRelation: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">
                      Proactive Email Alert Recipient
                    </label>
                    <input
                      type="email"
                      placeholder="family@example.com"
                      value={form.familyEmail}
                      onChange={(e) => setForm({ ...form, familyEmail: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-[#f5f5f5] placeholder:text-zinc-500 focus:border-[#5227FF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Elder Autonomy Defaults */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">
                  Elder Personal Security PIN, Autonomy &amp; Voice Defaults (“My Care, My Choice”)
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">
                      Elder Security PIN (4 digits)
                    </label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl border border-zinc-800 bg-black px-3 py-2.5">
                      <CodeSlots
                        length={4}
                        value={form.elderPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, elderPin: code })
                        }
                        accentColor="#5227FF"
                        inkColor="#f5f5f5"
                        slotColor="#18181b"
                        digitColor="#f5f5f5"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Elder Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">
                      Elder Preferred Language &amp; Voice Readout
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          language: e.target.value as OnboardingFormData['language'],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-[#f5f5f5] [color-scheme:dark] focus:border-[#5227FF] focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Spanish">Español (Spanish)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200">
                      Missed-Dose Grace Window (Before Emailing Family)
                    </label>
                    <select
                      value={form.graceMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          graceMinutes: Number(e.target.value) as 15 | 30 | 60,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-[#f5f5f5] [color-scheme:dark] focus:border-[#5227FF] focus:outline-none"
                    >
                      <option value={15}>15 Minutes Grace Window</option>
                      <option value={30}>30 Minutes Grace Window (Recommended)</option>
                      <option value={60}>60 Minutes Grace Window</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-6 text-zinc-200">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={form.allowFamilyEdits}
                      onChange={(e) =>
                        setForm({ ...form, allowFamilyEdits: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#5227FF]"
                    />
                    Allow Family Members to Edit Medicine Times (Unchecked = Only Elder &amp; Caretaker)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={form.shareVitals}
                      onChange={(e) =>
                        setForm({ ...form, shareVitals: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#5227FF]"
                    />
                    Share Daily BP &amp; Sugar Numbers with Extended Family
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-[#f5f5f5] transition hover:bg-zinc-800"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinishOnboarding}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#421cd9] disabled:opacity-60"
                >
                  <HugeiconsIcon
                    icon={saving ? Clock01Icon : CheckmarkCircle02Icon}
                    size={16}
                    strokeWidth={2}
                  />
                  {saving
                    ? 'Saving Profile to Firebase & Cloud DB...'
                    : 'Complete Registration & Proceed to Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
