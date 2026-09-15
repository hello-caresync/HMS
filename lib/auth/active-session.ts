import { clearNexoraRoleCookie, setNexoraRoleCookie } from './role-cookies';
import { CACHE_KEYS, removeLocalJson } from '@/lib/persistence/local-cache';

export const CURASYNC_ACTIVE_SESSION_KEY = 'curasync_active_session';
export const ADMIN_PROVISIONING_PATH = '/dashboard/staff-credentials';

export type ActiveStaffSession = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  staff_type: string;
  department: string;
  email: string;
  portal_access: string;
};

export function parseActiveSession(raw: string | null): ActiveStaffSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActiveStaffSession>;
    if (parsed?.email && parsed?.portal_access && parsed?.id) {
      return parsed as ActiveStaffSession;
    }
  } catch {
    // invalid session payload
  }
  return null;
}

/** Hospital Admins land on staff provisioning first; all other roles use their portal route. */
export function resolvePostLoginRoute(staffType: string, portalAccess: string): string {
  if (staffType === 'Admin') return ADMIN_PROVISIONING_PATH;
  return portalAccess || '/dashboard';
}

/** Operational staff never route to the admin credential provisioning screen. */
export function resolveOperationalStaffRoute(portalAccess: string): string {
  const route = portalAccess || '/dashboard';
  if (route === ADMIN_PROVISIONING_PATH) return '/dashboard';
  return route;
}

export function persistActiveSession(session: ActiveStaffSession): void {
  if (typeof window === 'undefined') return;

  const attrs = 'path=/; max-age=86400; SameSite=Lax';
  const sessionPayload = JSON.stringify(session);

  localStorage.setItem(CURASYNC_ACTIVE_SESSION_KEY, sessionPayload);
  localStorage.setItem('curasync_admin_session', sessionPayload);
  setNexoraRoleCookie('admin');

  document.cookie = `curasync_admin_session=${encodeURIComponent(session.hospital_id)}; ${attrs}`;
  document.cookie = `curasync_active_session=${encodeURIComponent(sessionPayload)}; ${attrs}`;

  const cookiePayload = encodeURIComponent(
    JSON.stringify({
      email: session.email,
      role: session.staff_type,
      loggedInAt: new Date().toISOString(),
    }),
  );
  document.cookie = `curasync_session=${cookiePayload}; ${attrs}`;
  document.cookie = `auth-token=authenticated; ${attrs}`;
  document.cookie = `sb-access-token=authenticated; ${attrs}`;
}

export function clearStaleAuthArtifacts(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('user_role');
  localStorage.removeItem('nexora_admin_session');
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CURASYNC_ACTIVE_SESSION_KEY);
  localStorage.removeItem('curasync_admin_session');
  localStorage.removeItem('curasync_staff_session');
  removeLocalJson(CACHE_KEYS.hospitalInfo);
  removeLocalJson(CACHE_KEYS.opdQueue);
  removeLocalJson(CACHE_KEYS.hospitalPlatform);
  clearNexoraRoleCookie();

  const attrs = 'path=/; max-age=0; SameSite=Lax';
  document.cookie = `curasync_admin_session=; ${attrs}`;
  document.cookie = `curasync_active_session=; ${attrs}`;
  document.cookie = `curasync_staff_session=; ${attrs}`;
  document.cookie = `curasync_session=; ${attrs}`;
  document.cookie = `auth-token=; ${attrs}`;
  document.cookie = `sb-access-token=; ${attrs}`;
}

/** Wipe leftover Super Admin and Hospital Admin tokens so login forms never auto-skip. */
export function purgeLocalAdminSessions(): void {
  if (typeof window === 'undefined') return;

  clearHospitalOsSessionTokens();
  clearStaleAuthArtifacts();
  localStorage.removeItem('nexora_superadmin_session');
  localStorage.removeItem('curasync_superadmin_session');
  localStorage.removeItem('super_admin_session');
  localStorage.removeItem('nexora_admin_session');
  sessionStorage.removeItem('nexora_admin_session');
  sessionStorage.removeItem('nexora_superadmin_session');

  const attrs = 'path=/; max-age=0; SameSite=Lax';
  document.cookie = `nexora_superadmin_session=; ${attrs}`;
  document.cookie = `curasync_superadmin_session=; ${attrs}`;
  document.cookie = `nexora_admin_session=; ${attrs}`;
  document.cookie = `auth-token=; ${attrs}`;
  document.cookie = `sb-access-token=; ${attrs}`;
  clearNexoraRoleCookie();
}

/** Drop leftover hospital Admin/staff tokens so tenant hops always show the login form. Does not touch Super Admin. */
export function clearHospitalOsSessionTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CURASYNC_ACTIVE_SESSION_KEY);
  localStorage.removeItem('curasync_admin_session');
  localStorage.removeItem('curasync_staff_session');
  localStorage.removeItem('curasync_admin_role');
  localStorage.removeItem('admin_authenticated');
  removeLocalJson(CACHE_KEYS.hospitalInfo);

  const attrs = 'path=/; max-age=0; SameSite=Lax';
  document.cookie = `curasync_admin_session=; ${attrs}`;
  document.cookie = `curasync_active_session=; ${attrs}`;
  document.cookie = `curasync_staff_session=; ${attrs}`;
  document.cookie = `curasync_session=; ${attrs}`;
}
