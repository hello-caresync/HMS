'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';

import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

export function DoctorTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { session } = useDoctorAuth();
  const notifications = useDoctorClinicalStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className={doctorUi.topBar}>
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-[#2C3531]/60 hover:bg-[#F4F6F0] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2C3531]/40" />
        <input
          type="search"
          placeholder="Search patients, appointments…"
          className="w-full rounded-xl border border-[#E2E8E0] bg-[#F4F6F0] py-2 pl-9 pr-3 text-sm text-[#2C3531] outline-none focus:border-[#7A9A8B] focus:bg-[#FAFCF8] focus:ring-2 focus:ring-[#7A9A8B]/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/doctor/notifications"
          className="relative rounded-xl p-2 text-[#2C3531]/60 transition hover:bg-[#F4F6F0] hover:text-[#2C3531]"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D96B52] px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <Link
          href="/doctor/profile"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#F4F6F0]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5F1] text-sm font-semibold text-[#7A9A8B]">
            {session?.fullName?.charAt(3) ?? 'D'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-[#2C3531]">{session?.fullName ?? 'Doctor'}</p>
            <p className="text-xs text-[#2C3531]/60">{session?.specialization?.split('·')[0]?.trim()}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
