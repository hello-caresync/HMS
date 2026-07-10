'use client';

import { BarChart3, Clock, Mail, MessageSquare, Smartphone, UserX } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import type { CommunicationLog, NotificationChannel } from '../types';

const CHANNEL_ICONS: Record<NotificationChannel, typeof MessageSquare> = {
  WhatsApp: MessageSquare,
  SMS: Smartphone,
  Email: Mail,
};

const CHANNEL_COLORS: Record<NotificationChannel, string> = {
  WhatsApp: 'bg-emerald-600',
  SMS: 'bg-sky-600',
  Email: 'bg-violet-600',
};

function AnalyticsMeter({
  label,
  value,
  suffix,
  max,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  suffix?: string;
  max: number;
  icon: typeof BarChart3;
  colorClass: string;
}) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
          <Icon className={`h-3 w-3 ${colorClass}`} />
          {label}
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-slate-900">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CommLogItem({ log }: { log: CommunicationLog }) {
  const Icon = CHANNEL_ICONS[log.channel];
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(log.timestamp));

  return (
    <li className="flex gap-2.5 rounded-lg border-2 border-slate-200 bg-slate-50/50 px-3 py-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${CHANNEL_COLORS[log.channel]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-snug text-slate-900">
          <span className="font-semibold text-slate-900">{log.message}</span>
          {' '}to{' '}
          <span className="font-medium">{log.patientName}</span>
          {log.slotTime && (
            <span className="text-slate-800"> for {log.slotTime} slot</span>
          )}
          {' '}via {log.channel}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[9px] text-slate-800">{time}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
              log.deliveryStatus === 'Delivered'
                ? 'bg-emerald-100 text-emerald-700'
                : log.deliveryStatus === 'Pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
            }`}
          >
            {log.deliveryStatus}
          </span>
        </div>
      </div>
    </li>
  );
}

export default function CommunicationsSidebar() {
  const { communicationLogs, analytics } = useAppointments();

  return (
    <aside className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-xs lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)]">
      {/* Analytics Summary */}
      <section className="border-b-2 border-slate-200 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <BarChart3 className="h-4 w-4 text-primary" />
          Appointment Analytics
        </h2>
        <div className="space-y-2">
          <AnalyticsMeter
            label="Today's Bookings"
            value={analytics.totalBookings}
            max={20}
            icon={BarChart3}
            colorClass="text-primary"
          />
          <AnalyticsMeter
            label="Avg Wait Time"
            value={analytics.averageWaitMinutes}
            suffix="m"
            max={45}
            icon={Clock}
            colorClass="text-amber-500"
          />
          <AnalyticsMeter
            label="No-Show Rate"
            value={analytics.noShowRatePercent}
            suffix="%"
            max={100}
            icon={UserX}
            colorClass="text-rose-500"
          />
        </div>
      </section>

      {/* Communication Logs */}
      <section className="flex min-h-0 flex-1 flex-col p-4">
        <h2 className="mb-2 text-sm font-bold text-slate-900">Communication Reminders</h2>
        <p className="mb-3 text-[10px] text-slate-800">Automated lifecycle notifications feed</p>

        <ul className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
          {communicationLogs.map((log) => (
            <CommLogItem key={log.id} log={log} />
          ))}
        </ul>
      </section>
    </aside>
  );
}
