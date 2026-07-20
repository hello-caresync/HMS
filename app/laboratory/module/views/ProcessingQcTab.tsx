'use client';

import { Activity, Cpu, Wrench } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  MOCK_ANALYZERS,
  MOCK_CALIBRATION,
  MOCK_PROCESSING_LOGS,
  MOCK_QC_CHECKS,
  QC_TREND,
} from '../lib/laboratoryMockData';
import { EquipmentPill, LabPanel, PipelineStatusPill, QcPill, StatusPill } from '../components/laboratoryUi';

export default function ProcessingQcTab() {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <div className="space-y-2">
        <LabPanel title="Sample Processing & Transport Log" icon={Activity} subtitle="Status · analyzer assignment · result entry">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Sample', 'Patient', 'Barcode', 'Transport', 'Analyzer', 'Result Entry', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PROCESSING_LOGS.map((log) => (
                <tr key={log.id} className={`border-b border-slate-50 ${log.resultEntry.includes('CRITICAL') ? 'bg-red-50/50' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{log.sampleId}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{log.patientName}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-slate-500">{log.barcode}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={log.transportLeg}>{log.transportLeg}</td>
                  <td className="px-1.5 py-1 text-[8px] text-violet-700">{log.analyzer}</td>
                  <td className={`max-w-[120px] truncate px-1.5 py-1 text-[8px] ${log.resultEntry.includes('CRITICAL') ? 'font-bold text-red-600' : 'text-slate-600'}`}>{log.resultEntry}</td>
                  <td className="px-1.5 py-1"><PipelineStatusPill status={log.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabPanel>

        <LabPanel title="Interfaced Analyzer Queue" icon={Cpu} subtitle="HL7/ASTM automated analyzers">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Analyzer', 'Interface', 'Queued', 'Status', 'Heartbeat'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ANALYZERS.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{a.analyzerName}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.interface}</td>
                  <td className="px-1.5 py-1 text-[10px] font-bold tabular-nums text-[#2563EB]">{a.samplesQueued}</td>
                  <td className="px-1.5 py-1"><EquipmentPill status={a.status} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{a.lastHeartbeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabPanel>
      </div>

      <div className="space-y-2">
        <LabPanel title="Daily QC Checks" subtitle="Internal quality control validation">
          <ul className="mb-2 space-y-1">
            {MOCK_QC_CHECKS.map((qc) => (
              <li key={qc.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                <div>
                  <p className="text-[9px] font-semibold text-[#0F172A]">{qc.instrument}</p>
                  <p className="text-[8px] text-slate-500">{qc.checkType} · {qc.level} · {qc.operator}</p>
                </div>
                <QcPill status={qc.status} />
              </li>
            ))}
          </ul>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={QC_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} domain={[90, 100]} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="pass" stackId="a" fill="#10B981" name="Pass %" />
                <Bar dataKey="fail" stackId="a" fill="#EF4444" name="Fail %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LabPanel>

        <LabPanel title="Instrument Calibration Schedule" icon={Wrench} subtitle="Preventive maintenance & calibration due dates">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Instrument', 'Next Due', 'Last Done', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CALIBRATION.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.status === 'Due' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{c.instrument}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{c.nextDue}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{c.lastCompleted}</td>
                  <td className="px-1.5 py-1"><StatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabPanel>
      </div>
    </div>
  );
}
