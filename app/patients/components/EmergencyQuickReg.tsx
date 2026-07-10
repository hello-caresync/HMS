'use client';

import { useState } from 'react';
import { AlertTriangle, Siren, X } from 'lucide-react';

import { usePatientRegistry } from '../context/PatientRegistryProvider';
import { GENDERS } from '../types';
import { inputCls, RegField, selectCls } from './shared/RegField';

type EmergencyQuickRegProps = {
  open: boolean;
  onClose: () => void;
  onRegistered?: (uhid: string) => void;
};

export default function EmergencyQuickReg({ open, onClose, onRegistered }: EmergencyQuickRegProps) {
  const { registerEmergencyPatient } = usePatientRegistry();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('Male');
  const [estimatedAge, setEstimatedAge] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issuedUhid, setIssuedUhid] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setName('');
    setGender('Male');
    setEstimatedAge('');
    setErrors({});
    setIssuedUhid(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Patient name is required';
    const age = Number(estimatedAge);
    if (!estimatedAge || Number.isNaN(age) || age < 0 || age > 130) {
      nextErrors.estimatedAge = 'Enter a valid estimated age';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const record = registerEmergencyPatient({
      name: name.trim(),
      gender,
      estimatedAge: age,
    });
    setIssuedUhid(record.profile.uhid);
    onRegistered?.(record.profile.uhid);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-rose-300 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
              <Siren className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Emergency Quick-Reg</h2>
              <p className="text-[10px] text-rose-600">Instant temporary UHID · 3 fields only</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="rounded-lg p-1 text-slate-800 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {issuedUhid ? (
          <div className="space-y-3 text-center">
            <div className="rounded-xl bg-emerald-50 px-4 py-5 ring-1 ring-emerald-200">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Temporary UHID Issued
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-900">{issuedUhid}</p>
              <p className="mt-2 text-xs text-emerald-700">Clinical logging can begin immediately.</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <RegField label="Patient Name" htmlFor="eq-name" required error={errors.name}>
              <input
                id="eq-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls(Boolean(errors.name))}
                placeholder="Full name or Unknown"
                autoFocus
              />
            </RegField>
            <div className="grid grid-cols-2 gap-3">
              <RegField label="Gender" htmlFor="eq-gender" required>
                <select
                  id="eq-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as typeof gender)}
                  className={selectCls()}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </RegField>
              <RegField label="Est. Age" htmlFor="eq-age" required error={errors.estimatedAge}>
                <input
                  id="eq-age"
                  type="number"
                  min="0"
                  max="130"
                  value={estimatedAge}
                  onChange={(e) => setEstimatedAge(e.target.value)}
                  className={inputCls(Boolean(errors.estimatedAge))}
                  placeholder="34"
                />
              </RegField>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Creates a provisional record. Complete full registration later.
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              Issue Temp UHID
            </button>
          </form>
        )}
      </div>
    </>
  );
}
