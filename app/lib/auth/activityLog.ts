import type { ActivityLogEntry } from './types';

export const ACTIVITY_LOG_STORAGE_KEY = 'nexora_activity_log';

export function logUserActivity(
  userId: string,
  action: string,
  module: string,
): ActivityLogEntry {
  const entry: ActivityLogEntry = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    action,
    module,
    timestampUtc: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return entry;

  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    const existing: ActivityLogEntry[] = raw ? (JSON.parse(raw) as ActivityLogEntry[]) : [];
    const next = [entry, ...existing].slice(0, 500);
    localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify([entry]));
  }

  return entry;
}

export function readActivityLog(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
}
