import fs from 'fs';
import path from 'path';
import type {
  Appointment,
  CareCircleState,
  CareMember,
  CareNote,
  CareRole,
  DoseLog,
  ElderAutonomySettings,
  EmailReminderLog,
  Medication,
  RolePasscodeRecord,
  VitalReading,
} from '@/types/domain';
import { hashPasscode } from '@/lib/security';
import { getLocalDateKey } from '@/lib/adherence';
import { syncCareCircleToFirestore } from '@/services/firebase';

const DEFAULT_CIRCLE_ID = 'circle-kc-2026';
const DEFAULT_CIRCLE_CODE = 'KC-2026';

// Pre-hashed role passcodes using cryptographic scrypt
// Elder Easy-PIN: "1234"
// Caretaker Passcode: "CARE2026" or keypad PIN "2026"
// Family Passcode: "FAMILY26" or keypad PIN "8899"
const elderHash = hashPasscode('1234', 'a1b2c3d4e5f60718293a4b5c6d7e8f90');
const caretakerHash = hashPasscode('CARE2026', 'b2c3d4e5f60718293a4b5c6d7e8f90a1');
const caretakerPinHash = hashPasscode('2026', 'd4e5f60718293a4b5c6d7e8f90a1b2c3');
const familyHash = hashPasscode('FAMILY26', 'c3d4e5f60718293a4b5c6d7e8f90a1b2');
const familyPinHash = hashPasscode('8899', 'e5f60718293a4b5c6d7e8f90a1b2c3d4');

export const DEFAULT_PASSCODE_RECORDS: RolePasscodeRecord[] = [
  {
    role: 'elder',
    salt: elderHash.salt,
    hash: elderHash.hash,
    label: 'Smt. Kamala Devi (Elder Owner)',
  },
  {
    role: 'caretaker',
    salt: caretakerHash.salt,
    hash: caretakerHash.hash,
    label: 'Ananya Rao (Primary Caretaker)',
  },
  {
    role: 'caretaker',
    salt: caretakerPinHash.salt,
    hash: caretakerPinHash.hash,
    label: 'Ananya Rao (Primary Caretaker)',
  },
  {
    role: 'family',
    salt: familyHash.salt,
    hash: familyHash.hash,
    label: 'Geetesh Gollapalli (Family Circle)',
  },
  {
    role: 'family',
    salt: familyPinHash.salt,
    hash: familyPinHash.hash,
    label: 'Geetesh Gollapalli (Family Circle)',
  },
];

