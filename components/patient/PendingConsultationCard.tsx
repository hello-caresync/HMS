'use client';

import { Calendar, Clock, Stethoscope } from 'lucide-react';

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

type PendingConsultationCardProps = {
  consultation: PendingConsultation;
};

export function PendingConsultationCard({ consultation }: PendingConsultationCardProps) {
  return (
    <article className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 shadow-xs">
      <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
        Consultation Scheduled — Prescription pending clinician review
      </div>

      <div className="space-y-3 text-xs text-[#2B1810]">
        <div className="flex items-start gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              Doctor assigned
            </p>
            <p className="font-semibold">{consultation.doctor_name}</p>
            {consultation.department ? (
              <p className="text-[11px] text-[#7C5C48]">{consultation.department}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[#7C5C48]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-sky-700" />
            {formatDisplayDate(consultation.appointment_date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-sky-700" />
            {formatSlotTime(consultation.slot_time)}
          </span>
        </div>

        {consultation.reported_symptoms ? (
          <div className="rounded-lg border border-sky-200 bg-white px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              Reported symptoms
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#2B1810]">
              {consultation.reported_symptoms}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default PendingConsultationCard;
