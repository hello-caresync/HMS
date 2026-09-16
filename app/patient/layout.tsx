'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

import { EcosystemNotificationBell } from '@/components/ecosystem/EcosystemNotificationBell';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';
import { PatientAmbientCanvas } from '@/components/patient/PatientAmbientCanvas';
import { PatientSidebar } from '@/components/patient/Sidebar';
import { PatientClinicalRealtimeBridge } from '@/components/patient/PatientClinicalRealtimeBridge';
import { ensurePatientIdPersisted, resolveActivePatientId } from '@/lib/clinical/bridge';
import { logoutPatientSession, readPatientAuthSession } from '@/lib/auth/patientAuth';
import { PatientAuthProvider } from '@/lib/patient/auth/PatientAuthProvider';
import { patientClasses } from '@/lib/patient/theme';

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
        <PatientAmbientCanvas>{children}</PatientAmbientCanvas>
        <Toaster position="top-right" closeButton />
      </PatientAuthProvider>
    );
  }

  if (!hydrated) {
    return (
      <PatientAuthProvider>
        <PatientAmbientCanvas className="flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#8C5A3C] px-5 py-3 text-white shadow-md">
            <Loader2 className="h-4 w-4 animate-spin text-[#F5EFE6]" />
            <span className="text-xs font-bold">Connecting to Patient Workspace…</span>
          </div>
        </PatientAmbientCanvas>
      </PatientAuthProvider>
    );
  }

  return (
    <PatientAuthProvider>
      <PatientAmbientCanvas className="flex h-screen max-h-screen w-full overflow-hidden font-sans">
        <PatientSidebar patientName={patientName} onLogout={handleLogout} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-40 flex h-14 shrink-0 items-center px-4 shadow-xs sm:px-5 ${patientClasses.topBar}`}
          >
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <RegalHospitalLogo heightClass="h-6" showNodeBadge />
                <span className="hidden truncate text-[11px] font-semibold text-stone-500 sm:inline">
                  HOSP-01 · Bengaluru
                </span>
                <span className="hidden rounded-full border border-[#EADBCE] bg-[#F3ECE4] px-2 py-0.5 text-[10px] font-bold text-[#5C3826] lg:inline">
                  {patientName}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[11px] font-mono text-stone-500 md:inline">
                  +91 98450 12345
                </span>
                <EcosystemNotificationBell
                  app="patient"
                  recipientId={patientId}
                  className="bg-[#F3ECE4] text-[#8C5A3C] hover:bg-[#EADBCE]"
                />
                <span className={patientClasses.badgeSuccess}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  OPD Live
                </span>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 pb-8 md:p-5 md:pb-8">{children}</div>
          </main>
        </div>

        <PatientClinicalRealtimeBridge />
        <Toaster position="top-right" closeButton richColors />
      </PatientAmbientCanvas>
    </PatientAuthProvider>
  );
}
