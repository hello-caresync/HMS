'use client';

import { useMemo, useState } from 'react';
import { Ban, CalendarClock, MoreVertical, XCircle } from 'lucide-react';

import { useAppointments } from '../context/AppointmentProvider';
import {
  DAY_SLOTS,
  findAppointmentAtSlot,
  formatHourLabel,
  groupSlotsByHour,
  resolveSlotState,
} from '../lib/calendarUtils';
import type { Appointment } from '../types';
import { APPOINTMENT_TYPE_STYLES, SLOT_STATE_STYLES } from '../types';

const RESCHEDULE_SLOTS = [
  '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
  '11:00', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15',
];

type SlotActionMenuProps = {
  appointment: Appointment;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
};

function SlotActionMenu({ appointment, onReschedule, onCancel }: SlotActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1 text-slate-800 hover:bg-white hover:text-slate-900"
        aria-label="Slot actions"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReschedule(appointment.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-900 hover:bg-slate-50"
            >
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Reschedule
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(appointment.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BookedSlotMiniCard({
  appointment,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const typeStyle = APPOINTMENT_TYPE_STYLES[appointment.appointmentType];
  const statusStyle =
    appointment.status === 'No-Show'
      ? 'border-rose-200 bg-rose-50'
      : appointment.status === 'In-Consultation'
        ? 'border-violet-300 bg-violet-50'
        : 'border-sky-200 bg-sky-50';

  return (
    <div
      className={`group flex h-full min-h-[52px] flex-col justify-between rounded-lg border px-2 py-1.5 transition-shadow hover:shadow-md ${statusStyle}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-900">{appointment.patientName}</p>
          {appointment.tokenNumber && (
            <p className="font-mono text-[10px] font-semibold text-primary">{appointment.tokenNumber}</p>
          )}
        </div>
        {appointment.status !== 'Cancelled' && appointment.status !== 'No-Show' && (
          <SlotActionMenu
            appointment={appointment}
            onReschedule={onReschedule}
            onCancel={onCancel}
          />
        )}
      </div>
      <span
        className={`mt-0.5 inline-flex w-fit rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${typeStyle.bg} ${typeStyle.text}`}
      >
        {appointment.appointmentType}
      </span>
    </div>
  );
}

export default function SchedulingMatrix() {
  const {
    selectedDoctorId,
    selectedDate,
    appointments,
    blockedSlots,
    cancelAppointment,
    rescheduleAppointment,
    doctors,
  } = useAppointments();

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const doctor = doctors.find((d) => d.id === selectedDoctorId);
  const hourGroups = useMemo(() => groupSlotsByHour(DAY_SLOTS), []);

  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === selectedDoctorId && a.date === selectedDate,
  );

  const stats = useMemo(() => {
    let available = 0;
    let booked = 0;
    let blocked = 0;
    DAY_SLOTS.forEach((slot) => {
      const state = resolveSlotState(
        selectedDoctorId,
        selectedDate,
        slot,
        appointments,
        blockedSlots,
      );
      if (state === 'available') available++;
      else if (state === 'booked') booked++;
      else blocked++;
    });
    return { available, booked, blocked };
  }, [selectedDoctorId, selectedDate, appointments, blockedSlots]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Day-at-a-Glance · 15-min Grid</h2>
          <p className="text-[11px] text-slate-800">{doctor?.name} · {doctor?.specialization}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['available', 'booked', 'blocked'] as const).map((state) => (
            <span
              key={state}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${SLOT_STATE_STYLES[state].border} ${SLOT_STATE_STYLES[state].bg}`}
            >
              <span className="font-mono font-bold text-slate-800">
                {state === 'available' ? stats.available : state === 'booked' ? stats.booked : stats.blocked}
              </span>
              {SLOT_STATE_STYLES[state].label}
            </span>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar max-h-[calc(100vh-320px)] overflow-y-auto">
        {hourGroups.map(({ hour, slots }) => (
          <div key={hour} className="border-b border-slate-50 last:border-b-0">
            <div className="sticky top-0 z-10 flex items-center gap-3 bg-slate-50/95 px-4 py-1.5 backdrop-blur-sm">
              <span className="w-12 text-right text-[11px] font-bold tabular-nums text-slate-800">
                {formatHourLabel(hour)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-800">
                {slots.length} slots
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4 py-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
              {slots.map((slotTime) => {
                const state = resolveSlotState(
                  selectedDoctorId,
                  selectedDate,
                  slotTime,
                  appointments,
                  blockedSlots,
                );
                const appointment = findAppointmentAtSlot(
                  doctorAppointments,
                  selectedDoctorId,
                  selectedDate,
                  slotTime,
                );
                const style = SLOT_STATE_STYLES[state];
                const blocked = blockedSlots.find(
                  (b) =>
                    b.doctorId === selectedDoctorId &&
                    b.date === selectedDate &&
                    b.startTime === slotTime,
                );

                return (
                  <div
                    key={slotTime}
                    className={`min-h-[56px] rounded-lg border transition-all ${style.border} ${style.bg} ${
                      state === 'available' ? 'cursor-default' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="font-mono text-[10px] font-semibold text-slate-800">
                        {slotTime}
                      </span>
                      {state === 'blocked' && <Ban className="h-3 w-3 text-slate-800" />}
                    </div>

                    {state === 'booked' && appointment && (
                      <div className="px-1.5 pb-1.5">
                        <BookedSlotMiniCard
                          appointment={appointment}
                          onReschedule={setRescheduleId}
                          onCancel={cancelAppointment}
                        />
                      </div>
                    )}

                    {state === 'blocked' && blocked && (
                      <p className="px-2 pb-2 text-[9px] leading-tight text-slate-800">
                        {blocked.reason}
                      </p>
                    )}

                    {state === 'available' && (
                      <p className="px-2 pb-2 text-[9px] text-emerald-600/70">Open slot</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {rescheduleId && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40" onClick={() => setRescheduleId(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
            <p className="mb-3 text-sm font-semibold text-slate-900">Reschedule to New Slot</p>
            <div className="grid grid-cols-3 gap-2">
              {RESCHEDULE_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    rescheduleAppointment(rescheduleId, t);
                    setRescheduleId(null);
                  }}
                  className="rounded-lg border border-slate-200 py-2 font-mono text-xs font-medium hover:border-primary hover:bg-primary-muted hover:text-primary"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
