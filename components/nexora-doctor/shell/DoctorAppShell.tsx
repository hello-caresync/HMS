'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { DoctorAuthGuard, DoctorAuthProvider } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorClinicalInit } from '@/lib/nexora-doctor/hooks';

import { DoctorSidebar } from './DoctorSidebar';
import { DoctorTopBar } from './DoctorTopBar';

function ClinicalBootstrap({ children }: { children: ReactNode }) {
  useDoctorClinicalInit();
  return <>{children}</>;
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
            <div className="flex h-screen overflow-hidden bg-slate-50">
              <div className="hidden lg:block">
                <DoctorSidebar />
              </div>

              {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                  <button
                    type="button"
                    className="absolute inset-0 bg-slate-900/40"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close menu"
                  />
                  <div className="relative z-50 h-full w-64 shadow-xl">
                    <DoctorSidebar />
                  </div>
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col">
                <DoctorTopBar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
              </div>
            </div>
          )}
          <Toaster position="top-right" richColors closeButton />
        </ClinicalBootstrap>
      </DoctorAuthGuard>
    </DoctorAuthProvider>
  );
}

export default DoctorAppShell;
