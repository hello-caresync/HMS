'use client';

import { Printer } from 'lucide-react';

type BarcodeLabelProps = {
  barcode: string;
  patientName: string;
  uhid: string;
  tests: string[];
  onPrint?: () => void;
};

/** Mock barcode label — SVG bar pattern + human-readable ID */
export default function BarcodeLabel({ barcode, patientName, uhid, tests, onPrint }: BarcodeLabelProps) {
  const bars = barcode.split('').flatMap((char, i) => {
    const w = (char.charCodeAt(0) % 3) + 1;
    return Array.from({ length: w }, (_, j) => (
      <rect
        key={`${i}-${j}`}
        x={i * 4 + j * 1.2}
        y={4}
        width={1.2}
        height={32}
        fill="#0f172a"
      />
    ));
  });

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Sample Label</p>
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-slate-900"
          >
            <Printer className="h-3 w-3" />
            Print
          </button>
        )}
      </div>
      <svg viewBox="0 0 120 40" className="mx-auto h-10 w-full max-w-[200px]" aria-hidden>
        {bars}
      </svg>
      <p className="mt-2 text-center font-mono text-sm font-bold tracking-widest text-slate-900">{barcode}</p>
      <div className="mt-2 border-t border-slate-200 pt-2 text-[10px] text-slate-800">
        <p className="font-semibold text-slate-800">{patientName}</p>
        <p className="font-mono">{uhid}</p>
        <p className="truncate">{tests.join(' · ')}</p>
      </div>
    </div>
  );
}
