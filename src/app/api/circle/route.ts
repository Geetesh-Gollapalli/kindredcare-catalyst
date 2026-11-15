import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { calculateAdherenceMetrics } from '@/lib/adherence';
import { canPerformAction } from '@/lib/security';
import { AutonomyUpdateSchema } from '@/lib/validation';
import { isFirebaseCloudConfigured } from '@/services/firebase';
import {
  getCareCircleState,
  isCircleOnboarded,
  resetCareCircleInStore,
  updateAutonomyInStore,
  updateCareCircleProfileInStore,
} from '@/services/store';

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  const circle = getCareCircleState();
  const isOnboarded = isCircleOnboarded();
  const metrics = calculateAdherenceMetrics(
    circle.medications,
    circle.doseLogs,
    new Date(),
    circle.autonomySettings.escalationGraceMinutes
  );

  return NextResponse.json({
    authenticated: Boolean(session),
    isOnboarded,
    session,
    circle,
    metrics,
    telemetry: {
      googleGeminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      adaptionGemmaConfigured: Boolean(process.env.ADAPTION_API_KEY),
      firebaseFirestoreReady: isFirebaseCloudConfigured(),
      firestoreSecurityRulesEnforced: true,
      proactiveEmailEngineReady: true,
    },
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
  const permission = canPerformAction(
    session.role,
    'update_autonomy',
    circle.autonomySettings
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 403 });
  }

  const body = await req.json();
  const parsed = AutonomyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid autonomy settings payload.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updatedAutonomy = await updateAutonomyInStore(parsed.data);
  return NextResponse.json({
    autonomySettings: updatedAutonomy,
    circle: getCareCircleState(),
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const updated = await updateCareCircleProfileInStore({
    elderName: body.elderName,
    elderAge: body.elderAge,
    bloodGroup: body.bloodGroup,
    allergies: body.allergies,
    conditions: body.conditions,
    primaryDoctor: body.primaryDoctor,
    emergencyPhone: body.emergencyPhone,
    elderPin: body.elderPin,
    caretakerName: body.caretakerName,
    caretakerEmail: body.caretakerEmail,
    caretakerPhone: body.caretakerPhone,
    caretakerPin: body.caretakerPin,
    familyName: body.familyName,
    familyRelation: body.familyRelation,
    familyEmail: body.familyEmail,
    familyPhone: body.familyPhone,
    familyPin: body.familyPin,
    medications: body.medications,
  });

  return NextResponse.json({
    isOnboarded: true,
    circle: updated,
  });
}

export async function DELETE() {
  const circle = await resetCareCircleInStore();
  return NextResponse.json({
    deleted: true,
    isOnboarded: false,
    circle,
  });
}
