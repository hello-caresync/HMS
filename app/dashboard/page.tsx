'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { HOSPITAL_DESK_DASHBOARD_PATH, HOSPITAL_DESK_LOGIN_PATH } from '@/lib/auth/hospital-desk-session';
import {
  hydrateHospitalDeskSessionFromCookies,
  readHospitalAppSession,
} from '@/lib/auth/ecosystem-sessions';

/** Legacy `/dashboard` entry — routes to the canonical role-scoped workspace without loops. */
export default function DashboardLegacyRouterPage() {
  const router = useRouter();
  const routedRef = useRef(false);

  useEffect(() => {
    if (routedRef.current) return;
    routedRef.current = true;

    const session = readHospitalAppSession() ?? hydrateHospitalDeskSessionFromCookies();
    if (!session?.hospital_id) {
      router.replace(HOSPITAL_DESK_LOGIN_PATH);
      return;
    }

    const role = session.staff_type.trim().toLowerCase();
    if (role === 'doctor') {
      router.replace('/doctor/dashboard');
      return;
    }

    router.replace(HOSPITAL_DESK_DASHBOARD_PATH);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9]">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-700" />
    </div>
  );
}
