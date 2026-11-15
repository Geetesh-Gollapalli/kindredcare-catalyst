import { NextRequest, NextResponse } from 'next/server';
import { PasscodeLoginSchema } from '@/lib/validation';
import {
  authenticateRoleByPasscode,
  checkPasscodeRateLimit,
  clearPasscodeRateLimit,
  recordFailedPasscodeAttempt,
  signSessionToken,
} from '@/lib/security';
import { getCareCircleState, getPasscodeRecords } from '@/services/store';
import { SESSION_COOKIE_NAME } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PasscodeLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Please enter your Name and a valid 4+ digit PIN.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { circleCode, passcode, role, memberName } = parsed.data;
    const clientIp = req.headers.get('x-forwarded-for') || 'local-client';
    const rateKey = `${clientIp}:${circleCode}`;

    const rateCheck = checkPasscodeRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed PIN attempts. Access locked for ${rateCheck.retryAfterSeconds}s.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const circle = getCareCircleState();
    const activePasscodes = getPasscodeRecords();

    const matchedRecord = authenticateRoleByPasscode(
      passcode,
      activePasscodes,
      role
    );

    if (!matchedRecord) {
      recordFailedPasscodeAttempt(rateKey);
      const updatedRate = checkPasscodeRateLimit(rateKey);
      return NextResponse.json(
        {
          error: `Incorrect PIN for the selected role. (${updatedRate.remainingAttempts} attempts remaining)`,
        },
        { status: 401 }
      );
    }

    clearPasscodeRateLimit(rateKey);

    const resolvedName =
      memberName?.trim() ||
      circle.members.find((m) => m.role === matchedRecord.role)?.name ||
      matchedRecord.label;

    const sessionPayload = {
      circleId: circle.circleId,
      circleCode: circle.circleCode,
      role: matchedRecord.role,
      memberName: resolvedName,
    };

    const token = signSessionToken(sessionPayload);

    const response = NextResponse.json({
      authenticated: true,
      session: sessionPayload,
      token,
      circle,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Authentication request failed.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
