'use client';

import { useMemo, useState } from 'react';
import { Filter, Users } from 'lucide-react';

import {
  getPatientByUhid,
  MOCK_PATIENTS,
  searchPatients,
  type PatientRecord,
} from '../lib/patientsMockData';
import { PatientPanel, StatusBadge, VerifiedPill } from '../components/patientsUi';
import PatientRecordDrawer from '../components/PatientRecordDrawer';

type DirectorySearchTabProps = {
  lookupQuery: string;
  selectedUhid: string | null;
  onSelectPatient: (uhid: string) => void;
};

export default function DirectorySearchTab({
  lookupQuery,
  selectedUhid,
  onSelectPatient,
}: DirectorySearchTabProps) {
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [aadhaarFilter, setAadhaarFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [referralFilter, setReferralFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [drawerUhid, setDrawerUhid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = searchPatients(lookupQuery);
    if (insuranceFilter !== 'all') {
      list = list.filter((p) =>
        insuranceFilter === 'self-pay' ? p.insuranceId === 'SELF-PAY' : p.insuranceId !== 'SELF-PAY',
      );
    }
    if (aadhaarFilter === 'verified') list = list.filter((p) => p.aadhaarVerified);
    if (aadhaarFilter === 'pending') list = list.filter((p) => !p.aadhaarVerified);
    if (referralFilter !== 'all') list = list.filter((p) => p.referralStatus === referralFilter);
    if (wardFilter !== 'all') {
      list = list.filter((p) =>
        wardFilter === 'assigned' ? p.wardRoom !== '—' : p.wardRoom === '—',
      );
    }
    return list;
  }, [lookupQuery, insuranceFilter, aadhaarFilter, referralFilter, wardFilter]);

  const openDrawer = (uhid: string) => {
    onSelectPatient(uhid);
    setDrawerUhid(uhid);
  };

  return (
    <div className="space-y-3">
      <PatientPanel title="Advanced Search Grid" icon={Filter} subtitle="Multi-attribute filters · click row to open detail drawer">
        <div className="flex flex-wrap gap-2">
          <select
            value={insuranceFilter}
            onChange={(e) => setInsuranceFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by insurance"
          >
            <option value="all">All Insurance</option>
            <option value="insured">Insured</option>
            <option value="self-pay">Self Pay</option>
          </select>
          <select
            value={aadhaarFilter}
            onChange={(e) => setAadhaarFilter(e.target.value as 'all' | 'verified' | 'pending')}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by Aadhaar status"
          >
            <option value="all">Aadhaar — All</option>
            <option value="verified">Aadhaar Verified</option>
            <option value="pending">Aadhaar Pending</option>
          </select>
          <select
            value={referralFilter}
            onChange={(e) => setReferralFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by referral status"
          >
            <option value="all">All Referral Status</option>
            {['Direct', 'Referral In', 'Corporate', 'Emergency Intake'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by ward assignment"
          >
            <option value="all">All Ward Status</option>
            <option value="assigned">Ward Assigned</option>
            <option value="unassigned">No Ward</option>
          </select>
          <span className="ml-auto self-center text-[10px] font-semibold text-[#2563EB]">{filtered.length} records</span>
        </div>
      </PatientPanel>

      <PatientPanel title="Complete Patient Directory" icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-100 bg-[#F8FAFC]">
              <tr>
                {['UHID', 'Name', 'Age/Sex', 'Insurance ID', 'Aadhaar', 'Referral', 'Ward/Room', 'Dept', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <DirectoryRow
                  key={p.uhid}
                  patient={p}
                  selected={selectedUhid === p.uhid}
                  onOpen={() => openDrawer(p.uhid)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </PatientPanel>

      {drawerUhid && getPatientByUhid(drawerUhid) && (
        <PatientRecordDrawer
          patient={getPatientByUhid(drawerUhid)!}
          onClose={() => setDrawerUhid(null)}
        />
      )}
    </div>
  );
}

function DirectoryRow({
  patient,
  selected,
  onOpen,
}: {
  patient: PatientRecord;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <tr
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      role="button"
      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
        selected ? 'bg-blue-50 ring-1 ring-inset ring-[#2563EB]/25' : ''
      }`}
    >
      <td className="px-2 py-1.5 font-mono text-[10px] font-semibold text-[#2563EB]">{patient.uhid}</td>
      <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{patient.name}</td>
      <td className="px-2 py-1.5 text-[10px] text-slate-600">{patient.age} / {patient.gender}</td>
      <td className="px-2 py-1.5 font-mono text-[9px] text-slate-500">{patient.insuranceId}</td>
      <td className="px-2 py-1.5">
        {patient.aadhaarVerified ? (
          <VerifiedPill label="Verified" />
        ) : (
          <span className="text-[9px] font-medium text-amber-600">Masked / Pending</span>
        )}
      </td>
      <td className="px-2 py-1.5 text-[9px] text-slate-600">{patient.referralStatus}</td>
      <td className="px-2 py-1.5 text-[9px] text-slate-600">{patient.wardRoom}</td>
      <td className="px-2 py-1.5 text-[10px] text-slate-600">{patient.department}</td>
      <td className="px-2 py-1.5"><StatusBadge status={patient.status} /></td>
    </tr>
  );
}
