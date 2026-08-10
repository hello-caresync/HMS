'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { PatientSidebar } from '@/components/patient/Sidebar';
import { OpdRealtimeBridge } from '@/components/patient/OpdRealtimeBridge';
import { PatientRealtimeSync } from '@/lib/realtime/RealtimeSyncProvider';
import {
  PATIENT_BRAND,
  PATIENT_NAV_ITEMS,
  isPatientNavActive,
  patientMobilePrimaryNav,
} from '@/lib/patient/navigation';
import { patientClasses } from '@/lib/patient/theme';

type PatientShellProps = {
  children: ReactNode;
};

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const BrandIcon = PATIENT_BRAND.icon;
  const mobileNav = patientMobilePrimaryNav();
  const activeItem = PATIENT_NAV_ITEMS.find((item) => isPatientNavActive(pathname, item.href));

  return (
    <div className={`min-h-screen w-full ${patientClasses.canvas}`}>
      <OpdRealtimeBridge />
      <PatientRealtimeSync />
      <PatientSidebar />

      <div className="flex min-h-screen min-w-0 flex-col md:ml-64">
        <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-8 ${patientClasses.topBar}`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white md:text-base">{activeItem?.label ?? 'Nexora Patient'}</p>
            <p className="hidden truncate text-xs text-patient-ivory-soft/90 md:block">{activeItem?.description ?? 'Clinical digital health companion'}</p>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <div className="rounded-lg bg-white/10 p-2 text-white">
              <BrandIcon className="h-4 w-4" aria-hidden />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-patient-canvas p-4 pb-24 md:p-8 md:pb-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-patient-lavender/30 bg-patient-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          aria-label="Primary patient navigation"
        >
          <ul className="grid gap-0" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
            {mobileNav.map(({ label, href, icon: Icon }) => {
              const active = isPatientNavActive(pathname, href);
              const short = label.split(' ')[0];
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold ${
                      active ? 'text-patient-primary' : 'text-patient-lavender'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="truncate">{short}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
