'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { DOCTOR_SIDEBAR_NAV, isDoctorNavActive } from '@/lib/doctor/navigation';
import { nxUi } from '@/lib/doctor/design-system';

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useDoctorAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[rgba(28,27,24,0.08)] bg-white transition-[width] ${
        collapsed ? 'w-[68px]' : 'w-[248px]'
      }`}
      aria-label="Doctor workspace navigation"
    >
      <div className="border-b border-[rgba(28,27,24,0.08)] p-4">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9C9890]">Nexora</p>
              <p className="text-[14px] font-semibold text-[#1C1B18]">Doctor</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={nxUi.btnGhost + ' !p-1.5'}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {!collapsed && session && (
          <div className="mt-3 rounded-xl bg-[#F3F2ED] p-3">
            <p className="truncate text-[13px] font-semibold text-[#1C1B18]">{session.fullName}</p>
            <p className="truncate text-[11px] text-[#6B6860]">{session.specialization}</p>
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
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition ${
                    active
                      ? 'bg-[#1C1B18] font-semibold text-white'
                      : 'font-medium text-[#6B6860] hover:bg-[#F3F2ED] hover:text-[#1C1B18]'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[#9C9890]'}`} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[rgba(28,27,24,0.08)] p-3">
        <button
          type="button"
          onClick={() => {
            signOut();
            router.push('/doctor/auth/login');
          }}
          className={`${nxUi.btnGhost} w-full justify-center text-[#6B6860] hover:text-[#DC2626]`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
