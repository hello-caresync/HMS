'use client';

import { SecureParameterBlock, inputClass, ModalOverlay, settingsType } from './settingsUi';

const btnPrimary = 'mt-4 w-full rounded-lg py-3 text-base font-bold text-white';
const btnSecondary = `${btnPrimary} bg-[#0F172A]`;

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Create User" onClose={onClose} wide>
      <input className={inputClass} placeholder="Display name" defaultValue="New Laboratory Technician" />
      <select className={`${inputClass} mt-3`}><option>Doctor</option><option>Nurse</option><option>Finance</option><option>Admin</option><option>Pharmacist</option></select>
      <input className={`${inputClass} mt-3`} placeholder="Department" defaultValue="Laboratory" />
      <div className="mt-3"><SecureParameterBlock verified /></div>
      <button type="button" onClick={onClose} className={`${btnPrimary} bg-[#2563EB]`}>Provision User Account</button>
    </ModalOverlay>
  );
}

export function ConfigureRoleModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Configure Role" onClose={onClose} wide>
      <input className={inputClass} placeholder="Role name" defaultValue="Laboratory Supervisor" />
      <textarea className={`${inputClass} mt-3`} rows={3} placeholder="Module permissions" defaultValue="Lab · Inventory View · Reports Read · No Billing Write" />
      <label className={`mt-3 flex items-center gap-2 ${settingsType.body}`}><input type="checkbox" defaultChecked className="h-4 w-4" /> Field-level masking — patient identifiers</label>
      <button type="button" onClick={onClose} className={btnSecondary}>Save Role Configuration</button>
    </ModalOverlay>
  );
}

export function AddDepartmentModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Add Department" onClose={onClose} wide>
      <input className={inputClass} placeholder="Department name" defaultValue="Interventional Radiology" />
      <select className={`${inputClass} mt-3`}><option>Clinical</option><option>Ancillary</option><option>Support</option></select>
      <input className={`${inputClass} mt-3`} placeholder="Reporting HOD" defaultValue="Dr. Suresh Kulkarni" />
      <button type="button" onClick={onClose} className={`${btnPrimary} bg-[#2563EB]`}>Register Department</button>
    </ModalOverlay>
  );
}

export function SetupIntegrationModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Setup Integration" onClose={onClose} wide>
      <select className={inputClass}><option>HL7 v2.5 — ADT Feed</option><option>FHIR R4 — Patient Registry</option><option>DICOM — PACS Linkage</option><option>REST — Payment Gateway</option></select>
      <input className={`${inputClass} mt-3`} placeholder="Endpoint URL" defaultValue="Internal gateway — TLS 1.3" />
      <div className="mt-3"><SecureParameterBlock verified /></div>
      <input className={`${inputClass} mt-3`} placeholder="Rate limit" defaultValue="500 requests/min" />
      <button type="button" onClick={onClose} className={`${btnPrimary} bg-violet-600`}>Deploy Integration Endpoint</button>
    </ModalOverlay>
  );
}

export function ManageNotificationsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Manage Notifications" onClose={onClose} wide>
      <p className={`${settingsType.body} font-semibold text-slate-600`}>Channel routing — SMS · Email · In-App · Pager</p>
      <div className="mt-3 space-y-2">
        {['Critical Lab Values', 'Bed Availability Alerts', 'Backup Failure Warnings', 'Security Login Anomalies'].map((n) => (
          <label key={n} className={`flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 ${settingsType.body}`}>
            <span>{n}</span>
            <input type="checkbox" defaultChecked={n !== 'Bed Availability Alerts'} className="h-4 w-4" />
          </label>
        ))}
      </div>
      <button type="button" onClick={onClose} className={`${btnPrimary} bg-[#2563EB]`}>Save Notification Rules</button>
    </ModalOverlay>
  );
}

export function BackupSystemModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Backup System" onClose={onClose} wide alert>
      <select className={inputClass}><option>Full Database Snapshot</option><option>Incremental Transaction Log</option><option>Document Storage — DMS</option><option>Offsite DR Replication</option></select>
      <p className={`mt-3 ${settingsType.bodyMuted}`}>Last full backup: 18-Jul-2026 03:00 IST · Retention 30 days</p>
      <div className="mt-3"><SecureParameterBlock verified /></div>
      <button type="button" onClick={onClose} className={`${btnPrimary} bg-emerald-600`}>Trigger Manual Backup Now</button>
    </ModalOverlay>
  );
}
