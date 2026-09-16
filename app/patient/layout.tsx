'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

import { EcosystemNotificationBell } from '@/components/ecosystem/EcosystemNotificationBell';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';
import { PatientSidebar } from '@/components/patient/Sidebar';
import { PatientClinicalRealtimeBridge } from '@/components/patient/PatientClinicalRealtimeBridge';
import { ensurePatientIdPersisted, resolveActivePatientId } from '@/lib/clinical/bridge';
import { logoutPatientSession, readPatientAuthSession } from '@/lib/auth/patientAuth';
import { PatientAuthProvider } from '@/lib/patient/auth/PatientAuthProvider';

function isAuthRoute(pathname: string | null) {
  return Boolean(pathname?.includes('/auth/login') || pathname?.endsWith('/login'));
}

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [patientName, setPatientName] = useState('Patient');
  const [patientId, setPatientId] = useState<string | undefined>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAuthRoute(pathname)) {
        setHydrated(true);
        return;
      }

      const authSession = readPatientAuthSession();
      if (!authSession) {
        router.replace('/patient/login');
        return;
      }

      setPatientName(authSession.name);
      setPatientId(authSession.patientId || resolveActivePatientId());
      ensurePatientIdPersisted(authSession.patientId);

      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  const handleLogout = () => {
    logoutPatientSession();
    router.replace('/patient/login');
  };

  if (isAuthRoute(pathname)) {
    return (
      <PatientAuthProvider>
        <div className="min-h-screen w-full overscroll-none bg-slate-50">{children}</div>
        <Toaster position="top-right" closeButton />
      </PatientAuthProvider>
    );
  }

  if (!hydrated) {
    return (
      <PatientAuthProvider>
        <div className="flex min-h-screen w-full items-center justify-center overscroll-none bg-[#F4F8F7]">
          <div className="flex items-center gap-3 rounded-2xl bg-[#113831] px-6 py-4 text-white shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-[#EAF5F2]" />
            <span className="text-xs font-black">Connecting to Patient Workspace…</span>
          </div>
        </div>
      </PatientAuthProvider>
    );
  }

  return (
    <PatientAuthProvider>
      <div className="flex min-h-screen w-full overscroll-none bg-[#F4F8F7] font-sans text-[#0E2924]">
      <PatientSidebar patientName={patientName} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain md:ml-64">
        <header className="bg-white border-b border-gray-100 py-3 px-6 shadow-xs sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <RegalHospitalLogo heightClass="h-7" showNodeBadge />
              <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 sm:inline-block">
                SmartQ Patient Portal
              </span>
              <span className="truncate text-[11px] font-bold text-slate-500 hidden lg:inline">
                {patientName}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 hidden md:inline font-mono">
                Helpline: <strong className="text-gray-700">+91 98450 12345</strong>
              </span>
              <EcosystemNotificationBell
                app="patient"
                recipientId={patientId}
                className="bg-[#EAF5F2] text-[#113831] hover:bg-[#DAF0EB]"
              />
              <div className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">OPD Live Desk Active</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      <PatientClinicalRealtimeBridge />
      <Toaster position="top-right" closeButton richColors />
    </div>
    </PatientAuthProvider>
  );
}
