'use client';

import { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';

import type { MedicalAssetRecord } from '../../../lib/administration';

type MaintenanceRequestSheetProps = {
  open: boolean;
  asset: MedicalAssetRecord | null;
  onClose: () => void;
  onSubmit: (description: string) => void;
};

export default function MaintenanceRequestSheet({
  open,
  asset,
  onClose,
  onSubmit,
}: MaintenanceRequestSheetProps) {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) setDescription('');
  }, [open, asset?.assetId]);

  if (!open || !asset) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
          <div>
            <p className="text-sm font-black">Maintenance Request</p>
            <p className="text-[10px] text-slate-900">{asset.equipmentName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 p-4">
          <dl className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <dt className="text-[9px] font-bold uppercase text-slate-800">Asset ID</dt>
            <dd className="font-mono font-bold">{asset.assetId}</dd>
            <dt className="mt-2 text-[9px] font-bold uppercase text-slate-800">Location</dt>
            <dd>{asset.roomLocator}</dd>
            <dt className="mt-2 text-[9px] font-bold uppercase text-slate-800">AMC</dt>
            <dd>{asset.amcProvider}</dd>
          </dl>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-800">
              Technical Issue Description
            </span>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe fault, error codes, calibration drift…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            disabled={!description.trim()}
            onClick={() => onSubmit(description.trim())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Submit Maintenance Ticket
          </button>
        </div>
      </aside>
    </>
  );
}
