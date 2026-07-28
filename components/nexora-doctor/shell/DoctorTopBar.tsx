'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

export function DoctorTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { session } = useDoctorAuth();
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search patients, appointments…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/doctor/communication"
          className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <Link
          href="/doctor/profile"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
            {session?.fullName?.charAt(3) ?? 'D'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{session?.fullName ?? 'Doctor'}</p>
            <p className="text-xs text-slate-500">{session?.specialization?.split('·')[0]?.trim()}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
