'use client';

import { useState } from 'react';
import {
  FileText,
  FolderOpen,
  User,
  Wallet,
} from 'lucide-react';

import {
  formatInr,
  MOCK_INVOICES,
  MOCK_TIMELINE,
  type PatientRecord,
} from '../lib/patientsMockData';
import {
  CollapsibleSection,
  DrawerOverlay,
  PatientPanel,
  SecureMaskedField,
  VerifiedPill,
} from './patientsUi';
import PatientTimelineView from '../views/PatientTimelineView';

type PatientRecordDrawerProps = {
  patient: PatientRecord;
  onClose: () => void;
};

export default function PatientRecordDrawer({ patient, onClose }: PatientRecordDrawerProps) {
  const [sections, setSections] = useState({
    profile: true,
    history: true,
    billing: false,
    documents: false,
  });

  const toggle = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const outstanding = MOCK_INVOICES.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

  const docs = [
    { name: 'General Treatment Consent.pdf', type: 'Consent', status: 'Signed' },
    { name: 'Echo Report — 14 Jul.pdf', type: 'Diagnostic', status: 'On file' },
    { name: 'Referral — Cardiology.pdf', type: 'Referral', status: 'On file' },
  ];

  return (
    <DrawerOverlay
      title={patient.name}
      subtitle={`${patient.uhid} · ${patient.department} · ${patient.status}`}
      onClose={onClose}
    >
      <div className="space-y-2">
        <CollapsibleSection title="Patient Profile Summary" open={sections.profile} onToggle={() => toggle('profile')}>
          <PatientPanel title="Contact & Demographics" icon={User} className="border-0 shadow-none">
            <dl className="grid grid-cols-2 gap-2 text-[10px]">
              <div><dt className="text-slate-400">Phone</dt><dd className="font-medium text-[#0F172A]">{patient.phone}</dd></div>
              <div><dt className="text-slate-400">Blood Group</dt><dd className="font-medium text-[#0F172A]">{patient.bloodGroup}</dd></div>
              <div className="col-span-2"><dt className="text-slate-400">Address</dt><dd className="font-medium text-[#0F172A]">{patient.address}</dd></div>
              <div className="col-span-2"><dt className="text-slate-400">Emergency Contact</dt><dd className="font-medium text-[#0F172A]">{patient.emergencyContact}</dd></div>
            </dl>
            <div className="mt-2">
              <p className="text-[9px] font-bold uppercase text-slate-400">Family Members</p>
              <ul className="mt-1 space-y-0.5">
                {patient.familyMembers.map((m) => (
                  <li key={m} className="text-[10px] text-slate-600">{m}</li>
                ))}
              </ul>
            </div>
          </PatientPanel>
        </CollapsibleSection>

        <CollapsibleSection title="Visit & Medical History Timeline" open={sections.history} onToggle={() => toggle('history')}>
          <PatientTimelineView events={MOCK_TIMELINE} compact />
        </CollapsibleSection>

        <CollapsibleSection
          title="Billing Summary"
          open={sections.billing}
          onToggle={() => toggle('billing')}
          badge={<span className="text-[9px] font-bold text-amber-700">{formatInr(outstanding)} due</span>}
        >
          <PatientPanel title="Invoices & Balances" icon={Wallet} className="border-0 shadow-none">
            <div className="mb-2 flex justify-between text-[10px]">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-bold text-[#0F172A]">{formatInr(outstanding)}</span>
            </div>
            <div className="mb-2 flex justify-between text-[10px]">
              <span className="text-slate-500">Credit Balance</span>
              <span className="font-bold text-emerald-700">{formatInr(patient.creditBalance)}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Invoice', 'Description', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="pb-1 pr-2 text-[8px] font-bold uppercase text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50">
                    <td className="py-1 pr-2 font-mono text-[9px] text-[#2563EB]">{inv.id}</td>
                    <td className="py-1 pr-2 text-[9px] text-slate-600">{inv.description}</td>
                    <td className="py-1 pr-2 text-[9px] font-bold tabular-nums">{formatInr(inv.amount)}</td>
                    <td className="py-1 text-[8px] font-semibold">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PatientPanel>
        </CollapsibleSection>

        <CollapsibleSection title="Document & Consent Vault" open={sections.documents} onToggle={() => toggle('documents')}>
          <PatientPanel title="Identity & Documents" icon={FolderOpen} className="border-0 shadow-none">
            <div className="space-y-2">
              <SecureMaskedField label="Aadhaar" verified={patient.aadhaarVerified} docType="Aadhaar" />
              <SecureMaskedField label="Passport / ID" verified={patient.passportVerified} docType="Identity Document" />
            </div>
            <ul className="mt-3 space-y-1.5">
              {docs.map((d) => (
                <li key={d.name} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-[#2563EB]" />
                    <div>
                      <p className="text-[10px] font-semibold text-[#0F172A]">{d.name}</p>
                      <p className="text-[8px] text-slate-400">{d.type}</p>
                    </div>
                  </div>
                  {d.status === 'Signed' ? <VerifiedPill /> : <span className="text-[8px] text-slate-500">{d.status}</span>}
                </li>
              ))}
            </ul>
          </PatientPanel>
        </CollapsibleSection>
      </div>
    </DrawerOverlay>
  );
}
