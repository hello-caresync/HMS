'use client';

import { useState } from 'react';

import { BED_STATUSES, ROOM_TYPES } from '../../lib/seedData';
import type { BedAvailability, RoomBedMaster, RoomType } from '../../types';
import { FormField, inputClass, selectClass } from '../shared/FormField';

type BedFormProps = {
  initial?: Omit<RoomBedMaster, 'id'>;
  onSubmit: (payload: Omit<RoomBedMaster, 'id'>) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export default function BedForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save Bed',
}: BedFormProps) {
  const [bedNumber, setBedNumber] = useState(initial?.bedNumber ?? '');
  const [roomType, setRoomType] = useState<RoomType>(initial?.roomType ?? 'General');
  const [availabilityStatus, setAvailabilityStatus] = useState<BedAvailability>(
    initial?.availabilityStatus ?? 'Vacant',
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!bedNumber.trim()) return;
        onSubmit({ bedNumber: bedNumber.trim().toUpperCase(), roomType, availabilityStatus });
      }}
    >
      <FormField label="Bed Number" htmlFor="bed-num" required>
        <input
          id="bed-num"
          value={bedNumber}
          onChange={(e) => setBedNumber(e.target.value.toUpperCase())}
          className={`${inputClass} font-mono`}
          placeholder="ICU-06"
          required
        />
      </FormField>
      <FormField label="Room Type" htmlFor="bed-type" required>
        <select
          id="bed-type"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomType)}
          className={selectClass}
          required
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Status" htmlFor="bed-status" required>
        <select
          id="bed-status"
          value={availabilityStatus}
          onChange={(e) => setAvailabilityStatus(e.target.value as BedAvailability)}
          className={selectClass}
          required
        >
          {BED_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
