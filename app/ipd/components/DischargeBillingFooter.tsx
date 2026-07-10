'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  FileText,
  Lock,
  Send,
} from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useIPD } from '../context/IPDProvider';
import type { BillingClearancePayload, DischargeSummary, IPDAdmission } from '../types';
import { computeRoomTariff, emptyDischargeSummary } from '../types';
import DischargePdfPreview from './DischargePdfPreview';

const SECTIONS: {
  key: keyof DischargeSummary;
  label: string;
  required: boolean;
  rows: number;
}[] = [
  { key: 'reasonForAdmission', label: 'Reason for Admission', required: true, rows: 1 },
  { key: 'courseInHospital', label: 'Course in Hospital', required: true, rows: 2 },
  { key: 'finalDiagnosis', label: 'Final Diagnosis', required: true, rows: 1 },
  { key: 'operativeFindings', label: 'Operative Findings', required: false, rows: 1 },
  { key: 'dischargeCondition', label: 'Discharge Condition', required: true, rows: 1 },
  { key: 'followUpInstructions', label: 'Follow-up / Medications', required: true, rows: 2 },
];

export default function DischargeBillingFooter() {
  const {
    selectedAdmissionId,
    getAdmission,
    updateDischargeSummary,
    finalizeDischarge,
  } = useIPD();

  const admission = selectedAdmissionId ? getAdmission(selectedAdmissionId) : undefined;
  const [summary, setSummary] = useState<DischargeSummary>(emptyDischargeSummary());
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [billingPayload, setBillingPayload] = useState<BillingClearancePayload | null>(null);

  useEffect(() => {
    if (admission?.dischargeSummary) {
      setSummary(admission.dischargeSummary);
    } else {
      setSummary(emptyDischargeSummary());
    }
    setError(null);
  }, [admission?.id, admission?.dischargeSummary]);

  if (!admission) {
    return (
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-800">
        Select a patient to begin discharge planning
      </footer>
    );
  }

  const locked = admission.recordLocked;
  const estimatedRoom = computeRoomTariff(admission);
  const estimatedPharmacy = 18450 + admission.clinical.marEntries.length * 1200;

  const handleField = (key: keyof DischargeSummary, value: string) => {
    if (locked) return;
    const next = { ...summary, [key]: value };
    setSummary(next);
    updateDischargeSummary(admission.id, next);
    setError(null);
  };

  const handleFinalize = () => {
    updateDischargeSummary(admission.id, summary);
    const result = finalizeDischarge(admission.id, summary);
    if (!result.success) {
      setError(result.error ?? 'Failed to finalize');
      return;
    }
    if (result.payload) setBillingPayload(result.payload);
    setShowPdf(true);
  };

  return (
    <>
      <footer className="border-t border-slate-200 bg-white shadow-[0_-4px_20px_-6px_rgba(15,23,42,0.08)]">
        <div className="mx-auto max-w-[1600px] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              Discharge Planning & Summary Compilation
            </h3>
            <p className="text-[11px] text-slate-800">
              {admission.patientName} · Est. room ₹{estimatedRoom.toLocaleString('en-IN')} + pharmacy ₹{estimatedPharmacy.toLocaleString('en-IN')}
            </p>
          </div>

          {!locked && (
            <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-6">
              {SECTIONS.map(({ key, label, required, rows }) => (
                <div key={key} className={rows > 1 ? 'col-span-2' : ''}>
                  <label className="mb-0.5 block text-[9px] font-bold uppercase text-slate-800">
                    {label}{required && ' *'}
                  </label>
                  <textarea
                    value={summary[key]}
                    onChange={(e) => handleField(key, e.target.value)}
                    rows={rows}
                    className="w-full resize-none rounded border border-slate-200 px-2 py-1 text-[11px] leading-snug focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    placeholder={`${label}…`}
                  />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mb-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {locked && admission.billingPayload ? (
              <div className="flex items-center gap-2 text-xs text-slate-800">
                <Lock className="h-4 w-4 text-emerald-600" />
                Ledger {admission.billingPayload.ledgerId} · {formatCurrency(admission.billingPayload.totalOutstanding)} locked
              </div>
            ) : (
              <p className="text-[10px] text-slate-800">
                Complete summary fields · preview PDF · finalize to lock record & sync billing
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPdf(true)}
                disabled={!summary.reasonForAdmission.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-40"
              >
                <FileText className="h-3.5 w-3.5" />
                Preview Discharge PDF
              </button>
              {!locked && (
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <CreditCard className="h-3.5 w-3.5 opacity-80" />
                  Finalize & Push to Billing Ledger
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      <DischargePdfPreview
        admission={admission}
        summary={summary}
        billingPayload={billingPayload ?? admission.billingPayload}
        open={showPdf}
        onClose={() => setShowPdf(false)}
      />
    </>
  );
}
