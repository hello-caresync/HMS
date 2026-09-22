export const SUPER_VAULT_SESSION_COOKIE = 'nexora_super_vault_session';

const SUPER_ADMIN_COOKIE_MARKERS = [
  `${SUPER_VAULT_SESSION_COOKIE}=unlocked`,
  'nexora_superadmin_session=',
  'curasync_superadmin_session=',
  'regal_role=super_admin',
  'nexora_role=super_admin',
] as const;

/** Gate destructive Super Admin RPCs to an unlocked vault or authenticated super-admin session. */
export function isSuperAdminAuthorizedRequest(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  if (!cookieHeader) return false;
  return SUPER_ADMIN_COOKIE_MARKERS.some((marker) => cookieHeader.includes(marker));
}
