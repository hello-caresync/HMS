'use client';

import {
  Activity,
  BedDouble,
  ClipboardList,
  FlaskConical,
  LogIn,
  Pill,
  Stethoscope,
  UserPlus,
} from 'lucide-react';

import { formatDateTime, MOCK_TIMELINE, type TimelineEvent } from '../lib/patientsMockData';

const TYPE_CONFIG: Record<
  TimelineEvent['type'],
  { icon: typeof UserPlus; color: string; ring: string }
> = {
  registration: { icon: UserPlus, color: 'bg-[#0F172A]', ring: 'ring-[#0F172A]/20' },
  consultation: { icon: Stethoscope, color: 'bg-[#2563EB]', ring: 'ring-blue-200' },
  lab: { icon: FlaskConical, color: 'bg-slate-700', ring: 'ring-slate-200' },
  pharmacy: { icon: Pill, color: 'bg-emerald-700', ring: 'ring-emerald-200' },
  admission: { icon: BedDouble, color: 'bg-violet-700', ring: 'ring-violet-200' },
  discharge: { icon: LogIn, color: 'bg-slate-500', ring: 'ring-slate-200' },
  emergency: { icon: Activity, color: 'bg-red-600', ring: 'ring-red-200' },
};

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  registration: 'Registration',
  consultation: 'Consultation',
  lab: 'Lab Test',
  pharmacy: 'Pharmacy',
  admission: 'Admission',
  discharge: 'Discharge',
  emergency: 'Emergency',
};

type PatientTimelineViewProps = {
  events?: TimelineEvent[];
  compact?: boolean;
};

export default function PatientTimelineView({ events = MOCK_TIMELINE, compact = false }: PatientTimelineViewProps) {
  return (
    <div className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">Patient Timeline</h2>
          <p className="text-[10px] text-slate-500">
            Chronological journey — registration through consultations, diagnostics, pharmacy, and discharge
          </p>
        </div>
      )}

      <ol className="relative space-y-0" aria-label="Patient care timeline">
        {events.map((event, index) => {
          const config = TYPE_CONFIG[event.type];
          const Icon = config.icon;
          const isLast = index === events.length - 1;

          return (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${config.color} ${config.ring}`}
              >
                <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white p-2.5 transition-shadow hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-1">
                  <div>
                    <span className="rounded bg-slate-100 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-slate-600">
                      {TYPE_LABELS[event.type]}
                    </span>
                    <h4 className="mt-0.5 text-[11px] font-bold text-[#0F172A]">{event.title}</h4>
                  </div>
                  <time className="shrink-0 text-[9px] font-mono text-slate-400">
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>
                <p className="mt-1 text-[10px] leading-snug text-slate-600">{event.detail}</p>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[9px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ClipboardList className="h-2.5 w-2.5" />
                    {event.department}
                  </span>
                  {event.provider && (
                    <span className="font-medium text-[#2563EB]">{event.provider}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
