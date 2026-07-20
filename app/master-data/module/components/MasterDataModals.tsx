'use client';

import { SecureLicensePlaceholder, inputClass, ModalOverlay } from './masterDataUi';

export function NewMasterRecordModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="New Master Record" onClose={onClose} wide>
      <select className={inputClass}><option>Service & Charge Master</option><option>Doctor Master</option><option>Vendor Master</option><option>Lab Test Master</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Record code" defaultValue="SRV-OPD-NEURO-NEW" />
      <input className={`${inputClass} mt-2`} placeholder="Description" defaultValue="Neurology OPD — Senior Consultant" />
      <SecureLicensePlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Create Master Record</button>
    </ModalOverlay>
  );
}

export function DuplicateScanModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Run Duplicate Scan" onClose={onClose} wide>
      <p className="text-[10px] text-slate-700">Scan scope: Doctor · Vendor · Lab Test · Employee masters</p>
      <div className="mt-2 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-[9px]">
        <p className="font-bold text-amber-800">3 potential duplicates detected</p>
        <p>Doctor Master — 94% match · Vendor Master — 88% · Lab Test — 91%</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-amber-600 py-2 text-[10px] font-bold text-white">View AI Duplicate Report</button>
    </ModalOverlay>
  );
}

export function AuditLogsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Audit Logs View" onClose={onClose} wide>
      <select className={inputClass}><option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select>
      <p className="mt-2 text-[9px] text-slate-600">Immutable audit trail — previous vs updated value differentials</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Open Full Audit Ledger</button>
    </ModalOverlay>
  );
}

export function AssignPermissionsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Permissions" onClose={onClose} wide>
      <select className={inputClass}><option>Billing Configurator</option><option>Clinical Read-Only</option><option>MDM Administrator</option></select>
      <input className={`${inputClass} mt-2`} placeholder="User / Role group" defaultValue="Billing Admin Team" />
      <SecureLicensePlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-bold text-white">Save Permissions</button>
    </ModalOverlay>
  );
}

export function UpdateChargeMasterModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Update Charge Master" onClose={onClose} wide>
      <input className={inputClass} placeholder="Service code" defaultValue="SRV-OPD-GEN" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Base price" defaultValue="850" />
      <input className={`${inputClass} mt-2`} placeholder="Discount rule" defaultValue="Senior Citizen 10%" />
      <input className={`${inputClass} mt-2`} placeholder="Insurance rate" defaultValue="Star Health Standard OPD" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Submit for Approval</button>
    </ModalOverlay>
  );
}

export function SyncSubModulesModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Sync Sub-Modules" onClose={onClose} wide>
      <p className="text-[10px] text-slate-700">Push reference data to: OPD · IPD · Billing · Laboratory · Pharmacy · Procurement</p>
      <div className="mt-2 space-y-1 text-[9px]">
        {['Billing charge sync', 'Lab test catalog', 'Pharmacy formulary', 'Vendor registry'].map((s) => (
          <label key={s} className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-3 w-3" />
            {s}
          </label>
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-teal-600 py-2 text-[10px] font-bold text-white">Run Sync</button>
    </ModalOverlay>
  );
}

export function AutoMergerModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalOverlay title="AI Auto-Merger Suggestion" onClose={onClose} wide>
      <p className="text-[10px] font-semibold">Merge duplicate doctor profiles?</p>
      <p className="mt-1 text-[9px] text-slate-600">Dr. Vikram Patil — Cardiology ↔ Dr V. Patil — Cardiac Sciences (94% match)</p>
      <p className="mt-2 text-[9px] text-violet-700">Retain: NX-DOC-0042 · Consolidate consultation charges · Archive duplicate</p>
      <SecureLicensePlaceholder verified />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Confirm Merge</button>
        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-slate-200 py-2 text-[10px] font-bold text-slate-600">Dismiss</button>
      </div>
    </ModalOverlay>
  );
}
