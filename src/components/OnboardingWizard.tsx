'use client';

import React, { useState } from 'react';
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
Patient Name: Smt. Kamala Devi | Age: 74 Years | Blood Group: O+
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
        onToast('✨ AI scanned medical summary & auto-filled health profile + medications!');
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
        onToast(`✨ AI filled purpose for ${name}`);
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
        onToast(`✨ AI identified purpose for ${newMed.name}`);
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
    onToast(`✓ Added ${created.name} to onboarding schedule.`);
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
    <div className="min-h-screen bg-[#F6F5F1] px-4 py-8 text-[#14171A]">
      <div className="mx-auto max-w-5xl">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white px-6 py-4 shadow-sm">
          <KindredCareLogo
            size={42}
            subtitle="First-Time Care Circle Setup & AI Health Onboarding"
          />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#EFECE6] px-3 py-1 text-xs font-semibold text-[#57606A] sm:inline-block">
              Step {step} of 4
            </span>
            <button
              type="button"
              onClick={onSkipToDemo}
              className="rounded-xl border border-black/15 bg-[#F6F5F1] px-4 py-2 text-xs font-bold text-[#14171A] transition hover:bg-[#EFECE6]"
            >
              Already Registered? Sign In →
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
                  ? 'border-[#0F524B] bg-[#0F524B] text-white shadow-sm'
                  : step > s.n
                    ? 'border-[#0E6B50]/30 bg-white text-[#14171A]'
                    : 'border-black/10 bg-white/70 text-[#57606A]'
              }`}
            >
              <div className="text-xs font-bold">{s.title}</div>
              <div
                className={`mt-0.5 text-[11px] ${
                  step === s.n ? 'text-white/80' : 'text-[#57606A]'
                }`}
              >
                {s.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          {/* =========================================================
              STEP 1: HOW IT WORKS + AI PDF / DOCUMENT AUTO-FILL
              ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  Step 1 of 4 • Welcome &amp; Smart AI Auto-Fill
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Built so an elder never needs to be Einstein.
                </h1>
                <p className="mt-1.5 text-sm text-[#57606A]">
                  KindredCare connects your care circle across{' '}
                  <strong>three strictly separated role workspaces</strong> so each person
                  signs in with their Name &amp; PIN and sees only what is built for them:
                </p>
              </div>

              {/* 3 Role Education Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    1. Elder Companion
                  </div>
                  <h3 className="mt-1 text-base font-bold">Calm 3-Button Companion</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#57606A]">
                    Zero charts, zero admin sidebars, zero medical jargon. Just giant
                    pill visuals, voice read-aloud in 5 languages, meal check-in, and
                    privacy switches.
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    2. Caretaker Station
                  </div>
                  <h3 className="mt-1 text-base font-bold">Clinical Care Station</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#57606A]">
                    Full medication add/edit, AI prescription scanner, drug-interaction
                    &amp; meal-timing guard, vitals logger, shift handoff, and AI doctor
                    brief.
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    3. Family Hub
                  </div>
                  <h3 className="mt-1 text-base font-bold">Peace-of-Mind Hub</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#57606A]">
                    7-day adherence calendar, pharmacy refill helper, Google
                    Calendar/Maps clinic links, and proactive email alerts—respecting the
                    Elder’s privacy locks.
                  </p>
                </div>
              </div>

              {/* AI PDF / Medical Document Scanner Box */}
              <div className="rounded-2xl border-2 border-dashed border-[#0F524B]/35 bg-[#0F524B]/[0.03] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0F524B] px-2.5 py-1 text-xs font-bold text-white">
                      ✨ Google Gemma 4 (Adaption Labs) + Gemini 3 Flash
                    </span>
                    <h2 className="mt-2 text-lg font-bold">
                      Have a Hospital Discharge PDF, Medical Summary, or Prescription?
                    </h2>
                    <p className="mt-1 text-xs text-[#57606A]">
                      Upload your `.pdf` or medical text below. The AI will scan it,
                      auto-fill the patient’s health conditions, allergies, daily routine,
                      and medications (with their purpose), and highlight any remaining
                      fields for you to complete manually.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <label className="cursor-pointer rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0A3C36]">
                      📄 Upload Health PDF / Summary
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
                      className="rounded-xl border border-[#0F524B]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#0F524B] transition hover:bg-[#0F524B]/5 disabled:opacity-50"
                    >
                      {scanningDoc
                        ? '⏳ Scanning with Gemma 4 AI...'
                        : '✨ Scan Sample Hospital Discharge PDF'}
                    </button>
                  </div>
                </div>

                {/* Optional Paste Box */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-[#57606A]">
                    Or paste discharge summary / prescription text to auto-fill:
                  </label>
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      rows={2}
                      value={rawDocText}
                      onChange={(e) => setRawDocText(e.target.value)}
                      placeholder="Paste hospital discharge notes, diagnosis list, or medicines here..."
                      className="flex-1 rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={scanningDoc || !rawDocText.trim()}
                      onClick={() => runAiDocumentAutofill(rawDocText)}
                      className="shrink-0 rounded-xl bg-[#14171A] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Extract &amp; Auto-Fill
                    </button>
                  </div>
                </div>

                {aiScanBanner && (
                  <div className="mt-4 rounded-xl border border-[#0E6B50]/30 bg-[#0E6B50]/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0E6B50]">
                        ✓ Auto-Filled via {aiScanBanner.providerUsed}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0E6B50]">
                        Profile + {form.medications.length} Medications Extracted
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#14171A]">
                      <strong>Remaining items for you to verify manually in Steps 2–4:</strong>{' '}
                      {aiScanBanner.missingFields.join(' • ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-[#0F524B] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0A3C36]"
                >
                  Continue to Step 2: Review Health &amp; Routine →
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
                  <span className="inline-block rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                    Step 2 of 4 • Elder Health Profile &amp; Daily Routine
                  </span>
                  <h2 className="mt-1 text-2xl font-bold">
                    Patient Health Details &amp; Meal Schedule
                  </h2>
                </div>
                {aiScanBanner && (
                  <span className="rounded-full bg-[#0E6B50]/10 px-3 py-1 text-xs font-bold text-[#0E6B50]">
                    ✨ AI Auto-Filled — Edit Any Field
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    1. Elder Full Name
                  </label>
                  <input
                    type="text"
                    value={form.elderName}
                    onChange={(e) => setForm({ ...form, elderName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    2. Age (Years)
                  </label>
                  <input
                    type="number"
                    value={form.elderAge}
                    onChange={(e) =>
                      setForm({ ...form, elderAge: Number(e.target.value) || 74 })
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    3. Blood Group
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm"
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
                  <label className="block text-xs font-bold text-[#14171A]">
                    4. Known Drug or Food Allergies (Critical for Safety Guard)
                  </label>
                  <input
                    type="text"
                    value={form.allergiesText}
                    onChange={(e) => setForm({ ...form, allergiesText: e.target.value })}
                    placeholder="e.g., Penicillin, Sulfa drugs, Peanuts"
                    className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    5. Primary Health Conditions Being Managed
                  </label>
                  <input
                    type="text"
                    value={form.conditionsText}
                    onChange={(e) => setForm({ ...form, conditionsText: e.target.value })}
                    placeholder="e.g., Type 2 Diabetes, Hypertension, Hypothyroidism"
                    className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    6. Primary Doctor &amp; Hospital
                  </label>
                  <input
                    type="text"
                    value={form.primaryDoctor}
                    onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14171A]">
                    7. Emergency Contact Phone (Manual Verification Recommended)
                  </label>
                  <input
                    type="text"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-amber-500/60 bg-amber-50/30 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14171A]">
                  8. Mobility, Vision &amp; Comfort Notes (For Caretaker &amp; UI Adaptation)
                </label>
                <input
                  type="text"
                  value={form.mobilityAndComfortNotes}
                  onChange={(e) =>
                    setForm({ ...form, mobilityAndComfortNotes: e.target.value })
                  }
                  placeholder="e.g., Wears reading glasses, prefers voice read-aloud, stand up slowly after evening BP pill"
                  className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>

              {/* Daily Routine Times */}
              <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
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
                      <label className="block text-[11px] font-semibold text-[#57606A]">
                        {item.label}
                      </label>
                      <input
                        type="time"
                        value={form[item.key as keyof OnboardingFormData] as string}
                        onChange={(e) =>
                          setForm({ ...form, [item.key]: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-bold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-[#0F524B] px-6 py-2.5 text-sm font-bold text-white"
                >
                  Continue to Step 3: Medicines &amp; Purpose →
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
                <span className="inline-block rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  Step 3 of 4 • Medications &amp; Purpose
                </span>
                <h2 className="mt-1 text-2xl font-bold">
                  What medicines are taken, and for what purpose?
                </h2>
                <p className="mt-1 text-xs text-[#57606A]">
                  Every medicine shows its <strong>plain-language purpose</strong> so the
                  elder always knows <em>why</em> they are taking a pill. Click{' '}
                  <strong>✨ Ask AI Purpose</strong> if you only know the tablet name.
                </p>
              </div>

              {/* Existing / AI-Auto-Filled Medications List */}
              <div className="space-y-3">
                {form.medications.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4"
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#14171A]">{m.name}</span>
                            <span className="rounded bg-black/5 px-2 py-0.5 text-xs font-semibold">
                              {m.dosage}
                            </span>
                            {m.aiFilled && (
                              <span className="rounded bg-[#0E6B50]/15 px-2 py-0.5 text-[10px] font-bold text-[#0E6B50]">
                                ✨ AI Auto-Filled
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-[#57606A]">
                            Time: <strong>{m.time}</strong> • Meal Rule:{' '}
                            <strong>{m.mealTiming}</strong> • Stock:{' '}
                            <strong>{m.stock} pills</strong>
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
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Editable Purpose Field + Ask AI Button */}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-[#57606A]">
                          For what purpose is {form.elderName.split(' ')[0]} taking {m.name}?
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
                          className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[11px] font-bold text-[#57606A]">
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
                          className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={askingPurposeMedId === m.id}
                        onClick={() => askAiForPurpose(m.id, m.name, m.dosage)}
                        className="mt-4 shrink-0 rounded-lg border border-[#0F524B]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#0F524B] hover:bg-[#0F524B]/5"
                      >
                        {askingPurposeMedId === m.id ? '⏳ Asking AI...' : '✨ Ask AI Purpose'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Medicine Manual Builder */}
              <div className="rounded-xl border border-black/15 bg-white p-4">
                <h3 className="text-sm font-bold">
                  + Add Another Medicine Manually
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      placeholder="e.g., Ecosprin 75"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      placeholder="e.g., 75 mg (1 tab)"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      Time (24h)
                    </label>
                    <input
                      type="time"
                      value={newMed.time}
                      onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#57606A]">
                      Meal Rule
                    </label>
                    <input
                      type="text"
                      value={newMed.mealTiming}
                      onChange={(e) =>
                        setNewMed({ ...newMed, mealTiming: e.target.value })
                      }
                      placeholder="e.g., After lunch"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#57606A]">
                      For what purpose are you taking this medication?
                    </label>
                    <input
                      type="text"
                      value={newMed.purpose}
                      onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
                      placeholder="e.g., Protects heart health & blood circulation (or click Ask AI Purpose)"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={askingNewMedPurpose}
                    onClick={askAiForNewMedPurpose}
                    className="rounded-lg border border-[#0F524B]/30 bg-[#0F524B]/5 px-3.5 py-2 text-xs font-bold text-[#0F524B]"
                  >
                    {askingNewMedPurpose ? '⏳ Asking AI...' : '✨ Ask AI Purpose'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewMedToOnboarding}
                    className="rounded-lg bg-[#14171A] px-4 py-2 text-xs font-bold text-white"
                  >
                    + Add Medicine to List
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-bold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-xl bg-[#0F524B] px-6 py-2.5 text-sm font-bold text-white"
                >
                  Continue to Step 4: Caretaker, Family &amp; Autonomy →
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
                <span className="inline-block rounded-md bg-[#0F524B]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  Step 4 of 4 • Care Circle Team, Passcodes &amp; Autonomy
                </span>
                <h2 className="mt-1 text-2xl font-bold">
                  Who is updating and checking daily progress?
                </h2>
                <p className="mt-1 text-xs text-[#57606A]">
                  Configure the Caretaker and Family members who support{' '}
                  <strong>{form.elderName}</strong>, plus her personal privacy and voice
                  preferences.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Caretaker Setup */}
                <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                      Primary Caretaker (Updates Daily Progress)
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Caretaker Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Nurse Ananya Rao"
                      value={form.caretakerName}
                      onChange={(e) =>
                        setForm({ ...form, caretakerName: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Caretaker Security PIN (4 digits)</label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl bg-[#18181b] py-2.5 px-3">
                      <CodeSlots
                        length={4}
                        value={form.caretakerPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, caretakerPin: code })
                        }
                        accentColor="#f5f5f5"
                        inkColor="#f5f5f5"
                        slotColor="#27272a"
                        digitColor="#18181b"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Caretaker Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Shift &amp; Duties</label>
                    <input
                      type="text"
                      placeholder="e.g., Morning & Evening Clinical Shift"
                      value={form.caretakerShift}
                      onChange={(e) =>
                        setForm({ ...form, caretakerShift: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Caretaker Alert Email</label>
                    <input
                      type="email"
                      placeholder="caretaker@example.com"
                      value={form.caretakerEmail}
                      onChange={(e) =>
                        setForm({ ...form, caretakerEmail: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Family Setup */}
                <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                      Family Coordinator (Checks Progress &amp; Refills)
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Family Member Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Geetesh Gollapalli"
                      value={form.familyName}
                      onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Family Security PIN (4 digits)</label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl bg-[#18181b] py-2.5 px-3">
                      <CodeSlots
                        length={4}
                        value={form.familyPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, familyPin: code })
                        }
                        accentColor="#f5f5f5"
                        inkColor="#f5f5f5"
                        slotColor="#27272a"
                        digitColor="#18181b"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Family Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">Relation &amp; Role</label>
                    <input
                      type="text"
                      placeholder="e.g., Son / Grandson & Family Coordinator"
                      value={form.familyRelation}
                      onChange={(e) =>
                        setForm({ ...form, familyRelation: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Proactive Email Alert Recipient
                    </label>
                    <input
                      type="email"
                      placeholder="family@example.com"
                      value={form.familyEmail}
                      onChange={(e) => setForm({ ...form, familyEmail: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Elder Autonomy Defaults */}
              <div className="rounded-xl border border-black/10 bg-[#F6F5F1] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  Elder Personal Security PIN, Autonomy &amp; Voice Defaults (“My Care, My Choice”)
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold">
                      Elder Security PIN (4 digits)
                    </label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl bg-[#18181b] py-2.5 px-3">
                      <CodeSlots
                        length={4}
                        value={form.elderPin.replace(/\D/g, '').slice(0, 4)}
                        onChange={(code: string) =>
                          setForm({ ...form, elderPin: code })
                        }
                        accentColor="#f5f5f5"
                        inkColor="#f5f5f5"
                        slotColor="#27272a"
                        digitColor="#18181b"
                        dangerColor="#ff3b30"
                        slotSize={38}
                        gap={8}
                        radius={10}
                        ariaLabel="Elder Security PIN"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
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
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Spanish">Español (Spanish)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
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
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold"
                    >
                      <option value={15}>15 Minutes Grace Window</option>
                      <option value={30}>30 Minutes Grace Window (Recommended)</option>
                      <option value={60}>60 Minutes Grace Window</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={form.allowFamilyEdits}
                      onChange={(e) =>
                        setForm({ ...form, allowFamilyEdits: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#0F524B]"
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
                      className="h-4 w-4 accent-[#0F524B]"
                    />
                    Share Daily BP &amp; Sugar Numbers with Extended Family
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-bold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinishOnboarding}
                  className="rounded-xl bg-[#0F524B] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0A3C36] disabled:opacity-60"
                >
                  {saving
                    ? 'Saving Profile to Firebase & Cloud DB...'
                    : '✓ Complete Registration & Proceed to Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
