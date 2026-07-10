'use client';

import { useState } from 'react';
import { FileUp, Link2 } from 'lucide-react';

import { TPA_COMPANY_OPTIONS } from '../../../lib/finance';

type ClaimFilingFormProps = {
  onFileClaim: (draft: {
    policyNumber: string;
    tpaCompany: string;
    coPayAmount: number;
    documentLabel: string;
  }) => void;
};

export default function ClaimFilingForm({ onFileClaim }: ClaimFilingFormProps) {
  const [policyNumber, setPolicyNumber] = useState('');
  const [tpaCompany, setTpaCompany] = useState(TPA_COMPANY_OPTIONS[0] ?? '');
  const [coPayAmount, setCoPayAmount] = useState(0);
  const [documentLabel, setDocumentLabel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNumber.trim()) return;
    onFileClaim({
      policyNumber: policyNumber.trim(),
      tpaCompany,
      coPayAmount,
      documentLabel: documentLabel.trim() || 'Claim documents bundle',
    });
    setPolicyNumber('');
    setCoPayAmount(0);
    setDocumentLabel('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-black text-slate-900">Corporate Claim Filing</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Policy Number
          </span>
          <input
            required
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="STAR-HEALTH-XXXXXXX"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            TPA Company
          </span>
          <select
            value={tpaCompany}
            onChange={(e) => setTpaCompany(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            {TPA_COMPANY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Co-Pay (₹)
          </span>
          <input
            type="number"
            min={0}
            step={500}
            value={coPayAmount}
            onChange={(e) => setCoPayAmount(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Claim Upload Label
          </span>
          <div className="flex gap-2">
            <input
              value={documentLabel}
              onChange={(e) => setDocumentLabel(e.target.value)}
              placeholder="Discharge summary + bills PDF"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-800 hover:bg-slate-100"
              title="Simulate document upload"
            >
              <FileUp className="h-4 w-4" />
            </button>
          </div>
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
      >
        <Link2 className="h-4 w-4" />
        File Corporate Claim Bundle
      </button>
    </form>
  );
}
