'use client';

import { Ambulance, CheckCircle2, Clock, Loader2, Radio } from 'lucide-react';

import type { EmergencyAlert, EmergencyAlertStatus } from '@/lib/patient/emergency/rakshak-sos.service';

const STATUS_META: Record<
  EmergencyAlertStatus,
  { label: string; description: string; className: string; icon: typeof Clock }
> = {
  Pending: {
    label: 'Pending',
    description: 'Hospital desk is reviewing your emergency alert.',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
    icon: Clock,
  },
  Dispatched: {
    label: 'Dispatched',
    description: 'Response team dispatched — help is on the way.',
    className: 'border-blue-300 bg-blue-50 text-blue-900',
    icon: Ambulance,
  },
  Resolved: {
    label: 'Resolved',
    description: 'Hospital desk marked this emergency as resolved.',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
  },
};

type EmergencyTrackerCardProps = {
  alert: EmergencyAlert | null;
  loading?: boolean;
};

export function EmergencyTrackerCard({ alert, loading }: EmergencyTrackerCardProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-patient-lavender/30 bg-white p-5 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
        <p className="text-sm font-bold text-patient-lavender">Loading emergency tracker…</p>
      </div>
    );
  }

  if (!alert) return null;

  const meta = STATUS_META[alert.status];
  const StatusIcon = meta.icon;

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${meta.className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
              Live Emergency Tracker · {alert.hospital_name}
            </p>
            <h3 className="mt-0.5 flex items-center gap-2 text-lg font-black">
              <StatusIcon className="h-5 w-5" />
              {meta.label}
            </h3>
            <p className="mt-1 text-sm font-semibold opacity-90">{meta.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
          Live
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-xs font-semibold sm:grid-cols-2">
        <div className="rounded-xl bg-white/60 px-3 py-2 sm:col-span-2">
          <dt className="opacity-70">Reported Location</dt>
          <dd className="mt-0.5 font-bold">
            {alert.place_description ??
              (alert.latitude != null && alert.longitude != null
                ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`
                : '—')}
          </dd>
        </div>
        <div className="rounded-xl bg-white/60 px-3 py-2">
          <dt className="opacity-70">Hospital Response</dt>
          <dd className="mt-0.5 font-bold">{meta.label}</dd>
        </div>
        <div className="rounded-xl bg-white/60 px-3 py-2">
          <dt className="opacity-70">Dispatched At</dt>
          <dd className="mt-0.5 font-bold">
            {new Date(alert.created_at).toLocaleString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })}
          </dd>
        </div>
        {alert.emergency_notes && (
          <div className="rounded-xl bg-white/60 px-3 py-2 sm:col-span-2">
            <dt className="opacity-70">Emergency Description</dt>
            <dd className="mt-0.5 font-bold">{alert.emergency_notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/** @deprecated Use EmergencyTrackerCard */
export const RakshakEmergencyStatusCard = EmergencyTrackerCard;
