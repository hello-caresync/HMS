'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bed,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Layers,
  LogOut,
  Pill,
  ScanLine,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';

type PipelineStageId =
  | 'patient-mgmt'
  | 'scheduling'
  | 'opd-consultation'
  | 'emr-updated'
  | 'lab-rad-pharmacy'
  | 'admission-trigger'
  | 'ipd-care'
  | 'emergency-casualty'
  | 'ot-coordination'
  | 'discharge-desk'
  | 'integrated-billing';

type PipelineStage = {
  id: PipelineStageId;
  step: number;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

type BedAllocation = {
  id: string;
  uhid: string;
  ward: string;
  bed: string;
  patient: string;
  status: 'Occupied' | 'Transfer Pending' | 'Available';
};

type TriageEntry = {
  id: string;
  token: string;
  level: 'Red' | 'Yellow' | 'Green';
  complaint: string;
  arrivalTime: string;
};

type OtScheduleEntry = {
  id: string;
  theatre: string;
  surgeon: string;
  procedure: string;
  startTime: string;
  status: 'In Progress' | 'Pre-Op' | 'Recovery';
};

type BillingLineItem = {
  id: string;
  uhid: string;
  patient: string;
  identityRef: string;
  serviceLine: string;
  amount: string;
  status: 'Pending' | 'Settled' | 'TPA Hold';
};

type VitalsState = {
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
};

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'patient-mgmt', step: 1, label: 'Patient Mgmt', shortLabel: 'MPI', icon: Users },
  { id: 'scheduling', step: 2, label: 'Scheduling', shortLabel: 'Appt', icon: Calendar },
  { id: 'opd-consultation', step: 3, label: 'OPD Consultation', shortLabel: 'OPD', icon: Stethoscope },
  { id: 'emr-updated', step: 4, label: 'EMR Updated', shortLabel: 'EMR', icon: FileText },
  {
    id: 'lab-rad-pharmacy',
    step: 5,
    label: 'Lab / Rad / Pharmacy Utilities',
    shortLabel: 'Dx',
    icon: FlaskConical,
  },
  { id: 'admission-trigger', step: 6, label: 'Admission Trigger', shortLabel: 'Admit', icon: ClipboardList },
  { id: 'ipd-care', step: 7, label: 'IPD Care', shortLabel: 'IPD', icon: Bed },
  { id: 'emergency-casualty', step: 8, label: 'Emergency Casualty', shortLabel: 'ER', icon: ShieldAlert },
  { id: 'ot-coordination', step: 9, label: 'OT Coordination', shortLabel: 'OT', icon: Layers },
  { id: 'discharge-desk', step: 10, label: 'Discharge Desk', shortLabel: 'DC', icon: LogOut },
  { id: 'integrated-billing', step: 11, label: 'Integrated Billing', shortLabel: 'Bill', icon: CreditCard },
];

const LIVE_VOLUMES = [
  { label: 'Active OPD', value: '47', accent: 'text-[#00758C]' },
  { label: 'Wards IPD', value: '186', accent: 'text-indigo-600' },
  { label: 'Emergency Casualty', value: '8', accent: 'text-rose-600' },
  { label: 'Active OTs', value: '2', accent: 'text-[#00A481]' },
];

const PATIENT_REGISTRY_SNAPSHOT = [
  { id: 'pt-01', uhid: 'UHID-NXR-20260714-A7F2', patient: 'R.K.', status: 'Active Intake' },
  { id: 'pt-02', uhid: 'UHID-NXR-20260714-B3C9', patient: 'S.M.', status: 'MPI Verified' },
  { id: 'pt-03', uhid: 'UHID-NXR-20260714-D8E1', patient: 'A.P.', status: 'Routing to OPD' },
];

