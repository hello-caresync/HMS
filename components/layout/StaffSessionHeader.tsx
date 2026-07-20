'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Clock, LogOut, Search, Shield } from 'lucide-react';

import { useAuth } from '@/app/context/AuthProvider';
import { formatRoleBadge, ROLE_LABELS } from '@/app/lib/auth';

type StaffSessionHeaderProps = {
  moduleTitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
};

function formatShiftClock(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function formatShiftDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function StaffSessionHeader({
  moduleTitle = 'Nexora Hospital ERP',
  showSearch = true,
  searchPlaceholder = 'Search UHID, employee, invoice…',
}: StaffSessionHeaderProps) {
  const { session, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const displayName = session?.displayName ?? 'Staff User';
  const role = session?.role;
  const roleBadge = role
    ? formatRoleBadge(role, session?.shiftLabel)
    : 'Unassigned Role';
  const department = session?.department ?? '—';
  const authMethodLabel =
    session?.authMethod === 'biometric'
      ? 'Smart-Card'
      : session?.authMethod === 'smart_card'
        ? 'Smart-Card'
        : 'Password';

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b-2 border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="flex h-[3.25rem] items-center gap-3 px-4 sm:px-5">
        <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-800">
              {moduleTitle}
            </p>
            <p className="truncate text-[10px] text-slate-800">Internal Back-Office Console</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Facility Online
          </span>
        </div>

        {showSearch && (
          <div className="relative mx-auto hidden min-w-0 max-w-md flex-1 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-800" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              aria-label="Global search"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-right xl:block">
            <div className="flex items-center justify-end gap-1.5">
              <Clock className="h-3 w-3 text-sky-600" />
              <p className="font-mono text-[11px] font-bold tabular-nums text-slate-800">
                {formatShiftClock(now)}
              </p>
            </div>
            <p className="text-[9px] text-slate-800">{formatShiftDate(now)} · IST Shift</p>
          </div>

          <div className="hidden min-w-0 max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 md:block">
            <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
            <p className="truncate text-[10px] text-slate-800">{department}</p>
          </div>

          <div
            className="hidden items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 sm:flex"
            title={role ? ROLE_LABELS[role] : undefined}
          >
            <Shield className="h-3 w-3 shrink-0 text-sky-700" />
            <span className="max-w-[160px] truncate text-[10px] font-bold uppercase tracking-wide text-sky-800">
              {roleBadge}
            </span>
          </div>

          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-bold text-white ring-2 ring-white shadow-sm"
            title={`${displayName} · ${authMethodLabel} auth`}
          >
            {initials(displayName)}
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg p-2 text-slate-800 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
