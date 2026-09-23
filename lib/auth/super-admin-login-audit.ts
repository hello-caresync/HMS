import { supabase } from '@/lib/supabase/client';

import { SUPER_ADMIN_ROOT_EMAIL } from './superAdminAuth';

const PENDING_ROOT_LOGIN_AUDIT_KEY = 'pending_super_admin_login_audit';

type RootLoginAuditEvent = {
  email: string;
  event_type: 'LOGIN_SUCCESS';
  user_agent: string | null;
  created_at: string;
};

function createRootLoginAuditEvent(): RootLoginAuditEvent {
  return {
    email: SUPER_ADMIN_ROOT_EMAIL,
    event_type: 'LOGIN_SUCCESS',
    user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent.slice(0, 500),
    created_at: new Date().toISOString(),
  };
}

async function insertRootLoginAudit(event: RootLoginAuditEvent): Promise<boolean> {
  const { error } = await supabase.from('super_admin_login_events').insert(event);
  return !error;
}

/**
 * Persist a successful root login in Supabase.
 * Failed writes are queued locally and retried when the vault opens.
 */
export async function recordOrQueueRootLoginSuccess(): Promise<void> {
  if (typeof window === 'undefined') return;

  const event = createRootLoginAuditEvent();

  try {
    if (await insertRootLoginAudit(event)) {
      localStorage.removeItem(PENDING_ROOT_LOGIN_AUDIT_KEY);
      return;
    }
  } catch {
    // Queue below; authentication itself remains available during transient outages.
  }

  localStorage.setItem(PENDING_ROOT_LOGIN_AUDIT_KEY, JSON.stringify(event));
}

export async function flushQueuedRootLoginSuccess(): Promise<void> {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(PENDING_ROOT_LOGIN_AUDIT_KEY);
  if (!raw) return;

  try {
    const event = JSON.parse(raw) as RootLoginAuditEvent;
    if (await insertRootLoginAudit(event)) {
      localStorage.removeItem(PENDING_ROOT_LOGIN_AUDIT_KEY);
    }
  } catch {
    // Keep the event queued for the next vault visit.
  }
}
