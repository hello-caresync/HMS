'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { OpdRealtimeBridge } from '@/components/patient/OpdRealtimeBridge';
import { PatientRealtimeSync } from '@/lib/realtime/RealtimeSyncProvider';
import {
  PATIENT_BRAND,
  PATIENT_NAV_ITEMS,
  isPatientNavActive,
  patientMobilePrimaryNav,
} from '@/lib/patient/navigation';
import { patientClasses } from '@/lib/patient/theme';
import { usePatientAppStore } from '@/lib/patient/store/patient-app-store';

type PatientShellProps = {
  children: ReactNode;
};

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const activeProfile = usePatientAppStore((s) => s.activeProfile);
  const BrandIcon = PATIENT_BRAND.icon;
  const mobileNav = patientMobilePrimaryNav();
  const activeItem = PATIENT_NAV_ITEMS.find((item) => isPatientNavActive(pathname, item.href));

  return (
    <div className={`min-h-screen w-full ${patientClasses.canvas}`}>
      <OpdRealtimeBridge />
      <PatientRealtimeSync />
      <aside
        className={`fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col overflow-hidden shadow-xl md:flex ${patientClasses.navShell}`}
        aria-label="Patient portal navigation"
      >
        <div className="shrink-0 border-b border-white/10 px-4 pb-3 pt-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/10 p-1.5 text-white">
              <BrandIcon className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-sm font-bold tracking-wider text-white">{PATIENT_BRAND.name}</span>
          </div>
          <div className="mt-2 rounded-xl border border-white/15 bg-white/5 p-2.5">
            <p className="text-xs font-semibold text-white">{activeProfile.displayName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                {activeProfile.mrn.replace(/^ID_/, 'ID: ')}
              </span>
              {activeProfile.abdmHealthId ? (
                <span className="inline-flex rounded border border-white/20 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/85">
                  {activeProfile.abdmHealthId}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          <ul className="space-y-0.5">
            {PATIENT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isPatientNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`group flex min-w-0 items-center gap-2.5 rounded-xl py-2 pl-3 pr-2 text-sm transition-all ${
                      active ? patientClasses.navActive : patientClasses.navIdle
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col md:ml-64">
        <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-8 ${patientClasses.topBar}`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white md:text-base">{activeItem?.label ?? 'Nexora Patient'}</p>
            <p className="hidden truncate text-xs text-patient-ivory-soft/90 md:block">{activeItem?.description ?? 'Luxury digital health companion'}</p>
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
          <ul className={`grid gap-0`} style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
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
