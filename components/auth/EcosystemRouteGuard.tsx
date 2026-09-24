'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  CURASYNC_ACTIVE_SESSION_KEY,
  parseActiveSession,
} from '@/lib/auth/active-session';
import {
  getStaffPortalSession,
  getVendorSession,
  hydrateHospitalDeskSessionFromCookies,
  isHospitalAppRole,
  parseJsonSession,
  readHospitalAppSession,
  SESSION_KEYS,
} from '@/lib/auth/ecosystem-sessions';
import { hospitalDeskLoginUrl } from '@/lib/auth/hospital-desk-session';
import { parseSuperAdminSession, SUPER_ADMIN_SESSION_KEY } from '@/lib/auth/super-admin-session';
import {
  hardNavigateSuperAdminRoute,
  normalizeSuperAdminRoutePath,
  shouldDisableSuperAdminLinkPrefetch,
  SUPER_ADMIN_LOGIN_PATH,
} from '@/lib/auth/superAdminAuth';

type GuardRole = 'admin' | 'staff' | 'vendor' | 'patient' | 'superadmin' | 'doctor' | 'hospital';

type RouteGuardProps = {
  role: GuardRole;
  children: ReactNode;
  loginPath: string;
};

function hasPatientSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    localStorage.getItem(SESSION_KEYS.patient) ||
      localStorage.getItem('curasync_patient_logged_in') === 'true',
  );
}

function hasDoctorSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(SESSION_KEYS.doctor));
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function hasSuperAdminSession(): boolean {
  if (typeof window === 'undefined') return false;

  if (localStorage.getItem('platform_root_unlocked') === 'true') return true;
  if (readCookie('platform_root') === 'true') return true;
  if (readCookie('super_admin_session')) return true;

  const nexora = parseJsonSession<{ role?: string }>(
    localStorage.getItem('nexora_superadmin_session'),
  );
  if (nexora?.role === 'super_admin') return true;
  if (parseSuperAdminSession(localStorage.getItem(SUPER_ADMIN_SESSION_KEY)) !== null) return true;
  const provisioned = parseJsonSession<{ id?: string; email?: string; role?: string }>(
    localStorage.getItem('super_admin_session'),
  );
  return Boolean(provisioned?.id && provisioned?.email);
}

export function EcosystemRouteGuard({ role, children, loginPath }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let ok = false;

    switch (role) {
      case 'admin': {
        const session = parseActiveSession(localStorage.getItem(CURASYNC_ACTIVE_SESSION_KEY));
        ok =
          session?.staff_type === 'Admin' ||
          parseActiveSession(localStorage.getItem('curasync_admin_session'))?.staff_type === 'Admin';
        break;
      }
      case 'hospital': {
        const session =
          readHospitalAppSession() ?? hydrateHospitalDeskSessionFromCookies();
        const staffType = session?.staff_type?.trim().toLowerCase() ?? '';
        if (staffType === 'doctor') {
          router.replace('/doctor/dashboard');
          return;
        }
        ok = isHospitalAppRole(session?.staff_type);
        break;
      }
      case 'staff':
        ok = Boolean(getStaffPortalSession());
        break;
      case 'vendor':
        ok = Boolean(getVendorSession());
        break;
      case 'patient':
        ok = hasPatientSession();
        break;
      case 'superadmin':
        ok = hasSuperAdminSession();
        break;
      case 'doctor':
        ok = hasDoctorSession();
        break;
    }

    if (!ok) {
      const destination =
        role === 'hospital'
          ? hospitalDeskLoginUrl(pathname ?? undefined)
          : loginPath;

      if (shouldDisableSuperAdminLinkPrefetch(destination)) {
        hardNavigateSuperAdminRoute(
          normalizeSuperAdminRoutePath(destination) === SUPER_ADMIN_LOGIN_PATH
            ? `${SUPER_ADMIN_LOGIN_PATH}/`
            : destination,
        );
        return;
      }

      router.replace(destination);
      return;
    }

    setAllowed(true);
  }, [role, loginPath, pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
