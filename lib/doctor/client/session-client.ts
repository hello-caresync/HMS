import { IDLE_THRESHOLD_MS, type SessionPingResponse } from '@/app/lib/security';
import type { StaffSession } from '@/app/lib/security/types';

/** Client-only session validation for static export (no /api/auth/session). */
export function pingClientSession(
  session: StaffSession,
  lastActivityAt: string,
): SessionPingResponse {
  const serverTime = new Date().toISOString();

  if (Date.now() >= new Date(session.expiresAt).getTime()) {
    return { valid: false, reason: 'EXPIRED', serverTime };
  }

  if (Date.now() - new Date(lastActivityAt).getTime() > IDLE_THRESHOLD_MS) {
    return { valid: false, reason: 'IDLE_TIMEOUT', serverTime };
  }

  const remainingMs = new Date(session.expiresAt).getTime() - Date.now();
  return {
    valid: true,
    expiresAt: session.expiresAt,
    serverTime,
    remainingMs,
    idleBreached: false,
  };
}

export function registerClientSession(_session: StaffSession, _lastActivityAt: string): void {
  /* Static export — session lives in localStorage only */
}

export function revokeClientSession(_token: string): void {
  /* No server registry in static export */
}
