'use client';

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Info,
  Trash2,
  X,
} from 'lucide-react';

import { formatTime } from '../lib/mockData';
import type { DashboardNotification } from '../types';

type NotificationCenterProps = {
  open: boolean;
  notifications: DashboardNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
};

function SeverityIcon({ severity }: { severity: DashboardNotification['severity'] }) {
  if (severity === 'critical') {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />;
  }
  if (severity === 'warning') {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
  }
  return <Info className="h-4 w-4 shrink-0 text-sky-500" />;
}

export default function NotificationCenter({
  open,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Slide-over panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Notification center"
      >
        <header className="flex items-center justify-between border-b-2 border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted">
              <Bell className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-800">
                {unreadCount} unread · {notifications.length} total
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-800 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b-2 border-slate-200 px-5 py-2.5">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>

        <ul className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3">
          {notifications.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-800">All caught up</p>
              <p className="text-xs text-slate-800">No system alerts at this time</p>
            </li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`mb-2 rounded-xl border px-4 py-3 transition ${
                  n.read
                    ? 'border-slate-200 bg-slate-50/50 opacity-75'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="flex gap-3">
                  <SeverityIcon severity={n.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-800">{n.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-800">
                        {n.module} · {formatTime(n.timestamp)}
                      </span>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(n.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary-muted"
                        >
                          <Check className="h-3 w-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </>
  );
}
