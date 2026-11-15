import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { CareNoteCreateSchema, VitalCreateSchema } from '@/lib/validation';
import {
  addCareNoteToStore,
  addVitalToStore,
  getCareCircleState,
} from '@/services/store';

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const body = await req.json();

  if (body.kind === 'care_note') {
    const parsedNote = CareNoteCreateSchema.safeParse(body);
    if (!parsedNote.success) {
      return NextResponse.json(
        { error: 'Invalid care note.', details: parsedNote.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const note = await addCareNoteToStore({
      authorName: session.memberName,
      role: session.role,
      message: parsedNote.data.message,
      category: parsedNote.data.category,
    });

    return NextResponse.json({
      careNote: note,
      circle: getCareCircleState(),
    });
  }

  const parsedVital = VitalCreateSchema.safeParse(body);
  if (!parsedVital.success) {
    return NextResponse.json(
      { error: 'Invalid vital reading.', details: parsedVital.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const vital = await addVitalToStore({
    ...parsedVital.data,
    recordedBy: `${session.memberName} (${session.role})`,
  });

  return NextResponse.json({
    vital,
    circle: getCareCircleState(),
  });
}
