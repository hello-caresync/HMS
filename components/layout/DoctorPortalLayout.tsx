'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import DoctorProviders from '@/components/doctor/DoctorProviders';
import DoctorSidebar from '@/components/doctor/sidebar';
import { clinicalClasses } from '@/lib/doctor/theme';

export default function DoctorPortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/doctor/auth');

  if (isAuthRoute) {
    return (
      <DoctorProviders>
        <div className={`min-h-screen ${clinicalClasses.pageBg}`}>{children}</div>
      </DoctorProviders>
    );
  }

  return (
    <DoctorProviders>
      <div className={`flex h-screen w-full overflow-hidden ${clinicalClasses.pageBg}`}>
        <DoctorSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </DoctorProviders>
  );
}
