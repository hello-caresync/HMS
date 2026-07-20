'use client';

import { SecureAdminPlaceholder, inputClass, ModalOverlay } from './administrationUi';

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create User" onClose={onClose} wide>
      <input className={inputClass} placeholder="Display name" defaultValue="New Billing Operator" />
      <select className={`${inputClass} mt-2`}><option>Billing Operator</option><option>Clinical HOD</option><option>Quality Auditor</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Department" defaultValue="Billing" />
      <SecureAdminPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Create User Account</button>
    </ModalOverlay>
  );
}

export function IncidentReportModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Trigger Incident Report" onClose={onClose} wide critical>
      <select className={inputClass}><option>Patient Fall</option><option>Equipment Failure</option><option>Medication Near-Miss</option><option>Security Breach</option></select>
      <textarea className={`${inputClass} mt-2`} rows={2} placeholder="Description" defaultValue="Report incident details — location, time, immediate actions taken" />
      <select className={`${inputClass} mt-2`}><option>IPD</option><option>Emergency</option><option>Pharmacy</option><option>CSSD</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white">Submit Incident Report</button>
    </ModalOverlay>
  );
}

export function ProcessApprovalModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Process Approval" onClose={onClose} wide>
      <p className="text-[10px] font-semibold">Leave Request — Nurse Kavita Joshi</p>
      <textarea className={`${inputClass} mt-2`} rows={2} placeholder="Approval notes" defaultValue="Approved — Ward C float coverage confirmed" />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Approve</button>
        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-red-200 bg-red-50 py-2 text-[10px] font-bold text-red-700">Reject</button>
      </div>
    </ModalOverlay>
  );
}

export function PublishPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Publish Policy" onClose={onClose} wide>
      <input className={inputClass} placeholder="Policy title" defaultValue="Infection Control Protocol — Monsoon Season 2026 v3.2" />
      <select className={`${inputClass} mt-2`}><option>All Staff</option><option>Clinical Only</option><option>Administration</option></select>
      <SecureAdminPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Publish Policy</button>
    </ModalOverlay>
  );
}

export function RegisterVisitorModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Register Visitor" onClose={onClose} wide>
      <input className={inputClass} placeholder="Visitor name" defaultValue="External Quality Auditor" />
      <input className={`${inputClass} mt-2`} placeholder="Purpose" defaultValue="NABH pre-assessment walkthrough" />
      <SecureAdminPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Host department" defaultValue="Quality & Administration" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Issue Visitor Pass</button>
    </ModalOverlay>
  );
}

export function EmergencyProtocolModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Deploy Emergency Protocol" onClose={onClose} wide critical>
      <select className={inputClass}><option>Code Blue — Cardiac Arrest</option><option>Code Red — Fire</option><option>Mass Casualty Incident</option><option>Internal Disaster</option></select>
      <p className="mt-2 text-[9px] text-red-700">Broadcasts alert to all departments · activates escalation tree · logs immutable audit entry</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white animate-pulse">Deploy Protocol Now</button>
    </ModalOverlay>
  );
}