const SCHEDULING_QUEUE = [
  { id: 'sch-01', token: 'OPD-102', patient: 'R.K.', slot: '09:15 AM', department: 'General Medicine' },
  { id: 'sch-02', token: 'OPD-103', patient: 'S.M.', slot: '09:30 AM', department: 'Cardiology' },
  { id: 'sch-03', token: 'OPD-104', patient: 'A.P.', slot: '09:45 AM', department: 'Orthopedics' },
];

const BED_MATRIX: BedAllocation[] = [
  { id: 'bed-01', uhid: 'UHID-NXR-IPD-01', ward: 'Med-Surg A', bed: 'A-204', patient: 'A.P.', status: 'Occupied' },
  { id: 'bed-02', uhid: 'UHID-NXR-IPD-02', ward: 'ICU Wing', bed: 'ICU-A-06', patient: 'M.J.', status: 'Transfer Pending' },
  { id: 'bed-03', uhid: 'UHID-NXR-IPD-03', ward: 'Med-Surg B', bed: 'B-118', patient: '—', status: 'Available' },
  { id: 'bed-04', uhid: 'UHID-NXR-IPD-04', ward: 'Pediatrics', bed: 'P-12', patient: 'L.N.', status: 'Occupied' },
];

const TRIAGE_BOARD: TriageEntry[] = [
  { id: 'er-01', token: 'ER-088', level: 'Red', complaint: 'Polytrauma · MVC', arrivalTime: '14:38' },
  { id: 'er-02', token: 'ER-089', level: 'Red', complaint: 'Chest pain · STEMI protocol', arrivalTime: '14:35' },
  { id: 'er-03', token: 'ER-090', level: 'Yellow', complaint: 'Abdominal pain', arrivalTime: '14:29' },
  { id: 'er-04', token: 'ER-091', level: 'Green', complaint: 'Minor laceration', arrivalTime: '14:22' },
];

const OT_SCHEDULE: OtScheduleEntry[] = [
  {
    id: 'ot-01',
    theatre: 'OT-2',
    surgeon: 'Dr. Khan',
    procedure: 'Open reduction · femur',
    startTime: '13:45',
    status: 'In Progress',
  },
  {
    id: 'ot-02',
    theatre: 'OT-4',
    surgeon: 'Dr. Sharma',
    procedure: 'CABG · pre-op prep',
    startTime: '15:00',
    status: 'Pre-Op',
  },
  {
    id: 'ot-03',
    theatre: 'OT-1',
    surgeon: 'Dr. Iyer',
    procedure: 'Appendectomy · recovery',
    startTime: '12:30',
    status: 'Recovery',
  },
];

const BILLING_LEDGER: BillingLineItem[] = [
  {
    id: 'inv-01',
    uhid: 'UHID-NXR-20260714-A7F2',
    patient: 'R.K.',
    identityRef: '[Identity Data Redacted]',
    serviceLine: 'OPD Consultation + Lab Panel',
    amount: '₹ 4,850',
    status: 'Settled',
  },
  {
    id: 'inv-02',
    uhid: 'UHID-NXR-20260714-B3C9',
    patient: 'S.M.',
    identityRef: '[Verification Omitted]',
    serviceLine: 'IPD Ward · Cardiology · 3 days',
    amount: '₹ 68,200',
    status: 'TPA Hold',
  },
  {
    id: 'inv-03',
    uhid: 'UHID-NXR-20260714-D8E1',
    patient: 'A.P.',
    identityRef: '[Identity Data Redacted]',
    serviceLine: 'OT Procedure + Pharmacy dispense',
    amount: '₹ 1,42,500',
    status: 'Pending',
  },
];

