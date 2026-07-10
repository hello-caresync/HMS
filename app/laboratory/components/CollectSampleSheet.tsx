'use client';

import { useState } from 'react';
import { CheckCircle2, Droplets } from 'lucide-react';

import { useLab } from '../context/LabProvider';
import type { LabOrder } from '../types';
import BarcodeLabel from './BarcodeLabel';
import Sheet from '../../master-data/components/shared/Sheet';

type CollectSampleSheetProps = {
  order: LabOrder | null;
  open: boolean;
  onClose: () => void;
};

export default function CollectSampleSheet({ order, open, onClose }: CollectSampleSheetProps) {
  const { collectSample } = useLab();
  const [barcode, setBarcode] = useState<string | null>(null);
  const [sampleType, setSampleType] = useState('Whole Blood (EDTA)');
  const [collected, setCollected] = useState(false);

  const handleClose = () => {
    setBarcode(null);
    setCollected(false);
    onClose();
  };

  const handleCollect = () => {
    if (!order) return;
    const code = collectSample(order.id);
    setBarcode(code);
    setCollected(true);
  };

  if (!order) return null;

  return (
    <Sheet
      open={open}
      title="Collect Sample"
      description={`${order.patientName} · ${order.uhid}`}
      onClose={handleClose}
      width="md"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-800">Sample Type</label>
          <select
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value)}
            disabled={collected}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option>Whole Blood (EDTA)</option>
            <option>Serum (SST)</option>
            <option>Plasma (Citrate)</option>
            <option>Urine (Random)</option>
          </select>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800">
          <p className="font-semibold text-slate-800">Ordered: {order.orderedTests.join(', ')}</p>
          <p className="mt-0.5">Ref: {order.orderedBy}</p>
        </div>

        {!collected ? (
          <button
            type="button"
            onClick={handleCollect}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-primary-hover"
          >
            <Droplets className="h-4 w-4" />
            Confirm Collection & Generate Barcode
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Sample collected · {sampleType}
            </div>
            {barcode && (
              <BarcodeLabel
                barcode={barcode}
                patientName={order.patientName}
                uhid={order.uhid}
                tests={order.orderedTests}
                onPrint={() => window.print()}
              />
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Done
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
