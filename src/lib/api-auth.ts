import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/security';
import type { AuthSession } from '@/types/domain';

export const SESSION_COOKIE_NAME = 'kc_session';

/**
 * Resolves the authenticated Care Circle session from HttpOnly cookie or Authorization header.
 */
export async function getAuthenticatedSession(
  req?: NextRequest
): Promise<AuthSession | null> {
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const verified = verifySessionToken(token);
      if (verified) return verified;
    }
    const cookieVal = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (cookieVal) {
      const verified = verifySessionToken(cookieVal);
      if (verified) return verified;
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
