'use client';

import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

import type { InstrumentChecklistItem, OtScheduleSlot } from '../../../lib/patientcare';

type PreSurgeryChecklistModalProps = {
  open: boolean;
  slot: OtScheduleSlot | null;
  items: InstrumentChecklistItem[];
  onToggle: (itemId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function PreSurgeryChecklistModal({
  open,
  slot,
  items,
  onToggle,
  onConfirm,
  onClose,
}: PreSurgeryChecklistModalProps) {
  if (!open || !slot) return null;

  const allVerified = items.every((i) => i.verified);
  const verifiedCount = items.filter((i) => i.verified).length;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b-2 border-slate-200 bg-slate-800 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <p className="text-sm font-black">Pre-Surgery Instrument Checklist</p>
              <p className="text-[10px] text-slate-900">
                {slot.procedureType} · {slot.patientName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Sterilization validation · {verifiedCount}/{items.length} confirmed
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100">
                <th className="px-2 py-1.5 text-left text-[9px] font-black uppercase text-slate-950">
                  Instrument
                </th>
                <th className="px-2 py-1.5 text-left text-[9px] font-black uppercase text-slate-950">
                  Batch
                </th>
                <th className="px-2 py-1.5 text-center text-[9px] font-black uppercase text-slate-950">
                  Verified
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.itemId}
                  className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-2 py-2 text-xs font-bold text-slate-950">
                    {item.instrumentName}
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-slate-950">
                    {item.sterilizationBatch}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onToggle(item.itemId)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded border-2 ${
                        item.verified
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-sky-400'
                      }`}
                      aria-label={`Verify ${item.instrumentName}`}
                    >
                      {item.verified && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            disabled={!allVerified}
            onClick={onConfirm}
            className="w-full rounded-lg bg-indigo-700 py-2.5 text-sm font-black text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm Checklist · Advance to In Surgery
          </button>
          {!allVerified && (
            <p className="mt-2 text-center text-[10px] text-amber-700">
              All instruments must be verified before state transition
            </p>
          )}
        </div>
      </div>
    </>
  );
}
