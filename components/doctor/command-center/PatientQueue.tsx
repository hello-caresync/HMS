'use client';

import React from 'react';

import { formatGenderDisplay } from '@/lib/clinical/format-gender';
import {
  doctorQueueRowToItem,
  type DoctorQueueItem,
} from '@/lib/doctor/command-center/supabase-service';
import type { DoctorQueueRow } from '@/lib/doctor/command-center/types';
import {
  formatQueueDateBadge,
  formatQueueSlotTime,
  isFutureAppointmentDate,
} from '@/lib/scheduling/queue-date-filter';

interface PatientQueueProps {
  queue: DoctorQueueItem[] | DoctorQueueRow[];
  selectedTokenId?: string | null;
  onSelectPatient: (patient: DoctorQueueRow) => void;
  isLoading?: boolean;
  emptyLabel?: string;
  queueDateMode?: 'today' | 'tomorrow' | 'upcoming' | 'custom';
  renderActions?: (patient: DoctorQueueRow) => React.ReactNode;
}

function toQueueItem(entry: DoctorQueueItem | DoctorQueueRow): DoctorQueueItem {
  if ('patientName' in entry && entry.patientName) {
    return entry as DoctorQueueItem;
  }
  return doctorQueueRowToItem(entry as DoctorQueueRow);
}

function formatQueueTokenLabel(token?: string | number | null): string {
  const raw = String(token ?? '').trim();
  if (!raw) return '#—';
  return raw.startsWith('#') ? raw : `#${raw}`;
}

function formatQueueStatusLabel(status?: string): string {
  const value = String(status ?? 'waiting').trim().toLowerCase().replace(/_/g, '-');
  if (/billing-pending|billing_pending/.test(value)) return 'AT BILLING';
  if (/billing|complete|done|paid|finished/.test(value)) return 'DONE';
  if (/consult|progress|called/.test(value)) return 'IN CONSULT';
  return 'WAITING';
}

function queueStatusClasses(status?: string): string {
  const value = String(status ?? 'waiting').trim().toLowerCase();
  if (/consult|progress|called/.test(value)) {
    return 'bg-amber-100 text-amber-800';
  }
  if (/billing|complete|done|paid/.test(value)) {
    return 'bg-slate-100 text-slate-600';
  }
  return 'bg-emerald-100 text-emerald-800';
}

export function PatientQueue({
  queue,
  selectedTokenId,
  onSelectPatient,
  isLoading,
  emptyLabel = 'No patients in waiting room.',
  queueDateMode = 'today',
  renderActions,
}: PatientQueueProps) {
  if (isLoading && (!queue || queue.length === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-slate-400">
        Loading queue...
      </div>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {queue.map((entry) => {
        const item = toQueueItem(entry);
        const entryRow = 'patient_name' in entry ? (entry as DoctorQueueRow) : null;
        const row: DoctorQueueRow =
          entryRow ??
          ({
            id: item.id,
            appointment_id: item.appointmentId,
            patient_id: item.patientId,
            patient_name: item.patientName,
            age: item.age,
            gender: item.gender,
            token_number: item.tokenNumber,
            appointment_time: item.time,
            time_slot: item.time,
            status: item.status,
            chief_complaint: item.chiefComplaint,
            vitals: item.vitals,
            appointment_type: item.appointmentType,
            appointment_date: item.appointmentDate,
            created_at: item.createdAt,
            _source_table: item._source_table,
          } as DoctorQueueRow);

        const tokenKey = item.appointmentId || item.id;
        const appointmentDate = String(
          row.appointment_date ?? item.appointmentDate ?? '',
        ).slice(0, 10);
        const slotLabel = formatQueueSlotTime(item.time ?? row.appointment_time ?? row.time_slot);
        const showScheduledBadge =
          queueDateMode === 'upcoming' ||
          queueDateMode === 'tomorrow' ||
          (appointmentDate && isFutureAppointmentDate(appointmentDate));
        const isSelected =
          selectedTokenId === tokenKey ||
          selectedTokenId === item.id ||
          selectedTokenId === item.appointmentId;

        const tokenLabel = formatQueueTokenLabel(item.tokenNumber);
        const statusLabel = formatQueueStatusLabel(item.status);

        return (
          <div
            key={tokenKey}
            onClick={() => onSelectPatient(row)}
            className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-all duration-150 ${
              isSelected
                ? 'border-emerald-400 bg-emerald-50 shadow-sm ring-1 ring-emerald-300'
                : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-950/80 px-2.5 py-1 font-mono text-xs font-bold tracking-tight text-emerald-300"
                  style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}
                >
                  {tokenLabel}
                </span>
                <div className="flex min-w-0 flex-col">
                  <h4 className="truncate text-sm font-semibold text-slate-900">{item.patientName}</h4>
                  <p className="truncate text-xs text-slate-500">
                    {formatGenderDisplay(item.gender)} · {item.age ? `${item.age}y` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {showScheduledBadge && appointmentDate ? (
                  <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {formatQueueDateBadge(appointmentDate)}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${queueStatusClasses(item.status)}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-emerald-100/80 pt-2 text-xs text-slate-500">
              <span className="min-w-0 truncate font-medium text-slate-600">
                {item.chiefComplaint || 'Routine checkup'}
              </span>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-600">
                {slotLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <span className="truncate">
                Visit:{' '}
                {showScheduledBadge || !/walk/i.test(String(item.appointmentType ?? row.source ?? ''))
                  ? 'Scheduled'
                  : 'Walk-in'}
              </span>
              {row.phone || row.patient_phone ?
                <span className="shrink-0">{String(row.phone ?? row.patient_phone)}</span>
              : null}
            </div>

            {renderActions ? <div>{renderActions(row)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export default PatientQueue;
