import type { HospitalStaffProfile } from './hospital/types';

export const SESSION_STORAGE_KEY = 'nexora_staff_session';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function readSession(): HospitalStaffProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HospitalStaffProfile;
  } catch {
    return null;
  }
}

export function writeSession(session: HospitalStaffProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function touchSessionActivity(): HospitalStaffProfile | null {
  const current = readSession();
  if (!current) return null;

  const updated: HospitalStaffProfile = {
    ...current,
    lastActivityAtUtc: new Date().toISOString(),
  };

  writeSession(updated);
  return updated;
}

export function isSessionExpired(session: HospitalStaffProfile): boolean {
  const last = new Date(session.lastActivityAtUtc).getTime();
  return Date.now() - last > INACTIVITY_TIMEOUT_MS;
}