function createSeedCareCircle(): CareCircleState {
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 5);
  nextWeek.setHours(16, 0, 0, 0);

  return {
    circleId: DEFAULT_CIRCLE_ID,
    circleCode: DEFAULT_CIRCLE_CODE,
    elderName: 'Smt. Kamala Devi',
    elderAge: 74,
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    conditions: ['Type 2 Diabetes', 'Essential Hypertension', 'Hypothyroidism'],
    primaryDoctor: 'Dr. Rajesh Sharma, MD (Geriatric Cardiology)',
    emergencyPhone: '+91 98400 11223',
    autonomySettings: {
      escalationGraceMinutes: 30,
      allowFamilyScheduleEdits: false,
      shareVitalsWithFamily: true,
      voiceReadoutEnabled: true,
      seniorComfortMode: false,
      preferredLanguage: 'English',
    },
    members: [
      {
        id: 'mem-elder-1',
        name: 'Smt. Kamala Devi',
        relation: 'Self (Center of Care)',
        role: 'elder',
        email: 'geeteshgollapalli@gmail.com',
        phone: '+91 98400 11220',
        receiveMissedAlerts: true,
        receiveAppointmentReminders: true,
        receiveRefillAlerts: true,
      },
      {
        id: 'mem-caretaker-1',
        name: 'Ananya Rao',
        relation: 'Primary Caretaker & Nurse',
        role: 'caretaker',
        email: 'geeteshgollapalli@gmail.com',
        phone: '+91 98400 11221',
        receiveMissedAlerts: true,
        receiveAppointmentReminders: true,
        receiveRefillAlerts: true,
      },
      {
        id: 'mem-family-1',
        name: 'Geetesh Gollapalli',
        relation: 'Grandson & Family Coordinator',
        role: 'family',
        email: 'geeteshgollapalli@gmail.com',
        phone: '+91 98400 11223',
        receiveMissedAlerts: true,
        receiveAppointmentReminders: true,
        receiveRefillAlerts: true,
      },
    ],
    medications: [
      {
        id: 'med-1',
        circleId: DEFAULT_CIRCLE_ID,
        name: 'Thyronorm 50mcg',
        genericName: 'Levothyroxine Sodium',
        dosage: '50 mcg (1 tablet)',
        purpose: 'Supports thyroid hormone balance & daily energy',
        plainExplanation:
          'Take this small white round pill first thing in the morning on an empty stomach with water. Wait 30 to 45 minutes before drinking tea, coffee, or eating breakfast.',
        slot: 'morning',
        scheduledTime: '07:00',
        mealTiming: 'empty_stomach',
        appearance: { color: 'White', shape: 'round', imprint: 'T50' },
        prescribedBy: 'Dr. Meera Nair (Endocrinology)',
        stockCount: 24,
        refillThreshold: 7,
        instructions: 'Take on an empty stomach 45 mins before breakfast or tea.',
        sideEffectsWatch: ['Fast heartbeat', 'Feeling unusually warm', 'Tremors'],
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
      {
        id: 'med-2',
        circleId: DEFAULT_CIRCLE_ID,
        name: 'Glycomet SR 500',
        genericName: 'Metformin Hydrochloride Sustained Release',
        dosage: '500 mg (1 tablet)',
        purpose: 'Keeps blood sugar steady after morning meals',
        plainExplanation:
          'Take this oval white tablet right after your breakfast. Taking it with food keeps your stomach comfortable and helps control blood sugar throughout the day.',
        slot: 'morning',
        scheduledTime: '08:30',
        mealTiming: 'after_meal',
        appearance: { color: 'White', shape: 'oval', imprint: 'SR500' },
        prescribedBy: 'Dr. Meera Nair (Endocrinology)',
        stockCount: 18,
        refillThreshold: 7,
        instructions: 'Swallow whole with water immediately after breakfast. Do not crush.',
        sideEffectsWatch: ['Mild nausea', 'Metallic taste', 'Dizziness if meal skipped'],
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
      {
        id: 'med-3',
        circleId: DEFAULT_CIRCLE_ID,
        name: 'Shelcal 500 (Calcium + Vit D3)',
        genericName: 'Elemental Calcium 500mg + Cholecalciferol 250 IU',
        dosage: '500 mg (1 tablet)',
        purpose: 'Strengthens bones & joints; spaced 6h away from thyroid pill',
        plainExplanation:
          'Take this light-blue tablet after lunch. Never take calcium at the same time as your morning thyroid pill because calcium blocks thyroid medicine absorption.',
        slot: 'afternoon',
        scheduledTime: '13:30',
        mealTiming: 'after_meal',
        appearance: { color: 'Sky Blue', shape: 'oval', imprint: 'SC500' },
        prescribedBy: 'Dr. Rajesh Sharma (Geriatrics)',
        stockCount: 4, // Low stock to demonstrate proactive refill alert!
        refillThreshold: 7,
        instructions: 'Take after lunch with water. Keep at least 4 hours apart from Thyronorm.',
        sideEffectsWatch: ['Constipation', 'Dry mouth'],
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
      {
        id: 'med-4',
        circleId: DEFAULT_CIRCLE_ID,
        name: 'Amlopres 5',
        genericName: 'Amlodipine Besylate',
        dosage: '5 mg (1 tablet)',
        purpose: 'Relaxes blood vessels to keep blood pressure safe',
        plainExplanation:
          'Take this yellow diamond-shaped tablet in the evening. Avoid grapefruit juice while taking this medicine, and stand up slowly from bed or chairs.',
        slot: 'evening',
        scheduledTime: '19:00',
        mealTiming: 'with_meal',
        appearance: { color: 'Soft Yellow', shape: 'diamond', imprint: 'AM5' },
        prescribedBy: 'Dr. Rajesh Sharma (Cardiology)',
        stockCount: 16,
        refillThreshold: 7,
        instructions: 'Take at 7:00 PM. Avoid grapefruit or pomelo juice.',
        sideEffectsWatch: ['Ankle swelling', 'Lightheadedness when standing quickly'],
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
      {
        id: 'med-5',
        circleId: DEFAULT_CIRCLE_ID,
        name: 'Atorva 10',
        genericName: 'Atorvastatin Calcium',
        dosage: '10 mg (1 tablet)',
        purpose: 'Protects heart health and manages cholesterol overnight',
        plainExplanation:
          'Take this small pink capsule before bedtime. Your body makes most cholesterol at night, so taking it before sleep works best.',
        slot: 'bedtime',
        scheduledTime: '21:30',
        mealTiming: 'anytime',
        appearance: { color: 'Rose Pink', shape: 'capsule', imprint: 'AT10' },
        prescribedBy: 'Dr. Rajesh Sharma (Cardiology)',
        stockCount: 22,
        refillThreshold: 7,
        instructions: 'Take with water before bedtime.',
        sideEffectsWatch: ['Unexplained muscle soreness', 'Fatigue'],
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      },
    ],
    doseLogs: [
      {
        id: 'log-seed-1',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-1',
        medicationName: 'Thyronorm 50mcg',
        dateKey: todayKey,
        scheduledTime: '07:00',
        status: 'taken',
        actionAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 4).toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-2',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-2',
        medicationName: 'Glycomet SR 500',
        dateKey: todayKey,
        scheduledTime: '08:30',
        status: 'taken',
        actionAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 35).toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-y1',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-1',
        medicationName: 'Thyronorm 50mcg',
        dateKey: yesterdayKey,
        scheduledTime: '07:00',
        status: 'taken',
        actionAt: yesterday.toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-y2',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-2',
        medicationName: 'Glycomet SR 500',
        dateKey: yesterdayKey,
        scheduledTime: '08:30',
        status: 'taken',
        actionAt: yesterday.toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-y3',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-3',
        medicationName: 'Shelcal 500 (Calcium + Vit D3)',
        dateKey: yesterdayKey,
        scheduledTime: '13:30',
        status: 'taken',
        actionAt: yesterday.toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-y4',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-4',
        medicationName: 'Amlopres 5',
        dateKey: yesterdayKey,
        scheduledTime: '19:00',
        status: 'skipped',
        reason: 'Felt slightly lightheaded before dinner; checked BP (114/72)',
        actionAt: yesterday.toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
      {
        id: 'log-seed-y5',
        circleId: DEFAULT_CIRCLE_ID,
        medicationId: 'med-5',
        medicationName: 'Atorva 10',
        dateKey: yesterdayKey,
        scheduledTime: '21:30',
        status: 'taken',
        actionAt: yesterday.toISOString(),
        loggedByRole: 'elder',
        loggedByName: 'Smt. Kamala Devi',
      },
    ],
    appointments: [
      {
        id: 'appt-1',
        circleId: DEFAULT_CIRCLE_ID,
        doctorName: 'Dr. Rajesh Sharma',
        specialty: 'Geriatric Cardiology & Hypertension Review',
        clinicName: 'Apollo Senior Heart & Wellness Centre',
        clinicAddress: 'Jubilee Hills Road No. 36, Hyderabad, Telangana 500033',
        dateTime: tomorrow.toISOString(),
        notes: 'Review 14-day evening BP logs and Amlopres 5mg dosage adjustment.',
        prepChecklist: [
          { id: 'p-1', text: 'Bring 14-day home Blood Pressure & Adherence Brief', completed: true },
          { id: 'p-2', text: 'Carry current pill organizer & latest lipid profile report', completed: true },
          { id: 'p-3', text: 'Ask if evening Amlopres can be reduced to 2.5mg on low-BP days', completed: false },
        ],
        reminder24hSent: false,
        reminder2hSent: false,
      },
      {
        id: 'appt-2',
        circleId: DEFAULT_CIRCLE_ID,
        doctorName: 'Dr. Meera Nair',
        specialty: 'Endocrinology & Thyroid Lab Follow-Up',
        clinicName: 'Care & Cure Diagnostics Clinic',
        clinicAddress: 'Banjara Hills Road No. 12, Hyderabad, Telangana 500034',
        dateTime: nextWeek.toISOString(),
        notes: 'Quarterly HbA1c and TSH blood panel.',
        prepChecklist: [
          { id: 'p-4', text: '10-hour overnight fasting (water allowed)', completed: false },
          { id: 'p-5', text: 'Give blood sample BEFORE taking morning Glycomet SR', completed: false },
        ],
        reminder24hSent: false,
        reminder2hSent: false,
      },
    ],
    vitals: [
      {
        id: 'vit-1',
        circleId: DEFAULT_CIRCLE_ID,
        type: 'blood_pressure',
        value: '124/78',
        unit: 'mmHg',
        status: 'normal',
        notes: 'Measured sitting calmly after morning walk',
        recordedBy: 'Smt. Kamala Devi',
        recordedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      },
      {
        id: 'vit-2',
        circleId: DEFAULT_CIRCLE_ID,
        type: 'blood_glucose',
        value: '112',
        unit: 'mg/dL (Fasting)',
        status: 'normal',
        notes: 'Within target geriatric range (90–130 mg/dL)',
        recordedBy: 'Ananya Rao (Caretaker)',
        recordedAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      },
      {
        id: 'vit-3',
        circleId: DEFAULT_CIRCLE_ID,
        type: 'hydration',
        value: '5 / 7',
        unit: 'glasses',
        status: 'normal',
        notes: 'Warm water and buttermilk',
        recordedBy: 'Smt. Kamala Devi',
        recordedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      },
    ],
    emailReminders: [
      {
        id: 'rem-seed-1',
        idempotencyKey: `${DEFAULT_CIRCLE_ID}:upcoming_dose:med-1:${todayKey}`,
        circleId: DEFAULT_CIRCLE_ID,
        category: 'upcoming_dose',
        subject: '⏰ Morning Medication Reminder: Thyronorm 50mcg (7:00 AM)',
        recipientEmails: ['geeteshgollapalli@gmail.com'],
        recipientNames: ['Smt. Kamala Devi', 'Ananya Rao'],
        bodyPreview:
          'Good morning Kamala Ji! Your Thyronorm 50mcg is scheduled for 7:00 AM on an empty stomach.',
        status: 'sent',
        transport: 'gmail_smtp',
        sentAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 45).toISOString(),
      },
    ],
    careNotes: [
      {
        id: 'note-1',
        circleId: DEFAULT_CIRCLE_ID,
        authorName: 'Smt. Kamala Devi',
        role: 'elder',
        category: 'question_for_doctor',
        message:
          'Ask Dr. Sharma tomorrow if I should skip evening Amlopres when my afternoon blood pressure is below 115/75.',
        createdAt: new Date(now.getTime() - 18 * 3600000).toISOString(),
      },
      {
        id: 'note-2',
        circleId: DEFAULT_CIRCLE_ID,
        authorName: 'Geetesh Gollapalli',
        role: 'family',
        category: 'encouragement',
        message:
          'Dadi, I ordered your Shelcal 500 refill from Apollo Pharmacy—delivering this evening! Proud of your 7-day morning streak ❤️',
        createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      },
    ],
    updatedAt: now.toISOString(),
  };
}

interface PersistedDatabasePayload {
  isOnboarded: boolean;
  state: CareCircleState;
  passcodeRecords: RolePasscodeRecord[];
}

const DB_FILE_PATH = path.join(process.cwd(), '.data', 'care-circle-db.json');

function loadPersistedDb(): PersistedDatabasePayload | null {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return null;
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedDatabasePayload;
    if (parsed && parsed.state && Array.isArray(parsed.passcodeRecords)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function savePersistedDb(payload: PersistedDatabasePayload): void {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only serverless environments where Firestore is primary
  }
}

// Global singleton in-memory + Disk + Firestore-synced store
const globalForStore = globalThis as unknown as {
  __kindredCareStore?: CareCircleState;
  __kindredCarePasscodes?: RolePasscodeRecord[];
  __kindredCareOnboarded?: boolean;
};

function ensureStoreInitialized() {
  if (!globalForStore.__kindredCareStore) {
    const persisted = loadPersistedDb();
    if (persisted) {
      globalForStore.__kindredCareStore = persisted.state;
      globalForStore.__kindredCarePasscodes = persisted.passcodeRecords;
      globalForStore.__kindredCareOnboarded = Boolean(persisted.isOnboarded);
    } else {
      globalForStore.__kindredCareStore = createSeedCareCircle();
      globalForStore.__kindredCarePasscodes = [...DEFAULT_PASSCODE_RECORDS];
      globalForStore.__kindredCareOnboarded = false;
    }
  }
}

export function getCareCircleState(): CareCircleState {
  ensureStoreInitialized();
  return globalForStore.__kindredCareStore!;
}

export function getPasscodeRecords(): RolePasscodeRecord[] {
  ensureStoreInitialized();
  return globalForStore.__kindredCarePasscodes || DEFAULT_PASSCODE_RECORDS;
}

export function isCircleOnboarded(): boolean {
  ensureStoreInitialized();
  return Boolean(globalForStore.__kindredCareOnboarded);
}

export async function updateCareCircleState(
  updater: (prev: CareCircleState) => CareCircleState
): Promise<CareCircleState> {
  const current = getCareCircleState();
  const next = {
    ...updater(current),
    updatedAt: new Date().toISOString(),
  };
  globalForStore.__kindredCareStore = next;
  const passcodes = getPasscodeRecords();
  savePersistedDb({
    isOnboarded: Boolean(globalForStore.__kindredCareOnboarded),
    state: next,
    passcodeRecords: passcodes,
  });
  // Non-blocking sync to Cloud Firestore when configured
  void syncCareCircleToFirestore(next, passcodes);
  return next;
}

export async function addMedicationToStore(
  input: Omit<Medication, 'id' | 'circleId' | 'createdAt'>
): Promise<Medication> {
  const med: Medication = {
    ...input,
    id: `med-${Date.now()}`,
    circleId: DEFAULT_CIRCLE_ID,
    createdAt: new Date().toISOString(),
  };
  await updateCareCircleState((prev) => ({
    ...prev,
    medications: [...prev.medications, med],
  }));
  return med;
}

export async function updateMedicationInStore(params: {
  id: string;
  patch: Partial<Medication>;
  refillDelta?: number;
}): Promise<Medication | null> {
  let updated: Medication | null = null;
  await updateCareCircleState((prev) => {
    const nextMedications = prev.medications.map((m) => {
      if (m.id !== params.id) return m;
      const nextStock =
        typeof params.refillDelta === 'number'
          ? Math.max(0, m.stockCount + params.refillDelta)
          : typeof params.patch.stockCount === 'number'
            ? params.patch.stockCount
            : m.stockCount;
      updated = {
        ...m,
        ...params.patch,
        stockCount: nextStock,
      };
      return updated;
    });
    return {
      ...prev,
      medications: nextMedications,
    };
  });
  return updated;
}

export async function deleteMedicationFromStore(medicationId: string): Promise<boolean> {
  let removed = false;
  await updateCareCircleState((prev) => {
    const filtered = prev.medications.filter((m) => m.id !== medicationId);
    removed = filtered.length < prev.medications.length;
    return {
      ...prev,
      medications: filtered,
    };
  });
  return removed;
}

export async function recordDoseActionInStore(params: {
  medicationId: string;
  status: 'taken' | 'skipped' | 'snoozed' | 'pending';
  role: CareRole;
  memberName: string;
  reason?: string;
  dateKey?: string;
}): Promise<DoseLog | null> {
  const state = getCareCircleState();
  const med = state.medications.find((m) => m.id === params.medicationId);
  if (!med) return null;

  const now = new Date();
  const dateKey = params.dateKey || getLocalDateKey(now);
  const snoozedUntil =
    params.status === 'snoozed'
      ? new Date(now.getTime() + 15 * 60 * 1000).toISOString()
      : undefined;

  const newLog: DoseLog = {
    id: `log-${Date.now()}`,
    circleId: state.circleId,
    medicationId: med.id,
    medicationName: med.name,
    dateKey,
    scheduledTime: med.scheduledTime,
    status: params.status,
    actionAt: now.toISOString(),
    loggedByRole: params.role,
    loggedByName: params.memberName,
    reason: params.reason,
    snoozedUntil,
  };

  await updateCareCircleState((prev) => {
    const existingLogIndex = prev.doseLogs.findIndex(
      (l) => l.medicationId === med.id && l.dateKey === dateKey
    );
    const prevWasTaken =
      existingLogIndex >= 0 && prev.doseLogs[existingLogIndex].status === 'taken';

    let nextLogs = [...prev.doseLogs];
    if (params.status === 'pending') {
      nextLogs = nextLogs.filter(
        (l) => !(l.medicationId === med.id && l.dateKey === dateKey)
      );
    } else if (existingLogIndex >= 0) {
      nextLogs[existingLogIndex] = newLog;
    } else {
      nextLogs.unshift(newLog);
    }

    const nextMedications = prev.medications.map((m) => {
      if (m.id !== med.id) return m;
      if (params.status === 'taken' && !prevWasTaken) {
        return { ...m, stockCount: Math.max(0, m.stockCount - 1) };
      }
      if (params.status === 'pending' && prevWasTaken) {
        return { ...m, stockCount: m.stockCount + 1 };
      }
      return m;
    });

    return {
      ...prev,
      medications: nextMedications,
      doseLogs: nextLogs,
    };
  });

  return newLog;
}

export async function updateCareCircleProfileInStore(patch: {
  elderName?: string;
  elderAge?: number;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  primaryDoctor?: string;
  emergencyPhone?: string;
  elderPin?: string;
  caretakerName?: string;
  caretakerEmail?: string;
  caretakerPhone?: string;
  caretakerPin?: string;
  familyName?: string;
  familyRelation?: string;
  familyEmail?: string;
  familyPhone?: string;
  familyPin?: string;
  medications?: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    purpose: string;
    slot: 'morning' | 'afternoon' | 'evening' | 'bedtime';
    scheduledTime: string;
    mealTiming: 'before_meal' | 'with_meal' | 'after_meal' | 'empty_stomach' | 'anytime';
    colorName?: string;
    shape?: 'round' | 'oval' | 'capsule' | 'diamond';
    imprint?: string;
    stock?: number;
  }>;
  autonomySettings?: Partial<ElderAutonomySettings>;
}): Promise<CareCircleState> {
  ensureStoreInitialized();
  globalForStore.__kindredCareOnboarded = true;

  // Update dynamic passcodes if provided during onboarding
  const currentPasscodes = [...getPasscodeRecords()];
  const elderLabel = `${patch.elderName?.trim() || 'Elder'} (Elder Owner)`;
  const caretakerLabel = `${patch.caretakerName?.trim() || 'Caretaker'} (Primary Caretaker)`;
  const familyLabel = `${patch.familyName?.trim() || 'Family'} (Family Circle)`;

  if (patch.elderPin && patch.elderPin.trim().length >= 4) {
    const hashed = hashPasscode(patch.elderPin.trim());
    currentPasscodes.unshift({
      role: 'elder',
      salt: hashed.salt,
      hash: hashed.hash,
      label: elderLabel,
    });
  }
  if (patch.caretakerPin && patch.caretakerPin.trim().length >= 4) {
    const hashed = hashPasscode(patch.caretakerPin.trim());
    currentPasscodes.unshift({
      role: 'caretaker',
      salt: hashed.salt,
      hash: hashed.hash,
      label: caretakerLabel,
    });
  }
  if (patch.familyPin && patch.familyPin.trim().length >= 4) {
    const hashed = hashPasscode(patch.familyPin.trim());
    currentPasscodes.unshift({
      role: 'family',
      salt: hashed.salt,
      hash: hashed.hash,
      label: familyLabel,
    });
  }
  globalForStore.__kindredCarePasscodes = currentPasscodes;

  return updateCareCircleState((prev) => {
    const nextElderName = patch.elderName?.trim() || prev.elderName;
    const nextMembers: CareMember[] = prev.members.map((m) => {
      if (m.role === 'elder') {
        return {
          ...m,
          name: nextElderName,
          phone: patch.emergencyPhone?.trim() || m.phone,
        };
      }
      if (m.role === 'caretaker') {
        return {
          ...m,
          name: patch.caretakerName?.trim() || m.name,
          email: patch.caretakerEmail?.trim() || m.email,
          phone: patch.caretakerPhone?.trim() || m.phone,
        };
      }
      if (m.role === 'family') {
        return {
          ...m,
          name: patch.familyName?.trim() || m.name,
          relation: patch.familyRelation?.trim() || m.relation,
          email: patch.familyEmail?.trim() || m.email,
          phone: patch.familyPhone?.trim() || m.phone,
        };
      }
      return m;
    });

    const nextMedications: Medication[] =
      Array.isArray(patch.medications) && patch.medications.length > 0
        ? patch.medications.map((med, idx) => ({
            id: `med-onb-${idx + 1}`,
            circleId: prev.circleId,
            name: med.name,
            genericName: med.genericName || med.name,
            dosage: med.dosage,
            purpose: med.purpose,
            plainExplanation: `Prescribed for ${med.purpose.toLowerCase()}. Take ${med.dosage} at ${med.scheduledTime}.`,
            slot: med.slot,
            scheduledTime: med.scheduledTime,
            mealTiming: med.mealTiming,
            appearance: {
              color: med.colorName || 'White',
              shape: med.shape || 'round',
              imprint: med.imprint || 'MED',
            },
            prescribedBy: patch.primaryDoctor?.trim() || prev.primaryDoctor,
            stockCount: typeof med.stock === 'number' ? med.stock : 28,
            refillThreshold: 7,
            instructions: `Take ${med.dosage} (${med.mealTiming.replace('_', ' ')})`,
            sideEffectsWatch: ['Monitor for any unusual dizziness or stomach discomfort'],
            active: true,
            createdAt: new Date().toISOString(),
          }))
        : prev.medications;

    return {
      ...prev,
      elderName: nextElderName,
      elderAge: typeof patch.elderAge === 'number' ? patch.elderAge : prev.elderAge,
      bloodGroup: patch.bloodGroup?.trim() || prev.bloodGroup,
      allergies: Array.isArray(patch.allergies) ? patch.allergies : prev.allergies,
      conditions: Array.isArray(patch.conditions) ? patch.conditions : prev.conditions,
      primaryDoctor: patch.primaryDoctor?.trim() || prev.primaryDoctor,
      emergencyPhone: patch.emergencyPhone?.trim() || prev.emergencyPhone,
      members: nextMembers,
      medications: nextMedications,
      autonomySettings: patch.autonomySettings
        ? { ...prev.autonomySettings, ...patch.autonomySettings }
        : prev.autonomySettings,
    };
  });
}

export async function addAppointmentToStore(
  input: Omit<Appointment, 'id' | 'circleId' | 'reminder24hSent' | 'reminder2hSent'>
): Promise<Appointment> {
  const appt: Appointment = {
    ...input,
    id: `appt-${Date.now()}`,
    circleId: DEFAULT_CIRCLE_ID,
    reminder24hSent: false,
    reminder2hSent: false,
  };
  await updateCareCircleState((prev) => ({
    ...prev,
    appointments: [...prev.appointments, appt],
  }));
  return appt;
}

export async function toggleAppointmentPrepItemInStore(
  appointmentId: string,
  prepItemId: string
): Promise<Appointment | null> {
  let updatedAppt: Appointment | null = null;
  await updateCareCircleState((prev) => {
    const nextAppointments = prev.appointments.map((appt) => {
      if (appt.id !== appointmentId) return appt;
      const nextChecklist = appt.prepChecklist.map((item) =>
        item.id === prepItemId ? { ...item, completed: !item.completed } : item
      );
      updatedAppt = { ...appt, prepChecklist: nextChecklist };
      return updatedAppt;
    });
    return { ...prev, appointments: nextAppointments };
  });
  return updatedAppt;
}

export async function addVitalToStore(
  input: Omit<VitalReading, 'id' | 'circleId' | 'recordedAt'>
): Promise<VitalReading> {
  const vital: VitalReading = {
    ...input,
    id: `vit-${Date.now()}`,
    circleId: DEFAULT_CIRCLE_ID,
    recordedAt: new Date().toISOString(),
  };
  await updateCareCircleState((prev) => ({
    ...prev,
    vitals: [vital, ...prev.vitals],
  }));
  return vital;
}

export async function addCareNoteToStore(
  input: Omit<CareNote, 'id' | 'circleId' | 'createdAt'>
): Promise<CareNote> {
  const note: CareNote = {
    ...input,
    id: `note-${Date.now()}`,
    circleId: DEFAULT_CIRCLE_ID,
    createdAt: new Date().toISOString(),
  };
  await updateCareCircleState((prev) => ({
    ...prev,
    careNotes: [note, ...prev.careNotes],
  }));
  return note;
}

export async function updateAutonomyInStore(
  patch: Partial<ElderAutonomySettings>
): Promise<ElderAutonomySettings> {
  let nextAutonomy!: ElderAutonomySettings;
  await updateCareCircleState((prev) => {
    nextAutonomy = {
      ...prev.autonomySettings,
      ...patch,
    };
    return {
      ...prev,
      autonomySettings: nextAutonomy,
    };
  });
  return nextAutonomy;
}

export async function recordEmailReminderInStore(
  log: EmailReminderLog
): Promise<EmailReminderLog> {
  await updateCareCircleState((prev) => ({
    ...prev,
    emailReminders: [log, ...prev.emailReminders],
  }));
  return log;
}
