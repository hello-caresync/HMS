import type { NextRequest } from 'next/server';

import { resolveHospitalSessionRole } from '@/lib/auth/hospital-rbac';

export const HOSPITAL_DESK_DASHBOARD_PATH = '/dashboard';
export const HOSPITAL_DESK_LOGIN_PATH = '/hospital/login';

export type VerifiedHospitalDeskSession = {
  email: string;
  hospitalId: string;
  staffType: string;
};

function decodeCookieJson(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function parseDeskPayload(raw: string | undefined): VerifiedHospitalDeskSession | null {
  const parsed = decodeCookieJson(raw);
  if (!parsed) return null;

  const email = String(parsed.email ?? '').trim().toLowerCase();
  const hospitalId = String(parsed.hospital_id ?? parsed.hospitalId ?? '').trim();
  const staffType = resolveHospitalSessionRole({
    staff_type: typeof parsed.staff_type === 'string' ? parsed.staff_type : null,
    role: typeof parsed.role === 'string' ? parsed.role : null,
  });

  if (!email || !hospitalId) return null;
  return { email, hospitalId, staffType };
}

/** Edge-safe verified hospital desk session — ignores stale auth-token / role-only cookies. */
export function readVerifiedHospitalDeskSession(
  request: NextRequest,
): VerifiedHospitalDeskSession | null {
  for (const key of [
    'curasync_active_session',
    'curasync_staff_session',
    'hospital_session',
  ] as const) {
    const verified = parseDeskPayload(request.cookies.get(key)?.value);
    if (verified) return verified;
  }
  return null;
}

export function resolveHospitalDeskHomePath(staffType: string): string {
  const role = staffType.trim().toLowerCase();
  if (role === 'doctor') return '/doctor/dashboard';
  return HOSPITAL_DESK_DASHBOARD_PATH;
}

/** Login redirect without recursive `redirect=/dashboard` loops. */
export function hospitalDeskLoginUrl(originalPath?: string): string {
  const path = String(originalPath ?? '').trim();
  if (
    !path ||
    path === '/dashboard' ||
    path.startsWith('/dashboard?') ||
    path === HOSPITAL_DESK_LOGIN_PATH ||
    path.includes('/login')
  ) {
    return HOSPITAL_DESK_LOGIN_PATH;
  }
  const url = new URL(HOSPITAL_DESK_LOGIN_PATH, 'http://local');
  url.searchParams.set('redirect', path);
  return `${url.pathname}${url.search}`;
}
