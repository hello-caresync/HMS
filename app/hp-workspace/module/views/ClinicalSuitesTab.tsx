'use client';

import { AlertTriangle, BedDouble, Cpu, FileText, Stethoscope, Users } from 'lucide-react';

import type { ActivePatientSummary } from '../lib/hpWorkspaceMockData';
import {
  ACTIVE_PATIENTS,
  BED_AVAILABILITY,
  DEPARTMENT_CAPACITY,
  EQUIPMENT_MAINTENANCE,
  MEDICAL_ORDERS,
  ON_DUTY_SHIFTS,
  PRESCRIPTIONS,
} from '../lib/hpWorkspaceMockData';
import {
  CapacityStatusPill,
  EquipmentStatusPill,
  HpPanel,
  PriorityPill,
  SecureIdentityPlaceholder,
} from '../components/hpWorkspaceUi';

type ClinicalSuitesTabProps = {
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  onOpenEmr: (patient: ActivePatientSummary) => void;
};

export default function ClinicalSuitesTab({ selectedPatientId, onSelectPatient, onOpenEmr }: ClinicalSuitesTabProps) {
  const patient = ACTIVE_PATIENTS.find((p) => p.id === selectedPatientId) ?? ACTIVE_PATIENTS[0];

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <div className="space-y-2">
        <HpPanel title="Patient & Clinical Workspace" subtitle="Active census · history · allergies · orders · EMR shortcut" icon={Stethoscope}>
          <SecureIdentityPlaceholder verified={patient.identityVerified} />
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
            {ACTIVE_PATIENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p.id)}
                className={`shrink-0 rounded-md border px-2 py-1 text-[8px] font-bold ${selectedPatientId === p.id ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-slate-200 text-slate-600'}`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
            <p className="text-[11px] font-bold text-[#0F172A]">{patient.name}</p>
            <p className="font-mono text-[8px] text-slate-500">{patient.uhid}</p>
            <p className="text-[9px] text-slate-600">{patient.age}y {patient.gender} · {patient.ward}</p>
            <p className="text-[9px] text-slate-600">Attending: {patient.attendingPhysician}</p>
            <p className="text-[9px] text-slate-600">Admitted: {patient.admissionDate}</p>
            <p className="mt-1 text-[9px] font-semibold text-slate-700">{patient.diagnosis}</p>
          </div>
          {patient.allergies[0] !== 'None documented' && (
            <div className="mt-2 flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-[9px] font-bold text-red-800">Allergies: {patient.allergies.join(', ')}</span>
            </div>
          )}
          <div className="mt-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Digital Prescription Status</p>
            {PRESCRIPTIONS.slice(0, 3).map((rx) => (
              <div key={rx.id} className="mb-1 flex justify-between rounded border border-slate-100 px-2 py-1 text-[8px]">
                <span>{rx.medication} {rx.dosage}</span>
                <span className={`rounded px-1 font-bold uppercase ${rx.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{rx.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Medical Orders Tracking</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Order', 'Details', 'Status', 'Priority'].map((h) => (
                    <th key={h} className="px-1 py-0.5 text-[7px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEDICAL_ORDERS.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50">
                    <td className="px-1 py-0.5 text-[8px] font-semibold">{o.orderType}</td>
                    <td className="max-w-[140px] truncate px-1 py-0.5 text-[8px] text-slate-600">{o.details}</td>
                    <td className="px-1 py-0.5 text-[8px]">{o.status}</td>
                    <td className="px-1 py-0.5"><PriorityPill priority={o.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => onOpenEmr(patient)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-[#0F172A] py-1.5 text-[9px] font-bold text-white hover:bg-slate-800"
          >
            <FileText className="h-3.5 w-3.5" />
            Open EMR Shortcut Drawer (Read-Only)
          </button>
        </HpPanel>
      </div>

      <div className="space-y-2">
        <HpPanel title="Department Capacity Monitor" subtitle="OPD · IPD · ICU · Emergency · OT · Pharmacy" icon={Users}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Department', 'Occupied', 'Capacity', 'Waitlist', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENT_CAPACITY.map((d) => (
                <tr key={d.department} className={`border-b border-slate-50 ${d.status === 'Critical' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{d.department}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{d.department === 'Pharmacy' ? '—' : d.occupied}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{d.department === 'Pharmacy' ? '—' : d.total}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums text-amber-700">{d.waitlist}</td>
                  <td className="px-1.5 py-1"><CapacityStatusPill status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>

        <HpPanel title="Bed Availability Map" subtitle="Ward-level census · isolation · step-down" icon={BedDouble}>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {BED_AVAILABILITY.map((b) => (
              <div key={b.ward} className="rounded border border-slate-100 p-2">
                <p className="text-[9px] font-bold">{b.ward}</p>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-lg font-bold tabular-nums text-emerald-600">{b.available}</span>
                  <span className="text-[8px] text-slate-500">/ {b.total} available</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${((b.total - b.available) / b.total) * 100}%` }} />
                </div>
                <p className="mt-1 text-[7px] text-slate-500">Isolation: {b.isolation}{b.icuStepDown ? ' · Step-down' : ''}</p>
              </div>
            ))}
          </div>
        </HpPanel>

        <HpPanel title="On-Duty Staff Shifts" subtitle="Morning · Evening · Night coverage" icon={Users}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Staff', 'Role', 'Dept', 'Shift', 'Coverage'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ON_DUTY_SHIFTS.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{s.staffName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{s.role}</td>
                  <td className="px-1.5 py-1 text-[8px]">{s.department}</td>
                  <td className="px-1.5 py-1 text-[8px] font-bold text-[#2563EB]">{s.shift}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{s.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>

        <HpPanel title="Medical Equipment Maintenance" subtitle="Operational status · scheduled service" icon={Cpu}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Equipment', 'Location', 'Status', 'Next Service'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT_MAINTENANCE.map((e) => (
                <tr key={e.id} className={`border-b border-slate-50 ${e.status === 'Out of Service' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 text-[8px] font-semibold">{e.equipment}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{e.location}</td>
                  <td className="px-1.5 py-1"><EquipmentStatusPill status={e.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{e.nextService}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HpPanel>
      </div>
    </div>
  );
}
