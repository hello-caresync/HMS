'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { DoctorAuthGuard, DoctorAuthProvider } from '@/lib/doctor/auth/DoctorAuthProvider';
import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { useDoctorClinicalInit } from '@/lib/nexora-doctor/hooks';
import { DoctorRealtimeSync } from '@/lib/realtime/RealtimeSyncProvider';

import { DoctorSidebar } from './DoctorSidebar';
import { DoctorTopBar } from './DoctorTopBar';

function ClinicalBootstrap({ children }: { children: ReactNode }) {
  useDoctorClinicalInit();
  return (
    <>
      <DoctorRealtimeSync />
      {children}
    </>
  );
}

export function DoctorAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/doctor/auth');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DoctorAuthProvider>
      <DoctorAuthGuard>
        <ClinicalBootstrap>
          {isAuthRoute ? (
            children
          ) : (
            <div className={doctorUi.shell}>
              <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
                <DoctorSidebar />
              </div>

              {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                  <button
                    type="button"
                    className="absolute inset-0 bg-[#1E2522]/60"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close menu"
                  />
                  <div className="relative z-50 h-full w-64 shadow-2xl">
                    <DoctorSidebar />
                  </div>
                </div>
              )}

              <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <DoctorTopBar onMenuClick={() => setSidebarOpen(true)} />
                <main className={doctorUi.mainScroll}>{children}</main>
              </div>
            </div>
          )}
          <Toaster position="top-right" closeButton />
        </ClinicalBootstrap>
      </DoctorAuthGuard>
    </DoctorAuthProvider>
  );
}

export default DoctorAppShell;
