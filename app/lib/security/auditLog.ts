import { LOGIN_HISTORY_STORAGE_KEY } from './constants';
import type { LoginHistoryEvent, LoginHistoryStatus } from './types';

function createEventId(): string {
  return `AUTH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function appendLoginHistoryEvent(
  employeeId: string,
  status: LoginHistoryStatus,
  geoLocHint = 'On-premise terminal · Nexora Health',
): LoginHistoryEvent {
  const event: LoginHistoryEvent = {
    eventId: createEventId(),
    timestamp: new Date().toISOString(),
    employeeId,
    status,
    geoLocHint,
  };

  if (typeof window === 'undefined') return event;

  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_STORAGE_KEY);
    const existing: LoginHistoryEvent[] = raw ? (JSON.parse(raw) as LoginHistoryEvent[]) : [];
    localStorage.setItem(
      LOGIN_HISTORY_STORAGE_KEY,
      JSON.stringify([event, ...existing].slice(0, 200)),
    );
  } catch {
    localStorage.setItem(LOGIN_HISTORY_STORAGE_KEY, JSON.stringify([event]));
  }

  return event;
}

export function readLoginHistory(): LoginHistoryEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginHistoryEvent[]) : [];
  } catch {
    return [];
  }
}
