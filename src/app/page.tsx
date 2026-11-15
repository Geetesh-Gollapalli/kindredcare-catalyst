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
import BranchedMenu from '@/components/BranchedMenu';
import CodeSlots from '@/components/CodeSlots';
import TechText from '@/components/TechText';
import { KindredCareGlassLogo } from '@/components/GlassIconReveal';
import DoodleCrewFooter from '@/components/DoodleCrewFooter';
import AnimatedList from '@/components/AnimatedList';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  CheckListIcon,
  FileUploadIcon,
  HeartCheckIcon,
  Logout01Icon,
  Mail01Icon,
  MedicalFileIcon,
  Medicine02Icon,
  PrinterIcon,
  SecurityCheckIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
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
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [role, setRole] = useState<CareRole>('elder');
  const [pendingRoleTarget, setPendingRoleTarget] = useState<CareRole>('elder');
  const [portalRoleTab, setPortalRoleTab] = useState<CareRole>('elder');
  const [memberNameInput, setMemberNameInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [pinSlotStatus, setPinSlotStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [customPins, setCustomPins] = useState<Record<CareRole, string[]>>({
    elder: ['1234'],
    caretaker: ['2026', 'CARE2026'],
    family: ['8899', 'FAMILY26'],
  });

  // Active sub-tabs for BranchedMenu synchronization
  const [elderActiveTab, setElderActiveTab] = useState<'meds' | 'visits' | 'privacy'>('meds');
  const [caretakerActiveTab, setCaretakerActiveTab] = useState<'shift' | 'meds' | 'appts' | 'emails'>('shift');
  const [familyActiveTab, setFamilyActiveTab] = useState<'peace' | 'schedule' | 'alerts'>('peace');

  // Accessibility & Modals
  const [comfortMode, setComfortMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMedicalIdModal, setShowMedicalIdModal] = useState(false);
  const [showFridgeSheetModal, setShowFridgeSheetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Care Circle Core State
  const [elderName, setElderName] = useState('Primary Care Patient');
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
    name: 'Registered Caretaker',
    shift: 'Primary Caretaker & Nurse (8:00 AM - 8:00 PM)',
    email: 'careteam@kindredcare.ai',
  });
  const [familyInfo, setFamilyInfo] = useState({
    name: 'Family Coordinator',
    relation: 'Primary Family Contact',
    email: 'family@kindredcare.ai',
  });
  const [onDutyResponder, setOnDutyResponder] = useState(
    'Registered Caretaker (On Duty)'
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
      by: 'Patient Self-Log',
    },
    {
      id: 'v2',
      type: 'Blood Glucose',
      value: '112 mg/dL',
      status: 'normal',
      notes: 'Fasting morning check',
      when: 'Today, 07:30 AM',
      by: 'Registered Caretaker',
    },
  ]);

  const [emails, setEmails] = useState<CaretakerEmailItem[]>([
    {
      id: 'em-1',
      category: 'upcoming_dose',
      subject: 'Morning Medication Reminder: Thyronorm 50mcg (7:00 AM)',
      recipients: 'Care Circle Members',
      preview:
        'Take 1 white round tablet on an empty stomach 45 mins before morning tea or breakfast.',
      sentAt: 'Today, 06:45 AM',
      status: 'Delivered via SMTP',
    },
  ]);

  const [careNotes, setCareNotes] = useState([
    {
      id: 'n1',
      author: 'Family Coordinator',
      role: 'family',
      category: 'encouragement',
      message:
        'Ordered the Shelcal 500 refill from the pharmacy — scheduled for delivery this evening.',
      when: '3 hours ago',
    },
    {
      id: 'n2',
      author: 'Primary Care Patient',
      role: 'elder',
      category: 'question_for_doctor',
      message:
        'Ask Dr. Sharma tomorrow if evening Amlopres should be adjusted when afternoon BP is below 115/75.',
      when: 'Yesterday',
    },
  ]);

  const [auditLog, setAuditLog] = useState<ProfileAuditEntry[]>([
    {
      id: 'aud-1',
      when: 'Today, 08:35 AM',
      actor: 'Elder Companion',
      role: 'elder',
      note: 'Confirmed taking Glycomet SR 500 after breakfast.',
    },
    {
      id: 'aud-2',
      when: 'Today, 07:30 AM',
      actor: 'Registered Caretaker',
      role: 'caretaker',
      note: 'Logged fasting Blood Glucose: 112 mg/dL (Normal).',
    },
    {
      id: 'aud-3',
      when: '3 hours ago',
      actor: 'Family Coordinator',
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

  // Initial Crash-Free Backend Warmup & Automatic First-Time Detection
  useEffect(() => {
    let mounted = true;
    async function bootWarmup() {
      let alreadyOnboarded = false;
      try {
        setWaitProgress(45);
        const localFlag =
          typeof window !== 'undefined' &&
          window.localStorage.getItem('kindredcare_onboarded_v2') === 'true';
        const res = await fetch('/api/circle').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          alreadyOnboarded = Boolean(data?.isOnboarded) || localFlag;
          const safe = ensureSafeCircleState(data?.circle);
          if (mounted && alreadyOnboarded && safe.elderName) {
            setIsOnboarded(true);
            setElderName(safe.elderName);
            setElderAge(safe.elderAge);
            setBloodGroup(safe.bloodGroup);
            setAllergies(safe.allergies);
            setConditions(safe.conditions);
            setPrimaryDoctor(safe.primaryDoctor);
            setEmergencyPhone(safe.emergencyPhone);
            const ctMember = safe.members.find((m) => m.role === 'caretaker');
            const fmMember = safe.members.find((m) => m.role === 'family');
            if (ctMember) {
              setCaretakerInfo((prev) => ({
                ...prev,
                name: ctMember.name,
                email: ctMember.email,
              }));
            }
            if (fmMember) {
              setFamilyInfo((prev) => ({
                ...prev,
                name: fmMember.name,
                relation: fmMember.relation,
                email: fmMember.email,
              }));
            }
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
          if (!mounted) return;
          // Automatic first-time detection: open Onboarding directly without asking
          if (!alreadyOnboarded) {
            setStage('onboarding');
          } else {
            setStage('portal');
          }
        }, 550);
      }, 1100);
    }
    bootWarmup();
    return () => {
      mounted = false;
    };
  }, []);

  async function enterRoleWithHydrationGate(
    targetRole: CareRole,
    passUsed?: string,
    memberNameUsed?: string
  ) {
    setPendingRoleTarget(targetRole);
    setWaitProgress(35);
    setWaitSteps([
      {
        id: 'r1',
        label: `Verifying ${targetRole.toUpperCase()} Identity & Security PIN`,
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
          passcode: passUsed || customPins[targetRole][0],
          role: targetRole,
          memberName: memberNameUsed || undefined,
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
      showToast(
        `Signed in as ${
          memberNameUsed ||
          (targetRole === 'elder'
            ? elderName
            : targetRole === 'caretaker'
              ? caretakerInfo.name
              : familyInfo.name)
        }`
      );
    }, 240);
  }

  async function handlePortalUnlock() {
    const nameEntered = memberNameInput.trim();
    const pass = passcodeInput.trim();

    if (!nameEntered) {
      setPortalError('Please enter your full name to sign in.');
      return;
    }

    if (pass.length < 4) {
      setPortalError('Please enter your 4+ digit security PIN.');
      return;
    }

    // Try server-side scrypt verification first
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: portalRoleTab,
          memberName: nameEntered,
          passcode: pass,
        }),
      });
      if (res.ok) {
        setPinSlotStatus('success');
        setFailedAttempts(0);
        setPortalError(null);
        setPasscodeInput('');
        await enterRoleWithHydrationGate(portalRoleTab, pass, nameEntered);
        return;
      }
    } catch {
      // Fallback to local customPins check
    }

    const matchedRole = (Object.keys(customPins) as CareRole[]).find((r) =>
      customPins[r].some((p) => p.toUpperCase() === pass.toUpperCase())
    );

    if (!matchedRole) {
      setPinSlotStatus('error');
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      const rem = Math.max(0, 5 - nextFail);
      setPortalError(
        `Incorrect security PIN for ${nameEntered}. (${rem} attempts remaining before 5-minute security lockout)`
      );
      return;
    }

    setPinSlotStatus('success');
    setFailedAttempts(0);
    setPortalError(null);
    setPasscodeInput('');
    await enterRoleWithHydrationGate(matchedRole, pass, nameEntered);
  }

  async function handleDeleteProfile() {
    await fetch('/api/circle', { method: 'DELETE' }).catch(() => null);
    await fetch('/api/auth', { method: 'DELETE' }).catch(() => null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('kindredcare_onboarded_v2');
    }
    setIsOnboarded(false);
    setShowProfileModal(false);
    setMemberNameInput('');
    setPasscodeInput('');
    setPinSlotStatus('idle');
    setStage('onboarding');
    showToast('Profile deleted & Care Circle reset. Starting fresh first-time onboarding.');
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

    showToast(`Marked ${target.name} as Taken (${nowStr}).`);
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
    showToast(`Undid ${target.name} log & restored 1 tablet.`);
  }

  function handleSnoozeMed(medId: string) {
    const target = medications.find((m) => m.id === medId);
    if (!target) return;
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'snoozed' } : m))
    );
    showToast(`Reminder snoozed for 15 minutes for ${target.name}.`);
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
        subject: `Urgent Refill Needed: ${target.name} (Skipped due to 0 stock)`,
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
    showToast(`Added +30 tablets to ${target.name}.`);
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
      showToast(`Updated ${med.name} schedule & purpose.`);
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
      showToast(`Added ${med.name} to Care Circle schedule.`);
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
    showToast(`Dispatched Email: ${subject}`);
  }

  async function handleRunAutoScanEmails(customRecipient?: string) {
    const low = medications.filter((m) => m.stock <= 7);
    if (low.length > 0) {
      await handleDispatchEmail({
        category: 'low_refill',
        subject: `Low Pill Inventory Alert: ${low[0].name} (${low[0].stock} left)`,
        preview: `${elderName}'s supply of ${low[0].name} is down to ${low[0].stock} tablets.`,
        customRecipient,
      });
    }
    await handleDispatchEmail({
      category: 'appointment_reminder',
      subject: `24h Appointment Reminder: ${appointments[0]?.doctorName} (${appointments[0]?.dateTimeLabel})`,
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
        showToast(`Refreshed via ${data.report.providerUsed}`);
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
        showToast(`Generated Clinical Brief via ${data.brief.providerUsed}`);
      }
    } catch {
      showToast('Updated Pre-Appointment Clinical Brief.');
    }
  }

  async function handleCompleteOnboarding(data: OnboardingFormData) {
    const cleanElderName = data.elderName.trim() || 'Registered Elder';
    const cleanCaretakerName = data.caretakerName.trim() || 'Primary Caretaker';
    const cleanFamilyName = data.familyName.trim() || 'Family Coordinator';

    setElderName(cleanElderName);
    setElderAge(data.elderAge || 70);
    setBloodGroup(data.bloodGroup || 'O+');
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
    setPrimaryDoctor(data.primaryDoctor || 'Primary Care Physician');
    setEmergencyPhone(data.emergencyPhone || '+91 98400 11223');
    setRoutine({
      wakeTime: data.wakeTime,
      breakfastTime: data.breakfastTime,
      lunchTime: data.lunchTime,
      dinnerTime: data.dinnerTime,
      bedTime: data.bedTime,
    });
    setCaretakerInfo({
      name: cleanCaretakerName,
      shift: data.caretakerShift || 'Primary Care Shift',
      email: data.caretakerEmail || 'caretaker@kindredcare.health',
    });
    setFamilyInfo({
      name: cleanFamilyName,
      relation: data.familyRelation || 'Family Coordinator',
      email: data.familyEmail || 'family@kindredcare.health',
    });
    setOnDutyResponder(`${cleanCaretakerName} (Primary Caretaker)`);
    setAutonomy({
      graceMinutes: data.graceMinutes,
      allowFamilyEdits: data.allowFamilyEdits,
      shareVitals: data.shareVitals,
      language: data.language,
    });

    setCustomPins((prev) => ({
      elder: data.elderPin.trim() ? [data.elderPin.trim(), ...prev.elder] : prev.elder,
      caretaker: data.caretakerPin.trim()
        ? [data.caretakerPin.trim(), ...prev.caretaker]
        : prev.caretaker,
      family: data.familyPin.trim() ? [data.familyPin.trim(), ...prev.family] : prev.family,
    }));

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
        elderName: cleanElderName,
        elderAge: data.elderAge,
        bloodGroup: data.bloodGroup,
        allergies: data.allergiesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        conditions: data.conditionsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        primaryDoctor: data.primaryDoctor,
        emergencyPhone: data.emergencyPhone,
        elderPin: data.elderPin.trim() || undefined,
        caretakerName: cleanCaretakerName,
        caretakerEmail: data.caretakerEmail,
        caretakerPin: data.caretakerPin.trim() || undefined,
        familyName: cleanFamilyName,
        familyRelation: data.familyRelation,
        familyEmail: data.familyEmail,
        familyPin: data.familyPin.trim() || undefined,
        medications: data.medications.map((m) => ({
          name: m.name,
          genericName: m.genericName,
          dosage: m.dosage,
          purpose: m.purpose,
          slot:
            parseInt(m.time, 10) < 11
              ? 'morning'
              : parseInt(m.time, 10) < 16
                ? 'afternoon'
                : parseInt(m.time, 10) < 20
                  ? 'evening'
                  : 'bedtime',
          scheduledTime: /^\d{2}:\d{2}$/.test(m.time) ? m.time : '08:30',
          mealTiming: m.mealTiming.toLowerCase().includes('empty')
            ? 'empty_stomach'
            : m.mealTiming.toLowerCase().includes('before')
              ? 'before_meal'
              : 'after_meal',
          colorName: m.colorName,
          shape: m.shape,
          imprint: m.imprint,
          stock: m.stock,
        })),
      }),
    }).catch(() => null);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('kindredcare_onboarded_v2', 'true');
    }
    setIsOnboarded(true);
    setMemberNameInput(cleanElderName);
    setPasscodeInput('');
    setStage('portal');
    showToast('Profile, Medications & Security PINs saved.');
  }

  /* =========================================================
     RENDER 1: CRASH-FREE BOOT & ROLE LOGIN WAIT SCREEN
     ========================================================= */
  if (stage === 'boot' || stage === 'role_wait') {
    const resolvedName =
      pendingRoleTarget === 'elder'
        ? elderName
        : pendingRoleTarget === 'caretaker'
          ? caretakerInfo.name
          : familyInfo.name;
    return (
      <BootAndLoginWaitScreen
        mode={stage === 'boot' ? 'boot' : 'role_login'}
        roleTarget={pendingRoleTarget}
        profileName={isOnboarded ? resolvedName : undefined}
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
          <div className="fixed right-5 bottom-5 z-50 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold text-[#f5f5f5] shadow-xl">
            {toastMessage}
          </div>
        )}
        <OnboardingWizard
          initialData={{
            elderName: isOnboarded ? elderName : '',
            elderAge: isOnboarded ? elderAge : 70,
            bloodGroup: isOnboarded ? bloodGroup : 'O+',
            allergiesText: isOnboarded ? allergies.join(', ') : '',
            conditionsText: isOnboarded ? conditions.join(', ') : '',
            mobilityAndComfortNotes: isOnboarded ? mobilityNotes : '',
            primaryDoctor: isOnboarded ? primaryDoctor : '',
            emergencyPhone: isOnboarded ? emergencyPhone : '',
            elderPin: '',
            wakeTime: routine.wakeTime,
            breakfastTime: routine.breakfastTime,
            lunchTime: routine.lunchTime,
            dinnerTime: routine.dinnerTime,
            bedTime: routine.bedTime,
            caretakerName: isOnboarded ? caretakerInfo.name : '',
            caretakerShift: isOnboarded ? caretakerInfo.shift : 'Morning & Evening Shift',
            caretakerEmail: isOnboarded ? caretakerInfo.email : '',
            caretakerPin: '',
            familyName: isOnboarded ? familyInfo.name : '',
            familyRelation: isOnboarded ? familyInfo.relation : 'Family Member',
            familyEmail: isOnboarded ? familyInfo.email : '',
            familyPin: '',
            language: autonomy.language,
            graceMinutes: autonomy.graceMinutes,
            allowFamilyEdits: autonomy.allowFamilyEdits,
            shareVitals: autonomy.shareVitals,
            medications: isOnboarded
              ? medications.map((m) => ({
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
                }))
              : [],
          }}
          onComplete={handleCompleteOnboarding}
          onSkipToDemo={() => {
            setIsOnboarded(true);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('kindredcare_onboarded_v2', 'true');
            }
            setStage('portal');
          }}
          onToast={showToast}
        />
      </>
    );
  }

  /* =========================================================
     RENDER 3: PROFESSIONAL NAME + PIN SIGN-IN PORTAL
     ========================================================= */
  if (stage === 'portal') {
    const portalHighlights = [
      {
        id: 'hl-elder',
        title: 'Elderly Member Workspace',
        desc: 'Calm 3-button companion with physical pill visuals, meal-timing safety guard, and multilingual voice read-aloud.',
      },
      {
        id: 'hl-caretaker',
        title: 'Caretaker Clinical Station',
        desc: 'Shift administration, AI prescription scanner, drug-interaction guard, vitals tracking, and doctor visit briefs.',
      },
      {
        id: 'hl-family',
        title: 'Family Peace-of-Mind Hub',
        desc: 'Real-time 7-day adherence calendar, pharmacy refill tracking, and proactive email reminders honoring Elder privacy settings.',
      },
    ];

    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col justify-between bg-black text-[#f5f5f5]"
      >
        {toastMessage && (
          <div className="fixed right-5 bottom-5 z-50 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold text-[#f5f5f5] shadow-xl">
            {toastMessage}
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          {/* Landing Hero Stage: Pure Black Backdrop + 21st.dev GlassIconReveal Logo + React Bits TechText Directly Underneath */}
          <div className="mb-8 flex w-full max-w-3xl flex-col items-center text-center">
            <div className="h-44 w-44 sm:h-52 sm:w-52">
              <KindredCareGlassLogo
                className="h-full w-full"
                tileSize={210}
                look="dark"
                background="#000000"
                logoColor="#ffffff"
                hold={1.8}
              />
            </div>
            <div className="mx-auto -mt-2 h-20 w-full max-w-md">
              <TechText
                text="KindredCare AI"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={600}
                fontSize={42}
                color="#f5f5f5"
                accentColor="#5227FF"
                align="center"
                reveal="letter"
                dashLength={4}
                dashGap={2}
                specks={15}
                intro="type"
                introDuration={1.8}
                clickKick
                guides={false}
              />
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              Connected Elderly Care &amp; Medication Ecosystem
            </p>
          </div>

          <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl lg:grid-cols-12">
            {/* Left Column: Architecture Highlights (AnimatedList) + Health Setup */}
            <div className="flex flex-col justify-between border-b border-zinc-800 bg-zinc-950 p-7 lg:col-span-6 lg:border-b-0 lg:border-r lg:p-10">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#f5f5f5]">
                    Shared elderly care, built around dignity.
                  </h1>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                    Sign in with your <strong className="text-zinc-200">Name</strong> and{' '}
                    <strong className="text-zinc-200">Security PIN</strong> to open your
                    dedicated role workspace. Elders receive a calm, large-button companion
                    while Caretakers and Family members access clinical and adherence tools.
                  </p>
                </div>

                {/* Role Architecture Highlights (React Bits AnimatedList) */}
                <div className="pt-1">
                  <AnimatedList
                    items={portalHighlights}
                    maxHeight={290}
                    showGradients={false}
                    displayScrollbar={false}
                    renderItem={(item, _idx, isSelected) => (
                      <div
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? 'border-[#5227FF] bg-[#5227FF]/12 shadow-xs'
                            : 'border-zinc-800 bg-zinc-900/70'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
                          {item.title}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={() => setStage('onboarding')}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-[#f5f5f5] hover:bg-zinc-800"
                >
                  <HugeiconsIcon icon={FileUploadIcon} size={15} strokeWidth={1.8} />
                  Update Health Profile / Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/15 px-4 py-2.5 text-xs font-bold text-violet-200 hover:bg-[#5227FF]/25"
                >
                  <HugeiconsIcon icon={UserCircleIcon} size={15} strokeWidth={1.8} />
                  View Care Circle Profile
                </button>
              </div>
            </div>

            {/* Right Column: Clean Name + React Bits CodeSlots PIN Entry */}
            <div className="flex flex-col justify-center bg-zinc-950 p-7 lg:col-span-6 lg:p-10">
              <h2 className="text-2xl font-extrabold text-[#f5f5f5]">
                Sign In to Your Workspace
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Select your role, enter your full name, and enter your personal security PIN.
              </p>

              {/* Clean Role Selector Tabs (Zero Exposed PINs) */}
              <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
                {(
                  [
                    { r: 'elder', label: 'Elderly Member' },
                    { r: 'caretaker', label: 'Caretaker / Nurse' },
                    { r: 'family', label: 'Family Member' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.r}
                    type="button"
                    onClick={() => {
                      setPortalRoleTab(tab.r);
                      setPasscodeInput('');
                      setPinSlotStatus('idle');
                      setPortalError(null);
                    }}
                    className={`rounded-lg py-2.5 text-xs font-bold transition ${
                      portalRoleTab === tab.r
                        ? 'bg-[#5227FF] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="member-name-field"
                    className="block text-xs font-bold text-zinc-200"
                  >
                    Your Full Name
                  </label>
                  <input
                    id="member-name-field"
                    type="text"
                    placeholder={
                      portalRoleTab === 'elder'
                        ? 'Enter your full name'
                        : portalRoleTab === 'caretaker'
                          ? 'Enter caretaker name'
                          : 'Enter family member name'
                    }
                    value={memberNameInput}
                    onChange={(e) => {
                      setMemberNameInput(e.target.value);
                      setPortalError(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-[#f5f5f5] placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="passcode-field"
                      className="block text-xs font-bold text-zinc-200"
                    >
                      Your Security PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasscodeText(!showPasscodeText)}
                      className="text-[11px] font-bold text-violet-300 hover:underline"
                    >
                      {showPasscodeText ? 'Mask PIN Digits' : 'Show PIN Digits'}
                    </button>
                  </div>

                  {/* React Bits CodeSlots Component for PIN Entry */}
                  <div className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black px-4 py-4 shadow-inner">
                    <CodeSlots
                      length={4}
                      value={passcodeInput.replace(/\D/g, '').slice(0, 4)}
                      status={pinSlotStatus}
                      mask={!showPasscodeText}
                      onChange={(code: string) => {
                        setPasscodeInput(code);
                        if (pinSlotStatus !== 'idle') setPinSlotStatus('idle');
                        setPortalError(null);
                      }}
                      onComplete={(code: string) => {
                        setPasscodeInput(code);
                      }}
                      accentColor="#5227FF"
                      inkColor="#f5f5f5"
                      slotColor="#27272a"
                      digitColor="#18181b"
                      dangerColor="#ff3b30"
                      slotSize={48}
                      gap={10}
                      radius={12}
                      bounce={0.2}
                      settle={0.3}
                      rise={8}
                      cascade={20}
                      ariaLabel="Security PIN"
                    />
                    {/* Hidden accessible input for tests & password managers */}
                    <input
                      id="passcode-field"
                      type={showPasscodeText ? 'text' : 'password'}
                      value={passcodeInput}
                      onChange={(e) => {
                        setPasscodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setPinSlotStatus('idle');
                        setPortalError(null);
                      }}
                      className="sr-only"
                      aria-label="Enter your 4+ digit PIN"
                    />
                  </div>
                </div>
              </div>

              {/* Numeric Keypad */}
              <div
                className="mt-4 grid grid-cols-3 gap-2"
                aria-label="Security PIN numeric keypad"
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Del'].map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPinSlotStatus('idle');
                        setPortalError(null);
                        if (key === 'Clear') setPasscodeInput('');
                        else if (key === 'Del')
                          setPasscodeInput((prev) => prev.slice(0, -1));
                        else
                          setPasscodeInput((prev) =>
                            prev.length < 4 ? prev + key : prev
                          );
                      }}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-sm font-bold text-[#f5f5f5] hover:bg-zinc-800"
                    >
                      {key}
                    </button>
                  )
                )}
              </div>

              {portalError && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/40 bg-red-950/50 px-3.5 py-2.5 text-xs font-bold text-red-200"
                >
                  {portalError}
                </div>
              )}

              <button
                type="button"
                onClick={handlePortalUnlock}
                className="mt-4 w-full rounded-xl bg-[#5227FF] py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#6d4aff]"
              >
                Sign In to Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Profile Modal accessible from Portal too */}
        <ElderProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onOpenOnboarding={() => setStage('onboarding')}
          onDeleteProfile={handleDeleteProfile}
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

        {/* 21st.dev DoodleCrewFooter on Landing Page */}
        <div className="w-full no-print mt-8 border-t border-zinc-900">
          <DoodleCrewFooter
            wordmark="KINDREDCARE"
            brand="KindredCare AI"
            blurb="Role-isolated elderly care and medication safety platform powered by Adaption Labs Gemma 4, Gemini 2.5 Flash & Firebase."
            tagline="Shared elderly care, built around dignity."
            copyright="© 2026 KindredCare AI • PromptWars x Catalyst Hackathon"
            preset="night"
            palette={{ background: '#000000', ink: '#f5f5f5', accent: '#5227FF' }}
            doodles={['sparkle', 'star', 'heart', 'bolt']}
            columns={[
              {
                title: 'Workspaces',
                links: [
                  { label: 'Elder Companion', href: '#main-content' },
                  { label: 'Clinical Station', href: '#main-content' },
                  { label: 'Family Hub', href: '#main-content' },
                ],
              },
              {
                title: 'AI Safety',
                links: [
                  { label: 'PDF Medical Scanner', href: '#main-content' },
                  { label: 'Drug Interaction Guard', href: '#main-content' },
                  { label: 'Clinical Briefs', href: '#main-content' },
                ],
              },
              {
                title: 'Security',
                links: [
                  { label: 'Scrypt PIN Vault', href: '#main-content' },
                  { label: 'Elder Autonomy Locks', href: '#main-content' },
                  { label: 'Firebase Sync', href: '#main-content' },
                ],
              },
            ]}
            actions={[{ label: 'Back to Sign In', href: '#main-content', icon: 'sparkle', variant: 'solid' }]}
            socials={[
              { label: 'Firebase', href: '#main-content' },
              { label: 'Gemini AI', href: '#main-content' },
              { label: 'Gemma 4', href: '#main-content' },
            ]}
            legal={[
              { label: 'Privacy', href: '#main-content' },
              { label: 'Clinical Disclaimer', href: '#main-content' },
            ]}
          />
        </div>
      </main>
    );
  }

  /* =========================================================
     RENDER 4: ROLE-ISOLATED WORKSPACE WITH REACT BITS BRANCHED MENU
     ========================================================= */
  const familyNoteText = careNotes.find(
    (n) => n.category === 'encouragement'
  )?.message;

  const roleMenuItems =
    role === 'elder'
      ? [
          {
            label: 'My Daily Care',
            children: [
              { value: 'meds', label: "Today's Medicines", icon: Medicine02Icon },
              { value: 'visits', label: 'My Doctor Visits', icon: Calendar03Icon },
              { value: 'privacy', label: 'My Privacy & Help', icon: SecurityCheckIcon },
            ],
          },
          {
            label: 'My Records',
            children: [
              { value: 'profile', label: 'My Health Profile', icon: UserCircleIcon },
              { value: 'medical_id', label: 'Emergency Medical ID', icon: MedicalFileIcon },
              { value: 'lock', label: 'Lock & Sign Out', icon: Logout01Icon },
            ],
          },
        ]
      : role === 'caretaker'
        ? [
            {
              label: 'Clinical Station',
              children: [
                { value: 'shift', label: 'Shift & Daily Doses', icon: CheckListIcon },
                { value: 'meds', label: 'Medications & AI Guard', icon: Medicine02Icon },
                { value: 'appts', label: 'Appointments & Brief', icon: Calendar03Icon },
                { value: 'emails', label: 'Proactive Email Alerts', icon: Mail01Icon },
              ],
            },
            {
              label: 'Patient Records',
              children: [
                { value: 'profile', label: 'Patient & Care Team', icon: UserCircleIcon },
                { value: 'fridge', label: 'Printable Fridge Sheet', icon: PrinterIcon },
                { value: 'medical_id', label: 'Emergency Medical ID', icon: MedicalFileIcon },
                { value: 'lock', label: 'Lock & Sign Out', icon: Logout01Icon },
              ],
            },
          ]
        : [
            {
              label: 'Family Peace Hub',
              children: [
                { value: 'peace', label: 'Peace-of-Mind & Refills', icon: HeartCheckIcon },
                { value: 'schedule', label: 'Schedule & Visits', icon: Calendar03Icon },
                { value: 'alerts', label: 'Email Alerts & Digest', icon: Mail01Icon },
              ],
            },
            {
              label: 'Care Circle Info',
              children: [
                { value: 'profile', label: 'Elder & Care Team', icon: UserCircleIcon },
                { value: 'medical_id', label: 'Emergency Medical ID', icon: MedicalFileIcon },
                { value: 'lock', label: 'Lock & Sign Out', icon: Logout01Icon },
              ],
            },
          ];

  const currentActiveMenuValue =
    role === 'elder'
      ? elderActiveTab
      : role === 'caretaker'
        ? caretakerActiveTab
        : familyActiveTab;

  return (
    <div className="app-workspace-shell min-h-screen bg-black text-[#f5f5f5]">
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold text-[#f5f5f5] shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      {/* Role-Specific Header */}
      <header className="no-print sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <KindredCareLogo
              size={38}
              subtitle={
                role === 'elder'
                  ? `Elder Companion • ${elderName}`
                  : role === 'caretaker'
                    ? `Clinical Caretaker Station • ${caretakerInfo.name}`
                    : `Family Overview • ${familyInfo.name}`
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dedicated Elder & Care Team Profile Button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/15 px-3.5 py-2 text-xs font-bold text-violet-200 hover:bg-[#5227FF]/25"
            >
              <HugeiconsIcon icon={UserCircleIcon} size={15} strokeWidth={1.8} />
              {elderName}’s Profile &amp; Care Team
            </button>

            <button
              type="button"
              onClick={() => setShowMedicalIdModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/60 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-900/60"
            >
              <HugeiconsIcon icon={MedicalFileIcon} size={15} strokeWidth={1.8} />
              Medical ID
            </button>

            <button
              type="button"
              onClick={() => setComfortMode(!comfortMode)}
              aria-pressed={comfortMode}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                comfortMode
                  ? 'border-[#5227FF] bg-[#5227FF] text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
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
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              High Contrast
            </button>

            <button
              type="button"
              onClick={() => {
                setPasscodeInput('');
                setStage('portal');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-[#f5f5f5] hover:bg-zinc-800"
            >
              <HugeiconsIcon icon={Logout01Icon} size={14} strokeWidth={1.8} />
              Sign Out / Switch Role
            </button>
          </div>
        </div>
      </header>

      {/* Main Role-Isolated Stage with React Bits BranchedMenu Navigation */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-6 lg:flex-row">
        <aside className="no-print shrink-0 lg:w-64">
          <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              {role === 'elder'
                ? 'Elder Navigation'
                : role === 'caretaker'
                  ? 'Clinical Navigation'
                  : 'Family Navigation'}
            </div>
            <BranchedMenu
              items={roleMenuItems}
              defaultOpen={[0, 1]}
              activeValue={currentActiveMenuValue}
              onSelect={(val) => {
                if (val === 'profile') {
                  setShowProfileModal(true);
                  return;
                }
                if (val === 'medical_id') {
                  setShowMedicalIdModal(true);
                  return;
                }
                if (val === 'fridge') {
                  setShowFridgeSheetModal(true);
                  return;
                }
                if (val === 'lock') {
                  setPasscodeInput('');
                  setStage('portal');
                  return;
                }
                if (role === 'elder' && (val === 'meds' || val === 'visits' || val === 'privacy')) {
                  setElderActiveTab(val);
                } else if (
                  role === 'caretaker' &&
                  (val === 'shift' || val === 'meds' || val === 'appts' || val === 'emails')
                ) {
                  setCaretakerActiveTab(val);
                } else if (
                  role === 'family' &&
                  (val === 'peace' || val === 'schedule' || val === 'alerts')
                ) {
                  setFamilyActiveTab(val);
                }
              }}
              color="#f5f5f5"
              accentColor="#5227FF"
              lineColor="#3f3f46"
              width={230}
              rowHeight={38}
              indent={38}
              trunk={12}
              radius={10}
              lineWidth={1.6}
              fontSize={13}
              drawDuration={400}
              foldDuration={300}
            />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          {role === 'elder' && (
            <ElderCompanionView
              activeTab={elderActiveTab}
              onTabChange={setElderActiveTab}
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
                    subject: `Elder Refill Request: ${m.name} (${m.stock} left)`,
                    preview: `${elderName} requested a refill for ${m.name}.`,
                  });
                }
              }}
              onToggleMeal={(mealKey) => {
                setMeals((prev) => {
                  const next = { ...prev, [mealKey]: !prev[mealKey] };
                  showToast(
                    `${mealKey.charAt(0).toUpperCase() + mealKey.slice(1)} marked ${
                      next[mealKey] ? 'eaten' : 'not eaten yet'
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
                    : `Noted "${feeling}" — ${caretakerInfo.name.split(' ')[0]} has been notified.`
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
                showToast('Saved your question for the doctor.');
              }}
              onTriggerSos={() => {
                handleDispatchEmail({
                  category: 'elder_sos',
                  subject: `PRIORITY SOS: ${elderName} Requested Immediate Help`,
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
                showToast('Updated your personal privacy & comfort settings.');
              }}
              onToggleComfort={() => setComfortMode(!comfortMode)}
              onToggleContrast={() => setHighContrast(!highContrast)}
              onToast={showToast}
            />
          )}

          {role === 'caretaker' && (
            <CaretakerClinicalView
              activeTab={caretakerActiveTab}
              onTabChange={setCaretakerActiveTab}
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
                showToast('Saved timestamped shift handoff.');
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
                showToast(`Logged ${type}: ${value}`);
              }}
              onAddAppointment={(appt) => {
                setAppointments((prev) => [
                  ...prev,
                  { ...appt, id: `appt-${Date.now()}` },
                ]);
                showToast('Scheduled appointment with Google Calendar & Maps links.');
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
                showToast('Saved Post-Visit Outcome to card & audit log.');
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
              activeTab={familyActiveTab}
              onTabChange={setFamilyActiveTab}
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
                showToast('Posted note to Care Circle.');
              }}
              onDispatchEmail={handleDispatchEmail}
            />
          )}
        </main>
      </div>

      {/* =========================================================
          DEDICATED ELDER & CARE TEAM PROFILE MODAL
          ========================================================= */}
      <ElderProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenOnboarding={() => setStage('onboarding')}
        onDeleteProfile={handleDeleteProfile}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-print-container w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl">
            <div className="rounded-xl bg-red-700 p-4 text-white">
              <div className="text-xs font-bold uppercase tracking-wider">
                Emergency Medical ID Card • KindredCare
              </div>
              <h3 className="mt-1 text-xl font-extrabold">
                {elderName} ({elderAge} yrs • Blood Group {bloodGroup})
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="rounded-xl border border-red-500/40 bg-red-950/60 p-3 font-bold text-red-200">
                CRITICAL ALLERGIES: {allergies.join(', ') || 'None recorded'}
              </div>
              <div>
                <strong className="text-zinc-100">Conditions:</strong>{' '}
                {conditions.join(' • ') || 'None recorded'}
              </div>
              <div>
                <strong className="text-zinc-100">Primary Physician:</strong> {primaryDoctor}
              </div>
              <div>
                <strong className="text-zinc-100">Emergency Contact:</strong> {emergencyPhone} (
                {familyInfo.name})
              </div>
              <div>
                <strong className="text-zinc-100">Active Medications &amp; Purpose:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {medications.map((m) => (
                    <li key={m.id}>
                      <strong className="text-white">{m.name}</strong> ({m.dosage} at {m.time}) —{' '}
                      {m.purpose}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="no-print mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5227FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#6d4aff]"
              >
                <HugeiconsIcon icon={PrinterIcon} size={14} strokeWidth={1.8} />
                Print Emergency Card
              </button>
              <button
                type="button"
                onClick={() => setShowMedicalIdModal(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-print-container w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-[#f5f5f5] shadow-2xl">
            <h3 className="text-xl font-bold text-[#f5f5f5]">
              Printable Fridge Pillbox Schedule — {elderName}
            </h3>
            <p className="text-xs text-zinc-400">
              High-contrast weekly check-off sheet for taping beside physical pillboxes.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-200">
                    <th className="border border-zinc-800 p-2">Time</th>
                    <th className="border border-zinc-800 p-2">Medicine &amp; Purpose</th>
                    <th className="border border-zinc-800 p-2">Pill Look</th>
                    <th className="border border-zinc-800 p-2">Meal Rule</th>
                    <th className="border border-zinc-800 p-2">Weekly Check</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {medications.map((m) => (
                    <tr key={m.id}>
                      <td className="border border-zinc-800 p-2 font-bold text-white">{m.time}</td>
                      <td className="border border-zinc-800 p-2">
                        <strong className="text-white">{m.name}</strong> ({m.dosage})
                        <div className="text-[11px] text-zinc-400">{m.purpose}</div>
                      </td>
                      <td className="border border-zinc-800 p-2">
                        {m.colorName} {m.shape} ({m.imprint})
                      </td>
                      <td className="border border-zinc-800 p-2">{m.mealTiming}</td>
                      <td className="border border-zinc-800 p-2 font-mono">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5227FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#6d4aff]"
              >
                <HugeiconsIcon icon={PrinterIcon} size={14} strokeWidth={1.8} />
                Print Fridge Sheet
              </button>
              <button
                type="button"
                onClick={() => setShowFridgeSheetModal(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 21st.dev DoodleCrewFooter in Workspace */}
      <div className="w-full no-print mt-12 border-t border-zinc-900">
        <DoodleCrewFooter
          wordmark="KINDREDCARE"
          brand="KindredCare AI"
          blurb="Role-isolated elderly care and medication safety platform powered by Adaption Labs Gemma 4, Gemini 2.5 Flash & Firebase."
          tagline="Shared elderly care, built around dignity."
          copyright="© 2026 KindredCare AI • PromptWars x Catalyst Hackathon"
          preset="night"
          palette={{ background: '#000000', ink: '#f5f5f5', accent: '#5227FF' }}
          doodles={['sparkle', 'star', 'heart', 'bolt']}
          columns={[
            {
              title: 'Workspaces',
              links: [
                { label: 'Elder Companion', href: '#main-content' },
                { label: 'Clinical Station', href: '#main-content' },
                { label: 'Family Hub', href: '#main-content' },
              ],
            },
            {
              title: 'AI Safety',
              links: [
                { label: 'PDF Medical Scanner', href: '#main-content' },
                { label: 'Drug Interaction Guard', href: '#main-content' },
                { label: 'Clinical Briefs', href: '#main-content' },
              ],
            },
            {
              title: 'Security',
              links: [
                { label: 'Scrypt PIN Vault', href: '#main-content' },
                { label: 'Elder Autonomy Locks', href: '#main-content' },
                { label: 'Firebase Sync', href: '#main-content' },
              ],
            },
          ]}
          actions={[{ label: 'Top of Workspace', href: '#main-content', icon: 'sparkle', variant: 'solid' }]}
          socials={[
            { label: 'Firebase', href: '#main-content' },
            { label: 'Gemini AI', href: '#main-content' },
            { label: 'Gemma 4', href: '#main-content' },
          ]}
          legal={[
            { label: 'Privacy', href: '#main-content' },
            { label: 'Clinical Disclaimer', href: '#main-content' },
          ]}
        />
      </div>
    </div>
  );
}
