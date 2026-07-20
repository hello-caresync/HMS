'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  ClipboardList,
  FileText,
  FlaskConical,
  Mic,
  Pill,
  Scissors,
  Stethoscope,
  Users,
  Zap,
} from 'lucide-react';

type TriagePriority = 'High' | 'Medium' | 'Routine';

type QueueEntry = {
  id: string;
  token: string;
  patientName: string;
  arrivalTime: string;
  priority: TriagePriority;
  complaint: string;
};

type AppointmentEntry = {
  id: string;
  time: string;
  patientName: string;
  complaint: string;
  type: 'OPD' | 'Follow-up' | 'Teleconsult';
};

type CriticalAlert = {
  id: string;
  message: string;
};

type SurgeryEntry = {
  id: string;
  time: string;
  procedure: string;
  room: string;
  patientRef: string;
};

type FollowUpEntry = {
  id: string;
  patientRef: string;
  task: string;
  dueBy: string;
  status: 'Pending Sign-off' | 'Chart Incomplete' | 'Discharge Review';
};

type QuickAction = {
  id: string;
  label: string;
  icon: typeof FileText;
};

const METRIC_TILE_CLASS =
  'flex items-center justify-between rounded-xl border border-slate-200/60 border-t-4 border-t-[#00758C] bg-white p-4 shadow-sm';

const PANEL_CLASS = 'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const PRIORITY_STYLES: Record<TriagePriority, string> = {
  High: 'bg-rose-500/10 text-rose-700 border border-rose-500/20 font-bold px-2 py-0.5 rounded text-[11px]',
  Medium:
    'bg-amber-500/10 text-amber-800 border border-amber-500/20 font-bold px-2 py-0.5 rounded text-[11px]',
  Routine:
    'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold px-2 py-0.5 rounded text-[11px]',
};

const CONSULTATION_QUEUE: QueueEntry[] = [
  {
    id: 'q-1',
    token: 'OPD-047',
    patientName: 'R. Srinivasan',
    arrivalTime: '09:12',
    priority: 'Medium',
    complaint: 'Persistent hypertension · medication review',
  },
  {
    id: 'q-2',
    token: 'ER-112',
    patientName: 'Unknown Male · Bay 3',
    arrivalTime: '09:28',
    priority: 'High',
    complaint: 'Chest pain · stat ECG ordered',
  },
  {
    id: 'q-3',
    token: 'OPD-048',
    patientName: 'S. Lakshmi',
    arrivalTime: '09:35',
    priority: 'Routine',
    complaint: 'Diabetes follow-up · HbA1c discussion',
  },
  {
    id: 'q-4',
    token: 'OPD-049',
    patientName: 'A. Arjun',
    arrivalTime: '09:48',
    priority: 'Medium',
    complaint: 'Pediatric fever · 38.4°C',
  },
  {
    id: 'q-5',
    token: 'TEL-024',
    patientName: 'Aishwarya D S',
    arrivalTime: '10:00',
    priority: 'Routine',
    complaint: 'Teleconsult · post-lab review',
  },
  {
    id: 'q-6',
    token: 'OPD-050',
    patientName: 'K. Venkatesh',
    arrivalTime: '10:15',
    priority: 'High',
    complaint: 'Syncope episode · orthostatic vitals pending',
  },
];

const TODAYS_APPOINTMENTS: AppointmentEntry[] = [
  {
    id: 'apt-1',
    time: '10:30',
    patientName: 'Aishwarya D S',
    complaint: 'Cardiology teleconsult · lipid panel review',
    type: 'Teleconsult',
  },
  {
    id: 'apt-2',
    time: '11:00',
    patientName: 'P. Nandini',
    complaint: 'Post-operative wound check · Day 7',
    type: 'Follow-up',
  },
  {
    id: 'apt-3',
    time: '11:45',
    patientName: 'M. Joseph',
    complaint: 'New patient · chronic cough · 3 weeks',
    type: 'OPD',
  },
  {
    id: 'apt-4',
    time: '14:00',
    patientName: 'L. Iyer',
    complaint: 'Geriatric fall risk assessment',
    type: 'OPD',
  },
];

const CRITICAL_ALERTS: CriticalAlert[] = [
  {
    id: 'crit-1',
    message: 'Critical Lab Panic Value: Hemoglobin 6.2 g/dL for Patient Room 402',
  },
  {
    id: 'crit-2',
    message: 'Stat Consultation requested in ER · Bay 3 · Chest pain protocol active',
  },
  {
    id: 'crit-3',
    message: 'Potassium 6.1 mmol/L · K. Venkatesh · immediate physician callback required',
  },
];

