'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';

import { DOCTOR_SIDEBAR_NAV, isDoctorNavActive } from '@/lib/doctor/navigation';
import { MOCK_DOCTOR } from '@/lib/doctor/mock-data';
import { clinicalClasses } from '@/lib/doctor/theme';

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200/80 bg-white transition-[width] ${
        collapsed ? 'w-[72px]' : 'w-[280px]'
      }`}
      aria-label="Nexora Doctor App navigation"
    >
      <div className={`${clinicalClasses.sidebarBrand} p-4`}>
        <div className="flex items-center justify-between gap-2">
          {!collapsed && <span className="text-sm font-bold tracking-wide">Nexora Doctor</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg border border-white/20 p-1.5 text-white/80 hover:bg-white/10"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {!collapsed && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-semibold">{MOCK_DOCTOR.name}</p>
            <p className="text-xs text-slate-300">{MOCK_DOCTOR.specialization}</p>
            <span className="mt-2 inline-block rounded-md bg-[#0D9488]/20 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
              {MOCK_DOCTOR.regId}
            </span>
          </div>
        )}
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {DOCTOR_SIDEBAR_NAV.map(({ label, href, icon: Icon }) => {
            const active = isDoctorNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 ${
                    active ? clinicalClasses.navActive : 'font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#0D9488]' : 'text-slate-400'}`} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={() => router.push('/doctor/auth/login')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#64748B] hover:border-[#EF4444]/30 hover:text-[#EF4444]"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
