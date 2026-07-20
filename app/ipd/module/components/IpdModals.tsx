'use client';

import type { IpdInpatient } from '../lib/ipdMockData';
import { IPD_NURSES, MOCK_BED_ASSETS, MOCK_INPATIENTS } from '../lib/ipdMockData';
import { inputClass, ModalOverlay, SecureIdentityPlaceholder } from './ipdUi';

type ModalProps = { onClose: () => void; patient?: IpdInpatient | null };

export function ViewInpatientModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Inpatient Profile" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified={p.identityVerified} />
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
        <div><dt className="text-slate-400">Patient</dt><dd className="font-bold text-[#0F172A]">{p.patientName}</dd></div>
        <div><dt className="text-slate-400">UHID</dt><dd className="font-mono text-[#2563EB]">{p.uhid}</dd></div>
        <div><dt className="text-slate-400">Ward / Room / Bed</dt><dd>{p.ward} · {p.room} · {p.bed}</dd></div>
        <div><dt className="text-slate-400">Consultant</dt><dd>{p.consultant}</dd></div>
        <div><dt className="text-slate-400">Nurse</dt><dd>{p.assignedNurse}</dd></div>
        <div><dt className="text-slate-400">Expected Discharge</dt><dd className="font-semibold text-indigo-700">{p.expectedDischarge}</dd></div>
      </dl>
      <p className="mt-2 text-[9px] italic text-slate-500">Admission documents & consent forms: [Identity Verification Checked/Masked for Security]</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Close Profile</button>
    </ModalOverlay>
  );
}

export function AllocateBedModal({ onClose }: ModalProps) {
  const available = MOCK_BED_ASSETS.filter((b) => b.status === 'Available');
  return (
    <ModalOverlay title="Allocate Bed" onClose={onClose} wide>
      <p className="mb-2 text-[10px] text-slate-600">{available.length} beds available across wards</p>
      <div className="grid grid-cols-3 gap-1.5">
        {available.map((b) => (
          <button key={b.id} type="button" onClick={onClose} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-semibold text-emerald-800 hover:border-[#2563EB]">
            {b.label}<br /><span className="text-[8px] font-normal">{b.ward}</span>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}

export function TransferPatientModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Transfer Patient" onClose={onClose} wide>
      <p className="mb-2 text-[11px] text-[#0F172A]"><strong>{p.patientName}</strong> · {p.ward} · {p.bed}</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="From location" defaultValue={`${p.ward} ${p.bed}`} />
        <input className={inputClass} placeholder="To location" />
        <select className={`${inputClass} col-span-2`}>
          <option>Ward Transfer</option>
          <option>ICU Transfer</option>
          <option>OT Transfer</option>
          <option>Diagnostic Transfer</option>
        </select>
        <input className={`${inputClass} col-span-2`} placeholder="Clinical reason" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Submit Transfer</button>
    </ModalOverlay>
  );
}

export function AssignNurseModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Assign Nurse" onClose={onClose}>
      <p className="mb-2 text-[11px]">{p.patientName} · {p.nursingStation}</p>
      <select className={inputClass}>
        {IPD_NURSES.map((n) => <option key={n}>{n}</option>)}
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Confirm Assignment</button>
    </ModalOverlay>
  );
}

export function ScheduleRoundModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Schedule Doctor Round" onClose={onClose} wide>
      <p className="mb-2 text-[11px]">{p.patientName} · Consultant: {p.consultant}</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} type="date" defaultValue="2026-07-18" />
        <input className={inputClass} type="time" defaultValue="11:30" />
        <input className={`${inputClass} col-span-2`} placeholder="Round notes / priority" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Schedule Round</button>
    </ModalOverlay>
  );
}

export function InitiateDischargeModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Initiate Discharge" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified={p.identityVerified} />
      <p className="mt-2 text-[11px]"><strong>{p.patientName}</strong> · {p.uhid}</p>
      <p className="mt-1 text-[10px] text-slate-600">This will trigger multi-department clearance workflow and bed release pipeline.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Start Discharge Clearance</button>
    </ModalOverlay>
  );
}

export function PrintWristbandModal({ onClose, patient }: ModalProps) {
  const p = patient ?? MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Patient Wristband" onClose={onClose}>
      <div className="rounded-lg border-2 border-[#0F172A] p-4 text-center">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS — IPD</p>
        <p className="mt-2 text-sm font-bold text-[#0F172A]">{p.patientName}</p>
        <p className="font-mono text-[10px] text-[#2563EB]">{p.uhid}</p>
        <p className="mt-1 text-[9px] text-slate-600">{p.ward} · {p.bed}</p>
        <p className="text-[8px] text-slate-400">Admitted: {p.admissionDate}</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Print Wristband</button>
    </ModalOverlay>
  );
}