const DISPATCH_UTILITIES = [
  { id: 'lab', label: 'Laboratory', icon: FlaskConical, color: 'text-[#00758C]' },
  { id: 'rad', label: 'Radiology', icon: ScanLine, color: 'text-[#008588]' },
  { id: 'pharm', label: 'Pharmacy Dispensation', icon: Pill, color: 'text-[#00A481]' },
];

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-800 transition-all placeholder:text-slate-400 focus:border-[#008588] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008588]/15';

const LABEL_CLASS = 'mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500';

const BED_STATUS_STYLES: Record<BedAllocation['status'], string> = {
  Occupied: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold',
  'Transfer Pending': 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
  Available: 'bg-[#5EC283]/15 text-[#00758C] border border-[#5EC283]/30 font-bold',
};

const TRIAGE_STYLES: Record<TriageEntry['level'], string> = {
  Red: 'bg-rose-50 text-rose-700 border border-rose-200',
  Yellow: 'bg-amber-50 text-amber-800 border border-amber-200',
  Green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const BILLING_STATUS_STYLES: Record<BillingLineItem['status'], string> = {
  Pending: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
  Settled: 'bg-[#5EC283]/20 text-[#00758C] border border-[#5EC283]/40 font-bold',
  'TPA Hold': 'bg-purple-50 text-purple-700 border border-purple-200 font-bold',
};

function StageWorkspaceHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-3">
      <h2 className="text-xs font-black uppercase tracking-wider text-[#00758C]">{title}</h2>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500">{description}</p>
    </div>
  );
}

