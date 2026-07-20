'use client';

import { SecureIdentityPlaceholder, inputClass, ModalOverlay } from './hpWorkspaceUi';

export function RegisterPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Register Patient" onClose={onClose} wide>
      <input className={inputClass} placeholder="Full name" defaultValue="New OPD Registration" />
      <input className={`${inputClass} mt-2`} placeholder="Age / Gender" defaultValue="42 / Male" />
      <SecureIdentityPlaceholder verified />
      <select className={`${inputClass} mt-2`}><option>OPD — General Medicine</option><option>Emergency — Walk-in</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Register & Generate UHID</button>
    </ModalOverlay>
  );
}

export function CreateAppointmentModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create Appointment" onClose={onClose} wide>
      <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-004755" />
      <select className={`${inputClass} mt-2`}><option>Dr. Arjun Rao — Orthopedics</option><option>Dr. Vikram Patil — Cardiology</option></select>
      <input className={`${inputClass} mt-2`} type="datetime-local" defaultValue="2026-07-19T10:30" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Schedule Appointment</button>
    </ModalOverlay>
  );
}

export function AdmitPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Admit Patient" onClose={onClose} wide>
      <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-004821" />
      <select className={`${inputClass} mt-2`}><option>IPD Ward B — Bed 18</option><option>ICU — Bed 4</option></select>
      <SecureIdentityPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Admission diagnosis" defaultValue="Polytrauma — MVA, observation & monitoring" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Confirm Admission</button>
    </ModalOverlay>
  );
}

export function GenerateBillModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Generate Bill" onClose={onClose} wide>
      <input className={inputClass} placeholder="Patient UHID" defaultValue="NX-2026-004798" />
      <select className={`${inputClass} mt-2`}><option>IPD Consolidated</option><option>OPD Consultation</option><option>Emergency Quick Bill</option></select>
      <SecureIdentityPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-bold text-white">Generate Invoice</button>
    </ModalOverlay>
  );
}

export function CreatePurchaseRequestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create Purchase Request" onClose={onClose} wide>
      <input className={inputClass} placeholder="Item description" defaultValue="Piperacillin-Tazobactam 4.5g — critical replenishment" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Quantity" defaultValue="100" />
      <select className={`${inputClass} mt-2`}><option>Pharmacy Stores</option><option>OT Consumables</option><option>Lab Reagents</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-orange-600 py-2 text-[10px] font-bold text-white">Submit PR</button>
    </ModalOverlay>
  );
}

export function ApproveRequestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Approve Request" onClose={onClose} wide>
      <p className="text-[10px] font-semibold text-[#0F172A]">PR-2026-11842 — Surgical suture kit replenishment</p>
      <p className="mt-1 text-[9px] text-slate-500">Requested by OT Stores · Amount ₹84,200</p>
      <textarea className={`${inputClass} mt-2`} rows={2} placeholder="Approval notes" defaultValue="Approved — vendor lead time confirmed 48hrs" />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Approve</button>
        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-red-200 bg-red-50 py-2 text-[10px] font-bold text-red-700">Reject</button>
      </div>
    </ModalOverlay>
  );
}
