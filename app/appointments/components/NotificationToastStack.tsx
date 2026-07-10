'use client';

import { Mail, MessageSquare, Smartphone, X } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import type { MockNotification, NotificationChannel } from '../types';

const CHANNEL_CONFIG: Record<
  NotificationChannel,
  { icon: typeof MessageSquare; bg: string; border: string; label: string }
> = {
  WhatsApp: {
    icon: MessageSquare,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'WhatsApp Reminder Dispatched',
  },
  SMS: {
    icon: Smartphone,
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    label: 'SMS Sent',
  },
  Email: {
    icon: Mail,
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    label: 'Email Notification Sent',
  },
};

function NotificationCard({ n, onDismiss }: { n: MockNotification; onDismiss: () => void }) {
  const config = CHANNEL_CONFIG[n.channel];
  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border p-3 shadow-lg animate-fadeIn ${config.border} ${config.bg}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
          {config.label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-800">{n.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-slate-800 hover:bg-white/60"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function NotificationToastStack() {
  const { notifications, dismissNotification } = useAppointments();

  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {notifications.map((n) => (
        <NotificationCard key={n.id} n={n} onDismiss={() => dismissNotification(n.id)} />
      ))}
    </div>
  );
}
