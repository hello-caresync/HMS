'use client';

import { Loader2 } from 'lucide-react';

import type { DynamicSlot } from '@/lib/scheduling/dynamic-slots';
import { classifyConditionTier, slotIntervalMinutes, slotTimesMatch } from '@/lib/scheduling/dynamic-slots';

type DynamicSlotPickerProps = {
  slots: DynamicSlot[];
  selectedTime: string;
  onSelect: (slot: DynamicSlot) => void;
  loading?: boolean;
  clinicalReason?: string;
  variant?: 'select' | 'grid';
  appearance?: 'patient' | 'hospital';
};

export function DynamicSlotPicker({
  slots,
  selectedTime,
  onSelect,
  loading = false,
  clinicalReason = '',
  variant = 'select',
  appearance = 'patient',
}: DynamicSlotPickerProps) {
  const hospital = appearance === 'hospital';
  const tier = classifyConditionTier(clinicalReason);
  const interval = slotIntervalMinutes(tier);
  const visibleSlots = slots.filter((slot) => !slot.isPast);
  const selectable = visibleSlots.filter((slot) => slot.isSelectable);
  const periods = ['Morning', 'Afternoon', 'Evening'] as const;

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border py-4 text-xs font-semibold ${hospital ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-[#EADBCE] bg-[#FAF6F0] text-[#7C5C48]'}`}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading live availability...
      </div>
    );
  }

  if (visibleSlots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-3 text-xs font-semibold text-amber-900">
        No open slots remain for this doctor on this day. Choose the next working day.
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="space-y-3">
        <p className={`text-[10px] font-bold uppercase tracking-wide ${hospital ? 'text-slate-500' : 'text-[#7C5C48]'}`}>
          {interval}-minute {tier} visits · booked times stay closed
        </p>
        {selectable.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
            Every remaining time on this day is already booked.
          </p>
        ) : null}
        {periods.map((period) => {
          const group = visibleSlots.filter((slot) => slot.period === period);
          if (group.length === 0) return null;
          return (
            <div key={period}>
              <p className={`mb-1.5 text-[10px] font-black uppercase tracking-wider ${hospital ? 'text-slate-500' : 'text-[#7f5539]'}`}>
                {period}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {group.map((slot) => {
                  const disabled = !slot.isSelectable;
                  const active = !disabled && slotTimesMatch(selectedTime, slot.time);
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={disabled}
                      aria-disabled={disabled}
                      onClick={() => {
                        if (!disabled) onSelect(slot);
                      }}
                      className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center transition ${
                        hospital
                          ? disabled
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : active
                              ? 'border-cyan-700 bg-cyan-700 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-cyan-600'
                          : disabled
                            ? 'cursor-not-allowed border-[#E6CCB2] bg-[#F3ECE4] text-[#7C5C48]/45'
                            : active
                              ? 'border-[#7f5539] bg-[#7f5539] text-white shadow-sm'
                              : 'border-[#EADBCE] bg-white text-[#2B1810] hover:border-[#7f5539]'
                      }`}
                    >
                      <span className={`text-[11px] font-black tabular-nums ${disabled ? 'line-through' : ''}`}>
                        {slot.time}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
                        {slot.isBooked ? 'Booked' : period}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <select
        value={selectedTime}
        onChange={(event) => {
          const match = slots.find((slot) => slot.time === event.target.value);
          if (match?.isSelectable) onSelect(match);
        }}
        className="w-full rounded-xl border border-[#EADBCE] bg-white px-3.5 py-2.5 text-xs font-medium text-[#2B1810] transition-all focus:border-[#8C5A3C] focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/20"
      >
        {visibleSlots.map((slot) => (
          <option key={slot.time} value={slot.time} disabled={!slot.isSelectable}>
            {slot.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] font-semibold text-[#7C5C48]">
        Live {interval}-minute {tier} slots · past and booked times are disabled
      </p>
    </div>
  );
}
