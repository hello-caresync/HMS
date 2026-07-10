'use client';

import { Bell, LogOut, Menu, Search, UserCircle2 } from 'lucide-react';

import { useAuth } from '../../context/AuthProvider';

type DashboardTopbarProps = {
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  unreadCount: number;
};

export default function DashboardTopbar({
  onMenuClick,
  onNotificationsClick,
  unreadCount,
}: DashboardTopbarProps) {
  const { session, logout } = useAuth();

  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b-2 border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-800 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="truncate text-xs text-slate-800">{today}</p>
        </div>

        <div className="relative ml-auto flex max-w-md flex-1 items-center sm:mx-6 sm:ml-0">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-800" />
          <input
            type="search"
            placeholder="Search patients, wards, invoices…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-800 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative rounded-xl p-2.5 text-slate-800 transition hover:bg-slate-100"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
            <UserCircle2 className="h-5 w-5 text-slate-800" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {session?.email ?? 'Admin User'}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-slate-800">
                {session?.role ?? 'Hospital Admin'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="rounded-xl p-2.5 text-slate-800 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
