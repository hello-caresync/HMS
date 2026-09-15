'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { PrintableInvoiceView, printInvoiceElement } from '@/components/billing/PrintableInvoiceView';
import { PharmacyBillingModal, type DirectBillingSeed } from '@/components/hospital/PharmacyBillingModal';
import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, Modal, ui } from '@/components/nexora-hospital/ui/primitives';
import {
  fetchHospitalBillingInvoices,
  markBillingInvoicePaid,
  subscribeHospitalBillingInvoices,
  type HospitalBillingInvoiceView,
} from '@/lib/hospital/billing-invoices-live';
import {
  fetchBillingPendingAppointments,
  mapHospitalAppointmentToReceptionRow,
  type HospitalAppointmentRecord,
} from '@/lib/hospital/appointments';
import { resolveDoctorConsultationFee } from '@/lib/hospital/doctors';
import { formatINR } from '@/lib/utils/currency';
import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { supabase } from '@/lib/supabase/client';

type BillingTab = 'ready' | 'invoices';

function formatTokenLabel(token?: string): string {
  const raw = String(token ?? '').trim();
  if (!raw) return '—';
  return raw.startsWith('#') ? raw : `#${raw}`;
}

function resolveConsultationFee(row: HospitalAppointmentRecord): number {
  return resolveDoctorConsultationFee(row);
}

