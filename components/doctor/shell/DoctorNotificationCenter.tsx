'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, Check, FlaskConical, MessageSquare, X } from 'lucide-react';

import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { useAcknowledgeNotification, useNotificationsFeed } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const CATEGORY_ICON = {
  EMERGENCY: AlertTriangle,
  CRITICAL_LAB: FlaskConical,
  OT: Bell,
  PATIENT_MSG: MessageSquare,
  ALL: Bell,
} as const;

const CATEGORY_STYLE = {
  EMERGENCY: 'border-l-[#EF4444] bg-red-50/50',
  CRITICAL_LAB: 'border-l-[#F59E0B] bg-amber-50/50',
  OT: 'border-l-[#A39E75] bg-[#F7F6E8]',
  PATIENT_MSG: 'border-l-[#C7C39E] bg-white',
  ALL: 'border-l-[#C7C39E]',
} as const;

export default function DoctorNotificationCenter() {
  const { notifOpen, setNotifOpen } = useDoctorShell();
  const { data } = useNotificationsFeed();
  const ack = useAcknowledgeNotification();
  const notifications = data?.notifications ?? [];

  if (!notifOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-[#2B2A22]/30 backdrop-blur-sm"
        onClick={() => setNotifOpen(false)}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-[85] flex h-full w-full max-w-md flex-col border-l border-[#E6E3C5] bg-[#FAFAF5]/98 shadow-2xl backdrop-blur-xl"
        aria-label="Notification center"
      >
        <div className="flex items-center justify-between border-b border-[#E6E3C5] px-4 py-4">
          <div>
            <p className="text-lg font-bold text-[#2B2A22]">Notification Center</p>
            <p className="text-xs text-[#5C5A4E]">Real-time · Hospital · Lab · Patient · ER</p>
          </div>
          <button
            type="button"
            onClick={() => setNotifOpen(false)}
            className="rounded-lg p-2 hover:bg-[#E6E3C5]/50"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
          {notifications.length === 0 && (
            <div className={`${sageUi.card} p-8 text-center`}>
              <Bell className="mx-auto h-8 w-8 text-[#C7C39E]" />
              <p className="mt-3 text-sm font-semibold text-[#2B2A22]">All caught up</p>
              <p className="mt-1 text-xs text-[#5C5A4E]">Critical alerts and lab results appear here instantly.</p>
            </div>
          )}
          <ul className="space-y-2">
            {notifications.map((n) => {
              const Icon = CATEGORY_ICON[n.category] ?? Bell;
              const style = CATEGORY_STYLE[n.category] ?? CATEGORY_STYLE.ALL;
              return (
                <li
                  key={n.id}
                  className={`rounded-xl border border-[#E6E3C5]/80 border-l-4 p-3 ${style} ${n.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#A39E75]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#2B2A22]">{n.title}</p>
                      <p className="mt-0.5 text-xs text-[#5C5A4E]">{n.body}</p>
                      <p className="mt-1 text-[10px] text-[#5C5A4E]/80">
                        {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!n.acknowledged && (
                      <button
                        type="button"
                        onClick={() => ack.mutate(n.id)}
                        className="flex items-center gap-1 rounded-lg bg-[#A39E75]/15 px-2 py-1 text-[10px] font-bold text-[#A39E75] hover:bg-[#A39E75]/25"
                      >
                        <Check className="h-3 w-3" />
                        Acknowledge
                      </button>
                    )}
                    {n.patientId && (
                      <Link
                        href={`/doctor/patients?patient=${n.patientId}`}
                        onClick={() => setNotifOpen(false)}
                        className="rounded-lg border border-[#C7C39E] px-2 py-1 text-[10px] font-bold text-[#2B2A22] hover:bg-[#F7F6E8]"
                      >
                        Open chart
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-[#E6E3C5] p-3">
          <Link
            href="/doctor/communication?tab=alerts"
            onClick={() => setNotifOpen(false)}
            className={`${sageUi.btnSecondary} block w-full text-center`}
          >
            Open full communication hub
          </Link>
        </div>
      </aside>
    </>
  );
}
