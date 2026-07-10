'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Ticket } from 'lucide-react';

import {
  DEPARTMENT_OPTIONS,
  DOCTOR_AVAILABILITY,
  generateTokenId,
  getPatientInitials,
  type QueueTokenEntry,
} from '../../../lib/frontoffice';

type TokenBookingFormProps = {
  queue: QueueTokenEntry[];
  onIssueToken: (entry: QueueTokenEntry) => void;
};

export default function TokenBookingForm({ queue, onIssueToken }: TokenBookingFormProps) {
  const [departmentCode, setDepartmentCode] = useState(DEPARTMENT_OPTIONS[0]?.code ?? 'ENT');
  const [doctorId, setDoctorId] = useState('');
  const [patientName, setPatientName] = useState('');

  const doctorsForDept = useMemo(
    () => DOCTOR_AVAILABILITY.filter((d) => d.departmentCode === departmentCode),
    [departmentCode],
  );

  const selectedDoctor = doctorsForDept.find((d) => d.id === doctorId) ?? doctorsForDept[0];

  const handleWalkIn = () => {
    if (!selectedDoctor?.available) return;
    const name = patientName.trim() || 'Walk-In Patient';
    const entry: QueueTokenEntry = {
      id: `q-${Date.now()}`,
      tokenId: generateTokenId(departmentCode, queue),
      patientInitials: getPatientInitials(name),
      department: DEPARTMENT_OPTIONS.find((d) => d.code === departmentCode)?.label ?? departmentCode,
      doctor: selectedDoctor.name,
      waitingMinutes: 0,
      status: 'Waiting',
      bookedAt: new Date().toISOString(),
    };
    onIssueToken(entry);
    setPatientName('');
  };

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-sky-700" />
          <div>
            <h2 className="text-sm font-black text-slate-900">Token Booking Desk</h2>
            <p className="text-[10px] text-slate-800">Walk-in · department · doctor routing</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Department
          </span>
          <select
            value={departmentCode}
            onChange={(e) => {
              setDepartmentCode(e.target.value);
              setDoctorId('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {dept.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Doctor Availability
          </span>
          <div className="mt-2 grid gap-2">
            {doctorsForDept.map((doc) => (
              <button
                key={doc.id}
                type="button"
                disabled={!doc.available}
                onClick={() => setDoctorId(doc.id)}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs transition ${
                  (doctorId || doctorsForDept[0]?.id) === doc.id
                    ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${!doc.available ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <p className="font-bold text-slate-900">{doc.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-800">{doc.slotLabel}</p>
                <p
                  className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
                    doc.available ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {doc.available ? 'Available' : 'Read-only · Off duty'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Patient Name (optional)
          </span>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Walk-in defaults if blank"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <button
          type="button"
          onClick={handleWalkIn}
          disabled={!selectedDoctor?.available}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarClock className="h-4 w-4" />
          Walk-In Token Generation
        </button>
      </div>
    </div>
  );
}
