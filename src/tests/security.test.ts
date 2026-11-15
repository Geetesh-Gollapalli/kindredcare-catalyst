import { describe, it, expect, beforeEach } from 'vitest';
import {
  authenticateRoleByPasscode,
  canPerformAction,
  checkPasscodeRateLimit,
  clearPasscodeRateLimit,
  hashPasscode,
  recordFailedPasscodeAttempt,
  signSessionToken,
  verifyPasscode,
  verifySessionToken,
} from '@/lib/security';
import { DEFAULT_PASSCODE_RECORDS } from '@/services/store';
import type { ElderAutonomySettings } from '@/types/domain';

describe('Security & Cryptographic Passcode Access Engine', () => {
  const defaultAutonomy: ElderAutonomySettings = {
    escalationGraceMinutes: 30,
    allowFamilyScheduleEdits: false,
    shareVitalsWithFamily: true,
    voiceReadoutEnabled: true,
    seniorComfortMode: false,
    preferredLanguage: 'English',
  };

  beforeEach(() => {
    clearPasscodeRateLimit('test-ip:KC-2026');
  });

  it('hashes and verifies passcodes using salted scrypt in constant time', () => {
    const { salt, hash } = hashPasscode('1234');
    expect(salt).toHaveLength(32);
    expect(hash).toHaveLength(128);
    expect(verifyPasscode('1234', salt, hash)).toBe(true);
    expect(verifyPasscode('9999', salt, hash)).toBe(false);
  });

  it('authenticates Elder, Caretaker, and Family passcodes accurately', () => {
    const elder = authenticateRoleByPasscode('1234', DEFAULT_PASSCODE_RECORDS);
    expect(elder?.role).toBe('elder');

    const caretaker = authenticateRoleByPasscode('CARE2026', DEFAULT_PASSCODE_RECORDS);
    expect(caretaker?.role).toBe('caretaker');

    const family = authenticateRoleByPasscode('FAMILY26', DEFAULT_PASSCODE_RECORDS);
    expect(family?.role).toBe('family');

    const invalid = authenticateRoleByPasscode('WRONG_PIN', DEFAULT_PASSCODE_RECORDS);
    expect(invalid).toBeNull();
  });

  it('signs and verifies HMAC-SHA256 session tokens and rejects tampered tokens', () => {
    const token = signSessionToken({
      circleId: 'circle-kc-2026',
      circleCode: 'KC-2026',
      role: 'elder',
      memberName: 'Smt. Kamala Devi',
    });

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('elder');
    expect(verified?.circleCode).toBe('KC-2026');

    const tampered = `${token}tamper`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it('enforces brute-force lockout after 5 failed passcode attempts', () => {
    const key = 'test-ip:KC-2026';
    for (let i = 0; i < 5; i += 1) {
      expect(checkPasscodeRateLimit(key).allowed).toBe(true);
      recordFailedPasscodeAttempt(key);
    }
    const locked = checkPasscodeRateLimit(key);
    expect(locked.allowed).toBe(false);
    expect(locked.remainingAttempts).toBe(0);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('enforces RBAC and respects Elder Autonomy preferences for schedule edits', () => {
    // Family cannot edit schedule when allowFamilyScheduleEdits is false
    expect(canPerformAction('family', 'manage_schedule', defaultAutonomy).allowed).toBe(false);
    expect(canPerformAction('caretaker', 'manage_schedule', defaultAutonomy).allowed).toBe(true);
    expect(canPerformAction('elder', 'manage_schedule', defaultAutonomy).allowed).toBe(true);

    // When Elder enables allowFamilyScheduleEdits, family can edit schedule
    const permissiveAutonomy = { ...defaultAutonomy, allowFamilyScheduleEdits: true };
    expect(canPerformAction('family', 'manage_schedule', permissiveAutonomy).allowed).toBe(true);

    // Family can never override the Elder's personal autonomy settings
    expect(canPerformAction('family', 'update_autonomy', permissiveAutonomy).allowed).toBe(false);
    expect(canPerformAction('elder', 'update_autonomy', permissiveAutonomy).allowed).toBe(true);
  });
});
