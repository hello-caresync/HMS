'use client';

import {
  Activity,
  Ambulance,
  BedDouble,
  ListOrdered,
  Siren,
  Stethoscope,
  UserPlus,
  Zap,
} from 'lucide-react';

import type { EmergencyModalType } from '../emergencyNav.types';
import type { ErTreatmentBed, TriageEntry } from '../lib/emergencyMockData';
import { ER_CENSUS, formatTime } from '../lib/emergencyMockData';
import { CodeBlueBanner, ErPanel, MlcFlag, StatusPill, TriageBadge } from '../components/emergencyUi';

type CommandCenterTabProps = {
  lookupQuery: string;
  triageStream: TriageEntry[];
  erBeds: ErTreatmentBed[];
  codeBlueActive: boolean;
  onBumpTriage: (id: string) => void;
  onQuickAction: (action: Exclude<EmergencyModalType, null>) => void;
};

export default function CommandCenterTab({
  lookupQuery,
  triageStream,
  erBeds,
  codeBlueActive,
  onBumpTriage,
  onQuickAction,
}: CommandCenterTabProps) {
  const census = ER_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const sortedTriage = [...triageStream].sort((a, b) => {
    const order = { Critical: 0, Emergent: 1, Urgent: 2, 'Non-Urgent': 3 };
    return order[a.priority] - order[b.priority];
  });

  const filteredTriage = q
    ? sortedTriage.filter(
        (t) =>
          t.patientName.toLowerCase().includes(q) ||
          t.uhid.toLowerCase().includes(q) ||
          t.erNumber.toLowerCase().includes(q) ||
          t.chiefComplaint.toLowerCase().includes(q),
      )
    : sortedTriage;

  return (
    <div className="space-y-2">
      <CodeBlueBanner active={codeBlueActive} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: 'Current ER Patients', value: census.currentPatients },
          { label: 'Critical Patients', value: census.criticalPatients, danger: true, pulse: true },
          { label: 'Waiting', value: census.waitingPatients, warn: true },
          { label: 'Under Treatment', value: census.underTreatment, purple: true },
          { label: 'Avg Response', value: `${census.avgResponseMinutes}m`, accent: true },
          { label: 'Available ER Beds', value: census.availableErBeds, success: true },
          { label: 'ICU Beds Avail.', value: census.icuBedAvailability, accent: true },
          { label: 'Active Ambulances', value: census.activeAmbulances, warn: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-300 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}
          >
            <p
              className={`text-base font-bold tabular-nums ${
                k.danger ? 'text-red-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.purple ? 'text-violet-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'
              }`}
            >
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <ErPanel
          title="Live Triage Stream"
          subtitle="Priority · chief complaint · GCS · MLC flags"
          icon={ListOrdered}
          className="xl:col-span-7"
          critical={filteredTriage.some((t) => t.priority === 'Critical')}
        >
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ER #', 'Patient', 'Priority', 'Complaint', 'GCS', 'MLC', 'Arrival', 'Triage Nurse', 'Escalate'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTriage.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-slate-50 ${t.priority === 'Critical' ? 'bg-red-50/60' : 'hover:bg-slate-50/80'}`}
                >
                  <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{t.erNumber}</td>
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold text-[#0F172A]">{t.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{t.isUnknown ? 'Temporary ID Generated' : t.uhid}</p>
                  </td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onBumpTriage(t.id)} title="Escalate priority">
                      <TriageBadge priority={t.priority} pulse={t.priority === 'Critical'} />
                    </button>
                  </td>
                  <td className="max-w-[140px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={t.chiefComplaint}>
                    {t.chiefComplaint}
                  </td>
                  <td className={`px-1.5 py-1 text-[10px] font-bold tabular-nums ${t.gcs <= 8 ? 'text-red-600 animate-pulse' : t.gcs <= 12 ? 'text-orange-600' : 'text-[#0F172A]'}`}>
                    {t.gcs}
                  </td>
                  <td className="px-1.5 py-1"><MlcFlag active={t.mlcFlag} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(t.arrivalTime)}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{t.triageNurse}</td>
                  <td className="px-1.5 py-1">
                    {t.priority !== 'Critical' && (
                      <button
                        type="button"
                        onClick={() => onBumpTriage(t.id)}
                        className="rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold text-orange-800 hover:bg-orange-200"
                      >
                        ↑ Escalate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErPanel>

        <ErPanel
          title="ER Bed & Treatment Queue"
          subtitle="Observation · trauma · resus · code blue"
          icon={BedDouble}
          className="xl:col-span-5"
          critical={codeBlueActive}
        >
          <ul className="space-y-1">
            {erBeds.map((bed) => (
              <li
                key={bed.id}
                className={`rounded border px-2 py-1.5 ${bed.codeBlue ? 'border-red-400 bg-red-50 animate-pulse' : 'border-[#E2E8F0]'}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-[10px] font-bold text-[#0F172A]">
                      {bed.bedLabel} · {bed.bay}
                    </p>
                    {bed.patientName ? (
                      <>
                        <p className="text-[9px] font-semibold">{bed.patientName}</p>
                        <p className="text-[8px] text-slate-500">{bed.assignedDoctor} · {bed.assignedNurse}</p>
                      </>
                    ) : (
                      <p className="text-[8px] text-slate-400">Unoccupied</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <StatusPill status={bed.status} />
                    {bed.treatmentStatus && <StatusPill status={bed.treatmentStatus} />}
                    {bed.codeBlue && (
                      <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Code Blue</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ErPanel>
      </div>

      <ErPanel title="Quick Actions" icon={Zap} subtitle="High-visibility ER operational controls">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'register-patient' as const, label: 'Register Emergency Patient', icon: UserPlus },
            { id: 'start-triage' as const, label: 'Start Triage', icon: Activity },
            { id: 'assign-doctor' as const, label: 'Assign Doctor', icon: Stethoscope },
            { id: 'allocate-er-bed' as const, label: 'Allocate ER Bed', icon: BedDouble },
            { id: 'dispatch-ambulance' as const, label: 'Dispatch Ambulance', icon: Ambulance },
            { id: 'activate-code-blue' as const, label: 'Activate Code Blue', icon: Siren, danger: true },
          ].map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className={`inline-flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center hover:border-[#2563EB]/40 ${
                danger ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${danger ? 'text-red-600' : 'text-[#2563EB]'}`} />
              <span className={`text-[8px] font-semibold ${danger ? 'text-red-800' : 'text-[#0F172A]'}`}>{label}</span>
            </button>
          ))}
        </div>
      </ErPanel>
    </div>
  );
}
