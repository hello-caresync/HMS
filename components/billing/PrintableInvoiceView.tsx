'use client';

import type { HospitalBillingInvoiceView } from '@/lib/hospital/billing-invoices-live';
import { MEDICINE_GST_RATE } from '@/lib/billing/invoice-breakdown';
import { formatINR } from '@/lib/utils/currency';

type PrintableInvoiceViewProps = {
  invoice: HospitalBillingInvoiceView;
  printRef?: React.RefObject<HTMLDivElement | null>;
};

export function PrintableInvoiceView({ invoice, printRef }: PrintableInvoiceViewProps) {
  const hospitalName = invoice.hospital_name || 'Hospital';
  const hospitalAddress = invoice.hospital_address || 'Address on file with billing desk';
  const gstPercent = Math.round(MEDICINE_GST_RATE * 100);

  return (
    <div ref={printRef} className="print-invoice mx-auto max-w-2xl bg-white p-8 text-slate-900">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice,
          .print-invoice * {
            visibility: visible;
          }
          .print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-black">{hospitalName}</h1>
        <p className="text-sm text-slate-600">{hospitalAddress}</p>
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
          <p className="text-xs font-bold uppercase text-slate-500">Consultation</p>
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
            <td className="pt-1 text-xs text-slate-500">Payment status</td>
            <td className="pt-1 text-right text-xs font-bold uppercase">{invoice.payment_status}</td>
          </tr>
        </tfoot>
      </table>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
        Computer-generated invoice · {hospitalName}
      </footer>
    </div>
  );
}

export function printInvoiceElement(node: HTMLElement | null): void {
  if (!node || typeof window === 'undefined') return;
  window.print();
}