const UPCOMING_SURGERIES: SurgeryEntry[] = [
  {
    id: 'sx-1',
    time: '12:30',
    procedure: 'Laparoscopic Cholecystectomy',
    room: 'OT-2',
    patientRef: 'P.N. · NX-IPD-4412',
  },
  {
    id: 'sx-2',
    time: '15:00',
    procedure: 'Cataract Extraction · Left Eye',
    room: 'OT-5',
    patientRef: 'S.G. · NX-IPD-4420',
  },
  {
    id: 'sx-3',
    time: '17:15',
    procedure: 'Emergency Appendectomy',
    room: 'OT-1',
    patientRef: 'Emergency · NX-ER-0091',
  },
];

const PENDING_FOLLOWUPS: FollowUpEntry[] = [
  {
    id: 'fu-1',
    patientRef: 'K. Venkatesh · NX-9028',
    task: 'Discharge summary · cardiology referral note',
    dueBy: 'Before 13:00',
    status: 'Chart Incomplete',
  },
  {
    id: 'fu-2',
    patientRef: 'P. Nandini · NX-8841',
    task: 'Operative note cosign · laparoscopic record',
    dueBy: 'Before 16:00',
    status: 'Pending Sign-off',
  },
  {
    id: 'fu-3',
    patientRef: 'Room 402 · NX-IPD-4398',
    task: 'Transfusion consent · Hb panic value protocol',
    dueBy: 'Immediate',
    status: 'Discharge Review',
  },
  {
    id: 'fu-4',
    patientRef: 'Aishwarya D S · NX-9021',
    task: 'Teleconsult follow-up instructions · e-prescribe Metformin',
    dueBy: 'Before 11:00',
    status: 'Pending Sign-off',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'New EMR Entry', icon: FileText },
  { id: 'qa-2', label: 'Order Diagnostics', icon: FlaskConical },
  { id: 'qa-3', label: 'E-Prescribe', icon: Pill },
  { id: 'qa-4', label: 'Dictate Note', icon: Mic },
];

function formatLiveTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClientMounted({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback;
  }

  return children;
}

