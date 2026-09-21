'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

import { EcosystemNotificationBell } from '@/components/ecosystem/EcosystemNotificationBell';
import { PatientAmbientCanvas } from '@/components/patient/PatientAmbientCanvas';
import { PatientSidebar } from '@/components/patient/Sidebar';
import { PatientClinicalRealtimeBridge } from '@/components/patient/PatientClinicalRealtimeBridge';
import { ensurePatientIdPersisted, resolveActivePatientId } from '@/lib/clinical/bridge';
import { syncPatientSessionFromSupabase } from '@/lib/auth/patient-oauth-session';
import { logoutPatientSession, readPatientAuthSession } from '@/lib/auth/patientAuth';
import { supabase } from '@/lib/supabase/client';
import { PatientAuthProvider } from '@/lib/patient/auth/PatientAuthProvider';
import { patientClasses } from '@/lib/patient/theme';

function isAuthRoute(pathname: string | null) {
  return Boolean(pathname?.includes('/auth/login') || pathname?.endsWith('/login'));
}

export default function PatientLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [patientName, setPatientName] = useState('Patient');
  const [patientId, setPatientId] = useState<string | undefined>();
  const sessionBootstrappedRef = useRef(false);

  const applyLocalPatientSession = (authSession: NonNullable<ReturnType<typeof readPatientAuthSession>>) => {
    setPatientName(authSession.name);
    setPatientId(authSession.patientId || resolveActivePatientId());
    ensurePatientIdPersisted(authSession.patientId);
    setHydrated(true);
  };

  useEffect(() => {
    if (isAuthRoute(pathname)) {
      sessionBootstrappedRef.current = false;
      setHydrated(true);
      return;
    }

    if (sessionBootstrappedRef.current) {
      const cachedSession = readPatientAuthSession();
      if (!cachedSession) {
        router.replace('/patient/login');
        return;
      }
      applyLocalPatientSession(cachedSession);
      return;
    }

    let cancelled = false;
    sessionBootstrappedRef.current = true;

    void (async () => {
      let authSession = readPatientAuthSession();
      if (!authSession) {
        const synced = await syncPatientSessionFromSupabase(supabase);
        if (synced.ok) {
          authSession = synced.session;
        } else if (synced.error !== 'No Supabase session.') {
          if (!cancelled) router.replace('/patient/login');
          return;
        }
      }

      if (!authSession) {
        if (!cancelled) router.replace('/patient/login');
        return;
      }

      if (cancelled) return;
      applyLocalPatientSession(authSession);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const handleLogout = () => {
    logoutPatientSession();
    sessionBootstrappedRef.current = false;
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
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#2B1810]">
                  {patientName}
                  <span className="font-medium text-[#7C5C48]"> • Verified Member</span>
                </p>
                <p className="hidden truncate text-[11px] text-[#7C5C48] sm:block">
                  Regal Patient Care · Live OPD workspace
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
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
