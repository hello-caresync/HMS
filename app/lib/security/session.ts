import { SESSION_TTL_MS, SECURITY_SESSION_STORAGE_KEY } from './constants';
import type { StaffSession } from './types';
import type { InternalStaffRole } from '../auth/hospital/types';

export function generateActiveToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `NXR-${crypto.randomUUID()}`;
  }
  return `NXR-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function buildStaffSession(
  employeeId: string,
  assignedRole: InternalStaffRole,
): StaffSession {
  return {
    employeeId,
    activeToken: generateActiveToken(),
    assignedRole,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
}

export function readSecuritySession(): StaffSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(SECURITY_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffSession;
  } catch {
    return null;
  }
}

export function writeSecuritySession(session: StaffSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SECURITY_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSecuritySession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SECURITY_SESSION_STORAGE_KEY);
}

export function isSecuritySessionExpired(session: StaffSession): boolean {
  return Date.now() >= new Date(session.expiresAt).getTime();
}

export function extendSecuritySession(session: StaffSession): StaffSession {
  const extended: StaffSession = {
    ...session,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  writeSecuritySession(extended);
  return extended;
}
