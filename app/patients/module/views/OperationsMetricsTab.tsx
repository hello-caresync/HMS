'use client';

import {
  BarChart3,
  Barcode,
  CreditCard,
  MessageSquare,
  QrCode,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ADMISSION_TREND,
  AGE_DISTRIBUTION,
  formatDateTime,
  GENDER_DISTRIBUTION,
  PATIENT_CENSUS,
  RECENT_CHECKINS,
} from '../lib/patientsMockData';
import type { QuickActionModalType } from '../patientsNav.types';
import { PatientPanel, StatusBadge } from '../components/patientsUi';

type OperationsMetricsTabProps = {
  onQuickAction: (type: NonNullable<QuickActionModalType>) => void;
  selectedUhid: string | null;
};

const QUICK_ACTIONS = [
  { id: 'print-card' as const, label: 'Print Patient Card', icon: CreditCard },
  { id: 'print-barcode' as const, label: 'Print Barcode', icon: Barcode },
  { id: 'generate-qr' as const, label: 'Generate QR Code', icon: QrCode },
  { id: 'send-sms' as const, label: 'Send SMS', icon: MessageSquare },
];

export default function OperationsMetricsTab({ onQuickAction, selectedUhid }: OperationsMetricsTabProps) {
  const census = PATIENT_CENSUS;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Total Registered', value: census.totalRegistered.toLocaleString('en-IN') },
          { label: 'New Today', value: census.newToday, accent: true },
          { label: 'Returning', value: census.returning },
          { label: 'Active', value: census.active },
          { label: 'Admitted', value: census.admitted },
          { label: 'Discharged', value: census.discharged },
          { label: 'Emergency', value: census.emergency, alert: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2.5 ${k.alert ? 'border-red-200' : 'border-slate-200'}`}
          >
            <p className={`text-lg font-bold tabular-nums leading-none ${k.accent ? 'text-[#2563EB]' : k.alert ? 'text-red-600' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <PatientPanel title="Live Intake & Recent Registrations" icon={Users} className="xl:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['UHID', 'Name', 'Type', 'New/Return', 'Check-in'].map((h) => (
                    <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_CHECKINS.map((row) => (
                  <tr key={row.uhid} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="py-1.5 pr-2 font-mono text-[10px] font-semibold text-[#2563EB]">{row.uhid}</td>
                    <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{row.name}</td>
                    <td className="py-1.5 pr-2"><StatusBadge status={row.status} /></td>
                    <td className="py-1.5 pr-2 text-[9px] font-bold uppercase text-slate-500">{row.isNew ? 'New' : 'Returning'}</td>
                    <td className="py-1.5 font-mono text-[9px] text-slate-500">{formatDateTime(row.checkInAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PatientPanel>

        <PatientPanel title="Quick Actions Matrix" className="xl:col-span-5">
          <p className="mb-2 text-[9px] text-slate-500">
            Active patient: <span className="font-mono font-semibold text-[#2563EB]">{selectedUhid ?? 'Select from directory'}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onQuickAction(id)}
                disabled={!selectedUhid && id !== 'send-sms'}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-[#F8FAFC] px-2 py-2 text-left text-[10px] font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB]/40 hover:bg-blue-50/50 disabled:opacity-40"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                {label}
              </button>
            ))}
          </div>
        </PatientPanel>
      </div>

      <PatientPanel title="Demographics & Analytics" icon={BarChart3} subtitle="Age · gender · admission trends — navy palette">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="h-[140px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Age Distribution</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGE_DISTRIBUTION} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="count" fill="#0F172A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[140px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Gender Distribution</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GENDER_DISTRIBUTION} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[140px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Admission Trend (7d)</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADMISSION_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="admissions" stroke="#0F172A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </PatientPanel>
    </div>
  );
}
