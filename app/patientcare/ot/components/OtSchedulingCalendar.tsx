'use client';

import { OT_STATUS_STYLES, OT_THEATERS, type OtScheduleSlot } from '../../../lib/patientcare';

type OtSchedulingCalendarProps = {
  slots: OtScheduleSlot[];
  onSlotClick: (slot: OtScheduleSlot) => void;
};

export default function OtSchedulingCalendar({ slots, onSlotClick }: OtSchedulingCalendarProps) {
  const dateLabel = slots[0]?.dateLabel ?? 'Today';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Operating Theater Schedule</h2>
        <p className="text-[10px] text-slate-800">{dateLabel}</p>
      </div>

      <div className="grid gap-0 divide-x divide-slate-200 lg:grid-cols-3">
        {OT_THEATERS.map((theater) => {
          const theaterSlots = slots
            .filter((s) => s.theaterId === theater.id)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={theater.id} className="min-h-[280px]">
              <div className="border-b-2 border-slate-200 bg-slate-800 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-white">
                  {theater.name}
                </p>
              </div>
              <div className="space-y-2 p-2">
                {theaterSlots.length === 0 ? (
                  <p className="py-6 text-center text-[10px] text-slate-800">No bookings</p>
                ) : (
                  theaterSlots.map((slot) => {
                    const clickable = slot.status === 'Pre-Op Checklist Pending';
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => onSlotClick(slot)}
                        className={`w-full rounded-lg border p-2.5 text-left text-xs transition ${
                          clickable
                            ? 'border-amber-400 bg-amber-50 hover:ring-2 hover:ring-amber-300'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold text-slate-800">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase ring-1 ${OT_STATUS_STYLES[slot.status]}`}
                          >
                            {slot.status}
                          </span>
                        </div>
                        <p className="mt-1 font-bold text-slate-900">{slot.patientName}</p>
                        <p className="text-[10px] text-slate-800">{slot.procedureType}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-sky-800">
                          {slot.leadSurgeon}
                        </p>
                        {clickable && (
                          <p className="mt-1 text-[8px] font-bold uppercase text-amber-700">
                            Open instrument checklist →
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
