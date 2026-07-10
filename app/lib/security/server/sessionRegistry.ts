import type { StaffSession } from '../types';

type RegisteredSession = StaffSession & {
  lastActivityAt: string;
};

const registry = new Map<string, RegisteredSession>();

export function registerServerSession(session: StaffSession, lastActivityAt: string): void {
  registry.set(session.activeToken, { ...session, lastActivityAt });
}

export function touchServerSession(activeToken: string, lastActivityAt: string): RegisteredSession | null {
  const existing = registry.get(activeToken);
  if (!existing) return null;

  const updated = { ...existing, lastActivityAt };
  registry.set(activeToken, updated);
  return updated;
}

export function resolveServerSession(activeToken: string): RegisteredSession | null {
  return registry.get(activeToken) ?? null;
}

export function revokeServerSession(activeToken: string): void {
  registry.delete(activeToken);
}

export function clearAllServerSessions(): void {
  registry.clear();
}
