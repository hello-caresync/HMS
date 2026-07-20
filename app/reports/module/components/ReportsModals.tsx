'use client';

import { useState } from 'react';

import { REPORT_BUILDER_FIELDS } from '../lib/reportsMockData';
import { SecurePatientPlaceholder, inputClass, ModalOverlay } from './reportsUi';

export function CustomReportBuilderModal({ onClose }: { onClose: () => void }) {
  const [selectedFields, setSelectedFields] = useState<string[]>(['patient-volume', 'bed-occupancy']);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const toggleField = (id: string) => {
    setSelectedFields((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleDrop = (targetIdx: number) => {
    if (!draggedId) return;
    setSelectedFields((prev) => {
      const next = prev.filter((f) => f !== draggedId);
      next.splice(targetIdx, 0, draggedId);
      return next;
    });
    setDraggedId(null);
  };

  return (
    <ModalOverlay title="Custom Report Builder" onClose={onClose} wide>
      <SecurePatientPlaceholder hipaa />
      <p className="mt-2 text-[9px] text-slate-600">Drag parameters to reorder · select metrics for your dashboard layout</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Available Parameters</p>
          <div className="max-h-[200px] space-y-1 overflow-y-auto rounded border border-slate-100 p-2">
            {REPORT_BUILDER_FIELDS.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                <input type="checkbox" checked={selectedFields.includes(f.id)} onChange={() => toggleField(f.id)} className="h-3 w-3" />
                <span className="text-[9px]">{f.label}</span>
                <span className="ml-auto text-[7px] text-slate-400">{f.group}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Report Layout (Drag to Reorder)</p>
          <div className="min-h-[200px] rounded border border-dashed border-[#2563EB]/40 bg-blue-50/30 p-2">
            {selectedFields.map((id, idx) => {
              const field = REPORT_BUILDER_FIELDS.find((f) => f.id === id);
              if (!field) return null;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDraggedId(id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  className="mb-1 cursor-grab rounded border border-[#2563EB]/30 bg-white px-2 py-1.5 text-[9px] font-semibold shadow-sm active:cursor-grabbing"
                >
                  {idx + 1}. {field.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Save Custom Layout</button>
    </ModalOverlay>
  );
}

export function ExportDashboardModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Export Dashboard" onClose={onClose} wide>
      <select className={inputClass}><option>Executive Command Dashboard</option><option>Clinical Quality Pack</option><option>Financial Intelligence Ledger</option></select>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Export PDF</button>
        <button type="button" onClick={onClose} className="flex-1 rounded-md bg-emerald-600 py-2 text-[10px] font-bold text-white">Export Excel</button>
      </div>
      <SecurePatientPlaceholder hipaa />
    </ModalOverlay>
  );
}

export function ScheduleReportModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Schedule Automated Report" onClose={onClose} wide>
      <input className={inputClass} placeholder="Report name" defaultValue="Weekly Executive HBI Pack" />
      <select className={`${inputClass} mt-2`}><option>Daily — 06:00 IST</option><option>Weekly — Monday 07:00</option><option>Monthly — 1st 08:00</option></select>
      <input className={`${inputClass} mt-2`} placeholder="Recipients" defaultValue="HOD Distribution List · Finance · Admin" />
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Schedule Report</button>
    </ModalOverlay>
  );
}

export function AiForecastModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Trigger AI Forecasting Run" onClose={onClose} wide>
      <p className="text-[10px] text-slate-700">Initiate predictive models: ICU capacity · OPD demand · revenue forecast · claim rejection risk</p>
      <select className={`${inputClass} mt-2`}><option>Full Hospital Intelligence Suite</option><option>Capacity Only</option><option>Revenue & Claims</option></select>
      <div className="mt-2 rounded-md border border-teal-200 bg-teal-50 p-2 text-[9px] text-teal-800">Estimated run time: 4–6 minutes · uses anonymized aggregate data only</div>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-teal-600 py-2 text-[10px] font-bold text-white">Run AI Forecast</button>
    </ModalOverlay>
  );
}

export function ReportAccessSecurityModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay title="Manage Report Access Security" onClose={onClose} wide>
      <SecurePatientPlaceholder hipaa />
      <table className="mt-2 w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-[#F8FAFC]">
            {['Role', 'Executive', 'Clinical', 'Financial', 'Export'].map((h) => (
              <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { role: 'Admin', exec: true, clinical: true, financial: true, export: true },
            { role: 'Doctor', exec: false, clinical: true, financial: false, export: true },
            { role: 'Finance', exec: true, clinical: false, financial: true, export: true },
            { role: 'Nurse', exec: false, clinical: true, financial: false, export: false },
          ].map((r) => (
            <tr key={r.role} className="border-b border-slate-50">
              <td className="px-1.5 py-1 text-[9px] font-semibold">{r.role}</td>
              {[r.exec, r.clinical, r.financial, r.export].map((v, i) => (
                <td key={i} className="px-1.5 py-1 text-center text-[10px]">{v ? '✓' : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={onClose} className="mt-3 w-full rounded-md bg-[#0F172A] py-2 text-[10px] font-bold text-white">Save Permissions</button>
    </ModalOverlay>
  );
}