function DashboardLoadingShell() {
  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/50 p-6 font-sans text-slate-950">
      <header>
        <h1 className="text-2xl font-black text-[#00758C]">Clinical Command Dashboard</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">Loading clinical workspace…</p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-200/60 bg-white shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}

function DoctorDashboardContent() {
  const [queue, setQueue] = useState<QueueEntry[]>(CONSULTATION_QUEUE);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState('Syncing session clock…');

  useEffect(() => {
    setLiveTime(formatLiveTimestamp());
  }, []);

  const metrics = useMemo(
    () => ({
      patientsSeen: 18,
      activeQueue: queue.length,
      pendingLabReviews: 4,
      scheduledSurgeries: UPCOMING_SURGERIES.length,
    }),
    [queue.length],
  );

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handleInitiateEncounter = useCallback(
    (entry: QueueEntry) => {
      setQueue((prev) => prev.filter((item) => item.id !== entry.id));
      showNotice(`Encounter initiated · ${entry.token} · ${entry.patientName} · sandbox consult desk`);
    },
    [showNotice],
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      showNotice(`${action.label} · clinical workflow opened · sandbox mode`);
    },
    [showNotice],
  );

  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/50 p-6 font-sans text-slate-950">
      {/* Command station header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">Clinical Command Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Dr. Aishwarya D S, MD · OPD Block A · Nexora Clinical · sandbox workspace
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#008588]/20 bg-white px-4 py-2.5 shadow-sm">
          <Clock className="h-4 w-4 text-[#008588]" aria-hidden />
          <span className="text-xs font-bold text-[#00758C]">{liveTime}</span>
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {actionNotice}
        </p>
      ) : null}

      {/* Critical alerts banner */}
      {CRITICAL_ALERTS.length > 0 ? (
        <section
          aria-label="Critical medical alerts"
          className="flex animate-pulse flex-col gap-2 rounded-xl border border-rose-500/20 border-l-4 border-l-rose-600 bg-rose-500/10 p-4 text-sm font-bold text-rose-700 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-xs font-black uppercase tracking-wider">Critical Medical Alerts</span>
          </div>
          <ul className="space-y-1.5">
            {CRITICAL_ALERTS.map((alert) => (
              <li key={alert.id} className="text-sm font-bold leading-snug">
                {alert.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Top performance tiles */}
      <section
        aria-label="Daily summary metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className={METRIC_TILE_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Patients Seen Today
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#00758C]">
              {metrics.patientsSeen}
            </p>
          </div>
          <Users className="h-5 w-5 text-[#008588]" aria-hidden />
        </div>
        <div className={METRIC_TILE_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Queue Count
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#008588]">
              {metrics.activeQueue}
            </p>
          </div>
          <Activity className="h-5 w-5 text-[#00A481]" aria-hidden />
        </div>
        <div className={METRIC_TILE_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pending Critical Lab Reviews
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-rose-600">
              {metrics.pendingLabReviews}
            </p>
          </div>
          <AlertTriangle className="h-5 w-5 text-rose-500" aria-hidden />
        </div>
        <div className={METRIC_TILE_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Scheduled Surgeries
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#5EC283]">
              {metrics.scheduledSurgeries}
            </p>
          </div>
          <Scissors className="h-5 w-5 text-[#5EC283]" aria-hidden />
        </div>
      </section>

      {/* High-density operation grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Left column — live interventions (65%) */}
        <div className="space-y-6">
          {/* Live consultation queue */}
          <section aria-label="Live consultation queue" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-lg font-black text-[#00758C]">Live Consultation Queue</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Token
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Patient
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Arrival
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Complaint
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-[#00758C]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-200/60">
                      <td className="px-3 py-3 font-mono text-xs font-black text-[#008588]">
                        {entry.token}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-900">
                        {entry.patientName}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-600">
                        {entry.arrivalTime}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex uppercase ${PRIORITY_STYLES[entry.priority]}`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-slate-700">
                        {entry.complaint}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInitiateEncounter(entry)}
                          className="rounded-lg bg-[#00758C] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#008588]"
                        >
                          Initiate Encounter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {queue.length === 0 ? (
              <p className="mt-3 text-sm font-medium text-[#00A481]">Queue cleared · all encounters initiated</p>
            ) : null}
          </section>

          {/* Today's appointments & surgeries matrix */}
          <section aria-label="Appointments and surgeries" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-lg font-black text-[#00758C]">
                Today&apos;s Appointments &amp; Surgeries Matrix
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#008588]">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Scheduled Check-ups
                </h3>
                <ul className="space-y-3">
                  {TODAYS_APPOINTMENTS.map((apt) => (
                    <li
                      key={apt.id}
                      className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-[#00758C]">{apt.time}</span>
                        <span className="rounded-md border border-[#00A481]/20 bg-[#00A481]/10 px-2 py-0.5 text-[10px] font-bold text-[#00A481]">
                          {apt.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900">{apt.patientName}</p>
                      <p className="text-xs font-medium text-slate-600">{apt.complaint}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#008588]">
                  <Scissors className="h-3.5 w-3.5" aria-hidden />
                  Upcoming Surgeries
                </h3>
                <ul className="space-y-3">
                  {UPCOMING_SURGERIES.map((surgery) => (
                    <li
                      key={surgery.id}
                      className="rounded-xl border border-[#5EC283]/30 bg-[#5EC283]/10 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-[#00758C]">
                          {surgery.time}
                        </span>
                        <span className="text-[10px] font-bold text-[#008588]">{surgery.room}</span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900">{surgery.procedure}</p>
                      <p className="text-xs font-medium text-slate-600">{surgery.patientRef}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right column — follow-ups & rapid access (35%) */}
        <aside className="space-y-6">
          <section aria-label="Doctor quick actions" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Doctor Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 text-left text-xs font-bold text-slate-700 transition-all hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4 text-[#008588]" aria-hidden />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Pending follow-ups" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Pending Follow-ups Desk</h2>
            </div>
            <ul className="space-y-3">
              {PENDING_FOLLOWUPS.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4"
                >
                  <p className="text-sm font-black text-[#00758C]">{item.patientRef}</p>
                  <p className="mt-1 text-xs font-medium text-slate-700">{item.task}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Due {item.dueBy}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.status === 'Discharge Review'
                          ? 'border border-rose-500/20 bg-rose-500/10 text-rose-700'
                          : item.status === 'Chart Incomplete'
                            ? 'border border-amber-500/20 bg-amber-500/10 text-amber-800'
                            : 'border border-[#00A481]/20 bg-[#00A481]/10 text-[#00A481]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function DoctorDashboardPage() {
  return (
    <ClientMounted fallback={<DashboardLoadingShell />}>
      <DoctorDashboardContent />
    </ClientMounted>
  );
}
