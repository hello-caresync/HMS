'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { HOSPITAL_COLORS } from '@/lib/nexora-hospital/design-tokens';
import { isHospitalShellRoute } from '@/lib/nexora-hospital/navigation';
import { useHospitalInit } from '@/lib/nexora-hospital/hooks';
import { HospitalSyncProvider } from '@/lib/nexora-hospital/HospitalSyncProvider';

import { GlobalSearchPalette } from './GlobalSearchPalette';
import { HospitalSidebar } from './HospitalSidebar';
import { HospitalTopBar } from './HospitalTopBar';

function HospitalBootstrap({ children }: { children: ReactNode }) {
  useHospitalInit();
  return (
    <>
      <HospitalSyncProvider />
      {children}
    </>
  );
}

export function HospitalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const useShell = isHospitalShellRoute(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!useShell) return <>{children}</>;

  return (
    <HospitalBootstrap>
      <div className="min-h-screen bg-[#F0F8F9]" style={{ backgroundColor: HOSPITAL_COLORS.pageBg }}>
        <HospitalSidebar />

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            />
            <div className="relative z-50 h-full w-64 shadow-2xl">
              <HospitalSidebar mobile onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-h-screen flex-col pl-0 lg:pl-64">
          <HospitalTopBar onMenuClick={() => setSidebarOpen(true)} />
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
            style={{ backgroundColor: HOSPITAL_COLORS.pageBg }}
          >
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" closeButton />
      <GlobalSearchPalette />
    </HospitalBootstrap>
  );
}

export default HospitalAppShell;
