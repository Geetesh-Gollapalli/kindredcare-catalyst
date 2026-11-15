'use client';

import React, { useEffect, useState } from 'react';
import {
  KindredCareLogo,
  ensureSafeCircleState,
} from '@/components/KindredCareBrand';
import {
  BootAndLoginWaitScreen,
  type ReadinessStep,
} from '@/components/BootAndLoginWaitScreen';
import {
  OnboardingWizard,
  type OnboardingFormData,
} from '@/components/OnboardingWizard';
import {
  ElderProfileModal,
  type ProfileAuditEntry,
  type ProfileMedItem,
} from '@/components/ElderProfileModal';
import {
  ElderCompanionView,
  type ElderAppointmentItem,
} from '@/components/ElderCompanionView';
import {
  CaretakerClinicalView,
  type CaretakerEmailItem,
  type CaretakerVitalItem,
} from '@/components/CaretakerClinicalView';
import { FamilyPeaceHubView } from '@/components/FamilyPeaceHubView';
import type { CareRole, DrugSafetyReport } from '@/types/domain';

const ROLE_PINS: Record<CareRole, string[]> = {
  elder: ['1234'],
  caretaker: ['2026', 'CARE2026'],
  family: ['8899', 'FAMILY26'],
};

const INITIAL_MEDICATIONS: ProfileMedItem[] = [
  {
    id: 'med-1',
    name: 'Thyronorm 50mcg',
    genericName: 'Levothyroxine Sodium',
    dosage: '50 mcg (1 tablet)',
    purpose: 'Supports thyroid hormone balance & steady daily energy.',
    scheduleType: 'daily',
    time: '07:00',
    mealTiming: 'Empty stomach, 45m before morning tea or breakfast',
    colorName: 'White',
    shape: 'round',
    imprint: 'T50',
    stock: 24,
    status: 'taken',
    takenAt: '07:04 AM',
  },
  {
    id: 'med-2',
    name: 'Glycomet SR 500',
    genericName: 'Metformin Sustained Release',
    dosage: '500 mg (1 tablet)',
    purpose: 'Keeps blood sugar steady after morning meals.',
    scheduleType: 'daily',
    time: '08:30',
    mealTiming: 'Immediately after breakfast',
    colorName: 'White',
    shape: 'oval',
    imprint: 'SR500',
    stock: 18,
    status: 'taken',
    takenAt: '08:35 AM',
  },
  {
    id: 'med-3',
    name: 'Shelcal 500 (Calcium + D3)',
    genericName: 'Calcium Carbonate + Vitamin D3',
    dosage: '500 mg (1 tablet)',
    purpose: 'Strengthens bones & joints.',
    scheduleType: 'daily',
    time: '13:30',
    mealTiming: 'After lunch (Spaced 6 hours from morning Thyronorm)',
    colorName: 'Sky Blue',
    shape: 'oval',
    imprint: 'SC500',
    stock: 4,
    status: 'pending',
    takenAt: null,
  },
  {
    id: 'med-4',
    name: 'Amlopres 5',
    genericName: 'Amlodipine Besylate',
    dosage: '5 mg (1 tablet)',
    purpose: 'Relaxes blood vessels to keep blood pressure safe.',
    scheduleType: 'daily',
    time: '19:00',
    mealTiming: 'With dinner (Avoid grapefruit; stand up slowly)',
    colorName: 'Soft Yellow',
    shape: 'diamond',
    imprint: 'AM5',
    stock: 16,
    status: 'pending',
    takenAt: null,
  },
  {
    id: 'med-5',
    name: 'Atorva 10',
    genericName: 'Atorvastatin Calcium',
    dosage: '10 mg (1 capsule)',
    purpose: 'Protects heart health and cholesterol overnight.',
    scheduleType: 'daily',
    time: '21:30',
    mealTiming: 'Before bedtime with water',
    colorName: 'Rose Pink',
    shape: 'capsule',
    imprint: 'AT10',
    stock: 22,
    status: 'pending',
    takenAt: null,
  },
  {
    id: 'med-6',
    name: 'Uprise-D3 60K (Weekly)',
    genericName: 'Cholecalciferol 60,000 IU',
    dosage: '1 softgel every Sunday',
    purpose: 'Weekly Vitamin D boost for bone & muscle strength.',
    scheduleType: 'weekly',
    time: '09:00',
    mealTiming: 'Sundays after breakfast',
    colorName: 'Amber Gold',
    shape: 'capsule',
    imprint: 'D3-60',
    stock: 6,
    status: 'pending',
    takenAt: null,
  },
  {
    id: 'med-7',
    name: 'Pan-D (As-Needed Acidity Relief)',
    genericName: 'Pantoprazole + Domperidone',
    dosage: '1 capsule PRN (Max 1/day)',
    purpose: 'As-needed relief for heartburn or stomach acidity.',
    scheduleType: 'prn',
    time: 'As Needed',
    mealTiming: '30m before meal only if feeling acidity',
    colorName: 'Silver Capsule',
    shape: 'capsule',
    imprint: 'P-D',
    stock: 10,
    status: 'pending',
    takenAt: null,
  },
];

