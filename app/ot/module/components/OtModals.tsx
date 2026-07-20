'use client';

import { MOCK_OT_ROOMS, MOCK_SURGICAL_TEAMS } from '../lib/otMockData';
import { inputClass, ModalOverlay, SecureIdentityPlaceholder } from './otUi';

export function ScheduleSurgeryModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Schedule Surgery" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Patient UHID" />
        <input className={inputClass} placeholder="Procedure name" />
        <select className={inputClass}><option>Dr. Kapoor</option><option>Dr. Anita Roy</option><option>Dr. Rajesh Kumar</option></select>
        <select className={inputClass}>{MOCK_OT_ROOMS.filter((r) => r.status === 'Available').map((r) => <option key={r.id}>{r.roomLabel}</option>)}</select>
        <input className={inputClass} type="datetime-local" />
        <label className="flex items-center gap-2 text-[10px]"><input type="checkbox" /> Emergency OT</label>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Confirm Schedule</button>
    </ModalOverlay>
  );
}

export function AssignOtRoomModal({ onClose }: { onClose: () => void }) {
  const available = MOCK_OT_ROOMS.filter((r) => r.status === 'Available');
  return (
    <ModalOverlay title="Assign OT Room" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-1.5">
        {available.map((r) => (
          <button key={r.id} type="button" onClick={onClose} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-semibold text-emerald-800 hover:border-[#2563EB]">
            {r.roomLabel}<br /><span className="text-[8px] font-normal">{r.floor}</span>
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}

export function AssignTeamModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Surgical Team" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>{MOCK_SURGICAL_TEAMS.map((t) => <option key={t.id}>{t.otRoom}</option>)}</select>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <input className={inputClass} placeholder="Surgeon" />
        <input className={inputClass} placeholder="Assistant" />
        <input className={inputClass} placeholder="Anesthesiologist" />
        <input className={inputClass} placeholder="OT Nurse" />
        <input className={`${inputClass} col-span-2`} placeholder="Technician" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Save Team Assignment</button>
    </ModalOverlay>
  );
}

export function VerifyChecklistModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Verify Pre-Operative Checklist" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <ul className="mt-2 space-y-1 text-[10px]">
        {['Patient Identification', 'Fasting Status', 'Allergy Verification', 'Blood Bank Request', 'Implant Verification', 'Consent Form'].map((item) => (
          <li key={item} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
            <span>{item}</span>
            <input type="checkbox" defaultChecked={item !== 'Blood Bank Request'} />
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Mark Checklist Verified</button>
    </ModalOverlay>
  );
}

export function RequestBloodModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Request Blood / Blood Products" onClose={onClose}>
      <input className={`${inputClass} mb-2`} placeholder="Case / Patient UHID" defaultValue="OT-2026-0415" />
      <select className={inputClass}><option>PRBC — 2 units</option><option>FFP — 4 units</option><option>Platelets — 1 unit</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Submit to Blood Bank</button>
    </ModalOverlay>
  );
}

export function PrintScheduleModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="OT Schedule — Today" onClose={onClose} wide>
      <div className="rounded-lg border-2 border-[#0F172A] p-3 text-[10px]">
        <p className="text-center text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS — OT Daily Schedule</p>
        <p className="mt-2 text-center font-bold">2026-07-18 · 18 Cases · 72% Utilization</p>
        <ul className="mt-2 space-y-1">
          <li>08:00 OT-3 — Arjun Das — TKR Left — Dr. Kapoor</li>
          <li>09:30 OT-1 — Vikram Patel — Craniotomy — Dr. Meera Iyer [EMERGENCY]</li>
          <li>11:00 OT-5 — Somnath Reddy — Lap Chole — Dr. Anita Roy</li>
        </ul>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Print Schedule</button>
    </ModalOverlay>
  );
}
