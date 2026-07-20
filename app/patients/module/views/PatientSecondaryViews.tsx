'use client';

import {
  BarChart3,
  CalendarClock,
  Download,
  FileText,
  FolderOpen,
  MessageSquare,
  Scale,
  Shield,
  Upload,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatInr,
  getPatientByUhid,
  MOCK_COMM_LOGS,
  MOCK_INVOICES,
} from '../lib/patientsMockData';
import { AlertStickyBar, PatientPanel, VerifiedPill } from '../components/patientsUi';

type SecondaryViewsProps = {
  view:
    | 'insurance-tpa'
    | 'documents'
    | 'appointment-admission'
    | 'billing'
    | 'communication'
    | 'consent-legal'
    | 'alerts'
    | 'reports';
  selectedUhid: string | null;
};

const DEMOGRAPHICS = [
  { label: 'Mon', registrations: 12 },
  { label: 'Tue', registrations: 18 },
  { label: 'Wed', registrations: 15 },
  { label: 'Thu', registrations: 22 },
  { label: 'Fri', registrations: 19 },
  { label: 'Sat', registrations: 8 },
  { label: 'Sun', registrations: 5 },
];

export default function PatientSecondaryViews({ view, selectedUhid }: SecondaryViewsProps) {
  const patient = selectedUhid ? getPatientByUhid(selectedUhid) : getPatientByUhid('NX-2026-000412');

  if (view === 'insurance-tpa') {
    return (
      <ViewShell title="Insurance & TPA" subtitle="Policy details · eligibility · authorization status">
        <PatientPanel title="Active Policy" icon={Shield}>
          <dl className="grid grid-cols-2 gap-2 text-[10px]">
            <div><dt className="text-slate-400">Policy ID</dt><dd className="font-mono font-semibold text-[#0F172A]">{patient?.insuranceId ?? '—'}</dd></div>
            <div><dt className="text-slate-400">Payer</dt><dd className="font-semibold text-[#0F172A]">Star Health Insurance</dd></div>
            <div><dt className="text-slate-400">Sum Insured</dt><dd className="font-semibold text-[#0F172A]">₹5,00,000</dd></div>
            <div><dt className="text-slate-400">Room Eligibility</dt><dd className="font-semibold text-[#0F172A]">Single AC — up to ₹8,000/day</dd></div>
          </dl>
          <div className="mt-2 flex gap-2">
            <VerifiedPill label="Eligibility Verified" />
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800">
              Pre-auth pending — IPD Day-3
            </span>
          </div>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'documents') {
    const docs = [
      { name: 'Discharge Summary Draft.pdf', type: 'Clinical', date: '2026-07-16', size: '248 KB' },
      { name: 'Echo Report — 14 Jul.pdf', type: 'Diagnostic', date: '2026-07-14', size: '1.2 MB' },
      { name: 'Consent — Cardiac Procedure.pdf', type: 'Legal', date: '2026-07-14', size: '89 KB' },
      { name: 'Referral — Cardiology.pdf', type: 'Referral', date: '2026-06-22', size: '56 KB' },
    ];
    return (
      <ViewShell title="Documents Management" subtitle="Medical reports · consent forms · referral letters">
        <div className="mb-2 flex gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2.5 py-1 text-[10px] font-bold text-white">
            <Upload className="h-3 w-3" /> Upload Document
          </button>
        </div>
        <PatientPanel title="Document Vault" icon={FolderOpen}>
          <ul className="space-y-1.5">
            {docs.map((d) => (
              <li key={d.name} className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
                  <div>
                    <p className="text-[10px] font-semibold text-[#0F172A]">{d.name}</p>
                    <p className="text-[9px] text-slate-400">{d.type} · {d.date} · {d.size}</p>
                  </div>
                </div>
                <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label={`Download ${d.name}`}>
                  <Download className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'appointment-admission') {
    const rows = [
      { date: '2026-07-18 10:00', type: 'Appointment', detail: 'Cardiology follow-up — Dr. Anita Roy', status: 'Scheduled' },
      { date: '2026-07-14 14:10', type: 'Admission', detail: 'Ward 3A Bed 12 — IPD', status: 'Active' },
      { date: '2026-07-12 09:00', type: 'Transfer', detail: 'ER Bay T-4 → Ward 3A (step-down)', status: 'Completed' },
      { date: '2026-03-08 22:30', type: 'Discharge', detail: 'Emergency — hypertensive urgency', status: 'Completed' },
    ];
    return (
      <ViewShell title="Appointment & Admission History" subtitle="Schedules · ward transfers · discharge records">
        <PatientPanel title="Timeline Grid" icon={CalendarClock}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Date/Time', 'Event', 'Detail', 'Status'].map((h) => (
                  <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 font-mono text-[9px] text-slate-600">{r.date}</td>
                  <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{r.type}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-slate-600">{r.detail}</td>
                  <td className="py-1.5 text-[9px] font-bold text-[#2563EB]">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'billing') {
    const outstanding = MOCK_INVOICES.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
    return (
      <ViewShell title="Billing Summary" subtitle="Outstanding balances · invoices · payment receipts">
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[10px] font-bold text-amber-900">Outstanding Balance</p>
          <p className="text-lg font-bold tabular-nums text-[#0F172A]">{formatInr(outstanding)}</p>
        </div>
        <PatientPanel title="Invoice Line Items" icon={Wallet}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Invoice', 'Date', 'Description', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 font-mono text-[9px] text-[#2563EB]">{inv.id}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-slate-600">{inv.date}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-slate-600">{inv.description}</td>
                  <td className="py-1.5 pr-2 text-[10px] font-bold tabular-nums text-[#0F172A]">{formatInr(inv.amount)}</td>
                  <td className="py-1.5 text-[9px] font-bold text-slate-600">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'communication') {
    return (
      <ViewShell title="Communication Center" subtitle="SMS · Email · WhatsApp notification logs">
        <PatientPanel title="Outbound Communications" icon={MessageSquare}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Channel', 'Subject', 'Sent', 'Status'].map((h) => (
                  <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_COMM_LOGS.map((log) => (
                <tr key={log.id} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 text-[10px] font-bold text-[#0F172A]">{log.channel}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-slate-600">{log.subject}</td>
                  <td className="py-1.5 pr-2 font-mono text-[9px] text-slate-500">{log.sentAt.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-1.5 text-[9px] font-semibold text-emerald-700">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'consent-legal') {
    const consents = [
      { name: 'General Treatment Consent', signed: '2026-07-14', status: 'Signed' },
      { name: 'Cardiac Procedure Consent', signed: '2026-07-14', status: 'Signed' },
      { name: 'Data Sharing — Insurance TPA', signed: '2026-07-14', status: 'Signed' },
      { name: 'Research Participation (Opt-out)', signed: '—', status: 'Declined' },
    ];
    return (
      <ViewShell title="Consent & Legal" subtitle="Digital consent · treatment agreements · signature logs">
        <PatientPanel title="Consent Registry" icon={Scale}>
          <ul className="space-y-1.5">
            {consents.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5">
                <div>
                  <p className="text-[10px] font-semibold text-[#0F172A]">{c.name}</p>
                  <p className="text-[9px] text-slate-400">Signed: {c.signed}</p>
                </div>
                {c.status === 'Signed' ? <VerifiedPill /> : <span className="text-[9px] text-slate-400">{c.status}</span>}
              </li>
            ))}
          </ul>
        </PatientPanel>
      </ViewShell>
    );
  }

  if (view === 'alerts') {
    const p = patient!;
    return (
      <ViewShell title="Patient Alerts Panel" subtitle="Allergy · critical conditions · special instructions">
        <div className="sticky top-0 z-10 space-y-1.5">
          {p.allergies.map((a) => (
            <AlertStickyBar key={a} type="allergy" message={a} />
          ))}
          {p.criticalConditions.map((c) => (
            <AlertStickyBar key={c} type="critical" message={c} />
          ))}
          {p.specialInstructions.map((s) => (
            <AlertStickyBar key={s} type="instruction" message={s} />
          ))}
        </div>
      </ViewShell>
    );
  }

  if (view === 'reports') {
    return (
      <ViewShell title="Reports & Analytics" subtitle="Demographics · registration trends · readmission statistics">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Registrations (7d)', value: '99' },
            { label: 'Readmission Rate', value: '4.2%' },
            { label: 'Avg Age Cohort', value: '43.2' },
          ].map((k) => (
            <div key={k.label} className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
              <p className="text-lg font-bold text-[#0F172A]">{k.value}</p>
              <p className="text-[9px] font-semibold uppercase text-slate-500">{k.label}</p>
            </div>
          ))}
        </div>
        <PatientPanel title="Registration Trends" icon={BarChart3} className="mt-2">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMOGRAPHICS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="registrations" stroke="#0F172A" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PatientPanel>
      </ViewShell>
    );
  }

  return null;
}

function ViewShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
