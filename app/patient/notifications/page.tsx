'use client';

import React from 'react';
import { BellOff, CheckCheck, Clock, Hospital, Loader2, Stethoscope } from 'lucide-react';

import { useEcosystemMessaging } from '@/lib/ecosystem/use-ecosystem-messaging';
import { resolveActivePatientId } from '@/lib/clinical/bridge';

export default function NotificationsPage() {
  const patientId = resolveActivePatientId();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useEcosystemMessaging({
    app: 'patient',
    recipientId: patientId,
    toastOnInsert: false,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1A332F]">Notifications</h1>
          <p className="mt-1 text-sm font-semibold text-[#7BA89E]">
            {notifications.length === 0
              ? 'No notifications · listening for Regal Hospital broadcasts'
              : `${unreadCount} unread · live updates from hospital & doctor apps`}
          </p>
        </div>

        {notifications.length > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex items-center gap-2 rounded-full border border-[#BDE2F5] bg-white px-4 py-2 text-xs font-bold text-[#1A332F] shadow-sm transition hover:bg-[#DAF0EB]"
          >
            <CheckCheck className="h-4 w-4 text-[#BDE2F5]" />
            Mark all read
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-[#D5E8E3] bg-white p-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
          <span className="text-xs font-black text-[#113831]">Syncing ecosystem messages…</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#CEB2C0] bg-white/60 p-12 text-center backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3B8C7E]/10 text-[#3B8C7E]">
            <BellOff className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#1A332F]">All clear</h3>
          <p className="mt-1 max-w-sm text-xs font-medium text-[#7BA89E]">
            Hospital broadcasts, queue updates, and doctor alerts stream here instantly via Supabase Realtime.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`relative flex items-start justify-between rounded-2xl border p-5 shadow-sm transition-all ${
                item.is_read
                  ? 'border-slate-200 bg-white/70 opacity-75'
                  : 'border-[#BDE2F5] bg-white shadow-md'
              }`}
            >
              <div className="flex gap-4">
                <div className="mt-1">
                  {item.sender_role?.includes('doctor') ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DAF0EB] text-[#3B8C7E]">
                      <Hospital className="h-5 w-5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#1A332F]">{item.title}</h4>
                    {!item.is_read ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#7BA89E]">{item.message}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('en-IN')
                        : 'Just now'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{item.category ?? 'general'}</span>
                  </div>
                </div>
              </div>

              {!item.is_read ? (
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className="shrink-0 text-xs font-bold text-[#7BA89E] hover:text-[#3B8C7E] hover:underline"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