export function BillingWorkspace() {
  const [activeTab, setActiveTab] = useState<BillingTab>('ready');
  const [hospitalId, setHospitalId] = useState('');
  const [invoices, setInvoices] = useState<HospitalBillingInvoiceView[]>([]);
  const [billingPending, setBillingPending] = useState<HospitalAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [payModal, setPayModal] = useState<HospitalBillingInvoiceView | null>(null);
  const [printInvoice, setPrintInvoice] = useState<HospitalBillingInvoiceView | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [settlementSeed, setSettlementSeed] = useState<DirectBillingSeed | null>(null);
  const [method, setMethod] = useState<'cash' | 'upi' | 'card' | 'insurance'>('upi');
  const [busy, setBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const reloadInvoices = useCallback(async (nodeId: string) => {
    if (!nodeId) {
      setInvoices([]);
      return;
    }
    const rows = await fetchHospitalBillingInvoices(supabase, nodeId);
    setInvoices(rows);
  }, []);

  const reloadBillingQueue = useCallback(async (nodeId: string) => {
    setLoadingQueue(true);
    try {
      const rows = await fetchBillingPendingAppointments(supabase, {
        hospitalId: nodeId || undefined,
        dateFilter: 'today',
        limit: 200,
      });
      setBillingPending(rows);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const session = readHospitalAppSession();
      const nodeId = (await resolveHospitalUuid(supabase, session?.hospital_id)) ?? '';
      setHospitalId(nodeId);
      await Promise.all([reloadInvoices(nodeId), reloadBillingQueue(nodeId)]);
    } finally {
      setLoading(false);
    }
  }, [reloadBillingQueue, reloadInvoices]);

  useEffect(() => {
    void reload();
    const unsubscribeInvoices = subscribeHospitalBillingInvoices(supabase, () => {
      void reload();
    });

    const channel = supabase
      .channel('hospital-billing-queue-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          void reloadBillingQueue(hospitalId);
        },
      )
      .subscribe();

    return () => {
      unsubscribeInvoices();
      void supabase.removeChannel(channel);
    };
  }, [hospitalId, reload, reloadBillingQueue]);

  const billingQueueRows = useMemo(
    () => billingPending.map(mapHospitalAppointmentToReceptionRow),
    [billingPending],
  );

  const settlementQueue = useMemo(
    () =>
      billingQueueRows.map((row) => ({
        id: row.id,
        token_number: row.token_number,
        patient_name: row.patient_name,
        doctor_name: row.doctor_name,
        department: row.department,
        status: row.status,
        source: 'patient_app',
      })),
    [billingQueueRows],
  );

  const revenueByCategory = invoices.reduce(
    (acc, inv) => {
      acc.consultation += inv.consultation_fee ?? 0;
      acc.pharmacy += inv.medicine_fee ?? inv.medicines_total ?? 0;
      acc.gst += inv.gst_amount ?? 0;
      return acc;
    },
    { consultation: 0, pharmacy: 0, gst: 0 },
  );

  const openSettlement = (row: (typeof billingQueueRows)[0]) => {
    setSettlementSeed({
      appointmentId: row.id,
      token: row.token_number,
    });
    setSettlementOpen(true);
  };

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Billing &amp; Checkout Desk</h1>
          <p className={ui.pageSubtitle}>
            Ready for Billing queue · consultation + pharmacy settlement · live sync
          </p>
        </div>
        <button type="button" className={ui.btnSecondary} onClick={() => void reload()}>
          <RefreshCw className="mr-1.5 inline h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('ready')}
          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
            activeTab === 'ready'
              ? 'bg-[#005F6B] text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          Ready for Billing ({billingQueueRows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
            activeTab === 'invoices'
              ? 'bg-[#005F6B] text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
      </div>

      {activeTab === 'ready' ? (
        <section className={`${ui.card} mb-6 p-5`}>
          <h2 className="mb-1 text-lg font-black text-[#0A2E36]">Ready for Billing</h2>
          <p className="mb-4 text-xs text-slate-500">
            Patients whose consultation is complete — enter pharmacy charges and settle the combined bill.
          </p>

          {loadingQueue ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading billing queue…</p>
          ) : billingQueueRows.length === 0 ? (
            <EntityEmptyState
              preset="invoices"
              onAction={() =>
                toast.info('Patients appear here after the doctor clicks Complete Consultation')
              }
            />
          ) : (
            <ul className="space-y-3">
              {billingQueueRows.map((row) => {
                const source = billingPending.find(
                  (entry) => String(entry.id ?? entry.appointment_id) === row.id,
                );
                const fee = source ? resolveConsultationFee(source) : 0;

                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-[#005F6B]/10 px-2.5 py-1 font-mono text-xs font-black text-[#005F6B]">
                          {formatTokenLabel(row.token_number)}
                        </span>
                        <Badge status="Billing Pending" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">{row.patient_name}</p>
                      <p className="text-xs font-semibold text-slate-600">
                        {row.doctor_name} ({row.department})
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Consultation Fee:{' '}
                        <span className="font-black text-[#005F6B]">{formatINR(fee)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`${ui.btnPrimary} shrink-0`}
                      onClick={() => openSettlement(row)}
                    >
                      <Receipt className="mr-1.5 inline h-4 w-4" />
                      Process Settlement &amp; Dispense
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === 'invoices' ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Consultation', amount: revenueByCategory.consultation },
              { label: 'Pharmacy', amount: revenueByCategory.pharmacy },
              { label: 'GST', amount: revenueByCategory.gst },
            ].map(({ label, amount }) => (
              <div key={label} className={ui.card}>
                <p className="text-sm font-bold uppercase text-[#005F6B]">{label}</p>
                <p className="mt-1 text-3xl font-bold text-[#0A2E36]">{formatINR(amount)}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className={`${ui.card} p-8 text-center text-sm font-semibold text-slate-500`}>
              Loading invoices from Supabase…
            </div>
          ) : invoices.length === 0 ? (
            <EntityEmptyState
              preset="invoices"
              onAction={() => toast.info('Invoices appear here when doctors complete consultations')}
            />
          ) : (
            <div className={`${ui.card} overflow-x-auto`}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.th}>Invoice #</th>
                    <th className={ui.th}>Patient</th>
                    <th className={ui.th}>Doctor</th>
                    <th className={ui.th}>Total</th>
                    <th className={ui.th}>Status</th>
                    <th className={ui.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className={ui.td}>{inv.invoice_number ?? inv.id.slice(0, 8)}</td>
                      <td className={ui.td}>{inv.patient_name}</td>
                      <td className={ui.td}>{inv.doctor_name ?? '—'}</td>
                      <td className={ui.td}>{formatINR(inv.total_payable ?? 0)}</td>
                      <td className={ui.td}>
                        <Badge status={inv.payment_status === 'paid' ? 'Paid' : 'Unpaid'} />
                      </td>
                      <td className={ui.td}>
                        {inv.payment_status !== 'paid' && (
                          <button
                            type="button"
                            className={ui.link}
                            onClick={() => setPayModal(inv)}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          type="button"
                          className={`${ui.link} ml-3`}
                          onClick={() => setPrintInvoice(inv)}
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      <PharmacyBillingModal
        open={settlementOpen}
        hospitalId={hospitalId}
        seed={settlementSeed}
        queue={settlementQueue}
        invoices={invoices.map((inv) => ({
          id: inv.id,
          status: inv.payment_status ?? 'unpaid',
          patient_name: inv.patient_name,
          uhid: inv.uhid,
          token_number: (inv as { token_number?: string | number | null }).token_number,
          doctor_name: inv.doctor_name,
          department: inv.department,
          consultation_fee: inv.consultation_fee,
          appointment_id: inv.appointment_id,
          prescribed_items: inv.prescribed_items,
          booking_source: inv.booking_source,
          patient_id: inv.uhid,
        }))}
        busy={busy}
        onClose={() => {
          setSettlementOpen(false);
          setSettlementSeed(null);
        }}
        onSettled={() => {
          void reload();
        }}
      />

      <Modal open={!!payModal} title="Mark invoice paid" onClose={() => setPayModal(null)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {payModal?.patient_name} · {formatINR(payModal?.total_payable ?? 0)}
          </p>
          <select
            className={ui.select}
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
          </select>
          <button
            type="button"
            disabled={busy || !payModal}
            className={ui.btnPrimary}
            onClick={() => {
              if (!payModal) return;
              void (async () => {
                setBusy(true);
                const result = await markBillingInvoicePaid(supabase, payModal, method);
                setBusy(false);
                if (!result.ok) {
                  toast.error(result.error ?? 'Payment failed');
                  return;
                }
                toast.success('Payment recorded · patient notified');
                setPayModal(null);
                void reload();
              })();
            }}
          >
            {busy ? 'Processing…' : 'Confirm payment'}
          </button>
        </div>
      </Modal>

      <Modal open={!!printInvoice} title="Invoice" onClose={() => setPrintInvoice(null)}>
        {printInvoice && (
          <>
            <PrintableInvoiceView invoice={printInvoice} printRef={printRef} />
            <div className="no-print mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={ui.btnSecondary}
                onClick={() => setPrintInvoice(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={ui.btnPrimary}
                onClick={() => printInvoiceElement(printRef.current)}
              >
                Print
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
