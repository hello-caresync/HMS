'use client';

import { Bell, LogOut, Menu, Radio } from 'lucide-react';

import type { DoctorSession } from '@/lib/doctor/session';

type DoctorTopNavProps = {
  session: DoctorSession;
  onOpenMenu: () => void;
  onLogout: () => void;
};

export function DoctorTopNav({ session, onOpenMenu, onLogout }: DoctorTopNavProps) {
  const initials = session.fullName
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <header className="doctor-glass sticky top-0 z-30 border-x-0 border-t-0 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-xl border border-[#9DA6CD]/30 p-2 text-[#894A66] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black text-[#2C243B]">Regal Hospital • Clinical Portal</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BDE2F5] bg-[#BDE2F5]/65 px-2.5 py-1 text-[10px] font-black uppercase text-[#894A66] shadow-[0_0_18px_rgba(189,226,245,0.9)]">
                <Radio className="h-3 w-3" />
                Active Consultation Room {session.opdRoom ?? '104'}
              </span>
            </div>
            <p className="truncate text-xs font-bold text-[#9887B1]">{session.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="doctor-clay hidden items-center gap-2.5 rounded-2xl px-3 py-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#93688E] to-[#894A66] text-xs font-black text-white shadow-[0_0_16px_rgba(189,226,245,0.75)]">
              {initials}
            </span>
            <span className="max-w-40 leading-tight">
              <span className="block truncate text-xs font-black text-[#2C243B]">{session.fullName}</span>
              <span className="block text-[10px] font-bold text-[#9887B1]">{session.employeeId}</span>
            </span>
          </div>
          <button
            type="button"
            className="doctor-clay-button relative border border-white/60 bg-white/70 p-2.5 text-[#93688E] hover:bg-[#BDE2F5]/40"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="doctor-clay-button inline-flex items-center gap-2 bg-[#894A66] px-3.5 py-2.5 text-xs font-black text-white hover:bg-[#93688E]"
          >
            <LogOut className="h-4 w-4 text-[#BDE2F5]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
