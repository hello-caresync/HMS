'use client';

import {
  ArrowUpRight,
  FlaskConical,
  Pill,
  ScanLine,
  Scissors,
  Sparkles,
} from 'lucide-react';

import {
  MOCK_LAB_REQUESTS,
  MOCK_PRESCRIPTIONS,
  MOCK_PROCEDURES,
  MOCK_RADIOLOGY_REQUESTS,
  MOCK_RECOMMENDATIONS,
  formatTime,
} from '../lib/opdMockData';
import { OpdPanel, StatusPill } from '../components/opdUi';

type ClinicalWorkflowTabProps = {
  onRecommendAdmission: () => void;
};

export default function ClinicalWorkflowTab({ onRecommendAdmission }: ClinicalWorkflowTabProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="space-y-3 xl:col-span-5">
        <OpdPanel title="Laboratory Requests" subtitle="Real-time lab coordination queue" icon={FlaskConical}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Patient', 'Test', 'Ordered By', 'Time', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LAB_REQUESTS.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#2563EB]">{r.id}</td>
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{r.patientName}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">{r.testName}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{r.orderedBy}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-400">{formatTime(r.orderedAt)}</td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>

        <OpdPanel title="Radiology Requests" subtitle="Imaging order tracking" icon={ScanLine}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Patient', 'Study', 'Modality', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_RADIOLOGY_REQUESTS.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#2563EB]">{r.id}</td>
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{r.patientName}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">{r.studyName}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{r.modality}</td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>

        <OpdPanel title="Prescription Status" subtitle="View-only pharmacy dispensation tracking" icon={Pill}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Rx ID', 'Patient', 'Medicines', 'Status', 'Pharmacy', 'Stock'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PRESCRIPTIONS.map((rx) => (
                <tr key={rx.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#2563EB]">{rx.id}</td>
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{rx.patientName}</td>
                  <td className="max-w-[120px] truncate px-2 py-1.5 text-[9px] text-slate-600" title={rx.medicines}>
                    {rx.medicines}
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={rx.status} />
                  </td>
                  <td className="px-2 py-1.5 text-[8px] text-slate-500">{rx.pharmacyStatus}</td>
                  <td className="px-2 py-1.5">
                    {rx.medicineAvailable ? (
                      <span className="text-[9px] font-bold text-emerald-600">Available</span>
                    ) : (
                      <span className="text-[9px] font-bold text-red-600">OOS</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>
      </div>

      <div className="space-y-3 xl:col-span-7">
        <OpdPanel title="Minor Procedures Console" subtitle="Dressing · Injection · Nebulization · ECG" icon={Scissors}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['ID', 'Patient', 'Procedure', 'Room', 'Nurse', 'Scheduled', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PROCEDURES.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#2563EB]">{p.id}</td>
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{p.patientName}</td>
                  <td className="px-2 py-1.5 text-[9px] font-medium text-violet-700">{p.procedure}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">{p.room}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{p.nurse}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-400">{formatTime(p.scheduledAt)}</td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>

        <OpdPanel
          title="Recommendation Engine"
          subtitle="Referrals · internal routing · critical IPD transfers"
          icon={Sparkles}
          headerRight={
            <button
              type="button"
              onClick={onRecommendAdmission}
              className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2 py-1 text-[9px] font-bold text-white hover:bg-blue-700"
            >
              <ArrowUpRight className="h-3 w-3" />
              Route to Admissions
            </button>
          }
        >
          <ul className="space-y-1.5">
            {MOCK_RECOMMENDATIONS.map((rec) => (
              <li key={rec.id} className="rounded border border-[#E2E8F0] px-2 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-[#0F172A]">
                      {rec.patientName} · <span className="font-mono text-[#2563EB]">{rec.uhid}</span>
                    </p>
                    <p className="text-[9px] text-slate-600">
                      <strong>{rec.type}</strong> → {rec.target}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-500">{rec.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={rec.priority} />
                    <StatusPill status={rec.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </OpdPanel>
      </div>
    </div>
  );
}
