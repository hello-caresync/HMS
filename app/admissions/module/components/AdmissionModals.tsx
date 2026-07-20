'use client';

import { useState } from 'react';

import { MOCK_BED_GRID, MOCK_INPATIENTS, formatInr } from '../lib/admissionsMockData';
import { inputClass, ModalOverlay, SecureIdentityPlaceholder } from './admissionsUi';

export function AdmitPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Admit Patient" onClose={onClose} wide>
      <div className="space-y-2">
        <SecureIdentityPlaceholder verified />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Patient UHID *</label><input className={inputClass} placeholder="NX-2026-XXXXXX" /></div>
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Admission Type</label><select className={inputClass}><option>Emergency</option><option>Elective</option><option>Referral</option></select></div>
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Department *</label><select className={inputClass}><option>Cardiology</option><option>Orthopedics</option><option>Emergency</option></select></div>
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Consultant</label><input className={inputClass} placeholder="Dr. Anita Roy" /></div>
        </div>
        <button type="button" onClick={onClose} className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Proceed to Bed Allocation</button>
      </div>
    </ModalOverlay>
  );
}

export function AllocateBedModal({ onClose }: { onClose: () => void }) {
  const available = MOCK_BED_GRID.filter((b) => b.status === 'Available');
  return (
    <ModalOverlay title="Allocate Bed" onClose={onClose} wide>
      <p className="mb-2 text-[10px] text-slate-600">Select from {available.length} available beds</p>
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

export function CollectDepositModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('50000');
  return (
    <ModalOverlay title="Collect Admission Deposit" onClose={onClose}>
      <p className="mb-2 text-[11px] text-slate-700">Patient: <strong>Rahul Sharma</strong> · NX-2026-000412</p>
      <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Deposit Amount (INR)</label>
      <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <p className="mt-2 text-[10px] text-slate-500">Package: Cardiac IPD — minimum deposit {formatInr(50000)}</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Record Deposit & Print Receipt</button>
    </ModalOverlay>
  );
}

export function VerifyInsuranceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Verify Insurance / TPA Pre-Auth" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
        <div><dt className="text-slate-400">TPA</dt><dd className="font-semibold">Star Health Insurance</dd></div>
        <div><dt className="text-slate-400">Policy Ref</dt><dd className="italic text-slate-500">[Masked for Security]</dd></div>
        <div><dt className="text-slate-400">Pre-Auth Status</dt><dd className="font-bold text-emerald-600">Approved — ₹5,00,000</dd></div>
        <div><dt className="text-slate-400">Valid Until</dt><dd>2026-07-25</dd></div>
      </dl>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Confirm Verification</button>
    </ModalOverlay>
  );
}

export function PrintAdmissionSlipModal({ onClose }: { onClose: () => void }) {
  const patient = MOCK_INPATIENTS[0];
  return (
    <ModalOverlay title="Admission Slip Preview" onClose={onClose}>
      <div className="rounded-lg border-2 border-[#0F172A] p-4 text-center">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS — IPD Admission</p>
        <p className="mt-2 text-sm font-bold text-[#0F172A]">{patient.patientName}</p>
        <p className="font-mono text-[10px] text-[#2563EB]">{patient.uhid}</p>
        <p className="mt-2 text-[10px] text-slate-600">{patient.ward} · {patient.bed}</p>
        <p className="text-[9px] text-slate-500">Admitted: {patient.admissionDate}</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Print Slip</button>
    </ModalOverlay>
  );
}

export function VisitorPassModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate Visitor Pass" onClose={onClose}>
      <div className="space-y-2">
        <input className={inputClass} placeholder="Visitor name" />
        <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-000412" />
        <select className={inputClass}><option>Ward 3A — 2 visitors max</option><option>ICU — 1 visitor · restricted hours</option></select>
        <button type="button" onClick={onClose} className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Issue Digital Pass</button>
      </div>
    </ModalOverlay>
  );
}

export function TransferPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Transfer Patient" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>{MOCK_INPATIENTS.map((p) => <option key={p.id}>{p.patientName} — {p.ward}</option>)}</select>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="From location" />
        <input className={inputClass} placeholder="To location" />
        <input className={`${inputClass} col-span-2`} placeholder="Clinical reason for transfer" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Submit Transfer Request</button>
    </ModalOverlay>
  );
}
