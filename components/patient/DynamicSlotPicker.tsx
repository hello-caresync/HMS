'use client';

import { Loader2 } from 'lucide-react';

import type { DynamicSlot } from '@/lib/scheduling/dynamic-slots';
import { classifyConditionTier, slotIntervalMinutes } from '@/lib/scheduling/dynamic-slots';

type DynamicSlotPickerProps = {
  slots: DynamicSlot[];
  selectedTime: string;
  onSelect: (slot: DynamicSlot) => void;
  loading?: boolean;
  clinicalReason?: string;
  variant?: 'select' | 'grid';
};

export function DynamicSlotPicker({
  slots,
  selectedTime,
  onSelect,
  loading = false,
  clinicalReason = '',
  variant = 'select',
}: DynamicSlotPickerProps) {
  const tier = classifyConditionTier(clinicalReason);
  const interval = slotIntervalMinutes(tier);
  const visibleSlots = slots.filter((slot) => !slot.isPast);
  const selectable = visibleSlots.filter((slot) => slot.isSelectable);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#EADBCE] bg-[#FAF6F0] py-4 text-xs font-semibold text-[#7C5C48]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading live availability...
      </div>
    );
  }

  if (selectable.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-3 text-xs font-semibold text-amber-900">
        No open slots remain for this doctor today. Please choose the next available working day.
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C5C48]">
          {interval}-minute {tier} consultation windows
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleSlots.map((slot) => {
            const disabled = !slot.isSelectable;
            const active = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(slot)}
                className={`rounded-xl border p-2.5 text-left text-[11px] font-black transition ${
                  disabled
                    ? 'cursor-not-allowed border-[#EADBCE] bg-[#FAF6F0] text-[#7C5C48]/50'
                    : active
                      ? 'border-[#8C5A3C] bg-[#8C5A3C] text-white shadow-sm'
                      : 'border-[#EADBCE] bg-white text-[#2B1810] hover:border-[#8C5A3C]'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
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
