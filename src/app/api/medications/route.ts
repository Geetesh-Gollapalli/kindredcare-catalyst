import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { canPerformAction } from '@/lib/security';
import {
  DoseActionSchema,
  MedicationCreateSchema,
  MedicationUpdateSchema,
} from '@/lib/validation';
import {
  addMedicationToStore,
  deleteMedicationFromStore,
  getCareCircleState,
  recordDoseActionInStore,
  updateMedicationInStore,
} from '@/services/store';

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const circle = getCareCircleState();
  const permission = canPerformAction(
    session.role,
    'manage_schedule',
    circle.autonomySettings
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 403 });
  }

  const body = await req.json();
  const parsed = MedicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid medication details.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const plainExplanation =
    parsed.data.plainExplanation ||
    `Take ${parsed.data.name} (${parsed.data.dosage}) ${parsed.data.mealTiming.replace('_', ' ')}. ${parsed.data.instructions}`;

  const med = await addMedicationToStore({
    ...parsed.data,
    plainExplanation,
  });

  return NextResponse.json({
    medication: med,
    circle: getCareCircleState(),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const circle = getCareCircleState();
  const permission = canPerformAction(
    session.role,
    'log_dose',
    circle.autonomySettings
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 403 });
  }

  const body = await req.json();
  const parsed = DoseActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid dose log payload.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const log = await recordDoseActionInStore({
    medicationId: parsed.data.medicationId,
    status: parsed.data.status,
    reason: parsed.data.reason,
    dateKey: parsed.data.dateKey,
    role: session.role,
    memberName: session.memberName,
  });

  if (!log) {
    return NextResponse.json(
      { error: 'Medication not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    doseLog: log,
    circle: getCareCircleState(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const circle = getCareCircleState();
  const body = await req.json();
  const parsed = MedicationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid medication update payload.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Allow Family to refill stock (+30), while schedule edits respect Elder Autonomy
  const isRefillOnly =
    typeof parsed.data.refillDelta === 'number' &&
    !parsed.data.name &&
    !parsed.data.dosage &&
    !parsed.data.scheduledTime;

  if (!isRefillOnly) {
    const permission = canPerformAction(
      session.role,
      'manage_schedule',
      circle.autonomySettings
    );
    if (!permission.allowed) {
      return NextResponse.json({ error: permission.reason }, { status: 403 });
    }
  }

  const { id, refillDelta, ...patch } = parsed.data;
  const updated = await updateMedicationInStore({ id, patch, refillDelta });
  if (!updated) {
    return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
  }

  return NextResponse.json({
    medication: updated,
    circle: getCareCircleState(),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const circle = getCareCircleState();
  const permission = canPerformAction(
    session.role,
    'manage_schedule',
    circle.autonomySettings
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { error: 'Medication id query parameter required.' },
      { status: 400 }
    );
  }

  const deleted = await deleteMedicationFromStore(id);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Medication not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    deleted: true,
    circle: getCareCircleState(),
  });
}
