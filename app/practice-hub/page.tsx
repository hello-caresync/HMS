'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  GraduationCap,
  User,
} from 'lucide-react';

type HubTab = 'profile' | 'notifications' | 'analytics';

type NotificationItem = {
  id: string;
  tag: 'Emergency Case Assignment' | 'Lab Report Ready' | 'OT Reminder';
  message: string;
  timestamp: string;
};

type BarPoint = { label: string; value: number };

const HUB_SUMMARY =
  'Standalone practice console · profile management · live alerts · analytics ledger · 13 Jul 2026';

const HUB_TABS: { key: HubTab; label: string }[] = [
  { key: 'profile', label: 'Doctor Profile' },
  { key: 'notifications', label: 'Live Notifications Feed' },
  { key: 'analytics', label: 'Practice Analytics Ledger' },
];

const METRICS = {
  dailyConsultations: 18,
  monthlyConsultations: 412,
  opdWaiting: 6,
  opdCompleted: 12,
  satisfactionPct: 94,
  revenueDaily: 42800,
  revenueMonthly: 892400,
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    tag: 'Emergency Case Assignment',
    message: 'Trauma bay activation · sandbox triage · respond within 5 min',
    timestamp: '10:12',
  },
  {
    id: 'n-2',
    tag: 'Lab Report Ready',
    message: 'HbA1c result uploaded for P.N. · review in laboratory module',
    timestamp: '09:45',
  },
  {
    id: 'n-3',
    tag: 'OT Reminder',
    message: 'OT-03 laparoscopic case · timeout in 15 minutes',
    timestamp: '08:15',
  },
  {
    id: 'n-4',
    tag: 'Lab Report Ready',
    message: 'Lipid profile finalized · R.S. · flag borderline LDL',
    timestamp: 'Yesterday 16:30',
  },
  {
    id: 'n-5',
    tag: 'OT Reminder',
    message: 'Pre-op checklist pending · K.V. · TKR 11:00',
    timestamp: 'Yesterday 10:00',
  },
];

const CONSULTATION_GROWTH: BarPoint[] = [
  { label: 'Feb', value: 320 },
  { label: 'Mar', value: 345 },
  { label: 'Apr', value: 368 },
  { label: 'May', value: 390 },
  { label: 'Jun', value: 401 },
  { label: 'Jul', value: 412 },
];

const PRESCRIPTION_STATS: BarPoint[] = [
  { label: 'Feb', value: 890 },
  { label: 'Mar', value: 920 },
  { label: 'Apr', value: 945 },
  { label: 'May', value: 980 },
  { label: 'Jun', value: 1010 },
  { label: 'Jul', value: 1042 },
];

const REVENUE_STATS: BarPoint[] = [
  { label: 'Feb', value: 720 },
  { label: 'Mar', value: 760 },
  { label: 'Apr', value: 810 },
  { label: 'May', value: 845 },
  { label: 'Jun', value: 870 },
  { label: 'Jul', value: 892 },
];

