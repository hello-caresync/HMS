'use client';

import {
  BedDouble,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  Printer,
  Stethoscope,
  UserCog,
  UserRound,
  Zap,
} from 'lucide-react';

import type { DirectoryGroupBy, IpdModalType } from '../ipdNav.types';
import type { IpdInpatient } from '../lib/ipdMockData';
import { IPD_CENSUS } from '../lib/ipdMockData';
import { ClinicalStatusPill, IpdPanel, VitalCompliancePill } from '../components/ipdUi';

type OperationalConsoleTabProps = {
  lookupQuery: string;
  groupBy: DirectoryGroupBy;
  onGroupByChange: (g: DirectoryGroupBy) => void;
  inpatients: IpdInpatient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  onQuickAction: (action: Exclude<IpdModalType, null>) => void;
};

export default function OperationalConsoleTab({
  lookupQuery,
  groupBy,
  onGroupByChange,
  inpatients,
  selectedPatientId,
  onSelectPatient,
  onQuickAction,
}: OperationalConsoleTabProps) {
  const census = IPD_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filtered = q
    ? inpatients.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          p.uhid.toLowerCase().includes(q) ||
          p.ward.toLowerCase().includes(q) ||
          p.room.toLowerCase().includes(q) ||
          p.bed.toLowerCase().includes(q),
      )
    : inpatients;

  const groupKey = (p: IpdInpatient) => {
    if (groupBy === 'ward') return p.ward;
    if (groupBy === 'room') return `${p.ward} · ${p.room}`;
    return `${p.ward} · ${p.room} · ${p.bed}`;
  };

  const grouped = filtered.reduce<Record<string, IpdInpatient[]>>((acc, p) => {
    const key = groupKey(p);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-9">
        {[
          { label: 'Current Inpatients', value: census.currentInpatients },
          { label: "Today's Admissions", value: census.todayAdmissions, accent: true },
          { label: "Today's Discharges", value: census.todayDischarges, success: true },
          { label: 'ICU Patients', value: census.icuPatients, danger: true },
          { label: 'Ward Occupancy', value: census.wardOccupancy },
          { label: 'Bed Occupancy', value: `${census.bedOccupancyPercent}%`, accent: true },
          { label: 'ALOS', value: `${census.avgLengthOfStay}d` },
          { label: 'Critical Patients', value: census.criticalPatients, danger: true },
          { label: 'Expected Discharges', value: census.expectedDischarges, success: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0]'}`}>
            <p className={`text-base font-bold tabular-nums ${k.accent ? 'text-[#2563EB]' : k.success ? 'text-emerald-600' : k.danger ? 'text-red-600' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <IpdPanel
        title="Master Inpatient Directory"
        subtitle="Ward · room · bed allocations with clinical & nursing flags"
        icon={ClipboardList}
        headerRight={
          <div className="flex gap-1">
            {(['ward', 'room', 'bed'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGroupByChange(g)}
                className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
                  groupBy === g ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {g}-wise
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-2">
          {Object.entries(grouped).map(([group, rows]) => (
            <div key={group}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{group}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                      {['Patient', 'UHID', 'Clinical', 'Nursing Station', 'Nurse', 'Consultant', 'Admitted', 'Exp. Discharge', 'Vitals'].map((h) => (
                        <th key={h} className="px-2 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => onSelectPatient(p.id)}
                        className={`cursor-pointer border-b border-slate-50 hover:bg-blue-50/40 ${
                          selectedPatientId === p.id ? 'bg-blue-50 ring-1 ring-inset ring-[#2563EB]/30' : ''
                        }`}
                      >
                        <td className="px-2 py-1 text-[10px] font-semibold text-[#0F172A]">{p.patientName}</td>
                        <td className="px-2 py-1 font-mono text-[8px] text-[#2563EB]">{p.uhid}</td>
                        <td className="px-2 py-1"><ClinicalStatusPill status={p.clinicalStatus} /></td>
                        <td className="px-2 py-1 text-[9px] text-slate-600">{p.nursingStation}</td>
                        <td className="px-2 py-1 text-[9px] text-slate-600">{p.assignedNurse}</td>
                        <td className="px-2 py-1 text-[9px] text-slate-500">{p.consultant}</td>
                        <td className="px-2 py-1 text-[9px] text-slate-500">{p.admissionDate}</td>
                        <td className="px-2 py-1 text-[9px] font-semibold text-indigo-700">{p.expectedDischarge}</td>
                        <td className="px-2 py-1"><VitalCompliancePill status={p.vitalCompliance} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </IpdPanel>

      <IpdPanel title="Quick Actions" icon={Zap} subtitle="Inpatient operational shortcuts">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
          {[
            { id: 'view-inpatient' as const, label: 'View Inpatient', icon: UserRound },
            { id: 'allocate-bed' as const, label: 'Allocate Bed', icon: BedDouble },
            { id: 'transfer-patient' as const, label: 'Transfer Patient', icon: Stethoscope },
            { id: 'assign-nurse' as const, label: 'Assign Nurse', icon: UserCog },
            { id: 'schedule-round' as const, label: 'Schedule Doctor Round', icon: CalendarClock },
            { id: 'initiate-discharge' as const, label: 'Initiate Discharge', icon: DoorOpen },
            { id: 'print-wristband' as const, label: 'Print Patient Wristband', icon: Printer },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-semibold text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </IpdPanel>
    </div>
  );
}
