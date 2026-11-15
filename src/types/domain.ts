export type CareRole = 'elder' | 'caretaker' | 'family';

export type TimeOfDaySlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type MealTiming =
  | 'before_meal'
  | 'with_meal'
  | 'after_meal'
  | 'empty_stomach'
  | 'anytime';

export type PillShape = 'round' | 'oval' | 'capsule' | 'diamond';

export interface PillAppearance {
  color: string;
  shape: PillShape;
  imprint?: string;
}

export interface Medication {
  id: string;
  circleId: string;
  name: string;
  genericName: string;
  dosage: string;
  purpose: string;
  plainExplanation: string;
  slot: TimeOfDaySlot;
  scheduledTime: string; // HH:mm 24-hour format
  mealTiming: MealTiming;
  appearance: PillAppearance;
  prescribedBy: string;
  stockCount: number;
  refillThreshold: number;
  instructions: string;
  sideEffectsWatch: string[];
  createdAt: string;
}

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'snoozed' | 'missed';

export interface DoseLog {
  id: string;
  circleId: string;
  medicationId: string;
  medicationName: string;
  dateKey: string; // YYYY-MM-DD
  scheduledTime: string;
  status: DoseStatus;
  actionAt: string;
  loggedByRole: CareRole;
  loggedByName: string;
  reason?: string;
  snoozedUntil?: string;
}

export interface PrepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Appointment {
  id: string;
  circleId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  dateTime: string; // ISO 8601
  notes: string;
  prepChecklist: PrepChecklistItem[];
  reminder24hSent: boolean;
  reminder2hSent: boolean;
}

export type VitalType =
  | 'blood_pressure'
  | 'blood_glucose'
  | 'heart_rate'
  | 'hydration'
  | 'mood';

export interface VitalReading {
  id: string;
  circleId: string;
  type: VitalType;
  value: string;
  unit: string;
  status: 'normal' | 'elevated' | 'attention';
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ElderAutonomySettings {
  escalationGraceMinutes: 15 | 30 | 60;
  allowFamilyScheduleEdits: boolean;
  shareVitalsWithFamily: boolean;
  voiceReadoutEnabled: boolean;
  seniorComfortMode: boolean;
  preferredLanguage: 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Spanish';
}

export interface CareMember {
  id: string;
  name: string;
  relation: string;
  role: CareRole;
  email: string;
  phone: string;
  receiveMissedAlerts: boolean;
  receiveAppointmentReminders: boolean;
  receiveRefillAlerts: boolean;
}

export type EmailReminderCategory =
  | 'upcoming_dose'
  | 'missed_dose_escalation'
  | 'appointment_reminder'
  | 'low_refill'
  | 'elder_sos';

export interface EmailReminderLog {
  id: string;
  idempotencyKey: string;
  circleId: string;
  category: EmailReminderCategory;
  subject: string;
  recipientEmails: string[];
  recipientNames: string[];
  bodyPreview: string;
  status: 'sent' | 'simulated_preview' | 'failed';
  transport: 'gmail_smtp' | 'ethereal_smtp' | 'local_audit';
  previewUrl?: string;
  sentAt: string;
}

export interface CareNote {
  id: string;
  circleId: string;
  authorName: string;
  role: CareRole;
  message: string;
  category: 'observation' | 'symptom' | 'encouragement' | 'question_for_doctor';
  createdAt: string;
}

export interface RolePasscodeRecord {
  role: CareRole;
  salt: string;
  hash: string;
  label: string;
}

export interface CareCircleState {
  circleId: string;
  circleCode: string;
  elderName: string;
  elderAge: number;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  primaryDoctor: string;
  emergencyPhone: string;
  autonomySettings: ElderAutonomySettings;
  members: CareMember[];
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  vitals: VitalReading[];
  emailReminders: EmailReminderLog[];
  careNotes: CareNote[];
  updatedAt: string;
}

export interface AuthSession {
  circleId: string;
  circleCode: string;
  role: CareRole;
  memberName: string;
  issuedAt: number;
  expiresAt: number;
}

export interface DrugInteractionFinding {
  severity: 'high' | 'moderate' | 'low' | 'safe';
  medicationsInvolved: string[];
  summary: string;
  clinicalMechanism: string;
  spacingRecommendation: string;
}

export interface DrugSafetyReport {
  overallRisk: 'high' | 'moderate' | 'low' | 'optimal';
  providerUsed: string;
  interactions: DrugInteractionFinding[];
  foodTimingTips: string[];
  scheduleOptimizationNote: string;
  generatedAt: string;
}

export interface DoctorVisitBrief {
  elderName: string;
  generatedAt: string;
  providerUsed: string;
  adherenceSummary: string;
  overallAdherencePercent: number;
  missedDosePatterns: string[];
  vitalsHighlights: string[];
  suggestedQuestionsForDoctor: string[];
  clinicalNotesSummary: string;
}
