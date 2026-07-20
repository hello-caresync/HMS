'use client';

import { ER_DOCTORS, INITIAL_ER_BEDS } from '../lib/emergencyMockData';
import { inputClass, ModalOverlay, SecureIdentityPlaceholder } from './emergencyUi';

export function RegisterEmergencyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Emergency Registration" onClose={onClose} wide>
      <SecureIdentityPlaceholder unknown />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[9px] font-semibold uppercase text-slate-500">Registration Type</label>
          <select className={inputClass}>
            <option>Known Patient — UHID lookup</option>
            <option>Unknown Patient — Trauma</option>
            <option>Walk-in Emergency</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-semibold uppercase text-slate-500">Arrival Mode</label>
          <select className={inputClass}>
            <option>Ambulance</option>
            <option>Walk-in</option>
            <option>Police Referral</option>
          </select>
        </div>
        <input className={`${inputClass} col-span-2`} placeholder="Chief complaint" />
        <label className="col-span-2 flex items-center gap-2 text-[10px]">
          <input type="checkbox" /> Medico-Legal Case (MLC) flag
        </label>
      </div>
      <p className="mt-2 text-[8px] italic text-slate-500">Identity proof documents: [Identity Verification Checked/Masked for Security]</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Register & Queue for Triage
      </button>
    </ModalOverlay>
  );
}

export function StartTriageModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Start Triage Assessment" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[9px] font-semibold uppercase text-slate-500">GCS Score</label>
          <input className={inputClass} type="number" min={3} max={15} defaultValue={15} />
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-semibold uppercase text-slate-500">Priority</label>
          <select className={inputClass}>
            <option>Critical — RED</option>
            <option>Emergent — ORANGE</option>
            <option>Urgent — YELLOW</option>
            <option>Non-Urgent — GREEN</option>
          </select>
        </div>
        <input className={`${inputClass} col-span-2`} placeholder="Chief complaint summary" />
        <input className={`${inputClass} col-span-2`} placeholder="Vitals snapshot — BP, HR, SpO₂, RR" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Complete Triage & Assign Queue
      </button>
    </ModalOverlay>
  );
}

export function AssignDoctorModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign ER Doctor" onClose={onClose}>
      <input className={`${inputClass} mb-2`} placeholder="ER Number / Patient" defaultValue="ER-2026-0842" />
      <select className={inputClass}>
        {ER_DOCTORS.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Assign Doctor
      </button>
    </ModalOverlay>
  );
}

export function AllocateErBedModal({ onClose }: { onClose: () => void }) {
  const available = INITIAL_ER_BEDS.filter((b) => b.status === 'Available');
  return (
    <ModalOverlay title="Allocate ER Bed" onClose={onClose} wide>
      <p className="mb-2 text-[10px] text-slate-600">{available.length} beds available</p>
      <div className="grid grid-cols-2 gap-1.5">
        {available.map((b) => (
          <button key={b.id} type="button" onClick={onClose} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-semibold text-emerald-800 hover:border-[#2563EB]">
            {b.bedLabel}<br /><span className="text-[8px] font-normal">{b.bay}</span>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}

export function DispatchAmbulanceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Dispatch Ambulance" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>AMB-05 — Delta-5 (Available)</option>
        <option>AMB-07 — Alpha-7 (Returning — ETA 8 min)</option>
      </select>
      <input className={inputClass} placeholder="Pickup location" />
      <input className={`${inputClass} mt-2`} placeholder="Incident type / chief complaint" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Dispatch & Send GPS Link
      </button>
    </ModalOverlay>
  );
}

export function ActivateCodeBlueModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalOverlay title="Activate Code Blue" onClose={onClose} critical>
      <p className="text-[11px] font-semibold text-red-700">This will alert resuscitation team, ICU liaison, and broadcast hospital-wide.</p>
      <select className={`${inputClass} mt-2`}>
        <option>Resuscitation Bay — Resus-1</option>
        <option>Trauma Bay — Trauma-2</option>
        <option>Observation — Obs-5</option>
      </select>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-[#E2E8F0] py-2 text-[10px] font-bold">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="flex-1 rounded-md bg-red-600 py-2 text-[10px] font-bold text-white animate-pulse"
        >
          Activate Code Blue
        </button>
      </div>
    </ModalOverlay>
  );
}
