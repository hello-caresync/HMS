'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

import { EcosystemNotificationBell } from '@/components/ecosystem/EcosystemNotificationBell';
import { PatientSidebar } from '@/components/patient/Sidebar';
import { PatientClinicalRealtimeBridge } from '@/components/patient/PatientClinicalRealtimeBridge';
import { ensurePatientIdPersisted, resolveActivePatientId } from '@/lib/clinical/bridge';

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

      const session =
        localStorage.getItem('curasync_patient_session') ||
        localStorage.getItem('patient_full_name');
      const savedName = localStorage.getItem('patient_full_name');
      if (savedName) setPatientName(savedName);
      setPatientId(resolveActivePatientId());
      ensurePatientIdPersisted();

      if (!session && !savedName) {
        router.replace('/patient/auth/login');
        return;
      }

      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('curasync_patient_session');
    router.push('/patient/auth/login');
  };

  if (isAuthRoute(pathname)) {
    return (
      <>
        {children}
        <Toaster position="top-right" closeButton />
      </>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8F7]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#113831] px-6 py-4 text-white shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#EAF5F2]" />
          <span className="text-xs font-black">Connecting to Patient Workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F8F7] font-sans text-[#0E2924]">
      <PatientSidebar patientName={patientName} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto md:ml-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#D5E8E3] bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#227B6B]" />
            <span className="truncate text-xs font-black text-[#0E2924]">
              Verified Patient Session • {patientName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <EcosystemNotificationBell
              app="patient"
              recipientId={patientId}
              className="bg-[#EAF5F2] text-[#113831] hover:bg-[#DAF0EB]"
            />
            <span className="rounded-full bg-[#113831] px-3.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              Live Sync
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      <PatientClinicalRealtimeBridge />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
