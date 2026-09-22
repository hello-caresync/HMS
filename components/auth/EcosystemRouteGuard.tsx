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
import { getDoctorSession } from '@/lib/doctor/session';
import { parseSuperAdminSession, SUPER_ADMIN_SESSION_KEY } from '@/lib/auth/super-admin-session';

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

function hasSuperAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
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
        if (getDoctorSession()) {
          router.replace('/doctor/dashboard');
          return;
        }
        const session =
          readHospitalAppSession() ?? hydrateHospitalDeskSessionFromCookies();
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
