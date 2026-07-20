'use client';

import { Camera, MapPin, Phone, User } from 'lucide-react';

import { getPatientByUhid } from '../lib/patientsMockData';
import {
  PatientPanel,
  SecureMaskedField,
  SecureVerificationRow,
  StatusBadge,
  VerifiedPill,
} from '../components/patientsUi';

type PatientProfileWorkspaceViewProps = {
  selectedUhid: string | null;
};

export default function PatientProfileWorkspaceView({ selectedUhid }: PatientProfileWorkspaceViewProps) {
  const patient = selectedUhid ? getPatientByUhid(selectedUhid) : getPatientByUhid('NX-2026-000412');

  if (!patient) {
    return (
      <p className="text-[11px] text-slate-500">Select a patient from the directory or search to view profile.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">{patient.name}</h2>
          <p className="font-mono text-[10px] text-[#2563EB]">{patient.uhid}</p>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 lg:col-span-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F172A]">
            <Camera className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Profile Photo Placeholder
          </p>
          <p className="text-[9px] text-slate-400">Secure capture at registration desk</p>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <PatientPanel title="Personal Information" icon={User}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
              {[
                ['Age', `${patient.age} years`],
                ['Gender', patient.gender],
                ['Blood Group', patient.bloodGroup],
                ['Registered', patient.registeredAt],
                ['Primary Dept', patient.department],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="font-medium text-[#0F172A]">{v}</dd>
                </div>
              ))}
            </dl>
          </PatientPanel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <PatientPanel title="Contact Details" icon={Phone}>
          <p className="text-[10px] text-[#0F172A]">{patient.phone}</p>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-600">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            {patient.address}
          </p>
        </PatientPanel>
        <PatientPanel title="Emergency Contact">
          <p className="text-[10px] font-semibold text-[#0F172A]">{patient.emergencyContact}</p>
        </PatientPanel>
      </div>

      <PatientPanel title="Identity Verification Status" subtitle="Government ID — secure vault">
        <div className="space-y-2">
          <SecureMaskedField label="Aadhaar" verified={patient.aadhaarVerified} docType="Aadhaar" />
          <SecureMaskedField label="Passport" verified={patient.passportVerified} docType="Passport" />
          <SecureVerificationRow
            items={[
              { label: 'Identity Document', verified: patient.identityVerified },
              { label: 'Aadhaar e-KYC', verified: patient.aadhaarVerified },
              { label: 'Passport MRZ', verified: patient.passportVerified },
              { label: 'Biometric Match', verified: patient.identityVerified },
            ]}
          />
          {patient.identityVerified && (
            <div className="flex justify-end">
              <VerifiedPill label="Identity Verified" />
            </div>
          )}
        </div>
      </PatientPanel>
    </div>
  );
}
