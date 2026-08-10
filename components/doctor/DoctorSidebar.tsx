'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Patient OPD Queue', href: '/doctor/queue', icon: Users },
  { label: 'Medical Records', href: '/doctor/records', icon: ClipboardList },
  { label: 'Messages', href: '/doctor/messages', icon: MessageSquare },
  { label: 'Schedule & Slots', href: '/doctor/schedule', icon: CalendarDays },
  { label: 'Profile & Settings', href: '/doctor/profile', icon: Settings },
] as const;

type DoctorSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
};

export function DoctorSidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: DoctorSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#2C243B]/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`doctor-glass-plum fixed inset-y-0 left-0 z-50 flex flex-col rounded-r-[2rem] border-y-0 border-l-0 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-[#BDE2F5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.18),4px_4px_10px_rgba(44,36,59,0.28)]">
              <Stethoscope className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-black tracking-wide">NEXORA DOCTOR</p>
                <p className="text-[10px] font-bold text-[#BDE2F5]">Regal Hospital</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden rounded-lg p-2 text-[#BDE2F5] hover:bg-white/10 lg:inline-flex"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto mt-3 hidden rounded-lg p-2 text-[#BDE2F5] hover:bg-white/10 lg:inline-flex"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-1.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onCloseMobile}
                    title={collapsed ? label : undefined}
                    className={`flex items-center rounded-2xl py-3 text-sm font-bold transition-all duration-200 active:scale-95 ${
                      collapsed ? 'justify-center px-2' : 'gap-3 px-4'
                    } ${
                      active
                        ? 'border border-white/25 bg-white/15 text-white shadow-[inset_2px_2px_6px_rgba(255,255,255,0.16),0_0_20px_rgba(189,226,245,0.28)]'
                        : 'text-[#BDE2F5]/85 hover:bg-[#93688E]/30 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#BDE2F5]' : ''}`} />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#93688E] text-xs font-black">
              RH
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-black">Clinical Workstation</p>
                <p className="text-[10px] text-[#BDE2F5]">Encrypted session</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
