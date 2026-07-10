'use client';

import { useState } from 'react';
import { FileText, Lock, Upload } from 'lucide-react';

import { useRadiology } from '../context/RadiologyProvider';
import type { RadiologyOrder } from '../types';
import { viewerTypeForModality } from '../types';
import MockScanViewer from './MockScanViewer';

type InterpretationPanelProps = {
  order: RadiologyOrder;
  onFinalized?: () => void;
};

export default function InterpretationPanel({ order, onFinalized }: InterpretationPanelProps) {
  const { finalizeReport, saveFindings } = useRadiology();
  const isCompleted = order.status === 'Completed';
  const [findings, setFindings] = useState(order.findings ?? '');
  const [locked, setLocked] = useState(isCompleted);
  const [emrOutput, setEmrOutput] = useState<string | null>(
    isCompleted && order.findings
      ? `Report finalized by ${order.finalizedBy} · EMR appended ✓`
      : null,
  );

  const handleFinalize = () => {
    if (!findings.trim()) return;
    const report = finalizeReport(order.id, findings.trim());
    if (report) {
      setLocked(true);
      setEmrOutput(report.emrPayload);
      onFinalized?.();
    }
  };

  const handleDraftSave = () => {
    if (!locked) saveFindings(order.id, findings);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0f1419]">
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#111820] px-3 py-2">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
          <FileText className="h-3.5 w-3.5 text-cyan-500" />
          Radiologist Interpretation
        </h3>
        {locked && (
          <span className="flex items-center gap-1 rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <Lock className="h-3 w-3" />
            Signed
          </span>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        {/* Left: clinical context + scan */}
        <div className="space-y-2 border-b border-slate-800 p-3 lg:border-b-0 lg:border-r">
          <div className="rounded-lg border border-slate-800 bg-[#111820] p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Clinical History</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{order.patientName}</p>
            <p className="font-mono text-[10px] text-cyan-500">{order.uhid}</p>
            <ul className="mt-2 space-y-0.5">
              {order.clinicalHistory.map((item) => (
                <li key={item} className="text-[11px] text-slate-800">• {item}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-slate-800">
              Ordered by {order.orderingDoctor}
            </p>
          </div>
          <MockScanViewer
            type={viewerTypeForModality(order.modality)}
            label={order.modality}
            fileName={order.uploadedFileName}
          />
        </div>

        {/* Right: findings editor */}
        <div className="flex flex-col p-3">
          <label htmlFor="findings" className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Radiological Impression / Findings
          </label>
          <textarea
            id="findings"
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            onBlur={handleDraftSave}
            disabled={locked}
            rows={14}
            placeholder="Describe imaging findings, measurements, and clinical impression…"
            className="flex-1 resize-none rounded-lg border border-slate-700 bg-[#0a0e14] px-3 py-2 text-sm leading-relaxed text-slate-200 placeholder:text-slate-800 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {!locked ? (
            <button
              type="button"
              onClick={handleFinalize}
              disabled={!findings.trim()}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-600 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              <Upload className="h-4 w-4" />
              Sign and Finalize Radiology Report
            </button>
          ) : (
            emrOutput && (
              <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/30 p-2">
                <p className="text-[10px] font-bold uppercase text-emerald-400">Appended to Patient EMR</p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono text-[9px] leading-relaxed text-emerald-300/90">
                  {emrOutput}
                </pre>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
