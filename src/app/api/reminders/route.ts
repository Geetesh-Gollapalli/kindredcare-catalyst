import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { ProactiveEmailTriggerSchema } from '@/lib/validation';
import { getCareCircleState } from '@/services/store';
import { triggerProactiveReminderWorkflow } from '@/services/email-service';

export async function GET(req: NextRequest) {
  // Cron / Automated Scheduler trigger endpoint
  const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  const session = await getAuthenticatedSession(req);

  if (!session && cronSecret !== (process.env.CRON_SECRET || 'kindredcare_cron_secret_2026')) {
    return NextResponse.json(
      { error: 'Unauthorized cron or reminder scan trigger.' },
      { status: 401 }
    );
  }

  const circle = getCareCircleState();
  const result = await triggerProactiveReminderWorkflow({
    circle,
    category: 'auto_scan',
  });

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    dispatchedCount: result.dispatched.length,
    skippedDuplicatesCount: result.skippedCount,
    dispatched: result.dispatched,
    circle: getCareCircleState(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = ProactiveEmailTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid reminder trigger request.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const circle = getCareCircleState();
  const result = await triggerProactiveReminderWorkflow({
    circle,
    category: parsed.data.category,
    targetId: parsed.data.targetId,
    customRecipientEmail: parsed.data.customRecipientEmail,
    customMessage: parsed.data.customMessage,
  });

  return NextResponse.json({
    dispatched: result.dispatched,
    skippedDuplicatesCount: result.skippedCount,
    circle: getCareCircleState(),
  });
}
