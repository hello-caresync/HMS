'use client';

import { SecureIdentityPlaceholder, inputClass, ModalOverlay } from './radiologyUi';

export function ScheduleScanModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Schedule Imaging Scan" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <select className={`${inputClass} mt-2`}>
        <option>CT — Chest with Contrast</option>
        <option>MRI — Brain Stroke Protocol</option>
        <option>X-Ray — Chest PA/Lateral</option>
        <option>Ultrasound — Abdomen RUQ</option>
      </select>
      <input className={`${inputClass} mt-2`} type="datetime-local" defaultValue="2026-07-18T14:00" />
      <select className={`${inputClass} mt-2`}>
        <option>Routine</option>
        <option>STAT Emergency</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Confirm Schedule
      </button>
    </ModalOverlay>
  );
}

export function CheckInPatientModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Check-In Patient — Radiology Reception" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <input className={`${inputClass} mt-2`} placeholder="Order number" defaultValue="RAD-2026-5518" />
      <p className="mt-2 text-[9px] text-slate-500">Patient wristband scan verified · safety questionnaire initiated</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Complete Check-In
      </button>
    </ModalOverlay>
  );
}

export function AssignTechnicianModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Assign Radiographer / Technician" onClose={onClose} wide>
      <select className={`${inputClass} mb-2`}>
        <option>Tech Ravi K. — CT Certified</option>
        <option>Tech Anita R. — MRI Certified</option>
        <option>Tech Joseph M. — General Radiography</option>
      </select>
      <select className={inputClass}>
        <option>Siemens SOMATOM go.Top — CT-2</option>
        <option>Philips Ingenia 1.5T — MR-1</option>
        <option>Carestream DRX-Evolution — XR-3</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Assign & Notify
      </button>
    </ModalOverlay>
  );
}

export function UploadImagesModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Upload Images to PACS" onClose={onClose} wide>
      <p className="text-[10px] text-slate-600">DICOM C-STORE destination: PACS-NEXORA-01 · AE Title: NEXORA_RIS</p>
      <input className={`${inputClass} mt-2`} placeholder="Study Instance UID" defaultValue="1.2.840.113619.2.55.3.604688119.968.1752825600" />
      <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
        <p className="text-[10px] font-semibold text-slate-600">Drop DICOM files or click to browse</p>
        <p className="mt-1 text-[8px] text-slate-400">Supports .dcm series · auto-validates modality & patient match</p>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Upload to PACS Archive
      </button>
    </ModalOverlay>
  );
}

export function VerifyReportModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Verify Report — Radiologist Review" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <p className="mt-2 text-[11px] font-semibold text-[#0F172A]">CT Abdomen/Pelvis — Sanjay Rao</p>
      <p className="mt-1 text-[10px] text-red-700">Impression: Large heterogeneous hepatic mass — 8.2 cm segment VII.</p>
      <input className={`${inputClass} mt-2`} placeholder="Radiologist digital signature ID" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">
        Submit Verification
      </button>
    </ModalOverlay>
  );
}

export function ReleaseReportModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Release Report to EMR / Patient Portal" onClose={onClose}>
      <p className="text-[10px] text-slate-600">Final radiologist authorization required before release to ordering physician and patient portal.</p>
      <SecureIdentityPlaceholder verified />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">
        Release to EMR & Portal
      </button>
    </ModalOverlay>
  );
}
