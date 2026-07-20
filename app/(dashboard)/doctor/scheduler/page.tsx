'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  History,
  List,
  ShieldAlert,
  Users,
} from 'lucide-react';

type ViewMode = 'list' | 'calendar';

type ScheduledAppointment = {
  id: string;
  patientName: string;
  ageGender: string;
  timeSlot: string;
  date: string;
  reason: string;
  status: 'Confirmed' | 'Pending' | 'Checked In';
};

type HistoryEntry = {
  id: string;
  patientName: string;
  date: string;
  reason: string;
  complianceFlag?: string;
  completed: boolean;
};

type WalkInPatient = {
  id: string;
  token: string;
  patientName: string;
  arrivalTime: string;
  complaint: string;
  waitMinutes: number;
};

type EmergencyRequest = {
  id: string;
  patientRef: string;
  triageCode: string;
  detail: string;
  requestedAt: string;
};

type CalendarDay = {
  day: number;
  inMonth: boolean;
  slotCount: number;
};

const MINT_BADGE =
  'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold px-2.5 py-0.5 rounded text-[10px] tracking-wide';

const PANEL_CLASS = 'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const INITIAL_APPOINTMENTS: ScheduledAppointment[] = [
  {
    id: 'apt-1',
    patientName: 'Aishwarya D S',
    ageGender: '34 · F',
    timeSlot: '10:30',
    date: '14 Jul 2026',
    reason: 'Cardiology teleconsult · lipid panel review',
    status: 'Confirmed',
  },
  {
    id: 'apt-2',
    patientName: 'R. Srinivasan',
    ageGender: '38 · M',
    timeSlot: '11:00',
    date: '14 Jul 2026',
    reason: 'Hypertension follow-up · medication titration',
    status: 'Checked In',
  },
  {
    id: 'apt-3',
    patientName: 'P. Nandini',
    ageGender: '45 · F',
    timeSlot: '11:45',
    date: '14 Jul 2026',
    reason: 'Post-operative wound check · Day 7',
    status: 'Pending',
  },
  {
    id: 'apt-4',
    patientName: 'M. Joseph',
    ageGender: '52 · M',
    timeSlot: '14:00',
    date: '14 Jul 2026',
    reason: 'Chronic cough · 3-week duration',
    status: 'Confirmed',
  },
  {
    id: 'apt-5',
    patientName: 'S. Lakshmi',
    ageGender: '62 · F',
    timeSlot: '09:15',
    date: '15 Jul 2026',
    reason: 'Diabetes management · HbA1c review',
    status: 'Confirmed',
  },
  {
    id: 'apt-6',
    patientName: 'K. Venkatesh',
    ageGender: '58 · M',
    timeSlot: '10:00',
    date: '16 Jul 2026',
    reason: 'Cardiology referral · syncope workup',
    status: 'Pending',
  },
];

const APPOINTMENT_HISTORY: HistoryEntry[] = [
  {
    id: 'hist-1',
    patientName: 'R. Srinivasan',
    date: '05 Jul 2026 · 15:00',
    reason: 'General medicine OPD · BP review',
    complianceFlag: 'Medication adherence verified',
    completed: true,
  },
  {
    id: 'hist-2',
    patientName: 'Aishwarya D S',
    date: '02 Jul 2026 · 11:30',
    reason: 'Teleconsult · post-lab follow-up',
    completed: true,
  },
  {
    id: 'hist-3',
    patientName: 'A. Arjun',
    date: '28 Jun 2026 · 09:45',
    reason: 'Pediatrics · fever protocol',
    complianceFlag: 'Guardian consent on file',
    completed: true,
  },
  {
    id: 'hist-4',
    patientName: 'L. Iyer',
    date: '20 Jun 2026 · 14:15',
    reason: 'Geriatric fall risk assessment',
    complianceFlag: 'Missed follow-up flagged',
    completed: true,
  },
  {
    id: 'hist-5',
    patientName: 'P. Nandini',
    date: '12 Jun 2026 · 10:00',
    reason: 'Pre-operative clearance · laparoscopic',
    completed: true,
  },
];

