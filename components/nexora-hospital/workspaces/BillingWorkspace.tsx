'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, Modal, ui } from '@/components/nexora-hospital/ui/primitives';
import { exportToCsv } from '@/lib/shared/services/export/export.service';
import { generateInvoice, processPayment } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

const DEFAULT_CATEGORIES = [
  { category: 'Consultation', amount: 0 },
  { category: 'Lab', amount: 0 },
  { category: 'Pharmacy', amount: 0 },
];

export function BillingWorkspace() {
  const invoices = useHospitalStore((s) => s.invoices);
  const patients = useHospitalStore((s) => s.patients);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [busy, setBusy] = useState(false);

  const revenueByCategory = useMemo(() => {
    const acc = invoices.reduce<Record<string, number>>((map, inv) => {
      inv.lineItems.forEach((l) => {
        map[l.category] = (map[l.category] ?? 0) + l.amount;
      });
      return map;
    }, {});
    DEFAULT_CATEGORIES.forEach(({ category }) => {
      if (acc[category] == null) acc[category] = 0;
    });
    return acc;
  }, [invoices]);

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Billing & Invoices</h1>
          <p className={ui.pageSubtitle}>Revenue · payments · patient billing sync</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ui.btnSecondary}
            disabled={invoices.length === 0}
            onClick={() =>
              exportToCsv(
                invoices as unknown as Record<string, unknown>[],
                [
                  { key: 'invoiceNumber', header: 'Invoice #' },
                  { key: 'patientName', header: 'Patient' },
                  { key: 'totalAmount', header: 'Total' },
                  { key: 'paidAmount', header: 'Paid' },
                  { key: 'paymentStatus', header: 'Status' },
                ],
                'invoices-export.csv',
              )
            }
          >
            Export CSV
          </button>
          <button
            type="button"
            className={ui.btnPrimary}
          onClick={() => {
            const p = patients[0];
            if (!p) return;
            void (async () => {
              await generateInvoice({
                patientId: p.id,
                patientName: p.fullName,
                lineItems: [
                  { description: 'Consultation', category: 'Consultation', amount: 800 },
                  { description: 'Lab CBC', category: 'Lab', amount: 600 },
                ],
              });
              toast.success('Invoice generated · Patient app notified');
            })();
          }}
        >
          Generate Invoice
        </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(revenueByCategory).map(([cat, amt]) => (
          <div key={cat} className={ui.card}>
            <p className="text-sm font-bold uppercase text-[#005F6B]">{cat}</p>
            <p className="mt-1 text-3xl font-bold text-[#0A2E36]">₹{amt.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EntityEmptyState preset="invoices" onAction={() => toast.info('Select a patient from Patients module first')} />
      ) : (
      <div className={`${ui.card} overflow-x-auto`}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th className={ui.th}>Invoice #</th>
              <th className={ui.th}>Patient</th>
              <th className={ui.th}>Total</th>
              <th className={ui.th}>Paid</th>
              <th className={ui.th}>Status</th>
              <th className={ui.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className={ui.td}>{inv.invoiceNumber}</td>
                <td className={ui.td}>{inv.patientName}</td>
                <td className={ui.td}>₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                <td className={ui.td}>₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                <td className={ui.td}>
                  <Badge status={inv.paymentStatus} />
                </td>
                <td className={ui.td}>
                  {inv.paymentStatus !== 'Paid' && (
                    <button
                      type="button"
                      className={ui.link}
                      onClick={() => {
                        setPayModal(inv.id);
                        setAmount(String(inv.totalAmount - inv.paidAmount));
                      }}
                    >
                      Process Payment
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${ui.link} ml-3`}
                    onClick={() => toast.info('Receipt sent to printer')}
                  >
                    Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <Modal open={!!payModal} title="Process Payment" onClose={() => setPayModal(null)}>
        <div className="space-y-3">
          <input
            className={ui.input}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
          />
          <select className={ui.select} value={method} onChange={(e) => setMethod(e.target.value)}>
            {['Cash', 'Card', 'UPI', 'Insurance'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !payModal}
            className={ui.btnPrimary}
            onClick={() => {
              if (!payModal) return;
              void (async () => {
                setBusy(true);
                await processPayment(payModal, Number(amount), method);
                setBusy(false);
                toast.success('Payment recorded');
                setPayModal(null);
              })();
            }}
          >
            {busy ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
