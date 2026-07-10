'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';

import Sheet from '../../master-data/components/shared/Sheet';
import { ADMITTING_DOCTORS, PATIENT_OPTIONS } from '../lib/seedIpd';
import { useIPD } from '../context/IPDProvider';
import type { IPDBed } from '../types';

type AdmitPatientModalProps = {
  bed: IPDBed | null;
  open: boolean;
  onClose: () => void;
};

export default function AdmitPatientModal({ bed, open, onClose }: AdmitPatientModalProps) {
  const { admitPatient, wards } = useIPD();
  const [patientId, setPatientId] = useState(PATIENT_OPTIONS[0]?.patientId ?? '');
  const [doctor, setDoctor] = useState(ADMITTING_DOCTORS[0]);
  const [error, setError] = useState<string | null>(null);

  const ward = bed ? wards.find((w) => w.id === bed.wardId) : null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!bed) return;
    const result = admitPatient(bed.id, patientId, doctor);
    if (!result.success) {
      setError(result.error ?? 'Admission failed');
      return;
    }
    handleClose();
  };

  if (!bed) return null;

  return (
    <Sheet
      open={open}
      title="Admit Patient"
      description={`${bed.bedLabel} · ${ward?.name ?? ''}`}
      onClose={handleClose}
      width="md"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Select Patient
          </label>
          <select
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {PATIENT_OPTIONS.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} · {p.uhid}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Admitting Doctor
          </label>
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {ADMITTING_DOCTORS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          <LogIn className="h-4 w-4" />
          Confirm Admission
        </button>
      </div>
    </Sheet>
  );
}
