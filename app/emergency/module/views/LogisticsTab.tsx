'use client';

import { Ambulance, Droplets, FlaskConical, HeartPulse, MapPin, ScanLine } from 'lucide-react';

import {
  MOCK_AMBULANCES,
  MOCK_BLOOD_BANK,
  MOCK_PROCEDURES,
  MOCK_URGENT_LABS,
  MOCK_URGENT_RAD,
  formatTime,
} from '../lib/emergencyMockData';
import { ErPanel, StatusPill, TriageBadge } from '../components/emergencyUi';

export default function LogisticsTab() {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
      <div className="space-y-2 xl:col-span-5">
        <ErPanel title="Urgent Laboratory Orders" icon={FlaskConical} subtitle="STAT · trauma · sepsis panels">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Patient', 'Test', 'Priority', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_URGENT_LABS.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{o.id}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{o.patientName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{o.testName}</td>
                  <td className="px-1.5 py-1"><TriageBadge priority={o.priority} /></td>
                  <td className="px-1.5 py-1"><StatusPill status={o.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{formatTime(o.orderedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErPanel>

        <ErPanel title="Urgent Radiology Orders" icon={ScanLine}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Patient', 'Study', 'Modality', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_URGENT_RAD.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{o.id}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{o.patientName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{o.studyName}</td>
                  <td className="px-1.5 py-1 text-[8px]">{o.modality}</td>
                  <td className="px-1.5 py-1"><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErPanel>

        <ErPanel title="Blood Bank Requests" icon={Droplets}>
          <ul className="space-y-1">
            {MOCK_BLOOD_BANK.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1">
                <div>
                  <p className="text-[9px] font-semibold text-[#0F172A]">{b.patientName}</p>
                  <p className="text-[8px] text-slate-600">{b.component} × {b.units} units</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <TriageBadge priority={b.urgency} />
                  <StatusPill status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        </ErPanel>

        <ErPanel title="Emergency Procedure Checklist" icon={HeartPulse} critical>
          <ul className="space-y-1">
            {MOCK_PROCEDURES.map((p) => (
              <li key={p.id} className={`rounded border px-2 py-1.5 ${p.procedure === 'CPR' && p.status === 'In Progress' ? 'border-red-300 bg-red-50 animate-pulse' : 'border-[#E2E8F0]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-[#0F172A]">{p.procedure}</p>
                    <p className="text-[8px] text-slate-600">{p.patientName} · {p.teamLead}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        </ErPanel>
      </div>

      <div className="space-y-2 xl:col-span-7">
        <ErPanel
          title="Ambulance Fleet & Tracking"
          subtitle="Active dispatches · GPS placeholders · driver alerts"
          icon={Ambulance}
          headerRight={<span className="text-[8px] font-bold text-[#2563EB]">{MOCK_AMBULANCES.filter((a) => a.status !== 'Available').length} active</span>}
        >
          <div className="mb-2 rounded-md border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
            <MapPin className="mx-auto mb-1 h-6 w-6 text-[#2563EB]" />
            <p className="text-[10px] font-bold text-[#0F172A]">Live GPS Map — Fleet Overlay</p>
            <p className="text-[8px] text-slate-500">[Tracking feed masked for operational security — 5 units on network]</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {MOCK_AMBULANCES.map((a) => (
                <span
                  key={a.id}
                  className={`rounded px-2 py-0.5 text-[8px] font-bold ${
                    a.status === 'En Route' || a.status === 'At Scene' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {a.callSign}
                </span>
              ))}
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Unit', 'Call Sign', 'Status', 'Crew', 'Destination', 'ETA', 'Last Alert'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_AMBULANCES.map((a) => (
                <tr key={a.id} className={`border-b border-slate-50 ${a.status === 'En Route' || a.status === 'At Scene' ? 'bg-orange-50/50' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{a.vehicleId}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{a.callSign}</td>
                  <td className="px-1.5 py-1"><StatusPill status={a.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{a.crew}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={a.destination}>{a.destination}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{a.etaMinutes != null ? `${a.etaMinutes}m` : '—'}</td>
                  <td className="max-w-[140px] truncate px-1.5 py-1 text-[8px] text-amber-700" title={a.lastAlert}>{a.lastAlert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErPanel>
      </div>
    </div>
  );
}
