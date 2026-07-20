'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CreditCard,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ShieldAlert,
  TestTube,
  UserCog,
  Video,
} from 'lucide-react';

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const PATIENT_NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarDays },
  { label: 'My Health', href: '/patient/health', icon: HeartPulse },
  { label: 'Medications', href: '/patient/medications', icon: Pill },
  { label: 'Diagnostics', href: '/patient/diagnostics', icon: TestTube },
  { label: 'Billing & Insurance', href: '/patient/billing', icon: CreditCard },
  { label: 'Care & Communication', href: '/patient/communication', icon: Video },
  { label: 'Emergency & Family', href: '/patient/emergency', icon: ShieldAlert },
  { label: 'Account & Settings', href: '/patient/profile', icon: UserCog },
];

function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === '/patient/dashboard') {
    return pathname === '/patient/dashboard' || pathname === '/patient/dashboard/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type PatientLayoutProps = {
  children: ReactNode;
};

export default function PatientLayout({ children }: PatientLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#00758C]/[0.02]">
      <aside
        className="flex w-[280px] shrink-0 flex-col border-r border-[#00758C]/10 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]"
        aria-label="Patient portal navigation"
      >
        <div className="border-b border-slate-200/80 p-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#00758C] p-2.5 text-white">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-lg font-black tracking-wider text-[#00758C]">NEXORA PATIENT</span>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]">
            <p className="text-sm font-bold text-slate-900">Aishwarya D S</p>
            <span className="mt-2 inline-flex rounded border border-[#008588]/20 bg-[#008588]/5 px-2 py-0.5 text-[10px] font-bold text-[#008588]">
              ID_NEX_9021
            </span>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {PATIENT_NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = isNavLinkActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`group flex items-center gap-2.5 ${
                      active
                        ? 'rounded-r-xl border-l-4 border-[#008588] bg-gradient-to-r from-[#008588]/10 to-transparent py-2.5 pl-4 pr-3 text-sm font-black text-[#008588] shadow-sm transition-all'
                        : 'rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50/80 hover:text-[#00758C]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-[#008588]' : 'text-slate-400 group-hover:text-[#00758C]'
                      }`}
                      aria-hidden
                    />
                    <span className="leading-snug">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="min-h-screen w-full flex-1 overflow-y-auto bg-slate-50/70 p-8">
        {children}
      </main>
    </div>
  );
}
