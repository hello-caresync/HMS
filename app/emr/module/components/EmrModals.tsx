'use client';

import type { EmrPatient } from '../lib/emrMockData';
import { ModalOverlay, SecureIdentityPlaceholder } from './emrUi';

export function PrintFullEmrModal({ onClose, patient }: { onClose: () => void; patient: EmrPatient }) {
  return (
    <ModalOverlay title="Print Full EMR Record" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified={patient.identityVerified} />
      <p className="mt-2 text-[11px] text-[#0F172A]">
        <strong>{patient.name}</strong> · {patient.uhid}
      </p>
      <p className="mt-1 text-[10px] text-slate-600">Certified print bundle includes all audited folders, timeline, and compliance watermark. No clinical edits permitted from this module.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Generate Print Job</button>
    </ModalOverlay>
  );
}

export function ExportSummaryModal({ onClose, patient }: { onClose: () => void; patient: EmrPatient }) {
  return (
    <ModalOverlay title="Export Certified Clinical Summary" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified={patient.identityVerified} />
      <select className="mt-2 w-full rounded-md border border-[#E2E8F0] px-2 py-1.5 text-[10px]">
        <option>PDF — NABH Certified Format</option>
        <option>PDF — Insurance TPA Summary</option>
        <option>HL7 FHIR Bundle — Read Only</option>
      </select>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Export with Audit Stamp</button>
    </ModalOverlay>
  );
}

export function PrintRecordModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Print Medical Record" onClose={onClose}>
      <p className="text-[10px] text-slate-600">Selected record section will be printed with view-only watermark and access log entry.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Print Section</button>
    </ModalOverlay>
  );
}

export function DownloadAuditedModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Download Audited EMR" onClose={onClose}>
      <p className="text-[10px] text-slate-600">Encrypted archive with SHA-256 integrity hash and audit trail reference ID.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Download Archive</button>
    </ModalOverlay>
  );
}

export function ShareRecordModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Share Record (Authorized)" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <input className="mt-2 w-full rounded-md border border-[#E2E8F0] px-2 py-1.5 text-[10px]" placeholder="Authorized recipient — facility or clinician" />
      <p className="mt-2 text-[9px] italic text-slate-500">Sharing requires active consent and RBAC approval. All shares logged.</p>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Request Authorized Share</button>
    </ModalOverlay>
  );
}

export function VerifyDocumentsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Verify Documents" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified />
      <ul className="mt-2 space-y-1 text-[10px]">
        {['Registration ID Proof', 'Insurance Card Scan', 'Consent Form v2.1', 'Discharge Summary'].map((doc) => (
          <li key={doc} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
            <span>{doc}</span>
            <span className="text-[8px] font-bold uppercase text-emerald-600">Verified</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Close Verification Panel</button>
    </ModalOverlay>
  );
}

export function PatientSummaryModal({ onClose, patient }: { onClose: () => void; patient: EmrPatient }) {
  return (
    <ModalOverlay title="Patient Clinical Summary" onClose={onClose} wide>
      <SecureIdentityPlaceholder verified={patient.identityVerified} />
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
        <div><dt className="text-slate-400">Patient</dt><dd className="font-bold">{patient.name}</dd></div>
        <div><dt className="text-slate-400">UHID</dt><dd className="font-mono text-[#2563EB]">{patient.uhid}</dd></div>
        <div><dt className="text-slate-400">Age/Gender</dt><dd>{patient.ageGender}</dd></div>
        <div><dt className="text-slate-400">Blood Group</dt><dd>{patient.bloodGroup}</dd></div>
        <div><dt className="text-slate-400">Primary Consultant</dt><dd>{patient.primaryConsultant}</dd></div>
        <div><dt className="text-slate-400">Last Visit</dt><dd>{patient.lastVisit}</dd></div>
      </dl>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Generate Summary PDF</button>
    </ModalOverlay>
  );
}
