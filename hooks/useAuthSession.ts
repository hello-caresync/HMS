'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { APP_ROUTES } from '../app/lib/routes';
import {
  clearSecuritySession,
  collectDeviceMetadata,
  IDLE_THRESHOLD_MS,
  readSecuritySession,
  SESSION_PING_INTERVAL_MS,
  type SessionPingResponse,
} from '../app/lib/security';

export type AuthSessionState = {
  isAuthenticated: boolean;
  isVerifying: boolean;
  lastPingAt: string | null;
  lastError: string | null;
  remainingMs: number | null;
};

export type UseAuthSessionOptions = {
  pingIntervalMs?: number;
  idleThresholdMs?: number;
  enabled?: boolean;
  onForcedLogout?: (reason: string) => void;
};

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

const INITIAL_STATE: AuthSessionState = {
  isAuthenticated: false,
  isVerifying: false,
  lastPingAt: null,
  lastError: null,
  remainingMs: null,
};

function isSameAuthState(a: AuthSessionState, b: AuthSessionState): boolean {
  return (
    a.isAuthenticated === b.isAuthenticated &&
    a.isVerifying === b.isVerifying &&
    a.lastPingAt === b.lastPingAt &&
    a.lastError === b.lastError &&
    a.remainingMs === b.remainingMs
  );
}

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const router = useRouter();
  const {
    pingIntervalMs = SESSION_PING_INTERVAL_MS,
    idleThresholdMs = IDLE_THRESHOLD_MS,
    enabled = true,
    onForcedLogout,
  } = options;

  const [state, setState] = useState<AuthSessionState>(INITIAL_STATE);

  const lastActivityRef = useRef<string>(new Date().toISOString());
  const logoutInFlightRef = useRef(false);
  const onForcedLogoutRef = useRef(onForcedLogout);
  onForcedLogoutRef.current = onForcedLogout;

  const commitState = useCallback((next: AuthSessionState) => {
    setState((prev) => (isSameAuthState(prev, next) ? prev : next));
  }, []);

  const forceLogout = useCallback((reason: string) => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;

    const session = readSecuritySession();
    const token = session?.activeToken;

    clearSecuritySession();
    onForcedLogoutRef.current?.(reason);

    if (token) {
      void fetch('/api/auth/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    router.replace(`${APP_ROUTES.login}?reason=${encodeURIComponent(reason)}`);
  }, [router]);

  const forceLogoutRef = useRef(forceLogout);
  forceLogoutRef.current = forceLogout;

  const pingSession = useCallback(async () => {
    const session = readSecuritySession();

    if (!session) {
      commitState({
        isAuthenticated: false,
        isVerifying: false,
        lastPingAt: null,
        lastError: null,
        remainingMs: null,
      });
      return;
    }

    const idleMs = Date.now() - new Date(lastActivityRef.current).getTime();
    if (idleMs > idleThresholdMs) {
      forceLogoutRef.current('idle_timeout');
      return;
    }

    setState((prev) => {
      if (prev.isVerifying && prev.lastError === null) return prev;
      return { ...prev, isVerifying: true, lastError: null };
    });

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeToken: session.activeToken,
          employeeId: session.employeeId,
          assignedRole: session.assignedRole,
          expiresAt: session.expiresAt,
          lastActivityAt: lastActivityRef.current,
          device: collectDeviceMetadata(),
        }),
      });

      const payload = (await response.json()) as SessionPingResponse;

      if (!response.ok || !payload.valid) {
        const reason =
          payload.valid === false ? payload.reason.toLowerCase() : 'session_invalid';

        commitState({
          isAuthenticated: false,
          isVerifying: false,
          lastPingAt: null,
          lastError: reason,
          remainingMs: null,
        });
        forceLogoutRef.current(reason);
        return;
      }

      commitState({
        isAuthenticated: true,
        isVerifying: false,
        lastPingAt: new Date().toISOString(),
        lastError: null,
        remainingMs: payload.remainingMs,
      });
    } catch {
      setState((prev) => {
        if (!prev.isVerifying && prev.lastError === 'network_error') return prev;
        return { ...prev, isVerifying: false, lastError: 'network_error' };
      });
    }
  }, [commitState, idleThresholdMs]);

  const pingSessionRef = useRef(pingSession);
  pingSessionRef.current = pingSession;

  const touchActivity = useCallback(() => {
    lastActivityRef.current = new Date().toISOString();
  }, []);

  /**
   * Session watchdog effect.
   *
   * LOOP FIX: Do not depend on `pingSession` or `onForcedLogout` — both were
   * recreated each render (unstable inline callback from AuthSessionWatchdog),
   * which re-ran this effect → immediate pingSession → setState → repeat.
   * Use refs for handlers; depend only on `enabled` and `pingIntervalMs`.
   */
  useEffect(() => {
    if (!enabled) {
      commitState(INITIAL_STATE);
      return;
    }

    const runPing = () => {
      void pingSessionRef.current();
    };

    runPing();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, touchActivity, { passive: true }),
    );

    const intervalId = window.setInterval(runPing, pingIntervalMs);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, touchActivity),
      );
      window.clearInterval(intervalId);
    };
  }, [commitState, enabled, pingIntervalMs, touchActivity]);

  return {
    ...state,
    pingSession,
    touchActivity,
    forceLogout,
  };
}
