'use client';

import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import { useState } from 'react';

import { useEcosystemMessaging } from '@/lib/ecosystem/use-ecosystem-messaging';
import type { EcosystemApp } from '@/lib/ecosystem/messaging-service';

type EcosystemNotificationBellProps = {
  app: EcosystemApp;
  recipientId?: string;
  className?: string;
  panelClassName?: string;
};

export function EcosystemNotificationBell({
  app,
  recipientId,
  className = '',
  panelClassName = '',
}: EcosystemNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useEcosystemMessaging({
    app,
    recipientId,
    toastOnInsert: !open,
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${className}`}
        aria-label="Ecosystem notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${panelClassName}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-900">Ecosystem Alerts</p>
                <p className="text-[10px] font-semibold text-slate-500">
                  {unreadCount} unread · live from Regal Hospital
                </p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50"
                    aria-label="Mark all read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing notifications…
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs font-medium text-slate-500">
                  No messages yet. Hospital broadcasts will appear here instantly.
                </p>
              ) : (
                notifications.slice(0, 20).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void markRead(item.id)}
                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      item.is_read ? 'opacity-70' : 'bg-teal-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-black text-slate-900">{item.title}</p>
                      {!item.is_read ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-600">{item.message}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.category} · {item.priority}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
