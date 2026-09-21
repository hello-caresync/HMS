export type RegalRole = 'super_admin' | 'admin' | 'doctor' | 'staff' | 'patient' | 'vendor';

export const REGAL_ROLE_COOKIE = 'regal_role';
/** @deprecated Use REGAL_ROLE_COOKIE */
export const NEXORA_ROLE_COOKIE = REGAL_ROLE_COOKIE;

const COOKIE_ATTRS = 'path=/; max-age=86400; SameSite=Lax';

export function setRegalRoleCookie(role: RegalRole): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REGAL_ROLE_COOKIE}=${role}; ${COOKIE_ATTRS}`;
  document.cookie = `nexora_role=; path=/; max-age=0; SameSite=Lax`;
}

/** @deprecated Use setRegalRoleCookie */
export const setNexoraRoleCookie = setRegalRoleCookie;

export function clearRegalRoleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REGAL_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `nexora_role=; path=/; max-age=0; SameSite=Lax`;
}

/** @deprecated Use clearRegalRoleCookie */
export const clearNexoraRoleCookie = clearRegalRoleCookie;
