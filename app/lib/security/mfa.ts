import { MFA_DEMO_CODE, MFA_REQUIRED_ROLES, PENDING_MFA_STORAGE_KEY } from './constants';
import type { PendingMfaChallenge } from './types';
import type { InternalStaffRole } from '../auth/hospital/types';

export function isMfaRequiredForRole(role: InternalStaffRole): boolean {
  return (MFA_REQUIRED_ROLES as readonly string[]).includes(role);
}

export function createPendingMfaChallenge(employeeId: string): PendingMfaChallenge {
  const challenge: PendingMfaChallenge = {
    challengeId: `MFA-${Date.now()}`,
    employeeId,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    method: 'otp',
    demoCode: MFA_DEMO_CODE,
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PENDING_MFA_STORAGE_KEY, JSON.stringify(challenge));
  }

  return challenge;
}

export function readPendingMfaChallenge(): PendingMfaChallenge | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(PENDING_MFA_STORAGE_KEY);
    if (!raw) return null;
    const challenge = JSON.parse(raw) as PendingMfaChallenge;
    if (Date.now() >= new Date(challenge.expiresAt).getTime()) {
      clearPendingMfaChallenge();
      return null;
    }
    return challenge;
  } catch {
    return null;
  }
}

export function clearPendingMfaChallenge(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_MFA_STORAGE_KEY);
}

export function verifyMfaOtp(code: string, challenge: PendingMfaChallenge): boolean {
  const normalized = code.replace(/\D/g, '');
  return normalized.length === 6 && normalized === challenge.demoCode;
}
