'use client';

import { CalendarClock, Search } from 'lucide-react';

import type {
  HospitalAppointmentDateFilter,
  HospitalReceptionRow,
} from '@/lib/hospital/appointments';
import {
  formatQueueDateBadge,
  formatQueueSlotTime,
  todayIsoDate,
  tomorrowIsoDate,
} from '@/lib/scheduling/queue-date-filter';

export type ReceptionQueueRow = HospitalReceptionRow;

type ReceptionQueueProps = {
  activeDateFilter: HospitalAppointmentDateFilter;
  onDateFilterChange: (filter: HospitalAppointmentDateFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  todayCount: number;
  tomorrowCount: number;
  upcomingCount: number;
  allCount: number;
  bookings: ReceptionQueueRow[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
};

const FILTER_OPTIONS: Array<{ id: HospitalAppointmentDateFilter; label: string }> = [
  { id: 'today', label: "Today's OPD" },
  { id: 'tomorrow', label: "Tomorrow's Schedule" },
  { id: 'upcoming', label: 'All Upcoming Bookings' },
  { id: 'all', label: 'All Appointments' },
];

function formatTokenLabel(token?: string): string {
  const raw = String(token ?? '').trim();
  if (!raw) return '—';
  if (/^#/.test(raw) || /^token/i.test(raw) || /^t-/i.test(raw) || /^nx-/i.test(raw)) {
    return raw.startsWith('#') ? raw : `#${raw}`;
  }
  return `#${raw}`;
}

function statusPillClasses(status: string): string {
  const value = status.trim().toLowerCase().replace(/_/g, '-');
  if (/billing|complete|done|paid/.test(value)) {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
  if (/consult|progress|called/.test(value)) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

function statusLabel(status: string): string {
  return String(status ?? 'WAITING').trim().toUpperCase().replace(/_/g, ' ');
}

export function ReceptionQueue({
  activeDateFilter,
  onDateFilterChange,
  searchQuery,
  onSearchQueryChange,
  todayCount,
  tomorrowCount,
  upcomingCount,
  allCount,
  bookings,
  loading = false,
  title = 'Live OPD Appointment Desk',
  subtitle = "Today's walk-ins and advance bookings from the patient portal",
  className = '',
}: ReceptionQueueProps) {
  const today = todayIsoDate();
  const tomorrow = tomorrowIsoDate();

  const badgeForFilter = (filter: HospitalAppointmentDateFilter): number => {
    if (filter === 'today') return todayCount;
    if (filter === 'tomorrow') return tomorrowCount;
    if (filter === 'upcoming') return upcomingCount;
    return allCount;
  };

  const emptyMessage =
    activeDateFilter === 'today'
      ? 'No live OPD bookings for today yet.'
      : activeDateFilter === 'tomorrow'
        ? `No appointments scheduled for ${tomorrow}.`
        : activeDateFilter === 'upcoming'
          ? `No advance bookings from ${today} onward.`
          : 'No appointments found in the master ledger.';

  return (
    <section className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#482A41]">
            <CalendarClock className="h-5 w-5 text-[#572E54]" />
            {title}
          </h2>
          <p className="text-xs text-[#8E7692]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onDateFilterChange(option.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeDateFilter === option.id
                  ? 'bg-[#572E54] text-white'
                  : 'border border-[#8E7692]/30 bg-white text-[#482A41]'
              }`}
            >
              {option.label} ({badgeForFilter(option.id)})
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search token, patient, doctor, or department..."
          className="w-full rounded-xl border border-[#8E7692]/30 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#572E54]"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#8E7692]">Loading OPD bookings…</p>
      ) : bookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8E7692]">{emptyMessage}</p>
      ) : (
        <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
          {bookings.map((booking) => {
            const apptDate = String(booking.appointment_date ?? '').slice(0, 10);
            const isToday = apptDate === today;
            const isFuture = apptDate > today;
            const slotLabel = formatQueueSlotTime(booking.appointment_time);

            return (
              <li
                key={booking.id}
                className="rounded-xl border border-[#8E7692]/20 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[#572E54]/10 px-2.5 py-1 font-mono text-xs font-black text-[#572E54]">
                        {formatTokenLabel(booking.token_number)}
                      </span>
                      {isToday ? (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                          Today
                        </span>
                      ) : null}
                      {isFuture && apptDate ? (
                        <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                          {formatQueueDateBadge(apptDate)}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusPillClasses(booking.status)}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#482A41]">{booking.patient_name}</p>
                    <p className="text-xs font-semibold text-[#572E54]">
                      {booking.doctor_name} · {booking.department}
                    </p>
                    <p className="mt-1 text-xs text-[#8E7692]">
                      {apptDate || '—'} at {slotLabel}
                    </p>
                    {booking.chief_complaint ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Reason: {booking.chief_complaint}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ReceptionQueue;