const INITIAL_WALKINS: WalkInPatient[] = [
  {
    id: 'wi-1',
    token: 'WALK-031',
    patientName: 'S. Gupta',
    arrivalTime: '09:52',
    complaint: 'Acute migraine · no prior chart',
    waitMinutes: 38,
  },
  {
    id: 'wi-2',
    token: 'WALK-032',
    patientName: 'D. Mehta',
    arrivalTime: '10:08',
    complaint: 'Skin rash · referral from pharmacy',
    waitMinutes: 22,
  },
  {
    id: 'wi-3',
    token: 'WALK-033',
    patientName: 'T. Reddy',
    arrivalTime: '10:22',
    complaint: 'Back pain · walk-in OPD',
    waitMinutes: 8,
  },
];

const INITIAL_EMERGENCIES: EmergencyRequest[] = [
  {
    id: 'er-1',
    patientRef: 'Unknown Male · Bay 3',
    triageCode: 'TRI-2401',
    detail: 'Chest pain · stat ECG · zero-wait override',
    requestedAt: '10:18',
  },
  {
    id: 'er-2',
    patientRef: 'K.V. · Resuscitation',
    triageCode: 'TRI-2402',
    detail: 'Hb panic 6.2 · transfusion protocol · immediate',
    requestedAt: '10:25',
  },
];

