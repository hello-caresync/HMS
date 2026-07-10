'use client';

import React, { useState } from 'react';

import { DAY_LABELS, type DayOfWeek, type OpdTimings } from '../../types';
import { FormField, inputClass, selectClass } from '../shared/FormField';

type OpdTimingsEditorProps = {
  value: OpdTimings;
  onChange: (timings: OpdTimings) => void;
};

export default function OpdTimingsEditor({ value, onChange }: OpdTimingsEditorProps) {
  const updateSlot = (day: DayOfWeek, patch: Partial<OpdTimings[number]>) => {
    onChange(value.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)));
  };

  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-[11px] text-slate-800">Configure day-wise OPD availability and slot windows.</p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-2 py-1.5 text-left font-black">Day</th>
              <th className="px-2 py-1.5 text-center font-black">Active</th>
              <th className="px-2 py-1.5 text-left font-black">Start</th>
              <th className="px-2 py-1.5 text-left font-black">End</th>
            </tr>
          </thead>
          <tbody>
            {value.map((slot) => (
              <tr key={slot.day} className="border-b border-slate-50 last:border-0">
                <td className="px-2 py-1.5 font-bold text-slate-900">{DAY_LABELS[slot.day]}</td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) => updateSlot(slot.day, { enabled: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/30"
                    aria-label={`${DAY_LABELS[slot.day]} OPD active`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="time"
                    value={slot.startTime}
                    disabled={!slot.enabled}
                    onChange={(e) => updateSlot(slot.day, { startTime: e.target.value })}
                    className={`${inputClass} py-1 text-xs disabled:bg-slate-50 disabled:text-slate-800`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="time"
                    value={slot.endTime}
                    disabled={!slot.enabled}
                    onChange={(e) => updateSlot(slot.day, { endTime: e.target.value })}
                    className={`${inputClass} py-1 text-xs disabled:bg-slate-50 disabled:text-slate-800`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type DoctorFormProps = {
  departments: { id: string; name: string }[];
  initial?: {
    name: string;
    specialization: string;
    departmentId: string;
    opdTimings: OpdTimings;
  };
  onSubmit: (payload: {
    name: string;
    specialization: string;
    departmentId: string;
    opdTimings: OpdTimings;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export function DoctorForm({ departments, initial, onSubmit, onCancel, submitLabel = 'Save Doctor' }: DoctorFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [specialization, setSpecialization] = useState(initial?.specialization ?? '');
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? departments[0]?.id ?? '');
  const [opdTimings, setOpdTimings] = useState<OpdTimings>(initial?.opdTimings ?? []);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !departmentId) return;
        onSubmit({ name: name.trim(), specialization: specialization.trim(), departmentId, opdTimings });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Doctor Name" htmlFor="doc-name" required>
          <input
            id="doc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Dr. Full Name"
            required
          />
        </FormField>
        <FormField label="Specialization" htmlFor="doc-spec" required>
          <input
            id="doc-spec"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className={inputClass}
            placeholder="e.g. Interventional Cardiology"
            required
          />
        </FormField>
        <FormField label="Department" htmlFor="doc-dept" required>
          <select
            id="doc-dept"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={selectClass}
            required
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="OPD Timings">
        <OpdTimingsEditor value={opdTimings} onChange={setOpdTimings} />
      </FormField>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
