'use client';

import { useState } from 'react';

import { MOCK_EMPLOYEES } from '../lib/staffMockData';
import { inputClass, ModalOverlay } from './staffUi';

export function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Add New Employee" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Full Name *</label><input className={inputClass} /></div>
        <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Department *</label><select className={inputClass}>{['Cardiology', 'Front Office', 'Nursing — ICU', 'HR', 'IT'].map((d) => <option key={d}>{d}</option>)}</select></div>
        <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Designation *</label><input className={inputClass} /></div>
        <div><label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Reporting Manager</label><input className={inputClass} /></div>
        <div className="col-span-2"><button type="button" onClick={onClose} className="w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Create Employee Record</button></div>
      </div>
    </ModalOverlay>
  );
}

export function AssignShiftModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Shift" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>{MOCK_EMPLOYEES.map((e) => <option key={e.id}>{e.name} — {e.department}</option>)}</select>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputClass}><option>Morning (07:00–15:00)</option><option>Evening (14:00–22:00)</option><option>Night (22:00–07:00)</option></select>
        <input type="date" className={inputClass} defaultValue="2026-07-18" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Confirm Assignment</button>
    </ModalOverlay>
  );
}

export function ApproveLeaveModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <ModalOverlay title="Approve Leave Request" onClose={onClose}>
      {!done ? (
        <>
          <p className="text-[11px] text-slate-700"><strong>Arjun Das</strong> — Half-day leave · 19 Jul 2026</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setDone(true)} className="flex-1 rounded-md bg-emerald-600 py-2 text-[11px] font-bold text-white">Approve</button>
            <button type="button" onClick={onClose} className="flex-1 rounded-md bg-red-600 py-2 text-[11px] font-bold text-white">Reject</button>
          </div>
        </>
      ) : (
        <p className="text-center text-[11px] font-semibold text-emerald-700">Leave approved · attendance updated</p>
      )}
    </ModalOverlay>
  );
}

export function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Reset Password" onClose={onClose}>
      <select className={`${inputClass} mb-2`}>{MOCK_EMPLOYEES.map((e) => <option key={e.id}>{e.name}</option>)}</select>
      <p className="text-[10px] text-slate-500">Temporary password will be sent via secure email. User must change on next login.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Send Reset Link</button>
    </ModalOverlay>
  );
}

export function GenerateIdCardModal({ onClose, employeeName, employeeCode }: { onClose: () => void; employeeName: string; employeeCode: string }) {
  return (
    <ModalOverlay title="Generate ID Card" onClose={onClose}>
      <div className="rounded-lg border-2 border-[#0F172A] p-4 text-center">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Nexora HMS Staff ID</p>
        <p className="mt-2 text-sm font-bold text-[#0F172A]">{employeeName}</p>
        <p className="font-mono text-[10px] text-[#2563EB]">{employeeCode}</p>
        <div className="mx-auto mt-2 h-16 w-16 rounded-full bg-slate-200" />
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[11px] font-bold text-white">Print ID Card</button>
    </ModalOverlay>
  );
}
