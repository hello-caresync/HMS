'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  PATIENT_BRAND,
  PATIENT_NAV_ITEMS,
  isPatientNavActive,
  patientMobilePrimaryNav,
} from '@/lib/patient/navigation';
import { usePatientAppStore } from '@/lib/patient/store/patient-app-store';

type PatientShellProps = {
  children: ReactNode;
};

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const activeProfile = usePatientAppStore((s) => s.activeProfile);
  const BrandIcon = PATIENT_BRAND.icon;
  const mobileNav = patientMobilePrimaryNav();

  return (
    <div className="min-h-screen w-full bg-[#faf6f7]">
      <aside
        className="fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col overflow-hidden bg-[#f47c8c] shadow-lg md:flex"
        aria-label="Patient portal navigation"
      >
        <div className="shrink-0 border-b border-white/15 px-4 pb-3 pt-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/15 p-1.5 text-white">
              <BrandIcon className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-sm font-bold tracking-wider text-white">{PATIENT_BRAND.name}</span>
          </div>
          <div className="mt-2 rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
            <p className="text-xs font-semibold text-white">{activeProfile.displayName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-[0.85]">
                {activeProfile.mrn.replace(/^ID_/, 'ID: ')}
              </span>
              {activeProfile.abdmHealthId ? (
                <span className="inline-flex rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white opacity-[0.85]">
                  {activeProfile.abdmHealthId}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          <ul className="space-y-1">
            {PATIENT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isPatientNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`group flex min-w-0 items-center gap-2.5 rounded-xl py-2.5 pl-3 pr-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-white font-black text-[#8c2b39] shadow-md'
                        : 'text-white/85 hover:bg-white/10'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-[#8c2b39]' : 'text-white/85'}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col md:ml-64">
        <header className="flex items-center justify-between border-b border-[#f0d8dc] bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#f47c8c] p-2 text-white">
              <BrandIcon className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-black text-[#8c2b39]">{PATIENT_BRAND.name}</p>
              <p className="text-[10px] font-bold text-[#736366]">{activeProfile.displayName}</p>
            </div>
          </div>
          <Link
            href="/patient/emergency"
            className="rounded-lg bg-[#e63946] px-3 py-1.5 text-[10px] font-black uppercase text-white"
          >
            SOS
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#faf6f7] p-4 pb-24 md:p-8 md:pb-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f0d8dc] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          aria-label="Primary patient navigation"
        >
          <ul className="grid grid-cols-5 gap-0">
            {mobileNav.map(({ label, href, icon: Icon }) => {
              const active = isPatientNavActive(pathname, href);
              const short = label.split(' ')[0];
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold ${
                      active ? 'text-[#f47c8c]' : 'text-[#736366]'
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