const JULY_2026_CALENDAR: CalendarDay[] = [
  { day: 29, inMonth: false, slotCount: 0 },
  { day: 30, inMonth: false, slotCount: 0 },
  { day: 1, inMonth: true, slotCount: 6 },
  { day: 2, inMonth: true, slotCount: 8 },
  { day: 3, inMonth: true, slotCount: 4 },
  { day: 4, inMonth: true, slotCount: 0 },
  { day: 5, inMonth: true, slotCount: 7 },
  { day: 6, inMonth: true, slotCount: 5 },
  { day: 7, inMonth: true, slotCount: 3 },
  { day: 8, inMonth: true, slotCount: 9 },
  { day: 9, inMonth: true, slotCount: 6 },
  { day: 10, inMonth: true, slotCount: 4 },
  { day: 11, inMonth: true, slotCount: 2 },
  { day: 12, inMonth: true, slotCount: 8 },
  { day: 13, inMonth: true, slotCount: 5 },
  { day: 14, inMonth: true, slotCount: 11 },
  { day: 15, inMonth: true, slotCount: 7 },
  { day: 16, inMonth: true, slotCount: 6 },
  { day: 17, inMonth: true, slotCount: 3 },
  { day: 18, inMonth: true, slotCount: 0 },
  { day: 19, inMonth: true, slotCount: 4 },
  { day: 20, inMonth: true, slotCount: 5 },
  { day: 21, inMonth: true, slotCount: 2 },
  { day: 22, inMonth: true, slotCount: 6 },
  { day: 23, inMonth: true, slotCount: 8 },
  { day: 24, inMonth: true, slotCount: 4 },
  { day: 25, inMonth: true, slotCount: 3 },
  { day: 26, inMonth: true, slotCount: 0 },
  { day: 27, inMonth: true, slotCount: 5 },
  { day: 28, inMonth: true, slotCount: 7 },
  { day: 29, inMonth: true, slotCount: 4 },
  { day: 30, inMonth: true, slotCount: 6 },
  { day: 31, inMonth: true, slotCount: 3 },
  { day: 1, inMonth: false, slotCount: 0 },
  { day: 2, inMonth: false, slotCount: 0 },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function slotDots(count: number): string {
  if (count === 0) return '';
  if (count <= 3) return '●';
  if (count <= 7) return '●●';
  return '●●●';
}

export default function DoctorSchedulerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>(INITIAL_APPOINTMENTS);
  const [walkIns, setWalkIns] = useState<WalkInPatient[]>(INITIAL_WALKINS);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>(INITIAL_EMERGENCIES);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<string | null>(null);

  const todayAppointments = useMemo(
    () => appointments.filter((apt) => apt.date === '14 Jul 2026'),
    [appointments],
  );

  const upcomingAppointments = useMemo(
    () => appointments.filter((apt) => apt.date !== '14 Jul 2026'),
    [appointments],
  );

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handleReschedule = useCallback(
    (appointment: ScheduledAppointment) => {
      setRescheduleTarget(appointment.id);
      showNotice(
        `Reschedule workflow opened · ${appointment.patientName} · ${appointment.timeSlot} · sandbox calendar`,
      );
    },
    [showNotice],
  );

  const handleAdmitEmergency = useCallback(
    (request: EmergencyRequest) => {
      setEmergencies((prev) => prev.filter((item) => item.id !== request.id));
      showNotice(`Emergency admitted immediately · ${request.triageCode} · pipeline override active`);
    },
    [showNotice],
  );

  const handleAssignWalkIn = useCallback(
    (patient: WalkInPatient) => {
      setWalkIns((prev) => prev.filter((item) => item.id !== patient.id));
      showNotice(`Walk-in assigned · ${patient.token} · ${patient.patientName} · next open slot queued`);
    },
    [showNotice],
  );

  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/50 p-6 font-sans text-slate-950">
      {/* Scheduler header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">
            Patient Encounter Scheduler &amp; Central Calendar
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Dr. Aishwarya D S, MD · OPD Block A · 14 slots allocated today · 6 open · 14 Jul 2026
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#008588]/20 bg-white px-4 py-2.5 shadow-sm">
          <Calendar className="h-4 w-4 text-[#008588]" aria-hidden />
          <span className="text-xs font-bold text-[#00758C]">JUL 2026 · ACTIVE_PROVIDER</span>
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {actionNotice}
        </p>
      ) : null}

      {/* Top priority critical strip */}
      <section
        aria-label="Emergency and walk-in intake"
        className="flex flex-col gap-4 lg:flex-row"
      >
        <div className="w-full lg:w-[40%]">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" aria-hidden />
            <h2 className="text-xs font-black uppercase tracking-wider text-rose-700">
              Emergency Requests
            </h2>
          </div>
          <ul className="space-y-2">
            {emergencies.map((request) => (
              <li
                key={request.id}
                className="flex animate-pulse items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-black text-rose-700 shadow-sm"
              >
                <div>
                  <p className="font-mono text-[10px]">{request.triageCode}</p>
                  <p className="mt-0.5 text-sm">{request.patientRef}</p>
                  <p className="mt-1 font-medium">{request.detail}</p>
                  <p className="mt-1 text-[10px] opacity-80">Requested {request.requestedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdmitEmergency(request)}
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-rose-700"
                >
                  Admit Immediately
                </button>
              </li>
            ))}
            {emergencies.length === 0 ? (
              <li className="rounded-xl border border-[#00A481]/20 bg-[#00A481]/10 p-3 text-xs font-bold text-[#00A481]">
                No active emergency overrides · pipeline nominal
              </li>
            ) : null}
          </ul>
        </div>

        <div className="w-full lg:w-[60%]">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#008588]" aria-hidden />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#00758C]">
              Walk-In Patients
            </h2>
          </div>
          <ul className="space-y-2">
            {walkIns.map((patient) => (
              <li
                key={patient.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3 text-xs shadow-sm"
              >
                <div>
                  <p className="font-mono font-black text-[#008588]">{patient.token}</p>
                  <p className="font-bold text-slate-900">{patient.patientName}</p>
                  <p className="text-slate-600">{patient.complaint}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                    Arrived {patient.arrivalTime} · wait {patient.waitMinutes} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAssignWalkIn(patient)}
                  className="shrink-0 rounded-lg border border-[#008588]/20 bg-[#008588]/5 px-3 py-1.5 text-xs font-bold text-[#008588] hover:bg-[#008588]/10"
                >
                  Assign Slot
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Left — calendar & pipeline (65%) */}
        <section aria-label="Appointment pipeline and calendar" className={PANEL_CLASS}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {viewMode === 'list' ? (
                <List className="h-5 w-5 text-[#008588]" aria-hidden />
              ) : (
                <Calendar className="h-5 w-5 text-[#008588]" aria-hidden />
              )}
              <h2 className="text-lg font-black text-[#00758C]">
                {viewMode === 'list' ? 'List View Pipeline' : 'Calendar Month View'}
              </h2>
            </div>

            <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#00758C] shadow-sm'
                    : 'text-slate-600 hover:text-[#00758C]'
                }`}
              >
                List View Pipeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-[#00758C] shadow-sm'
                    : 'text-slate-600 hover:text-[#00758C]'
                }`}
              >
                Calendar Month View
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#008588]">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Today&apos;s Appointments
                </h3>
                <ul className="space-y-3">
                  {todayAppointments.map((apt) => (
                    <li
                      key={apt.id}
                      className={`rounded-xl border p-4 ${
                        rescheduleTarget === apt.id
                          ? 'border-[#008588]/40 bg-[#008588]/5 ring-1 ring-[#008588]/20'
                          : 'border-slate-200/60 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#00758C]">{apt.patientName}</p>
                          <p className="text-xs font-bold text-slate-600">{apt.ageGender}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-black text-[#008588]">{apt.timeSlot}</p>
                          <span className={`mt-1 inline-flex uppercase ${MINT_BADGE}`}>{apt.status}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-700">{apt.reason}</p>
                      <button
                        type="button"
                        onClick={() => handleReschedule(apt)}
                        className="mt-2 cursor-pointer text-xs font-bold text-[#008588] hover:underline"
                      >
                        Reschedule Appointment
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-[#008588]">
                  Upcoming Appointments
                </h3>
                <ul className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <li
                      key={apt.id}
                      className="rounded-xl border border-slate-200/60 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#00758C]">{apt.patientName}</p>
                          <p className="text-xs font-bold text-slate-600">{apt.ageGender}</p>
                          <p className="text-[10px] font-bold text-[#5EC283]">{apt.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-black text-[#008588]">{apt.timeSlot}</p>
                          <span className={`mt-1 inline-flex uppercase ${MINT_BADGE}`}>{apt.status}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-700">{apt.reason}</p>
                      <button
                        type="button"
                        onClick={() => handleReschedule(apt)}
                        className="mt-2 cursor-pointer text-xs font-bold text-[#008588] hover:underline"
                      >
                        Reschedule Appointment
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm font-bold text-[#00758C]">July 2026 · Slot Density Map</p>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="py-1 text-center text-[10px] font-black uppercase text-slate-500"
                  >
                    {label}
                  </div>
                ))}
                {JULY_2026_CALENDAR.map((cell, index) => (
                  <div
                    key={`${cell.day}-${index}`}
                    className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border p-1 text-center ${
                      cell.day === 14 && cell.inMonth
                        ? 'border-[#008588]/40 bg-[#008588]/5 ring-1 ring-[#008588]/20'
                        : cell.inMonth
                          ? 'border-slate-200/60 bg-white'
                          : 'border-transparent bg-slate-50/50 text-slate-300'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        cell.inMonth ? 'text-slate-900' : 'text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.inMonth && cell.slotCount > 0 ? (
                      <span className="mt-0.5 text-[8px] font-bold leading-none text-[#00A481]">
                        {slotDots(cell.slotCount)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-medium text-slate-600">
                ● low · ●● medium · ●●● high slot density · today highlighted
              </p>
            </div>
          )}
        </section>

        {/* Right — history archive (35%) */}
        <aside aria-label="Appointment history" className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-[#008588]" aria-hidden />
            <h2 className="text-base font-black text-[#00758C]">Historical Encounter Log</h2>
          </div>

          <ul className="relative space-y-0">
            {APPOINTMENT_HISTORY.map((entry, index) => (
              <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                {index < APPOINTMENT_HISTORY.length - 1 ? (
                  <span
                    className="absolute left-[7px] top-4 h-full w-px bg-[#5EC283]/40"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#00A481] bg-white" />
                <div className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#00758C]">{entry.patientName}</p>
                    {entry.completed ? (
                      <span className={`inline-flex uppercase ${MINT_BADGE}`}>COMPLETED</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[10px] font-bold text-[#008588]">{entry.date}</p>
                  <p className="mt-1 text-xs font-medium text-slate-700">{entry.reason}</p>
                  {entry.complianceFlag ? (
                    <p className="mt-2 rounded-lg border border-[#5EC283]/30 bg-[#5EC283]/10 px-2 py-1 text-[10px] font-bold text-[#00758C]">
                      {entry.complianceFlag}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
