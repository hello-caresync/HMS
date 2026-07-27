'use client';

import Link from 'next/link';
import { Bell, Bot, Search, Stethoscope } from 'lucide-react';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { useNotificationsFeed, useOpdQueue } from '@/lib/doctor/hooks/useClinicalQueries';
import { nxUi } from '@/lib/doctor/design-system';

export default function DoctorTopBar() {
  const { toggleCommand, toggleAi, toggleNotif } = useDoctorShell();
  const { session } = useDoctorAuth();
  const { data: notifData } = useNotificationsFeed();
  const { data: queueData } = useOpdQueue();

  const unread = (notifData?.notifications ?? []).filter((n) => !n.acknowledged).length;
  const queueCount = queueData?.queue?.length ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(28,27,24,0.08)] bg-[#F8F7F4]/90 px-4 py-2.5 backdrop-blur-xl lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7A7558]">Nexora · Doctor</p>
            <p className="truncate text-[13px] font-semibold text-[#1C1B18]">
              {session?.fullName ?? 'Consultant'}
              <span className="font-normal text-[#9C9890]"> · {session?.specialization ?? '—'}</span>
            </p>
          </div>
          {queueCount > 0 && (
            <Link href="/doctor/care-center" className={nxUi.chipLive + ' hidden md:inline-flex'}>
              {queueCount} in OPD queue
            </Link>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:max-w-lg">
          <button
            type="button"
            onClick={toggleCommand}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[rgba(28,27,24,0.1)] bg-white px-3 py-2 text-left text-[13px] text-[#9C9890] shadow-sm transition hover:border-[rgba(28,27,24,0.18)]"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Search patients, actions…</span>
            <kbd className="ml-auto hidden rounded border border-[rgba(28,27,24,0.08)] bg-[#F3F2ED] px-1.5 py-0.5 text-[10px] font-semibold lg:inline">
              ⌘K
            </kbd>
          </button>

          <button type="button" onClick={toggleAi} className={nxUi.btnGhost + ' !p-2.5'} aria-label="AI Copilot">
            <Bot className="h-4 w-4" />
          </button>

          <button type="button" onClick={toggleNotif} className={`${nxUi.btnGhost} relative !p-2.5`} aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          <Link href="/doctor/care-center" className={nxUi.btnPrimary + ' hidden sm:inline-flex'}>
            <Stethoscope className="h-4 w-4" aria-hidden />
            Care Center
          </Link>
        </div>
      </div>
    </header>
  );
}
