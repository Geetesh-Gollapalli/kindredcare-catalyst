import { z } from 'zod';

export const CareRoleSchema = z.enum(['elder', 'caretaker', 'family']);

export const PasscodeLoginSchema = z.object({
  circleCode: z
    .string()
    .trim()
    .min(3, 'Care Circle code is required')
    .max(20)
    .default('KC-2026')
    .transform((v) => v.toUpperCase()),
  passcode: z
    .string()
    .trim()
    .min(4, 'Passcode must be at least 4 characters')
    .max(32, 'Passcode is too long'),
  role: CareRoleSchema.optional(),
  memberName: z.string().trim().min(1).max(60).optional(),
});

export const MedicationCreateSchema = z.object({
  name: z.string().trim().min(2, 'Medication name is required').max(100),
  genericName: z.string().trim().max(100).default(''),
  dosage: z.string().trim().min(1, 'Dosage is required').max(50),
  purpose: z.string().trim().min(2, 'Purpose is required').max(200),
  plainExplanation: z.string().trim().max(400).optional(),
  slot: z.enum(['morning', 'afternoon', 'evening', 'bedtime']),
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid 24-hour time HH:mm required'),
  mealTiming: z.enum([
    'before_meal',
    'with_meal',
    'after_meal',
    'empty_stomach',
    'anytime',
  ]),
  appearance: z
    .object({
      color: z.string().trim().min(2).max(30).default('White'),
      shape: z.enum(['round', 'oval', 'capsule', 'diamond']).default('round'),
      imprint: z.string().trim().max(20).optional(),
    })
    .default({ color: 'White', shape: 'round' }),
  prescribedBy: z.string().trim().max(80).default('Dr. Rajesh Sharma'),
  stockCount: z.number().int().min(0).max(1000).default(30),
  refillThreshold: z.number().int().min(1).max(100).default(7),
  instructions: z.string().trim().max(300).default('Take with a full glass of water.'),
  sideEffectsWatch: z.array(z.string().trim().max(80)).max(8).default([]),
});

export const DoseActionSchema = z.object({
  medicationId: z.string().trim().min(1),
  status: z.enum(['taken', 'skipped', 'snoozed', 'pending']),
  reason: z.string().trim().max(200).optional(),
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const MedicationUpdateSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  genericName: z.string().trim().max(100).optional(),
  dosage: z.string().trim().min(1).max(50).optional(),
  purpose: z.string().trim().min(2).max(200).optional(),
  plainExplanation: z.string().trim().max(400).optional(),
  slot: z.enum(['morning', 'afternoon', 'evening', 'bedtime']).optional(),
  scheduledTime: z.string().max(20).optional(),
  mealTiming: z
    .enum(['before_meal', 'with_meal', 'after_meal', 'empty_stomach', 'anytime'])
    .optional(),
  appearance: z
    .object({
      color: z.string().trim().min(2).max(30),
      shape: z.enum(['round', 'oval', 'capsule', 'diamond']),
      imprint: z.string().trim().max(20).optional(),
    })
    .optional(),
  prescribedBy: z.string().trim().max(80).optional(),
  stockCount: z.number().int().min(0).max(1000).optional(),
  refillDelta: z.number().int().min(-100).max(500).optional(),
  instructions: z.string().trim().max(300).optional(),
});

export const AppointmentCreateSchema = z.object({
  doctorName: z.string().trim().min(2, 'Doctor name is required').max(80),
  specialty: z.string().trim().min(2, 'Specialty is required').max(80),
  clinicName: z.string().trim().min(2, 'Clinic name is required').max(120),
  clinicAddress: z.string().trim().min(3, 'Clinic address is required').max(250),
  dateTime: z.string().min(10, 'Date and time required'),
  notes: z.string().trim().max(400).default(''),
  prepChecklist: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().trim().min(1).max(160),
        completed: z.boolean().default(false),
      })
    )
    .max(10)
    .default([]),
});

export const VitalCreateSchema = z.object({
  type: z.enum([
    'blood_pressure',
    'blood_glucose',
    'heart_rate',
    'hydration',
    'mood',
  ]),
  value: z.string().trim().min(1).max(40),
  unit: z.string().trim().max(20),
  status: z.enum(['normal', 'elevated', 'attention']).default('normal'),
  notes: z.string().trim().max(200).optional(),
});

export const CareNoteCreateSchema = z.object({
  message: z.string().trim().min(2, 'Note cannot be empty').max(500),
  category: z
    .enum(['observation', 'symptom', 'encouragement', 'question_for_doctor'])
    .default('observation'),
});

export const AutonomyUpdateSchema = z.object({
  escalationGraceMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(),
  allowFamilyScheduleEdits: z.boolean().optional(),
  shareVitalsWithFamily: z.boolean().optional(),
  voiceReadoutEnabled: z.boolean().optional(),
  seniorComfortMode: z.boolean().optional(),
  preferredLanguage: z
    .enum(['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish'])
    .optional(),
});

export const ProactiveEmailTriggerSchema = z.object({
  category: z.enum([
    'upcoming_dose',
    'missed_dose_escalation',
    'appointment_reminder',
    'low_refill',
    'elder_sos',
    'auto_scan',
  ]),
  targetId: z.string().trim().max(80).optional(),
  customRecipientEmail: z.string().email().optional(),
  customMessage: z.string().trim().max(400).optional(),
});