export default function CoreOperationsTerminalPage() {
  const [activeStage, setActiveStage] = useState<PipelineStageId>('opd-consultation');
  const [admissionRequired, setAdmissionRequired] = useState<boolean | null>(null);
  const [vitals, setVitals] = useState<VitalsState>({ bp: '122/78', pulse: '76', temp: '98.4', spo2: '98' });
  const [consultationNotes, setConsultationNotes] = useState('');
  const [dispatchFlags, setDispatchFlags] = useState({ lab: true, rad: false, pharm: true });

  const activeStageMeta = useMemo(
    () => PIPELINE_STAGES.find((stage) => stage.id === activeStage) ?? PIPELINE_STAGES[0],
    [activeStage],
  );

  const toggleDispatch = (key: keyof typeof dispatchFlags) => {
    setDispatchFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 antialiased">
      {/* 1. Core operations telemetry sub-header */}
      <header className="space-y-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md border border-[#008588]/25 bg-[#008588]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#008588]">
              Layer 3 Engine
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Operations Hub
            </span>
          </div>
          <h1 className="mt-2 text-xl font-black tracking-tight text-[#00758C] sm:text-2xl">
            Patient Lifecycle Transactional Pipeline
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-medium text-slate-500">
            11-stage sequential clinical workflow · reactive stage routing · integrated back-office dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Matrix</span>
          {LIVE_VOLUMES.map((item, idx) => (
            <span key={`vol-${item.label}-${idx}`} className="text-xs font-semibold text-slate-600">
              {idx > 0 ? <span className="mr-4 text-slate-300">|</span> : null}
              {item.label}: <span className={`font-black tabular-nums ${item.accent}`}>{item.value}</span>
            </span>
          ))}
        </div>
      </header>

      {/* 2. Interactive clinical workflow timeline tracker — 11 stages */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
          Sequential Processing Route · Stage {activeStageMeta.step} of 11
        </p>
        <div className="custom-scrollbar flex gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const isPast = stage.step < activeStageMeta.step;
            return (
              <button
                key={`stage-${stage.id}-${idx}`}
                type="button"
                onClick={() => setActiveStage(stage.id)}
                className={`group relative flex min-w-[108px] shrink-0 flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-all ${
                  isActive
                    ? 'border-[#00758C] bg-[#00758C] text-white shadow-sm'
                    : isPast
                      ? 'border-[#00A481]/30 bg-[#00A481]/5 text-[#00758C] hover:bg-[#00A481]/10'
                      : 'border-slate-200/80 bg-slate-50/50 text-slate-500 hover:border-[#008588]/30 hover:text-[#00758C]'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`text-[9px] font-black uppercase tracking-wider ${
                    isActive ? 'text-white/80' : 'text-slate-400'
                  }`}
                >
                  {stage.step}
                </span>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} aria-hidden />
                <span className="text-center text-[10px] font-bold leading-tight">{stage.shortLabel}</span>
                {idx < PIPELINE_STAGES.length - 1 ? (
                  <span
                    className={`absolute -right-1 top-1/2 hidden h-0 w-0 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent sm:block ${
                      isActive ? 'border-l-[#00758C]' : 'border-l-slate-200'
                    }`}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-500">
          Active milestone:{' '}
          <span className="font-black text-[#00758C]">{activeStageMeta.label}</span>
          {activeStageMeta.step < 11 ? (
            <>
              {' '}
              ➔ Next:{' '}
              <span className="font-bold text-[#008588]">
                {PIPELINE_STAGES[activeStageMeta.step]?.label ?? 'Complete'}
              </span>
            </>
          ) : null}
        </p>
      </section>

      {/* 3. Dense transactional data stage workspaces */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {/* Stage 1 — Patient Management */}
        {activeStage === 'patient-mgmt' ? (
          <div>
            <StageWorkspaceHeader
              title="Patient Management Registry"
              description="MPI-linked intake profiles awaiting pipeline routing"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">UHID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">MPI Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PATIENT_REGISTRY_SNAPSHOT.map((row, idx) => (
                    <tr key={`${row.id || row.uhid}-${idx}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-[#008588]">{row.uhid}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-900">{row.patient}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-md border border-[#5EC283]/30 bg-[#5EC283]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00758C]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Stage 2 — Scheduling */}
        {activeStage === 'scheduling' ? (
          <div>
            <StageWorkspaceHeader
              title="Appointment Scheduling Dispatch"
              description="Token allocation · provider blocks · slot confirmation"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SCHEDULING_QUEUE.map((row, idx) => (
                <article
                  key={`${row.id || row.token}-${idx}`}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4"
                >
                  <p className="font-mono text-xs font-bold text-[#008588]">{row.token}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{row.patient}</p>
                  <p className="text-[11px] text-slate-500">{row.department}</p>
                  <p className="mt-2 text-xs font-black tabular-nums text-[#00758C]">{row.slot}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {/* Stages 3 & 4 — OPD Consultation & EMR */}
        {activeStage === 'opd-consultation' || activeStage === 'emr-updated' ? (
          <div>
            <StageWorkspaceHeader
              title={
                activeStage === 'opd-consultation'
                  ? 'OPD Consultation Workspace'
                  : 'EMR Clinical Documentation Workspace'
              }
              description="Live vitals capture · consultation notes · automated utility dispatch routing"
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-5">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-rose-500" aria-hidden />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Live Vitals Capture
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vital-bp" className={LABEL_CLASS}>
                        Blood Pressure
                      </label>
                      <input
                        id="vital-bp"
                        type="text"
                        value={vitals.bp}
                        onChange={(e) => setVitals((v) => ({ ...v, bp: e.target.value }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-pulse" className={LABEL_CLASS}>
                        Pulse (bpm)
                      </label>
                      <input
                        id="vital-pulse"
                        type="text"
                        value={vitals.pulse}
                        onChange={(e) => setVitals((v) => ({ ...v, pulse: e.target.value }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-temp" className={LABEL_CLASS}>
                        Temperature (°F)
                      </label>
                      <input
                        id="vital-temp"
                        type="text"
                        value={vitals.temp}
                        onChange={(e) => setVitals((v) => ({ ...v, temp: e.target.value }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-spo2" className={LABEL_CLASS}>
                        SpO₂ (%)
                      </label>
                      <input
                        id="vital-spo2"
                        type="text"
                        value={vitals.spo2}
                        onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 p-4">
                  <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Automated Test Dispatch
                  </h3>
                  <div className="space-y-2">
                    {DISPATCH_UTILITIES.map((util, idx) => {
                      const Icon = util.icon;
                      const flagKey = util.id as keyof typeof dispatchFlags;
                      const checked = dispatchFlags[flagKey];
                      return (
                        <label
                          key={`dispatch-${util.id}-${idx}`}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50/80"
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Icon className={`h-4 w-4 ${util.color}`} aria-hidden />
                            {util.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDispatch(flagKey)}
                            className="h-4 w-4 accent-[#00758C]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <label htmlFor="consultation-notes" className={LABEL_CLASS}>
                  {activeStage === 'emr-updated' ? 'EMR Clinical Notes' : 'Active Consultation Notes'}
                </label>
                <textarea
                  id="consultation-notes"
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  rows={8}
                  placeholder="Document clinical findings, differential diagnosis, and care plan directives..."
                  className={`${INPUT_CLASS} min-h-[180px] resize-y`}
                />
                {activeStage === 'emr-updated' ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#00A481]">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    EMR chart sync ready · vitals locked to encounter REF-OPD-102
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Stage 5 — Lab/Rad/Pharmacy */}
        {activeStage === 'lab-rad-pharmacy' ? (
          <div>
            <StageWorkspaceHeader
              title="Diagnostics & Pharmacy Utility Dispatch"
              description="Cross-department order routing · result synchronizer status"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {DISPATCH_UTILITIES.map((util, idx) => {
                const Icon = util.icon;
                const active = dispatchFlags[util.id as keyof typeof dispatchFlags];
                return (
                  <article
                    key={`utility-${util.id}-${idx}`}
                    className={`rounded-xl border p-4 ${
                      active
                        ? 'border-[#008588]/30 bg-[#008588]/5'
                        : 'border-slate-200/80 bg-slate-50/40'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${util.color}`} aria-hidden />
                    <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-700">{util.label}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {active ? 'Order dispatched · awaiting result sync' : 'No active dispatch'}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        active
                          ? 'bg-[#5EC283]/20 text-[#00758C]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {active ? 'In Flight' : 'Idle'}
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Stages 6 & 7 — Admission & IPD */}
        {activeStage === 'admission-trigger' || activeStage === 'ipd-care' ? (
          <div className="space-y-5">
            <StageWorkspaceHeader
              title={
                activeStage === 'admission-trigger'
                  ? 'Admission Trigger & Routing Gate'
                  : 'IPD Care · Bed Allocation Matrix'
              }
              description="Ward transfer telemetry · occupancy synchronizer · conditional discharge routing"
            />

            {activeStage === 'admission-trigger' ? (
              <div className="rounded-xl border border-[#00758C]/20 bg-[#00758C]/5 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#00758C]">Admission Required?</p>
                <p className="mt-1 text-[11px] font-medium text-slate-600">
                  Select routing path based on clinical disposition assessment
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAdmissionRequired(true)}
                    className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                      admissionRequired === true
                        ? 'border-[#00758C] bg-[#00758C] text-white shadow-sm'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:border-[#008588]/40'
                    }`}
                  >
                    Yes → IPD Management Wing
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdmissionRequired(false)}
                    className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                      admissionRequired === false
                        ? 'border-[#00A481] bg-[#00A481] text-white shadow-sm'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:border-[#00A481]/40'
                    }`}
                  >
                    No → Discharge Desk
                  </button>
                </div>
                {admissionRequired !== null ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2">
                    <Activity className="h-4 w-4 text-[#008588]" aria-hidden />
                    <p className="text-[11px] font-semibold text-slate-700">
                      Routing visualizer:{' '}
                      <span className="font-black text-[#00758C]">
                        {admissionRequired
                          ? 'Stage 7 · IPD Care → Bed Allocation Matrix'
                          : 'Stage 10 · Discharge Desk → Final clearance'}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">UHID</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Bed</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {BED_MATRIX.map((row, idx) => (
                    <tr key={`${row.id || row.uhid}-${idx}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-[#008588]">{row.uhid}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{row.ward}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{row.bed}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-900">{row.patient}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ${BED_STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Stages 8 & 9 — Emergency & OT */}
        {activeStage === 'emergency-casualty' || activeStage === 'ot-coordination' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {activeStage === 'emergency-casualty' ? (
              <div>
                <StageWorkspaceHeader
                  title="Emergency Casualty · Triage Telemetry"
                  description="High-priority casualty intake · triage level distribution"
                />
                <ul className="space-y-2">
                  {TRIAGE_BOARD.map((entry, idx) => (
                    <li
                      key={`${entry.id || entry.token}-${idx}`}
                      className={`flex items-start justify-between rounded-lg border px-3 py-2.5 ${TRIAGE_STYLES[entry.level]}`}
                    >
                      <div>
                        <p className="font-mono text-xs font-bold">{entry.token}</p>
                        <p className="text-xs font-semibold">{entry.complaint}</p>
                        <p className="text-[10px] opacity-80">Arrival {entry.arrivalTime}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase">{entry.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeStage === 'ot-coordination' ? (
              <div className="xl:col-span-2">
                <StageWorkspaceHeader
                  title="OT Coordination · Surgical Theatre Log"
                  description="Active surgeon schedules · theatre timing matrix"
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Theatre</th>
                        <th className="px-4 py-3">Surgeon</th>
                        <th className="px-4 py-3">Procedure</th>
                        <th className="px-4 py-3">Start</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {OT_SCHEDULE.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-mono text-xs font-bold text-[#00758C]">{row.theatre}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-slate-900">{row.surgeon}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-700">{row.procedure}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.startTime}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded-md border border-[#008588]/25 bg-[#008588]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#008588]">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeStage === 'emergency-casualty' ? (
              <div>
                <StageWorkspaceHeader
                  title="Casualty Volume Summary"
                  description="Real-time ER throughput indicators"
                />
                <div className="grid grid-cols-3 gap-3">
                  {(['Red', 'Yellow', 'Green'] as const).map((level, idx) => {
                    const count = TRIAGE_BOARD.filter((e) => e.level === level).length;
                    return (
                      <div
                        key={`triage-sum-${level}-${idx}`}
                        className={`rounded-xl border p-4 text-center ${TRIAGE_STYLES[level]}`}
                      >
                        <p className="text-2xl font-black tabular-nums">{count}</p>
                        <p className="text-[10px] font-black uppercase">{level} Triage</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Stage 10 — Discharge Desk */}
        {activeStage === 'discharge-desk' ? (
          <div>
            <StageWorkspaceHeader
              title="Discharge Desk · Clearance Pipeline"
              description="Final clinical clearance · pharmacy reconciliation · billing handoff trigger"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Pending Clearance', value: '14', accent: 'border-t-amber-500' },
                { label: 'Pharmacy Reconciled', value: '9', accent: 'border-t-[#00A481]' },
                { label: 'Ready for Billing', value: '6', accent: 'border-t-[#00758C]' },
              ].map((tile, idx) => (
                <article
                  key={`dc-${tile.label}-${idx}`}
                  className={`rounded-xl border border-slate-200/80 border-t-4 ${tile.accent} bg-white p-4 shadow-sm`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{tile.label}</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{tile.value}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {/* Stage 11 — Integrated Billing */}
        {activeStage === 'integrated-billing' ? (
          <div>
            <StageWorkspaceHeader
              title="Integrated Billing Desk · Invoice Ledger"
              description="Accumulated patient costs · TPA settlement tracking · redacted identity mapping"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">UHID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Identity Reference</th>
                    <th className="px-4 py-3">Service Line</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {BILLING_LEDGER.map((row, idx) => (
                    <tr key={`${row.id || row.uhid}-${idx}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-[#008588]">{row.uhid}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-900">{row.patient}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-slate-500">
                        {row.identityRef}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-700">{row.serviceLine}</td>
                      <td className="px-4 py-2.5 text-xs font-black tabular-nums text-slate-900">{row.amount}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ${BILLING_STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
