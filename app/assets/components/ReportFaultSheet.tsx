'use client';

import { useState } from 'react';
import { AlertTriangle, Wrench } from 'lucide-react';

import Sheet from '../../master-data/components/shared/Sheet';
import { useAssets } from '../context/AssetsProvider';
import type { FaultUrgency } from '../types';
import { URGENCY_STYLES } from '../types';

type ReportFaultSheetProps = {
  open: boolean;
  onClose: () => void;
};

const URGENCIES: FaultUrgency[] = ['Low', 'High', 'Critical Breakdown'];

export default function ReportFaultSheet({ open, onClose }: ReportFaultSheetProps) {
  const { assets, reportFault } = useAssets();
  const [assetId, setAssetId] = useState(assets[0]?.id ?? '');
  const [urgency, setUrgency] = useState<FaultUrgency>('Low');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCritical = urgency === 'Critical Breakdown';

  const handleClose = () => {
    setDescription('');
    setUrgency('Low');
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    const result = reportFault(assetId, urgency, description);
    if (!result.success) {
      setError(result.error ?? 'Failed to submit');
      return;
    }
    handleClose();
  };

  return (
    <Sheet
      open={open}
      title="Report Equipment Fault"
      description="Maintenance & complaint logger"
      onClose={handleClose}
      width="lg"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Select Affected Asset
          </label>
          <select
            value={assetId}
            onChange={(e) => {
              setAssetId(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.assetId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Urgency Level
          </label>
          <div className="flex flex-wrap gap-1.5">
            {URGENCIES.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                  urgency === u
                    ? `${URGENCY_STYLES[u]} ring-2 ring-slate-800`
                    : `${URGENCY_STYLES[u]} opacity-70 hover:opacity-100`
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {isCritical && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-950 px-3 py-2.5 text-[11px] text-rose-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold uppercase tracking-wide text-rose-300">
                Critical Breakdown Protocol
              </p>
              <p className="mt-0.5 leading-relaxed text-rose-200/90">
                Asset status will immediately switch to <strong>Under Repair</strong> on the
                dashboard. Biomedical Engineering team receives an automated alert.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Problem Description
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            rows={4}
            placeholder="Describe fault symptoms, error codes, patient impact…"
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs leading-relaxed focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white ${
            isCritical
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-slate-800 hover:bg-slate-900'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Submit Fault Report
        </button>
      </div>
    </Sheet>
  );
}
