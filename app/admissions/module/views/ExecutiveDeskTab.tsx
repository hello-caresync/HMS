'use client';

import { Fragment, useState } from 'react';
import {
  Activity,
  BedDouble,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

import type { AdmissionModalType } from '../admissionsNav.types';
import {
  ADMISSION_CENSUS,
  formatDateTime,
  MOCK_ADMISSION_REQUESTS,
  MOCK_INPATIENTS,
} from '../lib/admissionsMockData';
import {
  AdmPanel,
  PriorityBadge,
  RequestStatusPill,
  SecureIdentityPlaceholder,
  StatusPill,
} from '../components/admissionsUi';

type ExecutiveDeskTabProps = {
  lookupQuery: string;
  onQuickAction: (action: Exclude<AdmissionModalType, null>) => void;
};

export default function ExecutiveDeskTab({ lookupQuery, onQuickAction }: ExecutiveDeskTabProps) {
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const census = ADMISSION_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filteredRequests = q
    ? MOCK_ADMISSION_REQUESTS.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.uhid.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q),
      )
    : MOCK_ADMISSION_REQUESTS;

  const filteredInpatients = q
    ? MOCK_INPATIENTS.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.uhid.toLowerCase().includes(q) ||
          p.ward.toLowerCase().includes(q),
      )
    : MOCK_INPATIENTS;

  const toggleExpand = (id: string) => {
    setExpandedRequestId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Today's Admissions", value: census.todayAdmissions, accent: true },
          { label: 'Current Inpatients', value: census.currentInpatients },
          { label: 'Pending Admissions', value: census.pendingAdmissions, warn: true },
          { label: 'Scheduled', value: census.scheduled },
          { label: 'Emergency Entries', value: census.emergencyEntries, danger: true },
          { label: 'Bed Occupancy', value: `${census.bedOccupancyPercent}%`, accent: true },
          { label: "Today's Discharges", value: census.todayDischarges, success: true },
          { label: 'Avg Length of Stay', value: `${census.avgLengthOfStay}d` },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2.5 ${k.danger ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0]'}`}
          >
            <p
              className={`text-lg font-bold tabular-nums ${
                k.accent ? 'text-[#2563EB]' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : 'text-[#0F172A]'
              }`}
            >
              {k.value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <AdmPanel
          title="Active Admission Requests Queue"
          subtitle="Doctor · Emergency · Elective · Referral — priority sorted"
          icon={ClipboardList}
          className="xl:col-span-7"
          headerRight={
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
              {filteredRequests.filter((r) => r.status === 'Pending' || r.status === 'In Progress').length} active
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['', 'Request', 'Patient', 'Source', 'Priority', 'Department', 'Doctor', 'Time', 'Status'].map((h) => (
                    <th key={h || 'expand'} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const expanded = expandedRequestId === req.id;
                  return (
                    <Fragment key={req.id}>
                      <tr
                        className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/80"
                        onClick={() => toggleExpand(req.id)}
                      >
                        <td className="px-1 py-1.5">
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[9px] font-bold text-[#2563EB]">{req.id}</td>
                        <td className="px-2 py-1.5">
                          <p className="text-[10px] font-semibold text-[#0F172A]">{req.patientName}</p>
                          <p className="font-mono text-[8px] text-slate-500">{req.uhid}</p>
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-slate-600">{req.source}</td>
                        <td className="px-2 py-1.5">
                          <PriorityBadge priority={req.priority} />
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-slate-600">{req.department}</td>
                        <td className="px-2 py-1.5 text-[9px] text-slate-500">{req.requestingDoctor}</td>
                        <td className="px-2 py-1.5 text-[9px] text-slate-500">{formatDateTime(req.requestedAt)}</td>
                        <td className="px-2 py-1.5">
                          <RequestStatusPill status={req.status} />
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                          <td colSpan={9} className="px-3 py-2">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              <SecureIdentityPlaceholder verified={req.identityVerified} />
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAction('admit-patient');
                                  }}
                                  className="rounded-md bg-[#2563EB] px-2 py-1 text-[9px] font-bold text-white"
                                >
                                  Admit Now
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAction('allocate-bed');
                                  }}
                                  className="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-[9px] font-semibold"
                                >
                                  Allocate Bed
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAction('verify-insurance');
                                  }}
                                  className="rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-[9px] font-semibold"
                                >
                                  Verify Insurance
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdmPanel>

        <AdmPanel
          title="Inpatient Monitoring Console"
          subtitle="Ward census · nursing assignments · discharge targets"
          icon={HeartPulse}
          className="xl:col-span-5"
        >
          <ul className="space-y-1">
            {filteredInpatients.map((p) => (
              <li key={p.id} className="rounded border border-[#E2E8F0] px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-[#0F172A]">{p.patientName}</p>
                    <p className="font-mono text-[8px] text-[#2563EB]">{p.uhid}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <dl className="mt-1 grid grid-cols-2 gap-x-2 text-[9px] text-slate-600">
                  <div>
                    <dt className="text-slate-400">Ward / Bed</dt>
                    <dd className="font-medium">{p.ward} · {p.bed}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Nurse</dt>
                    <dd>{p.nurseAssigned}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Admitted</dt>
                    <dd>{p.admissionDate}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Expected Discharge</dt>
                    <dd className="font-semibold text-indigo-700">{p.expectedDischarge}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </AdmPanel>
      </div>

      <AdmPanel title="Quick Actions" icon={Zap} subtitle="One-click operational shortcuts">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
          {[
            { id: 'admit-patient' as const, label: 'Admit Patient', icon: UserPlus },
            { id: 'allocate-bed' as const, label: 'Allocate Bed', icon: BedDouble },
            { id: 'transfer-patient' as const, label: 'Transfer Patient', icon: Activity },
            { id: 'collect-deposit' as const, label: 'Collect Deposit', icon: CreditCard },
            { id: 'verify-insurance' as const, label: 'Verify Insurance', icon: ShieldCheck },
            { id: 'print-slip' as const, label: 'Print Admission Slip', icon: FileText },
            { id: 'visitor-pass' as const, label: 'Generate Visitor Pass', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2.5 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[9px] font-semibold text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </AdmPanel>
    </div>
  );
}
