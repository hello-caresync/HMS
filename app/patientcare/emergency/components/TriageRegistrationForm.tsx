'use client';

import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';

import { TRIAGE_URGENCY_STYLES, type TriageUrgency } from '../../../lib/patientcare';

const URGENCY_LEVELS: TriageUrgency[] = [
  'Critical / Resuscitation',
  'Urgent',
  'Non-Urgent',
];

type TriageRegistrationFormProps = {
  onRegister: (draft: {
    patientIdentifier: string;
    chiefComplaint: string;
    urgency: TriageUrgency;
  }) => void;
};

export default function TriageRegistrationForm({ onRegister }: TriageRegistrationFormProps) {
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [urgencyIndex, setUrgencyIndex] = useState(1);
  const urgency = URGENCY_LEVELS[urgencyIndex] ?? 'Urgent';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdentifier.trim() || !chiefComplaint.trim()) return;
    onRegister({ patientIdentifier: patientIdentifier.trim(), chiefComplaint: chiefComplaint.trim(), urgency });
    setPatientIdentifier('');
    setChiefComplaint('');
    setUrgencyIndex(1);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg"
    >
      <div className="mb-3 flex items-center gap-2 text-white">
        <UserPlus className="h-4 w-4 text-rose-400" />
        <h2 className="text-sm font-black">Emergency Triage Registration</h2>
      </div>

      <label className="mb-3 block space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Patient Identifier
        </span>
        <input
          required
          value={patientIdentifier}
          onChange={(e) => setPatientIdentifier(e.target.value)}
          placeholder="Name · UHID · Unknown descriptor"
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
        />
      </label>

      <label className="mb-3 block space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Chief Complaint
        </span>
        <input
          required
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Presenting complaint"
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
        />
      </label>

      <div className="mb-4 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Urgency Scale
        </span>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={urgencyIndex}
          onChange={(e) => setUrgencyIndex(Number(e.target.value))}
          className="w-full accent-rose-500"
        />
        <div className="flex justify-between gap-1">
          {URGENCY_LEVELS.map((level, i) => (
            <span
              key={level}
              className={`flex-1 rounded px-1 py-1 text-center text-[8px] font-bold uppercase ${
                i === urgencyIndex ? TRIAGE_URGENCY_STYLES[level] : 'bg-slate-800 text-slate-800'
              }`}
            >
              {level.split(' ')[0]}
            </span>
          ))}
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${TRIAGE_URGENCY_STYLES[urgency]}`}
        >
          {urgency}
        </span>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-2.5 text-sm font-black text-white hover:bg-rose-500"
      >
        <Plus className="h-4 w-4" />
        Register Triage
      </button>
    </form>
  );
}
