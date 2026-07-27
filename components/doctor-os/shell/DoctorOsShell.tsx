'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { DoctorAuthGuard, DoctorAuthProvider } from '@/lib/doctor/auth/DoctorAuthProvider';
import DoctorProviders from '@/components/doctor/DoctorProviders';
import DoctorAiCopilot from '@/components/doctor/shell/DoctorAiCopilot';
import DoctorCommandPalette from '@/components/doctor/shell/DoctorCommandPalette';
import DoctorNotificationCenter from '@/components/doctor/shell/DoctorNotificationCenter';
import { DoctorShellProvider } from '@/components/doctor/shell/DoctorShellContext';
import DoctorOsFab from '@/components/doctor-os/shell/DoctorOsFab';
import DoctorOsSidebar from '@/components/doctor-os/shell/DoctorOsSidebar';
import DoctorOsTopBar from '@/components/doctor-os/shell/DoctorOsTopBar';
import { useDoctorOsStore, useOsColors } from '@/lib/doctor-os/store';

function OsShellInner({ children }: { children: ReactNode }) {
  const c = useOsColors();
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/doctor/auth');
  const showFab = !isAuth && !pathname?.includes('/clinical');

  if (isAuth) {
    return <div className="min-h-screen" style={{ backgroundColor: c.bg, color: c.text }}>{children}</div>;
  }

  return (
    <DoctorShellProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAF5] text-[#2B2A22]">
        <DoctorOsSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DoctorOsTopBar />
          <main className="custom-scrollbar flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
        {showFab && <DoctorOsFab />}
        <DoctorCommandPalette />
        <DoctorNotificationCenter />
        <DoctorAiCopilot />
      </div>
    </DoctorShellProvider>
  );
}

export default function DoctorOsShell({ children }: { children: ReactNode }) {
  return (
    <DoctorProviders>
      <DoctorAuthProvider>
        <DoctorAuthGuard>
          <OsShellInner>{children}</OsShellInner>
        </DoctorAuthGuard>
      </DoctorAuthProvider>
    </DoctorProviders>
  );
}