const TAG_STYLES: Record<NotificationItem['tag'], string> = {
  'Emergency Case Assignment': 'bg-rose-100 text-rose-950 border border-rose-400',
  'Lab Report Ready': 'bg-sky-100 text-sky-950 border border-sky-400',
  'OT Reminder': 'bg-amber-100 text-amber-950 border border-amber-400',
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function barHeight(value: number, max: number): string {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return `${Math.max(12, pct)}%`;
}

function BarChart({ title, unit, points, max }: { title: string; unit: string; points: BarPoint[]; max: number }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="text-xs font-bold text-slate-800">Unit · {unit}</p>
      <div className="mt-4 flex h-40 items-end justify-between gap-2 border-b-2 border-slate-300 px-1 pb-2">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-black tabular-nums text-slate-950">{point.value}</span>
            <div
              className="w-full max-w-[40px] rounded-t-md bg-slate-800"
              style={{ height: barHeight(point.value, max) }}
              aria-hidden
            />
            <span className="text-[10px] font-bold text-slate-800">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PracticeHubPage() {
  const [activeTab, setActiveTab] = useState<HubTab>('profile');
  const [leaveFrom, setLeaveFrom] = useState('2026-07-20');
  const [leaveTo, setLeaveTo] = useState('2026-07-22');
  const [leaveReason, setLeaveReason] = useState('Conference · sandbox CME');
  const [actionNote, setActionNote] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const revenueMax = useMemo(() => Math.max(...REVENUE_STATS.map((p) => p.value)), []);

  const handleLeaveSubmit = () => {
    showNotice(`Leave request submitted · ${leaveFrom} → ${leaveTo} · sandbox routing only`);
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Practice Performance &amp; Profile Console
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {HUB_SUMMARY}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Activity className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>ANALYTICS_STREAM_ACTIVE</span>
          </div>
        </header>

        {actionNote && (
          <p role="status" className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950">
            {actionNote}
          </p>
        )}

        <nav className="flex w-full flex-wrap gap-2">
          {HUB_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-lg border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                activeTab === key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
          {activeTab === 'profile' && (
            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              <section className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <User className="h-4 w-4" aria-hidden />
                  Personal Details
                </h2>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="font-bold text-slate-800">Name</dt>
                    <dd className="font-black text-slate-950">Dr. Sandbox M.</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="font-bold text-slate-800">Specialty</dt>
                    <dd className="font-black text-slate-950">Internal Medicine</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="font-bold text-slate-800">Department</dt>
                    <dd className="font-black text-slate-950">OPD · General Medicine</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-bold text-slate-800">Contact</dt>
                    <dd className="font-black text-slate-950">sandbox@nexora.local</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  Qualifications
                </h2>
                <ul className="mt-3 space-y-2 text-xs font-bold text-slate-950">
                  <li>MBBS · State Medical University · 2010</li>
                  <li>MD (Internal Medicine) · 2014</li>
                  <li>Fellowship · Clinical Cardiology · 2017</li>
                </ul>
                <p className="mt-4 text-[10px] font-black uppercase text-slate-800">Registration Number</p>
                <p className="font-mono text-sm font-black text-slate-950">NX-MD-REG-00421</p>
              </section>

              <section className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <Calendar className="h-4 w-4" aria-hidden />
                  Consultation Timings &amp; Availability
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { day: 'Mon – Wed', slot: '09:00 – 13:00 · OPD Block A' },
                    { day: 'Thu – Fri', slot: '14:00 – 18:00 · OPD Block B' },
                    { day: 'Sat', slot: '09:00 – 12:00 · Half day' },
                  ].map((row) => (
                    <div key={row.day} className="rounded-lg border-2 border-slate-200 bg-white p-3">
                      <p className="text-xs font-black text-slate-950">{row.day}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-800">{row.slot}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <h2 className="text-sm font-black text-slate-950">Submit Leave Request</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">From</span>
                    <input type="date" className={INPUT_CLASS} value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">To</span>
                    <input type="date" className={INPUT_CLASS} value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} />
                  </label>
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">Reason</span>
                    <input type="text" className={INPUT_CLASS} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleLeaveSubmit}
                  className="mt-3 rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-slate-800"
                >
                  Submit Leave Request
                </button>
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="relative w-full space-y-0 pl-6">
              <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-slate-300" aria-hidden />
              {NOTIFICATIONS.map((item) => (
                <article key={item.id} className="relative pb-6">
                  <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-white" aria-hidden />
                  <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${TAG_STYLES[item.tag]}`}>
                        {item.tag}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800">{item.timestamp}</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-950">{item.message}</p>
                  </div>
                </article>
              ))}
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
                <Bell className="h-4 w-4 text-slate-950" aria-hidden />
                Live feed sandbox · {NOTIFICATIONS.length} recent events
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="w-full space-y-5">
              <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: 'Daily Consultations', value: METRICS.dailyConsultations, unit: 'today' },
                  { label: 'Monthly Consultations', value: METRICS.monthlyConsultations, unit: 'Jul 2026' },
                  { label: 'Patient Satisfaction', value: METRICS.satisfactionPct, unit: '%' },
                  { label: 'Revenue Generated', value: `₹${(METRICS.revenueMonthly / 1000).toFixed(0)}K`, unit: 'monthly' },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-800">{m.label}</p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-slate-950">{m.value}</p>
                    <p className="text-[10px] font-bold text-slate-800">{m.unit}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">OPD Statistics · Today</p>
                  <div className="mt-3 flex gap-4">
                    <div>
                      <p className="text-2xl font-black text-slate-950">{METRICS.opdWaiting}</p>
                      <p className="text-[10px] font-bold text-slate-800">Waiting</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-emerald-900">{METRICS.opdCompleted}</p>
                      <p className="text-[10px] font-bold text-slate-800">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-950">₹{(METRICS.revenueDaily / 1000).toFixed(1)}K</p>
                      <p className="text-[10px] font-bold text-slate-800">Revenue today</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">Monthly Growth Snapshot</p>
                  <p className="mt-2 text-sm font-black text-emerald-900">+8.2% consult volume · sandbox metric</p>
                  <p className="text-xs font-bold text-slate-800">Prescriptions +6.1% · Revenue +5.4%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <BarChart title="Monthly Consultations" unit="visits" points={CONSULTATION_GROWTH} max={450} />
                <BarChart title="Prescription Statistics" unit="Rx count" points={PRESCRIPTION_STATS} max={1100} />
                <BarChart title="Revenue Counts" unit="₹ thousands" points={REVENUE_STATS} max={revenueMax} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
