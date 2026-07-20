'use client';

import { AlertTriangle, MessageSquare } from 'lucide-react';

import { MOCK_COMM_LOGS, PATIENT_ALERTS_HUB } from '../lib/patientsMockData';
import { AlertStickyBar, PatientPanel } from '../components/patientsUi';

const ALERT_TYPE_MAP = {
  allergy: 'allergy' as const,
  critical: 'critical' as const,
  infection: 'critical' as const,
  instruction: 'instruction' as const,
};

export default function AlertsCommunicationTab() {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <PatientPanel
          title="Patient Alerts Hub"
          icon={AlertTriangle}
          subtitle="Critical conditions · infection alerts · allergies · special instructions"
        >
          <div className="space-y-1.5">
            {PATIENT_ALERTS_HUB.map((alert) => (
              <div key={alert.id} className="rounded-md border border-slate-100 bg-[#F8FAFC] p-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#0F172A]">
                    {alert.patientName}
                    <span className="ml-1.5 font-mono font-normal text-[#2563EB]">{alert.uhid}</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-px text-[8px] font-bold uppercase ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {alert.type}
                  </span>
                </div>
                <AlertStickyBar type={ALERT_TYPE_MAP[alert.type]} message={alert.message} />
              </div>
            ))}
          </div>
        </PatientPanel>
      </div>

      <div className="xl:col-span-5">
        <PatientPanel
          title="Communication Logs"
          icon={MessageSquare}
          subtitle="SMS · Email · WhatsApp — appointment reminders & health campaigns"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Channel', 'Subject', 'Sent', 'Status'].map((h) => (
                    <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_COMM_LOGS.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50">
                    <td className="py-1.5 pr-2 text-[10px] font-bold text-[#0F172A]">{log.channel}</td>
                    <td className="py-1.5 pr-2 text-[10px] leading-snug text-slate-600">{log.subject}</td>
                    <td className="py-1.5 pr-2 font-mono text-[8px] text-slate-400">
                      {log.sentAt.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-1.5 text-[9px] font-semibold text-emerald-700">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-2">
            <p className="text-[9px] font-bold uppercase text-slate-400">Campaign Summary (Today)</p>
            <div className="mt-1 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'SMS Sent', value: 142 },
                { label: 'WhatsApp', value: 89 },
                { label: 'Email', value: 34 },
              ].map((k) => (
                <div key={k.label}>
                  <p className="text-sm font-bold text-[#0F172A]">{k.value}</p>
                  <p className="text-[8px] text-slate-500">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </PatientPanel>
      </div>
    </div>
  );
}
