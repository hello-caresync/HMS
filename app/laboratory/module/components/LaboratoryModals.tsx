'use client';

import { SecureIdentityPlaceholder, inputClass, ModalOverlay } from './laboratoryUi';

export function CollectSampleModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Collect Sample" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Order / Barcode" defaultValue="LAB-2026-8843" />
      <select className={`${inputClass} mt-2`}><option>Venous — EDTA</option><option>Arterial — Blood Gas</option><option>Blood Culture Bottle</option></select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Confirm Collection</button>
    </ModalOverlay>
  );
}

export function PrintBarcodeModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Print Sample Barcode" onClose={onClose}>
      <p className="text-[10px] text-slate-600">Auto-mapped label: BC-LAB-8843-A · Blood Culture</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Print Label</button>
    </ModalOverlay>
  );
}

export function AssignTestModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Test to Analyzer" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}><option>Sysmex XN-1000</option><option>Cobas c702</option><option>VITEK 2 Compact</option></select>
      <input className={inputClass} placeholder="Sample barcode" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Assign & Queue</button>
    </ModalOverlay>
  );
}

export function VerifyResultModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Verify Result — Tech Clearance" onClose={onClose} wide>
      <p className="text-[11px] font-semibold">CBC — Rahul Sharma · WBC 11.2 ×10³/µL</p>
      <input className={`${inputClass} mt-2`} placeholder="Tech digital signature ID" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Submit Tech Verification</button>
    </ModalOverlay>
  );
}

export function ReleaseReportModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Release Report" onClose={onClose}>
      <p className="text-[10px] text-slate-600">Pathologist authorization required for final release to EMR/portal.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Release to EMR</button>
    </ModalOverlay>
  );
}

export function ReportCriticalModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Report Critical Value" onClose={onClose} critical wide>
      <p className="text-[11px] font-bold text-red-700">Critical value escalation — notify ordering physician immediately.</p>
      <select className={`${inputClass} mt-2`}><option>Lactate 4.8 mmol/L — Meera Krishnan</option><option>Troponin-I 0.82 ng/mL — Priya Patel</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Physician notified — callback confirmation" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-red-600 py-2 text-[10px] font-bold text-white animate-pulse">Log Critical Escalation</button>
    </ModalOverlay>
  );
}
