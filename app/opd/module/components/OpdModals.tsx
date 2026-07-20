'use client';

import { OPD_DOCTORS } from '../lib/opdMockData';
import { inputClass, ModalOverlay, SecureIdentityPlaceholder } from './opdUi';

export function CheckInPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Patient Check-In" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Patient UHID *</label>
          <input className={inputClass} placeholder="NX-2026-XXXXXX" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Appointment Ref</label>
          <input className={inputClass} placeholder="APT-2026-XXXX" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Department</label>
          <select className={inputClass}>
            <option>General Medicine</option>
            <option>Pulmonology</option>
            <option>Orthopedics</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Priority Tier</label>
          <select className={inputClass}>
            <option>General</option>
            <option>VIP</option>
            <option>Emergency Queue</option>
          </select>
        </div>
      </div>
      <p className="mt-2 text-[9px] italic text-slate-500">QR scan data: [Identity Verification Checked/Masked for Security]</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Confirm Check-In & Generate Token
      </button>
    </ModalOverlay>
  );
}

export function GenerateTokenModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate OPD Token" onClose={onClose}>
      <p className="mb-2 text-[11px] text-slate-700">
        Next available token: <strong className="text-[#2563EB]">G-044</strong>
      </p>
      <select className={`${inputClass} mb-2`}>
        <option>General Queue</option>
        <option>VIP Queue</option>
        <option>Emergency Queue</option>
      </select>
      <input className={inputClass} placeholder="Patient UHID" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Issue Token & Print
      </button>
    </ModalOverlay>
  );
}

export function AssignDoctorModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Doctor" onClose={onClose} wide>
      <input className={`${inputClass} mb-2`} placeholder="Token / UHID" defaultValue="G-042 · NX-2026-000412" />
      <select className={inputClass}>
        {OPD_DOCTORS.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <select className={`${inputClass} mt-2`}>
        <option>Room 3 — General Medicine</option>
        <option>Room 4 — Pulmonology</option>
        <option>Room 5 — VIP Suite</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Assign & Notify
      </button>
    </ModalOverlay>
  );
}

export function ReferPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Refer Patient" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>Internal Referral — Gastroenterology</option>
        <option>Internal Referral — Cardiology</option>
        <option>External Referral — City Neurology Centre</option>
      </select>
      <textarea className={`${inputClass} min-h-[60px]`} placeholder="Clinical reason for referral" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Submit Referral
      </button>
    </ModalOverlay>
  );
}

export function RecommendAdmissionModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Recommend Admission to IPD" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <div className="mt-2 space-y-2">
        <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-000365" />
        <select className={inputClass}>
          <option>Cardiology Ward</option>
          <option>ICU</option>
          <option>Orthopedics IPD</option>
        </select>
        <textarea className={`${inputClass} min-h-[60px]`} placeholder="Admission justification" defaultValue="Hypertensive crisis — step-up monitoring required" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Route to Admissions Module
      </button>
    </ModalOverlay>
  );
}

export function PrintOpdSlipModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="OPD Slip Preview" onClose={onClose}>
      <div className="rounded-lg border-2 border-[#0F172A] p-4 text-center">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS — OPD Visit</p>
        <p className="mt-2 text-2xl font-bold text-[#2563EB]">G-042</p>
        <p className="text-sm font-bold text-[#0F172A]">Rahul Sharma</p>
        <p className="font-mono text-[10px] text-slate-500">NX-2026-000412</p>
        <p className="mt-2 text-[10px] text-slate-600">Dr. Rajesh Kumar · Room 3</p>
        <p className="text-[9px] text-slate-400">Check-in: 09:12 AM</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">
        Print OPD Slip
      </button>
    </ModalOverlay>
  );
}
