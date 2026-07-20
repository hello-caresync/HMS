'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  CalendarClock,
  FolderHeart,
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Stethoscope,
  Video,
} from 'lucide-react';

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  title: string;
  links: NavLink[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'clinical-operations',
    title: 'Clinical Operations',
    links: [
      { label: 'Dashboard Home', href: '/doctor/dashboard', icon: LayoutDashboard },
      { label: 'Patient Scheduler', href: '/doctor/scheduler', icon: CalendarClock },
      { label: 'Active Consultation Desk', href: '/doctor/consultation', icon: Stethoscope },
      { label: 'Historical EMR Vault', href: '/doctor/emr-vault', icon: FolderHeart },
    ],
  },
  {
    id: 'diagnostics-interventions',
    title: 'Diagnostics & Interventions',
    links: [
      { label: 'Laboratory Analytics', href: '/doctor/labs', icon: ShieldAlert },
      { label: 'Radiology Imaging Suite', href: '/doctor/radiology', icon: Layers },
      { label: 'Surgical Theatre Log', href: '/doctor/surgeries', icon: Activity },
      { label: 'Telemedicine Terminal', href: '/doctor/telehealth', icon: Video },
    ],
  },
];

const LEGACY_PATH_ALIASES: Record<string, string[]> = {
  '/doctor/dashboard': ['/doctor/dashboard', '/dashboard'],
  '/doctor/scheduler': ['/doctor/scheduler', '/dashboard/appointments'],
  '/doctor/consultation': ['/doctor/consultation', '/dashboard/consultation'],
  '/doctor/emr-vault': ['/doctor/emr-vault', '/dashboard/emr'],
  '/doctor/labs': ['/doctor/labs', '/dashboard/laboratory'],
  '/doctor/radiology': ['/doctor/radiology', '/dashboard/radiology'],
  '/doctor/surgeries': ['/doctor/surgeries', '/dashboard/surgery'],
  '/doctor/telehealth': ['/doctor/telehealth', '/dashboard/telemedicine'],
};

function isNavLinkActive(pathname: string, href: string): boolean {
  const aliases = LEGACY_PATH_ALIASES[href] ?? [href];
  return aliases.some(
    (alias) => pathname === alias || pathname === `${alias}/` || pathname.startsWith(`${alias}/`),
  );
}

type DoctorPortalLayoutProps = {
  children: ReactNode;
};

export default function DoctorPortalLayout({ children }: DoctorPortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleTerminateSession = () => {
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#00758C]/[0.02]">
      <aside
        className="flex min-h-screen w-[280px] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white shadow-sm"
        aria-label="Doctor portal navigation"
      >
        <div>
          <div className="border-b border-slate-200/80 p-6">
            <span className="block text-lg font-black uppercase tracking-wider text-[#00758C]">
              NEXORA CLINICAL
            </span>
            <div className="mt-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">Dr. Aishwarya D S, MD</p>
              <span className="mt-1.5 block w-fit rounded-md border border-[#008588]/20 bg-[#008588]/5 px-2 py-0.5 text-[10px] font-black tracking-widest text-[#008588]">
                REG_NEX_MD_9021
              </span>
            </div>
          </div>

          <nav className="custom-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto px-3 py-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-2 mt-4 block text-[11px] font-black uppercase tracking-wider text-[#00A481]">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.links.map(({ label, href, icon: Icon }) => {
                    const active = isNavLinkActive(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={
                            active
                              ? 'flex items-center gap-2.5 border-l-4 border-[#008588] bg-gradient-to-r from-[#008588]/10 to-transparent py-2 pl-4 pr-3 text-sm font-black text-[#008588] shadow-sm transition-all'
                              : 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50/60 hover:text-[#00758C]'
                          }
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-[#008588]' : 'text-slate-400'
                            }`}
                            aria-hidden
                          />
                          <span className="leading-snug">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-200/80 p-4">
          <button
            type="button"
            onClick={handleTerminateSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Terminate Session
          </button>
        </div>
      </aside>

      <main className="min-h-screen w-full flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