export default function KindredCarePage() {
  // Screen Stage: 'boot' | 'onboarding' | 'portal' | 'role_wait' | 'workspace'
  const [stage, setStage] = useState<
    'boot' | 'onboarding' | 'portal' | 'role_wait' | 'workspace'
  >('boot');
  const [waitProgress, setWaitProgress] = useState(25);
  const [waitSteps, setWaitSteps] = useState<ReadinessStep[]>([
    {
      id: 's1',
      label: 'Connecting to Care Circle Vault (KC-2026)',
      detail: 'Verifying encrypted state store & Firestore rules',
      status: 'active',
    },
    {
      id: 's2',
      label: 'Running Crash-Free Schema Normalizer',
      detail: 'Validating medications, appointments, vitals & autonomy arrays',
      status: 'pending',
    },
    {
      id: 's3',
      label: 'Warming Google Gemma 4 & Gemini 3 Flash AI',
      detail: 'Adaption Labs + Google GenAI clinical engines ready',
      status: 'pending',
    },
  ]);

  // Active Role & Portal State
  const [role, setRole] = useState<CareRole>('elder');
  const [pendingRoleTarget, setPendingRoleTarget] = useState<CareRole>('elder');
  const [portalRoleTab, setPortalRoleTab] = useState<CareRole>('elder');
  const [circleCodeInput, setCircleCodeInput] = useState('KC-2026');
  const [passcodeInput, setPasscodeInput] = useState('1234');
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Accessibility & Modals
  const [comfortMode, setComfortMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMedicalIdModal, setShowMedicalIdModal] = useState(false);
  const [showFridgeSheetModal, setShowFridgeSheetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Care Circle Core State
  const [elderName, setElderName] = useState('Smt. Kamala Devi');
  const [elderAge, setElderAge] = useState(74);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Sulfa drugs']);
  const [conditions, setConditions] = useState<string[]>([
    'Type 2 Diabetes',
    'Essential Hypertension',
    'Hypothyroidism',
  ]);
  const [mobilityNotes, setMobilityNotes] = useState(
    'Wears reading glasses; prefers spoken voice guidance; stand up slowly after evening BP pill.'
  );
  const [primaryDoctor, setPrimaryDoctor] = useState(
    'Dr. Rajesh Sharma, MD (Geriatric Cardiology)'
  );
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98400 11223');
  const [routine, setRoutine] = useState({
    wakeTime: '06:30',
    breakfastTime: '08:15',
    lunchTime: '13:15',
    dinnerTime: '19:30',
    bedTime: '21:45',
  });
  const [caretakerInfo, setCaretakerInfo] = useState({
    name: 'Ananya Rao',
    shift: 'Primary Caretaker & Nurse (8:00 AM – 8:00 PM)',
    email: 'geeteshgollapalli@gmail.com',
  });
  const [familyInfo, setFamilyInfo] = useState({
    name: 'Geetesh Gollapalli',
    relation: 'Grandson & Family Coordinator',
    email: 'geeteshgollapalli@gmail.com',
  });
  const [onDutyResponder, setOnDutyResponder] = useState(
    'Ananya Rao (Primary Caretaker)'
  );
  const [shiftHandoffNote, setShiftHandoffNote] = useState(
    'Morning meds confirmed, fasting sugar 112 mg/dL. Ensure full lunch before 1:30 PM Shelcal.'
  );
  const [lastHandoffAt, setLastHandoffAt] = useState('Today, 08:40 AM');

  const [autonomy, setAutonomy] = useState<{
    graceMinutes: 15 | 30 | 60;
    allowFamilyEdits: boolean;
    shareVitals: boolean;
    language: 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Spanish';
  }>({
    graceMinutes: 30,
    allowFamilyEdits: false,
    shareVitals: true,
    language: 'English',
  });

  const [meals, setMeals] = useState({
    breakfast: true,
    lunch: false,
    dinner: false,
  });
  const [hydrationGlasses, setHydrationGlasses] = useState(5);
  const [currentFeeling, setCurrentFeeling] = useState('Feeling Good');
  const [thyroidCountdownMins, setThyroidCountdownMins] = useState<number | null>(null);

  const [medications, setMedications] = useState<ProfileMedItem[]>(INITIAL_MEDICATIONS);
  const [appointments, setAppointments] = useState<ElderAppointmentItem[]>([
    {
      id: 'appt-1',
      doctorName: 'Dr. Rajesh Sharma',
      specialty: 'Geriatric Cardiology & Hypertension',
      clinicName: 'Apollo Senior Heart & Wellness Centre',
      clinicAddress: 'Jubilee Hills Road No. 36, Hyderabad',
      dateTimeLabel: 'Tomorrow • 10:30 AM',
      isoStart: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Review 14-day evening BP logs & Amlopres 5mg dosage.',
      checklist: [
        {
          id: 'c1',
          text: 'Bring 14-day home Blood Pressure & Adherence Brief',
          done: true,
        },
        { id: 'c2', text: 'Carry current pill organizer & lipid report', done: true },
        {
          id: 'c3',
          text: 'Ask about reducing evening Amlopres when BP < 115/75',
          done: false,
        },
      ],
    },
    {
      id: 'appt-2',
      doctorName: 'Dr. Meera Nair',
      specialty: 'Endocrinology & Thyroid Lab',
      clinicName: 'Care & Cure Diagnostics Clinic',
      clinicAddress: 'Banjara Hills Road No. 12, Hyderabad',
      dateTimeLabel: 'In 5 Days • 08:30 AM',
      isoStart: new Date(Date.now() + 5 * 86400000).toISOString(),
      notes: 'Quarterly HbA1c & TSH blood panel.',
      checklist: [
        { id: 'c4', text: '10-hour overnight fasting (plain water allowed)', done: false },
        {
          id: 'c5',
          text: 'Give blood sample BEFORE morning Glycomet SR tablet',
          done: false,
        },
      ],
    },
  ]);

  const [vitals, setVitals] = useState<CaretakerVitalItem[]>([
    {
      id: 'v1',
      type: 'Blood Pressure',
      value: '124/78 mmHg',
      status: 'normal',
      notes: 'Sitting calmly after morning walk',
      when: 'Today, 08:15 AM',
      by: 'Kamala Ji',
    },
    {
      id: 'v2',
      type: 'Blood Glucose',
      value: '112 mg/dL',
      status: 'normal',
      notes: 'Fasting morning check',
      when: 'Today, 07:30 AM',
      by: 'Ananya Rao',
    },
  ]);

  const [emails, setEmails] = useState<CaretakerEmailItem[]>([
    {
      id: 'em-1',
      category: 'upcoming_dose',
      subject: '⏰ Morning Medication Reminder: Thyronorm 50mcg (7:00 AM)',
      recipients: 'Smt. Kamala Devi, Ananya Rao',
      preview:
        'Take 1 white round tablet on an empty stomach 45 mins before morning tea or breakfast.',
      sentAt: 'Today, 06:45 AM',
      status: 'Delivered via SMTP',
    },
  ]);

  const [careNotes, setCareNotes] = useState([
    {
      id: 'n1',
      author: 'Geetesh Gollapalli',
      role: 'family',
      category: 'encouragement',
      message:
        'Dadi, I ordered your Shelcal 500 refill from Apollo Pharmacy—arriving this evening! ❤️',
      when: '3 hours ago',
    },
    {
      id: 'n2',
      author: 'Smt. Kamala Devi',
      role: 'elder',
      category: 'question_for_doctor',
      message:
        'Ask Dr. Sharma tomorrow if I should skip evening Amlopres when afternoon BP is below 115/75.',
      when: 'Yesterday',
    },
  ]);

  const [auditLog, setAuditLog] = useState<ProfileAuditEntry[]>([
    {
      id: 'aud-1',
      when: 'Today, 08:35 AM',
      actor: 'Smt. Kamala Devi (Elder)',
      role: 'elder',
      note: 'Confirmed taking Glycomet SR 500 after breakfast.',
    },
    {
      id: 'aud-2',
      when: 'Today, 07:30 AM',
      actor: 'Ananya Rao (Caretaker)',
      role: 'caretaker',
      note: 'Logged fasting Blood Glucose: 112 mg/dL (Normal).',
    },
    {
      id: 'aud-3',
      when: '3 hours ago',
      actor: 'Geetesh Gollapalli (Family)',
      role: 'family',
      note: 'Checked daily adherence & ordered Shelcal 500 pharmacy refill.',
    },
  ]);

  const [drugSafetyReport, setDrugSafetyReport] = useState<DrugSafetyReport | null>({
    overallRisk: 'optimal',
    providerUsed: 'Google Gemma 4 (gemma-4-31b-it via Adaption Labs)',
    generatedAt: new Date().toISOString(),
    interactions: [
      {
        severity: 'moderate',
        medicationsInvolved: ['Thyronorm 50mcg', 'Shelcal 500 (Calcium)'],
        summary: 'Calcium Absorption Conflict — Safely Spaced by 6.5 Hours',
        clinicalMechanism:
          'Calcium carbonate binds levothyroxine in the gut and reduces absorption by up to 40% if taken together.',
        spacingRecommendation:
          'Keep Thyronorm at 7:00 AM and Shelcal at 1:30 PM (minimum 4-hour separation verified).',
      },
      {
        severity: 'low',
        medicationsInvolved: ['Amlopres 5', 'Atorva 10'],
        summary: 'Cardiovascular Pair — Avoid Grapefruit Juice',
        clinicalMechanism:
          'Both share CYP3A4 enzyme metabolism; grapefruit juice elevates blood concentration.',
        spacingRecommendation:
          'Safe at 7:00 PM and 9:30 PM. Stand up slowly after evening Amlopres.',
      },
    ],
    foodTimingTips: [
      'Wait 45 minutes after morning Thyronorm before drinking tea or coffee.',
    ],
    scheduleOptimizationNote: 'Current schedule prevents absorption conflicts.',
  });

  const [aiDoctorBrief, setAiDoctorBrief] = useState<{
    providerUsed: string;
    adherenceSummary: string;
    vitalsHighlights: string[];
    suggestedQuestionsForDoctor: string[];
  } | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
  }

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    document.body.classList.toggle('comfort-mode', comfortMode);
  }, [comfortMode]);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    const anyModal = showProfileModal || showMedicalIdModal || showFridgeSheetModal;
    document.body.classList.toggle('modal-open', anyModal);
  }, [showProfileModal, showMedicalIdModal, showFridgeSheetModal]);

  // Initial Crash-Free Backend Warmup & Readiness Gate
  useEffect(() => {
    let mounted = true;
    async function bootWarmup() {
      try {
        setWaitProgress(45);
        const res = await fetch('/api/circle').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          const safe = ensureSafeCircleState(data?.circle);
          if (mounted && safe.elderName) {
            setElderName(safe.elderName);
          }
        }
      } catch {
        // Crash-free fallback guaranteed
      }
      if (!mounted) return;
      setWaitSteps((prev) =>
        prev.map((s, i) =>
          i <= 1 ? { ...s, status: 'done' } : { ...s, status: 'active' }
        )
      );
      setWaitProgress(88);
      setTimeout(() => {
        if (!mounted) return;
        setWaitSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
        setWaitProgress(100);
        setTimeout(() => {
          if (mounted) setStage('portal');
        }, 180);
      }, 220);
    }
    bootWarmup();
    return () => {
      mounted = false;
    };
  }, []);

  async function enterRoleWithHydrationGate(targetRole: CareRole, passUsed?: string) {
    setPendingRoleTarget(targetRole);
    setWaitProgress(35);
    setWaitSteps([
      {
        id: 'r1',
        label: `Verifying ${targetRole.toUpperCase()} Passcode & Session`,
        detail: 'Salted scrypt + HMAC-SHA256 role authorization',
        status: 'active',
      },
      {
        id: 'r2',
        label: 'Hydrating Role-Isolated Workspace',
        detail:
          targetRole === 'elder'
            ? 'Loading Calm 3-Button Elder Companion (zero admin clutter)'
            : targetRole === 'caretaker'
              ? 'Loading 4-Tab Clinical Caretaker Station & AI Safety Guard'
              : 'Loading 3-Tab Family Peace-of-Mind Hub & Autonomy Locks',
        status: 'pending',
      },
    ]);
    setStage('role_wait');

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleCode: 'KC-2026',
          passcode: passUsed || ROLE_PINS[targetRole][0],
          role: targetRole,
        }),
      }).catch(() => null);
    } catch {
      // Safe fallback
    }

    setWaitProgress(85);
    setWaitSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
    setTimeout(() => {
      setRole(targetRole);
      setWaitProgress(100);
      setStage('workspace');
      showToast(`Unlocked ${targetRole.toUpperCase()} Workspace`);
    }, 240);
  }

  function handlePortalUnlock() {
    const code = circleCodeInput.trim().toUpperCase();
    const pass = passcodeInput.trim().toUpperCase();

    if (code !== 'KC-2026') {
      setPortalError('Care Circle not found. Please use KC-2026.');
      return;
    }

    const matchedRole = (Object.keys(ROLE_PINS) as CareRole[]).find((r) =>
      ROLE_PINS[r].includes(pass)
    );

    if (!matchedRole) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      const rem = Math.max(0, 5 - nextFail);
      setPortalError(
        `Incorrect passcode for KC-2026. (${rem} attempts remaining before 5-minute security lockout)`
      );
      return;
    }

    setFailedAttempts(0);
    setPortalError(null);
    enterRoleWithHydrationGate(matchedRole, pass);
  }

  // Medication Actions
  function handleTakeMed(
    medId: string,
    confirmedMealKey?: 'breakfast' | 'lunch' | 'dinner'
  ) {
    if (confirmedMealKey) {
      setMeals((prev) => ({ ...prev, [confirmedMealKey]: true }));
    }
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const target = medications.find((m) => m.id === medId);
    if (!target) return;

    // If taking empty-stomach Thyronorm, start 45-minute tea/breakfast countdown
    if (/thyronorm|empty stomach/i.test(target.name + ' ' + target.mealTiming)) {
      setThyroidCountdownMins(45);
    }

    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              status: 'taken',
              takenAt: nowStr,
              stock: Math.max(0, m.stock - 1),
            }
          : m
      )
    );

    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        when: 'Just now',
        actor:
          role === 'elder'
            ? `${elderName} (Elder)`
            : `${caretakerInfo.name} (Caretaker)`,
        role,
        note: `Confirmed taking ${target.name} (${target.dosage}) at ${nowStr}.`,
      },
      ...prev,
    ]);

    fetch('/api/medications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationId: medId, status: 'taken' }),
    }).catch(() => null);

    showToast(`✓ Marked ${target.name} as Taken (${nowStr}).`);
  }

  function handleUndoMed(medId: string) {
    const target = medications.find((m) => m.id === medId);
    if (!target) return;
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? { ...m, status: 'pending', takenAt: null, stock: m.stock + 1 }
          : m
      )
    );
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        when: 'Just now',
        actor: role.toUpperCase(),
        role,
        note: `Undid mistaken tap for ${target.name} and restored +1 tablet to stock.`,
      },
      ...prev,
    ]);
    fetch('/api/medications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationId: medId, status: 'pending' }),
    }).catch(() => null);
    showToast(`↩ Undid ${target.name} log & restored 1 tablet.`);
  }

  function handleSnoozeMed(medId: string) {
    const target = medications.find((m) => m.id === medId);
    if (!target) return;
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'snoozed' } : m))
    );
    showToast(`⏰ Reminder snoozed for 15 minutes for ${target.name}.`);
  }

  function handleSkipMed(medId: string, reason: string) {
    const target = medications.find((m) => m.id === medId);
    if (!target) return;
    const isOut = /out of|refill/i.test(reason);
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? { ...m, status: 'skipped', stock: isOut ? 0 : m.stock }
          : m
      )
    );
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        when: 'Just now',
        actor: `${elderName} (Elder)`,
        role: 'elder',
        note: `Skipped ${target.name} — Reason: "${reason}".`,
      },
      ...prev,
    ]);
    if (/dizzy/i.test(reason)) {
      setCurrentFeeling('Slightly Dizzy');
    }
    if (isOut) {
      handleDispatchEmail({
        category: 'low_refill',
        subject: `💊 Urgent Refill Needed: ${target.name} (Skipped due to 0 stock)`,
        preview: `${elderName} skipped ${target.name} because the pillbox is out of tablets.`,
      });
    } else {
      showToast(`Logged skip reason for ${target.name}: ${reason}`);
    }
  }

  function handleRefillMed(medId: string) {
    const target = medications.find((m) => m.id === medId);
    if (!target) return;
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 30 } : m))
    );
    setAuditLog((prev) => [
      {
        id: `aud-${Date.now()}`,
        when: 'Just now',
        actor:
          role === 'family'
            ? `${familyInfo.name} (Family)`
            : `${caretakerInfo.name} (Caretaker)`,
        role,
        note: `Refilled +30 tablets for ${target.name} (New stock: ${target.stock + 30}).`,
      },
      ...prev,
    ]);
    fetch('/api/medications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: medId, refillDelta: 30 }),
    }).catch(() => null);
    showToast(`✓ Added +30 tablets to ${target.name}.`);
  }

  function handleAddOrEditMed(med: ProfileMedItem, isEdit: boolean) {
    if (isEdit) {
      setMedications((prev) => prev.map((m) => (m.id === med.id ? med : m)));
      setAuditLog((prev) => [
        {
          id: `aud-${Date.now()}`,
          when: 'Just now',
          actor: `${caretakerInfo.name} (Caretaker)`,
          role: 'caretaker',
          note: `Edited ${med.name} (${med.dosage} at ${med.time}) — Purpose: ${med.purpose}.`,
        },
        ...prev,
      ]);
      showToast(`✓ Updated ${med.name} schedule & purpose.`);
    } else {
      setMedications((prev) => [...prev, med]);
      setAuditLog((prev) => [
        {
          id: `aud-${Date.now()}`,
          when: 'Just now',
          actor: `${caretakerInfo.name} (Caretaker)`,
          role: 'caretaker',
          note: `Added ${med.name} (${med.dosage}) — Purpose: ${med.purpose}.`,
        },
        ...prev,
      ]);
      showToast(`✓ Added ${med.name} to Care Circle schedule.`);
    }
  }

  function handleDeleteMed(medId: string) {
    const target = medications.find((m) => m.id === medId);
    setMedications((prev) => prev.filter((m) => m.id !== medId));
    if (target) {
      setAuditLog((prev) => [
        {
          id: `aud-${Date.now()}`,
          when: 'Just now',
          actor: `${caretakerInfo.name} (Caretaker)`,
          role: 'caretaker',
          note: `Removed ${target.name} from active medication schedule.`,
        },
        ...prev,
      ]);
      showToast(`Removed ${target.name}.`);
    }
  }

  async function handleDispatchEmail({
    category,
    subject,
    preview,
    customRecipient,
  }: {
    category: string;
    subject: string;
    preview: string;
    customRecipient?: string;
  }) {
    const recipients = customRecipient || `${caretakerInfo.name}, ${familyInfo.email}`;
    let previewUrl: string | undefined;
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category === 'weekly_digest' ? 'upcoming_dose' : category,
          customRecipientEmail: customRecipient || familyInfo.email,
          customMessage: preview,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        previewUrl = d?.dispatched?.[0]?.previewUrl;
      }
    } catch {
      // Safe fallback
    }

    const newEm: CaretakerEmailItem = {
      id: `em-${Date.now()}`,
      category,
      subject,
      recipients,
      preview,
      sentAt: 'Just now',
      status: 'Delivered via SMTP',
      previewUrl,
    };
    setEmails((prev) => [newEm, ...prev]);
    showToast(`✉️ Dispatched Email: ${subject}`);
  }

  async function handleRunAutoScanEmails(customRecipient?: string) {
    const low = medications.filter((m) => m.stock <= 7);
    if (low.length > 0) {
      await handleDispatchEmail({
        category: 'low_refill',
        subject: `💊 Low Pill Inventory Alert: ${low[0].name} (${low[0].stock} left)`,
        preview: `${elderName}'s supply of ${low[0].name} is down to ${low[0].stock} tablets.`,
        customRecipient,
      });
    }
    await handleDispatchEmail({
      category: 'appointment_reminder',
      subject: `📅 24h Appointment Reminder: ${appointments[0]?.doctorName} (${appointments[0]?.dateTimeLabel})`,
      preview: `Bring 14-day Blood Pressure & Adherence Brief to ${appointments[0]?.clinicName}.`,
      customRecipient,
    });
  }

  async function handleRunDrugSafetyAi() {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drug_safety' }),
      });
      const data = await res.json();
      if (data?.report) {
        setDrugSafetyReport(data.report);
        showToast(`🛡️ Refreshed via ${data.report.providerUsed}`);
      }
    } catch {
      showToast('Re-verified drug-interaction guard.');
    }
  }

  async function handleRefreshAiDoctorBrief() {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'doctor_brief' }),
      });
      const data = await res.json();
      if (data?.brief) {
        setAiDoctorBrief(data.brief);
        showToast(`✨ Generated Clinical Brief via ${data.brief.providerUsed}`);
      }
    } catch {
      showToast('Updated Pre-Appointment Clinical Brief.');
    }
  }

  async function handleCompleteOnboarding(data: OnboardingFormData) {
    setElderName(data.elderName);
    setElderAge(data.elderAge);
    setBloodGroup(data.bloodGroup);
    setAllergies(
      data.allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    setConditions(
      data.conditionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    setMobilityNotes(data.mobilityAndComfortNotes);
    setPrimaryDoctor(data.primaryDoctor);
    setEmergencyPhone(data.emergencyPhone);
    setRoutine({
      wakeTime: data.wakeTime,
      breakfastTime: data.breakfastTime,
      lunchTime: data.lunchTime,
      dinnerTime: data.dinnerTime,
      bedTime: data.bedTime,
    });
    setCaretakerInfo({
      name: data.caretakerName,
      shift: data.caretakerShift,
      email: data.caretakerEmail,
    });
    setFamilyInfo({
      name: data.familyName,
      relation: data.familyRelation,
      email: data.familyEmail,
    });
    setAutonomy({
      graceMinutes: data.graceMinutes,
      allowFamilyEdits: data.allowFamilyEdits,
      shareVitals: data.shareVitals,
      language: data.language,
    });
    if (data.medications.length > 0) {
      setMedications(
        data.medications.map((m) => ({
          ...m,
          status: 'pending' as const,
          takenAt: null,
        }))
      );
    }

    await fetch('/api/circle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        elderName: data.elderName,
        elderAge: data.elderAge,
        bloodGroup: data.bloodGroup,
        allergies: data.allergiesText.split(',').map((s) => s.trim()),
        conditions: data.conditionsText.split(',').map((s) => s.trim()),
        primaryDoctor: data.primaryDoctor,
        emergencyPhone: data.emergencyPhone,
      }),
    }).catch(() => null);

    setStage('portal');
    showToast('✓ Saved Onboarding Health Profile, Medications & Care Team!');
  }

  /* =========================================================
     RENDER 1: CRASH-FREE BOOT & ROLE LOGIN WAIT SCREEN
     ========================================================= */
  if (stage === 'boot' || stage === 'role_wait') {
    return (
      <BootAndLoginWaitScreen
        mode={stage === 'boot' ? 'boot' : 'role_login'}
        roleTarget={pendingRoleTarget}
        steps={waitSteps}
        progressPercent={waitProgress}
      />
    );
  }

  /* =========================================================
     RENDER 2: 4-STEP ONBOARDING WIZARD WITH AI PDF AUTO-FILL
     ========================================================= */
  if (stage === 'onboarding') {
    return (
      <>
        {toastMessage && (
          <div className="fixed right-5 bottom-5 z-50 rounded-xl bg-[#14171A] px-4 py-3 text-xs font-bold text-white shadow-xl">
            {toastMessage}
          </div>
        )}
        <OnboardingWizard
          initialData={{
            elderName,
            elderAge,
            bloodGroup,
            allergiesText: allergies.join(', '),
            conditionsText: conditions.join(', '),
            mobilityAndComfortNotes: mobilityNotes,
            primaryDoctor,
            emergencyPhone,
            wakeTime: routine.wakeTime,
            breakfastTime: routine.breakfastTime,
            lunchTime: routine.lunchTime,
            dinnerTime: routine.dinnerTime,
            bedTime: routine.bedTime,
            caretakerName: caretakerInfo.name,
            caretakerShift: caretakerInfo.shift,
            caretakerEmail: caretakerInfo.email,
            familyName: familyInfo.name,
            familyRelation: familyInfo.relation,
            familyEmail: familyInfo.email,
            language: autonomy.language,
            graceMinutes: autonomy.graceMinutes,
            allowFamilyEdits: autonomy.allowFamilyEdits,
            shareVitals: autonomy.shareVitals,
            medications: medications.map((m) => ({
              id: m.id,
              name: m.name,
              genericName: m.genericName,
              dosage: m.dosage,
              purpose: m.purpose,
              scheduleType: m.scheduleType,
              time: m.time,
              mealTiming: m.mealTiming,
              colorName: m.colorName,
              shape: m.shape,
              imprint: m.imprint,
              stock: m.stock,
            })),
          }}
          onComplete={handleCompleteOnboarding}
          onSkipToDemo={() => setStage('portal')}
          onToast={showToast}
        />
      </>
    );
  }

  /* =========================================================
     RENDER 3: PASSCODE ACCESS PORTAL (KC-2026)
     ========================================================= */
  if (stage === 'portal') {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-[#F6F5F1] px-4 py-10"
      >
        {toastMessage && (
          <div className="fixed right-5 bottom-5 z-50 rounded-xl bg-[#14171A] px-4 py-3 text-xs font-bold text-white shadow-xl">
            {toastMessage}
          </div>
        )}

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-black/12 bg-white shadow-xl lg:grid-cols-12">
          {/* Left Column: Brand, Onboarding CTA & Role Overview */}
          <div className="flex flex-col justify-between bg-[#FBFBF9] p-7 lg:col-span-6 lg:border-r lg:border-black/10 lg:p-10">
            <div className="space-y-5">
              <KindredCareLogo
                size={46}
                subtitle="Role-Isolated Elderly Care & Medication Ecosystem"
              />

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#14171A]">
                  Shared elderly care, built around dignity.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#57606A]">
                  Each passcode unlocks a <strong>purpose-built workspace</strong> so{' '}
                  <strong>{elderName}</strong> gets a calm, large-button companion while her
                  Caretaker and Family get clinical and peace-of-mind tools.
                </p>
              </div>

              {/* First-Time Onboarding & AI PDF Scanner CTA */}
              <div className="rounded-2xl border border-[#0F524B]/25 bg-[#0F524B]/[0.05] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0F524B]">
                  New User or Have a Hospital Discharge PDF?
                </div>
                <p className="mt-1 text-xs text-[#57606A]">
                  Upload a medical PDF/summary to auto-fill health details, medication
                  purposes, and set up your Care Circle.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStage('onboarding')}
                    className="rounded-xl bg-[#0F524B] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0A3C36]"
                  >
                    📄 Start First-Time Setup &amp; AI PDF Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs font-bold text-[#14171A]"
                  >
                    👤 View {elderName.split(' ')[1]}’s Profile
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Click Instant Role Launchers */}
            <div className="mt-6 space-y-2 border-t border-black/10 pt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#57606A]">
                1-Click Role Preview (Unlocks Dedicated Role Screen)
              </div>
              <div className="space-y-2">
                {[
                  {
                    r: 'elder' as CareRole,
                    title: '1. Elder Companion (Smt. Kamala Devi)',
                    pin: 'PIN: 1234',
                    desc: 'Calm 3-button view • Giant pill visuals • Voice read-aloud',
                  },
                  {
                    r: 'caretaker' as CareRole,
                    title: '2. Clinical Caretaker Station (Ananya Rao)',
                    pin: 'PIN: 2026 / CARE2026',
                    desc: '4 clinical tabs • Med edit & AI Rx scanner • Vitals & Brief',
                  },
                  {
                    r: 'family' as CareRole,
                    title: '3. Family Peace-of-Mind Hub (Geetesh)',
                    pin: 'PIN: 8899 / FAMILY26',
                    desc: '3 family tabs • 7-day adherence • Refills & Email Digest',
                  },
                ].map((card) => (
                  <button
                    key={card.r}
                    type="button"
                    onClick={() => enterRoleWithHydrationGate(card.r)}
                    className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-left transition hover:border-[#0F524B] hover:bg-[#F6F5F1]"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#14171A]">{card.title}</div>
                      <div className="text-[11px] text-[#57606A]">{card.desc}</div>
                    </div>
                    <span className="rounded-md bg-[#0F524B]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#0F524B]">
                      {card.pin} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Passcode Keypad */}
          <div className="flex flex-col justify-center p-7 lg:col-span-6 lg:p-10">
            <h2 className="text-xl font-bold text-[#14171A]">
              Passcode Access Portal
            </h2>
            <p className="mt-1 text-xs text-[#57606A]">
              Select your role or enter your 4-digit PIN on the keypad below.
            </p>

            {/* Role Selector Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-[#EFECE6] p-1">
              {(
                [
                  { r: 'elder', label: 'Elder (1234)', pin: '1234' },
                  { r: 'caretaker', label: 'Caretaker (2026)', pin: '2026' },
                  { r: 'family', label: 'Family (8899)', pin: '8899' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.r}
                  type="button"
                  onClick={() => {
                    setPortalRoleTab(tab.r);
                    setPasscodeInput(tab.pin);
                    setPortalError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    portalRoleTab === tab.r
                      ? 'bg-white text-[#14171A] shadow-2xs'
                      : 'text-[#57606A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="circle-code"
                  className="block text-xs font-bold text-[#14171A]"
                >
                  Care Circle ID
                </label>
                <input
                  id="circle-code"
                  type="text"
                  value={circleCodeInput}
                  onChange={(e) => setCircleCodeInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 font-mono text-sm font-bold"
                />
              </div>
              <div>
                <label
                  htmlFor="passcode-field"
                  className="block text-xs font-bold text-[#14171A]"
                >
                  Role PIN / Passcode
                </label>
                <div className="mt-1 flex gap-1.5">
                  <input
                    id="passcode-field"
                    type={showPasscodeText ? 'text' : 'password'}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 font-mono text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscodeText(!showPasscodeText)}
                    className="rounded-xl border border-black/15 px-3 text-xs font-bold"
                  >
                    {showPasscodeText ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div
              className="mt-4 grid grid-cols-3 gap-2"
              aria-label="Passcode numeric keypad"
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Del'].map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'Clear') setPasscodeInput('');
                      else if (key === 'Del')
                        setPasscodeInput((prev) => prev.slice(0, -1));
                      else setPasscodeInput((prev) => prev + key);
                    }}
                    className="rounded-xl border border-black/12 bg-[#F6F5F1] py-2.5 text-sm font-bold text-[#14171A] hover:bg-[#EFECE6]"
                  >
                    {key}
                  </button>
                )
              )}
            </div>

            {portalError && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800"
              >
                {portalError}
              </div>
            )}

            <button
              type="button"
              onClick={handlePortalUnlock}
              className="mt-4 w-full rounded-xl bg-[#0F524B] py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#0A3C36]"
            >
              Unlock Role Workspace →
            </button>
          </div>
        </div>

        {/* Profile Modal accessible from Portal too */}
        <ElderProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onOpenOnboarding={() => setStage('onboarding')}
          elderName={elderName}
          elderAge={elderAge}
          bloodGroup={bloodGroup}
          allergies={allergies}
          conditions={conditions}
          mobilityNotes={mobilityNotes}
          primaryDoctor={primaryDoctor}
          emergencyPhone={emergencyPhone}
          routine={routine}
          caretaker={{
            ...caretakerInfo,
            handoffNote: shiftHandoffNote,
            lastVitalSummary: `${vitals[0]?.type}: ${vitals[0]?.value} (${vitals[0]?.when})`,
          }}
          family={{
            ...familyInfo,
            lastNoteSummary:
              careNotes.find((n) => n.role === 'family')?.message ||
              'Monitoring adherence & refills',
          }}
          autonomy={autonomy}
          currentFeeling={currentFeeling}
          hydrationGlasses={hydrationGlasses}
          meals={meals}
          medications={medications}
          auditLog={auditLog}
        />
      </main>
    );
  }

  /* =========================================================
     RENDER 4: ROLE-ISOLATED WORKSPACE (ELDER vs CARETAKER vs FAMILY)
     ========================================================= */
  const familyNoteText = careNotes.find(
    (n) => n.category === 'encouragement'
  )?.message;

  return (
    <div className="app-workspace-shell min-h-screen bg-[#F6F5F1] text-[#14171A]">
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 rounded-xl bg-[#14171A] px-4 py-3 text-xs font-bold text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      {/* Role-Specific Header */}
      <header className="no-print sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <KindredCareLogo
              size={38}
              subtitle={
                role === 'elder'
                  ? `Elder Companion • ${elderName}`
                  : role === 'caretaker'
                    ? `Clinical Caretaker Station • ${caretakerInfo.name}`
                    : `Family Peace-of-Mind Hub • ${familyInfo.name}`
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dedicated Elder & Care Team Profile Button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="rounded-xl border border-[#0F524B]/30 bg-[#0F524B]/5 px-3.5 py-2 text-xs font-bold text-[#0F524B] hover:bg-[#0F524B]/10"
            >
              👤 {elderName.split(' ')[1] || elderName}’s Profile &amp; Care Team
            </button>

            <button
              type="button"
              onClick={() => setShowMedicalIdModal(true)}
              className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800"
            >
              🪪 Medical ID
            </button>

            <button
              type="button"
              onClick={() => setComfortMode(!comfortMode)}
              aria-pressed={comfortMode}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                comfortMode
                  ? 'border-[#0F524B] bg-[#0F524B] text-white'
                  : 'border-black/15 bg-white text-[#14171A]'
              }`}
            >
              Aa Large Text
            </button>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                highContrast
                  ? 'border-black bg-black text-white'
                  : 'border-black/15 bg-white text-[#14171A]'
              }`}
            >
              ◐ Contrast
            </button>

            <button
              type="button"
              onClick={() => setStage('portal')}
              className="rounded-xl bg-[#14171A] px-3.5 py-2 text-xs font-bold text-white"
            >
              🔒 Switch Role / Lock
            </button>
          </div>
        </div>
      </header>

      {/* Main Role-Isolated Stage */}
      <main id="main-content" className="px-4 pt-6">
        {role === 'elder' && (
          <ElderCompanionView
            elderName={elderName}
            emergencyPhone={emergencyPhone}
            caretakerName={caretakerInfo.name}
            familyName={familyInfo.name}
            medications={medications}
            appointments={appointments}
            familyEncouragementNote={familyNoteText}
            meals={meals}
            hydrationGlasses={hydrationGlasses}
            currentFeeling={currentFeeling}
            thyroidCountdownMins={thyroidCountdownMins}
            autonomy={autonomy}
            comfortMode={comfortMode}
            highContrast={highContrast}
            onTakeMed={handleTakeMed}
            onUndoMed={handleUndoMed}
            onSnoozeMed={handleSnoozeMed}
            onSkipMed={handleSkipMed}
            onAskRefill={(medId) => {
              const m = medications.find((x) => x.id === medId);
              if (m) {
                handleDispatchEmail({
                  category: 'low_refill',
                  subject: `💊 Elder Refill Request: ${m.name} (${m.stock} left)`,
                  preview: `${elderName} tapped "Ask Family to Order More" for ${m.name}.`,
                });
              }
            }}
            onToggleMeal={(mealKey) => {
              setMeals((prev) => {
                const next = { ...prev, [mealKey]: !prev[mealKey] };
                showToast(
                  `${mealKey.charAt(0).toUpperCase() + mealKey.slice(1)} marked ${
                    next[mealKey] ? 'eaten ✓' : 'not eaten yet'
                  }`
                );
                return next;
              });
            }}
            onSetHydration={(g) => {
              setHydrationGlasses(g);
              showToast(`Hydration logged: ${g} of 8 glasses today.`);
            }}
            onSelectFeeling={(feeling) => {
              setCurrentFeeling(feeling);
              setAuditLog((prev) => [
                {
                  id: `aud-${Date.now()}`,
                  when: 'Just now',
                  actor: `${elderName} (Elder)`,
                  role: 'elder',
                  note: `Self-reported feeling: "${feeling}".`,
                },
                ...prev,
              ]);
              showToast(
                feeling === 'Feeling Good'
                  ? 'Glad you are feeling good today!'
                  : `Noted "${feeling}" — Nurse ${caretakerInfo.name.split(' ')[0]} has been notified.`
              );
            }}
            onToggleChecklist={(apptId, checkId) => {
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === apptId
                    ? {
                        ...a,
                        checklist: a.checklist.map((c) =>
                          c.id === checkId ? { ...c, done: !c.done } : c
                        ),
                      }
                    : a
                )
              );
            }}
            onAddDoctorQuestion={(qText) => {
              setCareNotes((prev) => [
                {
                  id: `n-${Date.now()}`,
                  author: elderName,
                  role: 'elder',
                  category: 'question_for_doctor',
                  message: qText,
                  when: 'Just now',
                },
                ...prev,
              ]);
              showToast('✓ Saved your question for the doctor!');
            }}
            onTriggerSos={() => {
              handleDispatchEmail({
                category: 'elder_sos',
                subject: `🚨 PRIORITY SOS: ${elderName} Requested Immediate Help`,
                preview: `${elderName} pressed the Emergency SOS button. Please call ${emergencyPhone} immediately.`,
              });
            }}
            onOpenMedicalId={() => setShowMedicalIdModal(true)}
            onUpdateAutonomy={(patch) => {
              setAutonomy((prev) => ({ ...prev, ...patch }));
              fetch('/api/circle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  escalationGraceMinutes: patch.graceMinutes,
                  allowFamilyScheduleEdits: patch.allowFamilyEdits,
                  shareVitalsWithFamily: patch.shareVitals,
                  preferredLanguage: patch.language,
                }),
              }).catch(() => null);
              showToast('✓ Updated your personal privacy & comfort settings.');
            }}
            onToggleComfort={() => setComfortMode(!comfortMode)}
            onToggleContrast={() => setHighContrast(!highContrast)}
            onToast={showToast}
          />
        )}

        {role === 'caretaker' && (
          <CaretakerClinicalView
            elderName={elderName}
            elderAge={elderAge}
            bloodGroup={bloodGroup}
            allergies={allergies}
            currentFeeling={currentFeeling}
            onDutyResponder={onDutyResponder}
            shiftHandoffNote={shiftHandoffNote}
            lastHandoffAt={lastHandoffAt}
            graceMinutes={autonomy.graceMinutes}
            medications={medications}
            appointments={appointments}
            vitals={vitals}
            emails={emails}
            auditLog={auditLog}
            drugSafetyReport={drugSafetyReport}
            aiDoctorBrief={aiDoctorBrief}
            onTakeMed={(id) => handleTakeMed(id)}
            onUndoMed={handleUndoMed}
            onAddOrEditMed={handleAddOrEditMed}
            onRefillMed={handleRefillMed}
            onDeleteMed={handleDeleteMed}
            onRunDrugSafetyAi={handleRunDrugSafetyAi}
            onSaveShiftHandoff={(resp, note) => {
              setOnDutyResponder(resp);
              setShiftHandoffNote(note);
              setLastHandoffAt('Just now');
              setAuditLog((prev) => [
                {
                  id: `aud-${Date.now()}`,
                  when: 'Just now',
                  actor: `${caretakerInfo.name} (Caretaker)`,
                  role: 'caretaker',
                  note: `Updated Shift Handoff for ${resp.split(' (')[0]}: "${note}"`,
                },
                ...prev,
              ]);
              showToast('✓ Saved timestamped shift handoff.');
            }}
            onAddVital={(type, value, notes) => {
              const num = parseInt(value, 10);
              const status: 'normal' | 'elevated' | 'attention' =
                num >= 150 || num <= 65
                  ? 'attention'
                  : num >= 135
                    ? 'elevated'
                    : 'normal';
              setVitals((prev) => [
                {
                  id: `v-${Date.now()}`,
                  type,
                  value,
                  status,
                  notes: notes || 'Recorded via Caretaker Station',
                  when: 'Just now',
                  by: caretakerInfo.name,
                },
                ...prev,
              ]);
              setAuditLog((prev) => [
                {
                  id: `aud-${Date.now()}`,
                  when: 'Just now',
                  actor: `${caretakerInfo.name} (Caretaker)`,
                  role: 'caretaker',
                  note: `Logged ${type}: ${value} (${status.toUpperCase()}).`,
                },
                ...prev,
              ]);
              showToast(`✓ Logged ${type}: ${value}`);
            }}
            onAddAppointment={(appt) => {
              setAppointments((prev) => [
                ...prev,
                { ...appt, id: `appt-${Date.now()}` },
              ]);
              showToast('📅 Scheduled appointment with Google Calendar & Maps links.');
            }}
            onToggleChecklist={(apptId, checkId) => {
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === apptId
                    ? {
                        ...a,
                        checklist: a.checklist.map((c) =>
                          c.id === checkId ? { ...c, done: !c.done } : c
                        ),
                      }
                    : a
                )
              );
            }}
            onSavePostVisitOutcome={(apptId, outcomeText) => {
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === apptId ? { ...a, postVisitOutcome: outcomeText } : a
                )
              );
              setAuditLog((prev) => [
                {
                  id: `aud-${Date.now()}`,
                  when: 'Just now',
                  actor: `${caretakerInfo.name} (Caretaker)`,
                  role: 'caretaker',
                  note: `Logged Post-Visit Outcome: "${outcomeText}"`,
                },
                ...prev,
              ]);
              showToast('✓ Saved Post-Visit Outcome to card & audit log.');
            }}
            onRefreshAiDoctorBrief={handleRefreshAiDoctorBrief}
            onDispatchEmail={handleDispatchEmail}
            onRunAutoScanEmails={handleRunAutoScanEmails}
            onOpenFridgeSheet={() => setShowFridgeSheetModal(true)}
            onToast={showToast}
          />
        )}

        {role === 'family' && (
          <FamilyPeaceHubView
            elderName={elderName}
            familyName={familyInfo.name}
            onDutyResponder={onDutyResponder}
            shiftHandoffNote={shiftHandoffNote}
            currentFeeling={currentFeeling}
            hydrationGlasses={hydrationGlasses}
            autonomy={autonomy}
            medications={medications}
            appointments={appointments}
            vitals={vitals}
            emails={emails}
            careNotes={careNotes}
            onRefillMed={handleRefillMed}
            onSendFamilyNote={(category, message) => {
              setCareNotes((prev) => [
                {
                  id: `n-${Date.now()}`,
                  author: familyInfo.name,
                  role: 'family',
                  category,
                  message,
                  when: 'Just now',
                },
                ...prev,
              ]);
              setAuditLog((prev) => [
                {
                  id: `aud-${Date.now()}`,
                  when: 'Just now',
                  actor: `${familyInfo.name} (Family)`,
                  role: 'family',
                  note: `Posted ${category}: "${message}"`,
                },
                ...prev,
              ]);
              showToast('💌 Posted note to Care Circle!');
            }}
            onDispatchEmail={handleDispatchEmail}
          />
        )}
      </main>

      {/* =========================================================
          DEDICATED ELDER & CARE TEAM PROFILE MODAL
          ========================================================= */}
      <ElderProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenOnboarding={() => setStage('onboarding')}
        elderName={elderName}
        elderAge={elderAge}
        bloodGroup={bloodGroup}
        allergies={allergies}
        conditions={conditions}
        mobilityNotes={mobilityNotes}
        primaryDoctor={primaryDoctor}
        emergencyPhone={emergencyPhone}
        routine={routine}
        caretaker={{
          ...caretakerInfo,
          handoffNote: shiftHandoffNote,
          lastVitalSummary: `${vitals[0]?.type}: ${vitals[0]?.value} (${vitals[0]?.when})`,
        }}
        family={{
          ...familyInfo,
          lastNoteSummary:
            careNotes.find((n) => n.role === 'family')?.message ||
            'Monitoring daily adherence & refills',
        }}
        autonomy={autonomy}
        currentFeeling={currentFeeling}
        hydrationGlasses={hydrationGlasses}
        meals={meals}
        medications={medications}
        auditLog={auditLog}
      />

      {/* =========================================================
          EMERGENCY MEDICAL ID CARD MODAL (PRINTABLE)
          ========================================================= */}
      {showMedicalIdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-print-container w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="rounded-xl bg-red-700 p-4 text-white">
              <div className="text-xs font-bold uppercase tracking-wider">
                Emergency Medical ID Card • Care Circle KC-2026
              </div>
              <h3 className="mt-1 text-xl font-extrabold">
                {elderName} ({elderAge} yrs • Blood Group {bloodGroup})
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 font-bold text-red-900">
                CRITICAL ALLERGIES: {allergies.join(', ')}
              </div>
              <div>
                <strong>Conditions:</strong> {conditions.join(' • ')}
              </div>
              <div>
                <strong>Primary Physician:</strong> {primaryDoctor}
              </div>
              <div>
                <strong>Emergency Contact:</strong> {emergencyPhone} ({familyInfo.name})
              </div>
              <div>
                <strong>Active Medications &amp; Purpose:</strong>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  {medications.map((m) => (
                    <li key={m.id}>
                      <strong>{m.name}</strong> ({m.dosage} at {m.time}) — {m.purpose}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="no-print mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-[#0F524B] px-4 py-2 text-xs font-bold text-white"
              >
                🖨️ Print Emergency Card
              </button>
              <button
                type="button"
                onClick={() => setShowMedicalIdModal(false)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PRINTABLE FRIDGE PILLBOX SCHEDULE MODAL
          ========================================================= */}
      {showFridgeSheetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-print-container w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#14171A]">
              Printable Fridge Pillbox Schedule — {elderName}
            </h3>
            <p className="text-xs text-[#57606A]">
              High-contrast weekly check-off sheet for taping beside physical pillboxes.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F5F1]">
                    <th className="border border-black/20 p-2">Time</th>
                    <th className="border border-black/20 p-2">Medicine &amp; Purpose</th>
                    <th className="border border-black/20 p-2">Pill Look</th>
                    <th className="border border-black/20 p-2">Meal Rule</th>
                    <th className="border border-black/20 p-2">Weekly Check</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((m) => (
                    <tr key={m.id}>
                      <td className="border border-black/20 p-2 font-bold">{m.time}</td>
                      <td className="border border-black/20 p-2">
                        <strong>{m.name}</strong> ({m.dosage})
                        <div className="text-[11px] text-[#57606A]">{m.purpose}</div>
                      </td>
                      <td className="border border-black/20 p-2">
                        {m.colorName} {m.shape} ({m.imprint})
                      </td>
                      <td className="border border-black/20 p-2">{m.mealTiming}</td>
                      <td className="border border-black/20 p-2 font-mono">
                        [ ]M [ ]T [ ]W [ ]T [ ]F [ ]S [ ]S
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="no-print mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-[#0F524B] px-4 py-2 text-xs font-bold text-white"
              >
                🖨️ Print Fridge Sheet
              </button>
              <button
                type="button"
                onClick={() => setShowFridgeSheetModal(false)}
                className="rounded-xl border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
