'use client';

import { Download, FileText, X } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import type { BillingClearancePayload, DischargeSummary, IPDAdmission } from '../types';
import { computeRoomTariff } from '../types';

type DischargePdfPreviewProps = {
  admission: IPDAdmission;
  summary: DischargeSummary;
  billingPayload?: BillingClearancePayload;
  open: boolean;
  onClose: () => void;
};

export default function DischargePdfPreview({
  admission,
  summary,
  billingPayload,
  open,
  onClose,
}: DischargePdfPreviewProps) {
  if (!open) return null;

  const roomTariff = billingPayload?.roomTariffTotal ?? computeRoomTariff(admission);
  const pharmacy = billingPayload?.pharmacyCharges ?? 18450;
  const total = billingPayload?.totalOutstanding ?? roomTariff + pharmacy;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Discharge Summary — PDF Preview</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-800 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mock PDF viewport */}
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-100 p-6">
          <article className="mx-auto max-w-lg rounded border border-slate-300 bg-white p-8 shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
            <header className="mb-6 border-b-2 border-slate-800 pb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">
                Nexora Central Hospital
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">Discharge Summary</h1>
              <p className="mt-2 text-xs text-slate-800">
                {admission.patientName} · {admission.uhid}
              </p>
              <p className="text-[10px] text-slate-800">
                Admitted: {new Date(admission.admittedAt).toLocaleDateString('en-IN')} · {admission.admittingDoctor}
              </p>
            </header>

            {(
              [
                ['Reason for Admission', summary.reasonForAdmission],
                ['Course in Hospital', summary.courseInHospital],
                ['Final Diagnosis', summary.finalDiagnosis],
                ['Operative Findings', summary.operativeFindings || 'N/A'],
                ['Discharge Condition', summary.dischargeCondition],
                ['Follow-up Instructions', summary.followUpInstructions],
              ] as const
            ).map(([title, body]) => (
              <section key={title} className="mb-4">
                <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-900">{title}</h2>
                <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {body || '—'}
                </p>
              </section>
            ))}

            <footer className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-[10px] font-bold uppercase text-slate-800">Billing Consolidation</p>
              <table className="mt-2 w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-0.5 text-slate-950">Room Tariffs</td>
                    <td className="py-0.5 text-right font-mono font-bold">{formatCurrency(roomTariff)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-950">Pharmacy Accounts</td>
                    <td className="py-0.5 text-right font-mono font-bold">{formatCurrency(pharmacy)}</td>
                  </tr>
                  <tr className="border-t border-slate-300 font-bold">
                    <td className="py-1 text-slate-900">Total Outstanding</td>
                    <td className="py-1 text-right font-mono text-indigo-800">{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>
              {billingPayload && (
                <p className="mt-2 font-mono text-[9px] text-slate-800">
                  Ledger: {billingPayload.ledgerId} · Locked {new Date(billingPayload.lockedAt).toLocaleString('en-IN')}
                </p>
              )}
            </footer>
          </article>
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF (Mock)
          </button>
        </div>
      </div>
    </>
  );
}
