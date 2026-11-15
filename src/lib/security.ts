import crypto from 'crypto';
import type { AuthSession, CareRole, ElderAutonomySettings, RolePasscodeRecord } from '@/types/domain';

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'kindredcare_catalyst_hmac_secret_2026_default_key';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

// Sliding-window brute-force rate limiter store
interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes lockout

/**
 * Hashes a passcode using cryptographic scrypt with a unique random salt.
 */
export function hashPasscode(passcode: string, customSalt?: string): { salt: string; hash: string } {
  const normalized = passcode.trim();
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(normalized, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return {
    salt,
    hash: derivedKey.toString('hex'),
  };
}

/**
 * Verifies a plaintext passcode against a salted scrypt hash in constant time.
 */
export function verifyPasscode(passcode: string, salt: string, expectedHashHex: string): boolean {
  try {
    const normalized = passcode.trim();
    const derivedKey = crypto.scryptSync(normalized, salt, KEY_LENGTH, SCRYPT_PARAMS);
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Resolves which CareRole matches a provided passcode for a Care Circle.
 */
export function authenticateRoleByPasscode(
  passcode: string,
  records: RolePasscodeRecord[],
  preferredRole?: CareRole
): RolePasscodeRecord | null {
  if (preferredRole) {
    const target = records.find((r) => r.role === preferredRole);
    if (target && verifyPasscode(passcode, target.salt, target.hash)) {
      return target;
    }
  }
  for (const record of records) {
    if (verifyPasscode(passcode, record.salt, record.hash)) {
      return record;
    }
  }
  return null;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function signSessionToken(
  payload: Omit<AuthSession, 'issuedAt' | 'expiresAt'>,
  ttlSeconds = 60 * 60 * 12
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthSession = {
    ...payload,
    issuedAt: now,
    expiresAt: now + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 session token in constant time and checks expiry.
 */
export function verifySessionToken(token: string | undefined | null): AuthSession | null {
  if (!token || !token.includes('.')) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const sigBufferA = Buffer.from(providedSignature, 'utf8');
  const sigBufferB = Buffer.from(expectedSignature, 'utf8');
  if (sigBufferA.length !== sigBufferB.length || !crypto.timingSafeEqual(sigBufferA, sigBufferB)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AuthSession;
    const now = Math.floor(Date.now() / 1000);
    if (decoded.expiresAt < now) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Brute-force rate limiter for passcode authentication endpoints.
 */
export function checkPasscodeRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  if (now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  return {
    allowed: entry.attempts < MAX_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.attempts),
    retryAfterSeconds: 0,
  };
}

export function recordFailedPasscodeAttempt(key: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    });
    return;
  }

  const nextAttempts = entry.attempts + 1;
  rateLimitStore.set(key, {
    ...entry,
    attempts: nextAttempts,
    lockedUntil: nextAttempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : null,
  });
}

export function clearPasscodeRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

export type ProtectedAction =
  | 'log_dose'
  | 'manage_schedule'
  | 'manage_appointments'
  | 'log_vitals'
  | 'add_care_note'
  | 'update_autonomy'
  | 'trigger_email_alert';

/**
 * Role-Based Access Control (RBAC) enforcing Elder Autonomy preferences.
 */
export function canPerformAction(
  role: CareRole,
  action: ProtectedAction,
  autonomy: ElderAutonomySettings
): { allowed: boolean; reason?: string } {
  switch (action) {
    case 'update_autonomy':
      if (role === 'elder' || role === 'caretaker') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Only the elderly individual or primary caretaker may modify autonomy & consent preferences.',
      };

    case 'manage_schedule':
    case 'manage_appointments':
      if (role === 'caretaker' || role === 'elder') {
        return { allowed: true };
      }
      if (role === 'family' && autonomy.allowFamilyScheduleEdits) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason:
          'Elder Autonomy Policy: Family members currently have read-only schedule access. Enable "Allow Family Schedule Edits" in Elder Autonomy Settings to grant edit permission.',
      };

    case 'log_dose':
    case 'log_vitals':
    case 'add_care_note':
    case 'trigger_email_alert':
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}
