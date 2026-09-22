'use client';

import { Calendar, CheckCircle2, Circle, Clock, Stethoscope } from 'lucide-react';

import type { PendingConsultation } from '@/lib/patient/prescriptions-feed';

function formatDisplayDate(value: string): string {
  const raw = String(value ?? '').slice(0, 10);
  if (!raw) return '—';
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatSlotTime(value: string): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '—') return '—';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 || 12;
  return `${normalized}:${minutes} ${period}`;
}

function doctorInitial(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, '').trim();
  return cleaned.charAt(0).toUpperCase() || 'D';
}

const TIMELINE_STEPS = [
  { id: 'confirmed', label: 'Appointment Confirmed', state: 'done' as const },
  { id: 'consultation', label: 'Doctor Consultation & Triage', state: 'active' as const },
  { id: 'dispatch', label: 'Digital Prescription Dispatch', state: 'upcoming' as const },
];

type PendingConsultationCardProps = {
  consultation: PendingConsultation;
};

export function PendingConsultationCard({ consultation }: PendingConsultationCardProps) {
  const doctorDisplay = consultation.doctor_name.startsWith('Dr')
    ? consultation.doctor_name
    : `Dr. ${consultation.doctor_name}`;

  return (
    <article className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-5 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
        Consultation Scheduled — Prescription pending clinician review
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-lg font-bold text-sky-800">
              {doctorInitial(consultation.doctor_name)}
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Assigned Clinician
            </p>
            <h2 className="text-lg font-bold text-slate-900">{doctorDisplay}</h2>
            <p className="text-sm font-medium text-slate-600">
              {consultation.department || 'General Medicine'}
            </p>
          </div>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {formatDisplayDate(consultation.appointment_date)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatSlotTime(consultation.slot_time)}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-sky-700" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Reported Symptoms &amp; Intake Notes
          </p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Reported issue
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {consultation.reported_symptoms?.trim() || 'General consultation requested'}
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              Patient notes / vitals status
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              Initial intake recorded. Clinician review pending.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Live Consultation Timeline
        </p>
        <ol className="space-y-3">
          {TIMELINE_STEPS.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              {step.state === 'done' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              ) : step.state === 'active' ? (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-[10px] font-bold text-amber-700">
                  ⏳
                </span>
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-hidden />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">
                  {step.state === 'done'
                    ? 'Completed'
                    : step.state === 'active'
                      ? 'In progress'
                      : 'Upcoming'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export default PendingConsultationCard;
