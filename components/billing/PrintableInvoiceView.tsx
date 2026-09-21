'use client';

import type { HospitalBillingInvoiceView } from '@/lib/hospital/billing-invoices-live';
import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { MEDICINE_GST_RATE } from '@/lib/billing/invoice-breakdown';
import { REGAL_HOSPITAL_FULL_NAME, REGAL_HOSPITAL_NODE_LABEL } from '@/lib/regal/brand';
import { formatINR } from '@/lib/utils/currency';

type PrintableInvoiceViewProps = {
  invoice: HospitalBillingInvoiceView;
  printRef?: React.RefObject<HTMLDivElement | null>;
};

export function PrintableInvoiceView({ invoice, printRef }: PrintableInvoiceViewProps) {
  const hospitalName = invoice.hospital_name || REGAL_HOSPITAL_FULL_NAME;
  const hospitalAddress = invoice.hospital_address || 'Bengaluru · Regal Health HMS';
  const gstPercent = Math.round(MEDICINE_GST_RATE * 100);
  const isSettled = /paid|settled/i.test(String(invoice.payment_status ?? ''));

  return (
    <div
      id="print-invoice-root"
      ref={printRef}
      className="print-invoice mx-auto max-w-2xl bg-white p-8 text-slate-900"
    >
      <header className="border-b border-slate-200 pb-4 text-center">
        <div className="mb-3 flex justify-center">
          <RegalHospitalLogo heightClass="h-10" framed={false} priority={false} />
        </div>
        <h1 className="text-xl font-black">{hospitalName}</h1>
        <p className="text-sm text-slate-600">{hospitalAddress}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{REGAL_HOSPITAL_NODE_LABEL}</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Tax Invoice · {invoice.invoice_number ?? invoice.id.slice(0, 8)}
        </p>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Patient</p>
          <p className="font-semibold">{invoice.patient_name}</p>
          <p className="text-slate-600">UHID: {invoice.patient_uhid ?? invoice.uhid}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-slate-500">Consulting Doctor</p>
          <p className="font-semibold">{invoice.doctor_name ?? 'Consulting physician'}</p>
          <p className="text-slate-600">{invoice.department ?? 'OPD'}</p>
          <p className="text-slate-600">
            {new Date(invoice.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </section>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-2">Consultation fee</td>
            <td className="py-2 text-right">{formatINR(invoice.consultation_fee)}</td>
          </tr>
          {invoice.medicines.map((med) => (
            <tr key={`${med.name}-${med.qty}`} className="border-b border-slate-100">
              <td className="py-2">
                {med.name} × {med.qty}
              </td>
              <td className="py-2 text-right">{formatINR(med.qty * med.price)}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <td className="py-2">GST on medicines ({gstPercent}%)</td>
            <td className="py-2 text-right">{formatINR(invoice.gst_amount ?? 0)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-3 font-black">Total payable</td>
            <td className="pt-3 text-right font-black">{formatINR(invoice.total_payable ?? 0)}</td>
          </tr>
          <tr>
            <td className="pt-1 text-xs text-slate-500">Settlement status</td>
            <td className="pt-1 text-right">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                  isSettled
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {invoice.payment_status}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
        Computer-generated invoice · {hospitalName} · Regal Health HMS
      </footer>
    </div>
  );
}

export function printInvoiceElement(node: HTMLElement | null): void {
  if (!node || typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });
}
