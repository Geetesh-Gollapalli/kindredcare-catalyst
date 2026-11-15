import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { canPerformAction } from '@/lib/security';
import { AppointmentCreateSchema } from '@/lib/validation';
import {
  addAppointmentToStore,
  getCareCircleState,
  toggleAppointmentPrepItemInStore,
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
    'manage_appointments',
    circle.autonomySettings
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 403 });
  }

  const body = await req.json();
  const parsed = AppointmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid appointment payload.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const appt = await addAppointmentToStore(parsed.data);
  return NextResponse.json({
    appointment: appt,
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

  const body = (await req.json()) as { appointmentId?: string; prepItemId?: string };
  if (!body.appointmentId || !body.prepItemId) {
    return NextResponse.json(
      { error: 'appointmentId and prepItemId are required.' },
      { status: 400 }
    );
  }

  const updated = await toggleAppointmentPrepItemInStore(
    body.appointmentId,
    body.prepItemId
  );
  if (!updated) {
    return NextResponse.json(
      { error: 'Appointment not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    appointment: updated,
    circle: getCareCircleState(),
  });
}
