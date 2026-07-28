import { logUserActivity } from './activityLog';
import { evaluatePasswordPolicy } from './passwordPolicy';
import {
  authenticateBiometricBypass,
  authenticateStaff,
  resolvePostLoginRoute,
} from './hospital';
import {
  clearSession,
  readSession,
  touchSessionActivity,
  writeSession,
} from './session';
import type { MfaChallengeState, HospitalStaffProfile } from './types';
import { registerClientSession, revokeClientSession } from '@/lib/doctor/client/session-client';
import {
  appendLoginHistoryEvent,
  buildStaffSession as buildSecuritySession,
  clearPendingMfaChallenge,
  clearSecuritySession,
  createPendingMfaChallenge,
  isMfaRequiredForRole,
  readPendingMfaChallenge,
  readSecuritySession,
  verifyMfaOtp,
  writeSecuritySession,
} from '../security';

export async function initiateStaffLogin(
  identifier: string,
  password: string,
): Promise<
  | { ok: true; requiresMfa: true; employeeId: string; profile: HospitalStaffProfile }
  | { ok: true; requiresMfa: false; profile: HospitalStaffProfile }
  | { ok: false; error: string }
> {
  const result = authenticateStaff(identifier, password);

  if (result.ok === false) {
    appendLoginHistoryEvent(identifier, 'FAILED');
    logUserActivity(identifier, 'Failed login attempt', 'Hospital IAM');
    return { ok: false, error: result.error };
  }

  const profile: HospitalStaffProfile = { ...result.session, mfaPending: false };

  if (isMfaRequiredForRole(profile.role)) {
    createPendingMfaChallenge(profile.employeeId);
    appendLoginHistoryEvent(profile.employeeId, 'MFA_CHALLENGE');
    logUserActivity(profile.userId, 'MFA challenge issued', 'Hospital IAM');
    return { ok: true, requiresMfa: true, employeeId: profile.employeeId, profile };
  }

  appendLoginHistoryEvent(profile.employeeId, 'SUCCESS');
  return { ok: true, requiresMfa: false, profile };
}

export async function verifyStaffMfa(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const challenge = readPendingMfaChallenge();
  if (!challenge) {
    return { ok: false, error: 'MFA challenge expired. Sign in again.' };
  }

  if (!verifyMfaOtp(code, challenge)) {
    appendLoginHistoryEvent(challenge.employeeId, 'FAILED');
    return { ok: false, error: 'Invalid verification code. Access denied.' };
  }

  appendLoginHistoryEvent(challenge.employeeId, 'SUCCESS');
  clearPendingMfaChallenge();
  return { ok: true };
}

export function resendMfaChallenge(employeeId: string): void {
  createPendingMfaChallenge(employeeId);
  logUserActivity(employeeId, 'MFA code resent (simulation)', 'Hospital IAM');
}

export async function completeStaffLogin(
  profile: HospitalStaffProfile,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const securitySession = buildSecuritySession(profile.employeeId, profile.role);
  writeSecuritySession(securitySession);
  writeSession({ ...profile, mfaPending: false });

  const lastActivityAt = new Date().toISOString();
  registerClientSession(securitySession, lastActivityAt);

  logUserActivity(profile.userId, `Login (${profile.role})`, 'Hospital IAM');
  return { ok: true };
}

export async function signInWithEmail(
  identifier: string,
  password: string,
): Promise<
  | { ok: true; session: HospitalStaffProfile; requiresMfa: boolean }
  | { ok: false; error: string }
> {
  const result = await initiateStaffLogin(identifier, password);
  if (result.ok === false) return result;

  if (result.requiresMfa) {
    return {
      ok: true,
      session: { ...result.profile, mfaPending: true },
      requiresMfa: true,
    };
  }

  const completed = await completeStaffLogin(result.profile);
  if (completed.ok === false) return { ok: false, error: completed.error };

  return { ok: true, session: result.profile, requiresMfa: false };
}

export async function signInWithBiometricBypass(
  employeeId?: string,
): Promise<
  | { ok: true; session: HospitalStaffProfile; requiresMfa: boolean }
  | { ok: false; error: string }
> {
  const result = authenticateBiometricBypass(employeeId);

  if (result.ok === false) {
    logUserActivity(employeeId ?? 'unknown', 'Biometric auth failed', 'Hospital IAM');
    return { ok: false, error: result.error };
  }

  const profile: HospitalStaffProfile = { ...result.session, mfaPending: false };
  const completed = await completeStaffLogin(profile);
  if (completed.ok === false) return { ok: false, error: completed.error };

  appendLoginHistoryEvent(profile.employeeId, 'SUCCESS');
  logUserActivity(
    profile.userId,
    `Biometric login (${profile.role})`,
    'Hospital IAM',
  );

  return { ok: true, session: profile, requiresMfa: false };
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  logUserActivity(trimmedEmail, 'Password reset requested (internal ERP)', 'Hospital IAM');
  return {
    ok: true,
    message:
      'If this employee account exists, IT will process your reset request within 24 hours.',
  };
}

export async function completePasswordReset(
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const policy = evaluatePasswordPolicy(newPassword);
  if (!policy.valid) {
    return { ok: false, message: 'Password does not meet Nexora security policy.' };
  }

  logUserActivity('unknown', 'Password reset completed (mock)', 'Hospital IAM');
  return { ok: true, message: 'Password updated. Sign in with your new credentials.' };
}

export function signOut(userId?: string): void {
  const session = readSession();
  const id = userId ?? session?.userId ?? 'anonymous';

  if (typeof window !== 'undefined') {
    const security = readSecuritySession();
    if (security?.activeToken) {
      revokeClientSession(security.activeToken);
    }
  }

  clearSession();
  clearSecuritySession();
  clearPendingMfaChallenge();
  logUserActivity(id, 'Logout', 'Hospital IAM');
}

export function getCurrentSession(): HospitalStaffProfile | null {
  return readSession();
}

export function refreshSessionActivity(): HospitalStaffProfile | null {
  return touchSessionActivity();
}

export function createMfaChallenge(_session: HospitalStaffProfile): MfaChallengeState {
  return { pending: true, method: 'totp', verificationToken: `MFA-${Date.now()}` };
}

export async function verifyMfaChallenge(): Promise<{ ok: false; error: string }> {
  return { ok: false, error: 'Use verifyStaffMfa during the login MFA step.' };
}

export { resolvePostLoginRoute };
