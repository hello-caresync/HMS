'use client';

import { SecureCompliancePlaceholder, inputClass, ModalOverlay } from './assetUi';

export function RegisterAssetModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Register Asset" onClose={onClose} wide>
      <input className={inputClass} placeholder="Asset name" defaultValue="Philips IntelliVue MX800 Monitor" />
      <select className={`${inputClass} mt-2`}><option>Patient Monitor</option><option>Ventilator</option><option>CT Scanner</option><option>Lab Analyzer</option></select>
      <SecureCompliancePlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Department" defaultValue="ICU" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Register & Generate Tag</button>
    </ModalOverlay>
  );
}

export function AssignAssetModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Asset" onClose={onClose} wide>
      <input className={inputClass} placeholder="Asset tag" defaultValue="NX-AST-002156" />
      <input className={`${inputClass} mt-2`} placeholder="Building / Floor" defaultValue="Critical Care Tower · 3rd Floor" />
      <input className={`${inputClass} mt-2`} placeholder="Department / Room / Bed" defaultValue="ICU · Room ICU-3 · Bed 4" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Confirm Assignment</button>
    </ModalOverlay>
  );
}

export function LogBreakdownModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Log Breakdown" onClose={onClose} wide critical>
      <input className={inputClass} placeholder="Asset tag" defaultValue="NX-AST-005118" />
      <textarea className={`${inputClass} mt-2`} rows={2} placeholder="Issue description" defaultValue="SpO2 module intermittent failure — monitoring compromised" />
      <select className={`${inputClass} mt-2`}><option>Emergency</option><option>Critical</option><option>Normal</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white">Create Breakdown Ticket</button>
    </ModalOverlay>
  );
}

export function AllocateSparePartsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Allocate Spare Parts" onClose={onClose} wide>
      <input className={inputClass} placeholder="Part code" defaultValue="SP-MND-SPO2-MOD" />
      <input className={`${inputClass} mt-2`} placeholder="Linked asset" defaultValue="NX-AST-005118" />
      <input className={`${inputClass} mt-2`} type="number" placeholder="Quantity" defaultValue="1" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-orange-600 py-2 text-[10px] font-bold text-white">Issue Spare Parts</button>
    </ModalOverlay>
  );
}

export function RenewAmcModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Renew AMC" onClose={onClose} wide>
      <input className={inputClass} placeholder="Asset tag" defaultValue="NX-AST-003902" />
      <input className={`${inputClass} mt-2`} placeholder="Vendor" defaultValue="Philips Healthcare" />
      <SecureCompliancePlaceholder verified />
      <input className={`${inputClass} mt-2`} type="date" defaultValue="2027-03-21" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Submit AMC Renewal</button>
    </ModalOverlay>
  );
}

export function PrintTagLabelsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Print Tag Labels" onClose={onClose} wide>
      <input className={inputClass} placeholder="Asset tags (comma-separated)" defaultValue="NX-AST-004821, NX-AST-003902" />
      <select className={`${inputClass} mt-2`}><option>QR Code Label</option><option>RFID Tag</option><option>Barcode + QR Combo</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Send to Label Printer</button>
    </ModalOverlay>
  );
}

export function ScheduleAuditModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Schedule Physical Audit" onClose={onClose} wide>
      <select className={inputClass}><option>Radiology Block</option><option>ICU Tower</option><option>Central Laboratory</option><option>Full Campus</option></select>
      <input className={`${inputClass} mt-2`} type="date" defaultValue="2026-07-25" />
      <SecureCompliancePlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Schedule Audit</button>
    </ModalOverlay>
  );
}
