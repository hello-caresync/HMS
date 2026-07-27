'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Building2,
  Command,
  Moon,
  Search,
  Sun,
  User,
  Zap,
} from 'lucide-react';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { useNotificationsFeed, useOpdQueue } from '@/lib/doctor/hooks/useClinicalQueries';
import { useDoctorOsStore, useOsColors } from '@/lib/doctor-os/store';

export default function DoctorOsTopBar() {
  const c = useOsColors();
  const { session } = useDoctorAuth();
  const { toggleCommand, toggleNotif, toggleAi, setCommandOpen } = useDoctorShell();
  const toggleTheme = useDoctorOsStore((s) => s.toggleTheme);
  const theme = useDoctorOsStore((s) => s.theme);
  const hospitalName = useDoctorOsStore((s) => s.hospitalName);
  const { data: notifs } = useNotificationsFeed();
  const { data: queue } = useOpdQueue();
  const unread = (notifs?.notifications ?? []).filter((n) => !n.acknowledged).length;
  const qLen = queue?.queue?.length ?? 0;

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-xl lg:px-6"
      style={{ backgroundColor: c.glass, borderColor: c.border }}
    >
      <button
        type="button"
        onClick={toggleCommand}
        className="flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition"
        style={{ borderColor: c.border, backgroundColor: c.surface, color: c.textSecondary }}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search patients, orders, actions…</span>
        <kbd className="ml-auto hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:inline" style={{ backgroundColor: c.muted }}>
          ⌘K
        </kbd>
      </button>

      {qLen > 0 && (
        <Link
          href="/doctor/care-center"
          className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold sm:flex"
          style={{ backgroundColor: `${c.success}18`, color: c.success }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: c.success }} />
          {qLen} in queue
        </Link>
      )}

      <Link
        href="/doctor/emergency"
        className="rounded-xl p-2 transition hover:opacity-80"
        style={{ backgroundColor: `${c.critical}15`, color: c.critical }}
        title="Emergency"
      >
        <AlertTriangle className="h-4 w-4" />
      </Link>

      <button type="button" onClick={toggleAi} className="rounded-xl p-2" style={{ color: c.textSecondary }} title="AI">
        <Zap className="h-4 w-4" />
      </button>

      <button type="button" onClick={toggleNotif} className="relative rounded-xl p-2" style={{ color: c.textSecondary }}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white" style={{ backgroundColor: c.critical }}>
            {unread}
          </span>
        )}
      </button>

      <button type="button" onClick={toggleTheme} className="rounded-xl p-2" style={{ color: c.textSecondary }} title="Theme">
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <button type="button" onClick={() => setCommandOpen(true)} className="hidden rounded-xl p-2 lg:block" style={{ color: c.textSecondary }} title="Command palette">
        <Command className="h-4 w-4" />
      </button>

      <Link href="/doctor/settings" className="flex items-center gap-2 rounded-xl border px-2 py-1.5" style={{ borderColor: c.border }}>
        <span className="hidden h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white sm:flex" style={{ backgroundColor: c.accent }}>
          {session?.fullName?.charAt(0) ?? 'D'}
        </span>
        <User className="h-4 w-4 sm:hidden" style={{ color: c.textSecondary }} />
      </Link>
    </header>
  );
}
