'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  Download,
  FileText,
  History,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

type LineItem = {
  label: string;
  amount: string;
};

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  department: string;
  description: string;
  lineItems: LineItem[];
  amount: string;
  dueDate: string;
  status: InvoiceStatus;
};

type PaymentHistoryEntry = {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  amount: string;
  method: string;
};

type InsurancePolicy = {
  providerName: string;
  policyId: string;
  memberId: string;
  coverageStatus: 'Active';
  opdCoverage: string;
  ipdCoverage: string;
  validUntil: string;
  networkHospitals: string;
};

type ClaimStatus = 'Under Review' | 'Approved' | 'Settled' | 'Rejected';

type InsuranceClaim = {
  id: string;
  claimRef: string;
  service: string;
  submittedDate: string;
  status: ClaimStatus;
  reimbursed: string;
  timeline: string[];
};

type RefundStatus = 'Refund Initiated' | 'Processing by Bank' | 'Settled to Account' | 'None';

type RefundRecord = {
  id: string;
  reference: string;
  amount: string;
  reason: string;
  status: RefundStatus;
  initiatedDate: string;
};

const VERIFIED_CHIP =
  'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold px-3 py-1 rounded-full text-[11px] tracking-wide';

const PANEL_CLASS = 'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const SUMMARY_CARD_CLASS =
  'flex flex-col justify-between rounded-xl border border-slate-200/60 border-t-4 border-t-[#008588] bg-white p-4 shadow-sm';

const INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'NX-INV-2026-8841',
    issueDate: '05 Jul 2026',
    department: 'General Medicine · OPD',
    description: 'Consultation · Dr. Meera Nair',
    lineItems: [
      { label: 'Consultation fee', amount: '₹600' },
      { label: 'Registration', amount: '₹150' },
      { label: 'Platform surcharge', amount: '₹100' },
    ],
    amount: '₹850',
    dueDate: '10 Jul 2026',
    status: 'Paid',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'NX-INV-2026-9012',
    issueDate: '08 Jul 2026',
    department: 'Laboratory Services',
    description: 'Lipid Profile · CBC · Blood Chemistry',
    lineItems: [
      { label: 'Lipid panel', amount: '₹520' },
      { label: 'CBC panel', amount: '₹380' },
      { label: 'Collection fee', amount: '₹340' },
    ],
    amount: '₹1,240',
    dueDate: '15 Jul 2026',
    status: 'Overdue',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'NX-INV-2026-9155',
    issueDate: '10 Jul 2026',
    department: 'Cardiology · Teleconsult',
    description: 'Virtual follow-up · Dr. Rajesh Kumar',
    lineItems: [
      { label: 'Teleconsult session', amount: '₹500' },
      { label: 'ECG review add-on', amount: '₹100' },
    ],
    amount: '₹600',
    dueDate: '20 Jul 2026',
    status: 'Pending',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'NX-INV-2026-9334',
    issueDate: '12 Jul 2026',
    department: 'Pharmacy Dispensary',
    description: '30-day prescription fulfilment',
    lineItems: [
      { label: 'Metformin 500 mg × 60', amount: '₹420' },
      { label: 'Amlodipine 5 mg × 30', amount: '₹280' },
      { label: 'Dispensing fee', amount: '₹180' },
    ],
    amount: '₹880',
    dueDate: '19 Jul 2026',
    status: 'Pending',
  },
];

const PAYMENT_HISTORY: PaymentHistoryEntry[] = [
  {
    id: 'pay-1',
    transactionId: 'NX-PAY-2026-77201',
    date: '06 Jul 2026',
    description: 'OPD Consultation · General Medicine',
    amount: '₹850',
    method: 'UPI · Verified Gateway',
  },
  {
    id: 'pay-2',
    transactionId: 'NX-PAY-2026-76844',
    date: '02 Jul 2026',
    description: 'Radiology · Chest X-Ray',
    amount: '₹980',
    method: 'Card · 3DS Secure',
  },
  {
    id: 'pay-3',
    transactionId: 'NX-PAY-2026-75102',
    date: '18 Jun 2026',
    description: 'Teleconsult · Cardiology',
    amount: '₹600',
    method: 'Net Banking',
  },
];

const INSURANCE: InsurancePolicy = {
  providerName: 'Nexora Health Shield Network',
  policyId: 'NHS-2026-44102',
  memberId: 'MEM-AISH-9021',
  coverageStatus: 'Active',
  opdCoverage: '80% co-pay · ₹50,000 annual OPD limit',
  ipdCoverage: '90% room rent · ₹5,00,000 sum insured',
  validUntil: '31 Mar 2027',
  networkHospitals: '142 empanelled · Tier-1 metro coverage',
};

const INSURANCE_CLAIMS: InsuranceClaim[] = [
  {
    id: 'clm-1',
    claimRef: 'NX-CLM-2026-1104',
    service: 'OPD Consultation · General Medicine',
    submittedDate: '06 Jul 2026',
    status: 'Settled',
    reimbursed: '₹680',
    timeline: ['Submitted', 'Under Review', 'Approved', 'Settled'],
  },
  {
    id: 'clm-2',
    claimRef: 'NX-CLM-2026-1128',
    service: 'Laboratory Panel · Lipid Profile',
    submittedDate: '09 Jul 2026',
    status: 'Under Review',
    reimbursed: 'Pending',
    timeline: ['Submitted', 'Under Review'],
  },
  {
    id: 'clm-3',
    claimRef: 'NX-CLM-2026-1091',
    service: 'Radiology · Chest X-Ray',
    submittedDate: '02 Jul 2026',
    status: 'Approved',
    reimbursed: '₹784',
    timeline: ['Submitted', 'Under Review', 'Approved'],
  },
];

const REFUND_RECORD: RefundRecord = {
  id: 'ref-1',
  reference: 'NX-RFD-2026-0042',
  amount: '₹150',
  reason: 'Duplicate registration charge · OPD-043',
  status: 'Processing by Bank',
  initiatedDate: '11 Jul 2026',
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: VERIFIED_CHIP,
  Pending: 'border border-amber-500/20 bg-amber-500/10 text-amber-800 font-bold px-3 py-1 rounded-full text-[11px] tracking-wide',
  Overdue: 'border border-rose-500/20 bg-rose-500/10 text-rose-700 font-black px-3 py-1 rounded-full text-[11px] tracking-wide',
};

const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  'Under Review': 'border border-[#008588]/20 bg-[#008588]/5 text-[#008588] font-bold px-3 py-1 rounded-full text-[11px] tracking-wide',
  Approved: VERIFIED_CHIP,
  Settled: VERIFIED_CHIP,
  Rejected: 'border border-rose-500/20 bg-rose-500/10 text-rose-700 font-bold px-3 py-1 rounded-full text-[11px] tracking-wide',
};

function parseAmount(amount: string): number {
  return Number.parseInt(amount.replace(/[^\d]/g, ''), 10) || 0;
}

export default function PatientBillingPage() {
  const [refundStatus, setRefundStatus] = useState<RefundStatus>(REFUND_RECORD.status);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const outstanding = INVOICES.filter((i) => i.status !== 'Paid').reduce(
      (sum, inv) => sum + parseAmount(inv.amount),
      0,
    );
    const pendingClaims = INSURANCE_CLAIMS.filter(
      (c) => c.status === 'Under Review' || c.status === 'Approved',
    ).length;
    return { outstanding, pendingClaims };
  }, []);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handlePayment = useCallback(
    (invoice: InvoiceRecord) => {
      showNotice(
        `Secure payment gateway · ${invoice.invoiceNumber} · ${invoice.amount} · sandbox redirect`,
      );
    },
    [showNotice],
  );

  const handleDownloadReceipt = useCallback(
    (entry: PaymentHistoryEntry) => {
      showNotice(`Receipt PDF · ${entry.transactionId} · sandbox download queued`);
    },
    [showNotice],
  );

  const handleAdvanceRefund = useCallback(() => {
    if (refundStatus === 'Processing by Bank') {
      setRefundStatus('Settled to Account');
      showNotice('Refund settled to registered bank account · sandbox confirmation');
    }
  }, [refundStatus, showNotice]);

  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/70 p-6 font-sans text-slate-950">
      {/* Central HUD financial header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">
            Financial Statements &amp; Insurance Claims Ledger
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Secure transactional portal · verified payment gateway · PCI-DSS sandbox · claims
            processing hub · 14 Jul 2026
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00A481]/20 bg-[#00A481]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#00A481]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          PAYMENT_GATEWAY_VERIFIED
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {actionNotice}
        </p>
      ) : null}

      {/* Top highlight bar — financial summary */}
      <section
        aria-label="Active financial summary"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Outstanding Balance
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-[#00758C]">
            ₹{metrics.outstanding.toLocaleString('en-IN')}
          </p>
          <Wallet className="mt-2 h-4 w-4 text-[#008588]" aria-hidden />
        </div>
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Claims Pending
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-[#00A481]">
            {metrics.pendingClaims}
          </p>
          <FileText className="mt-2 h-4 w-4 text-[#00A481]" aria-hidden />
        </div>
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Last Processed Refund
          </p>
          <p className="mt-2 text-lg font-black text-[#5EC283]">{refundStatus}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-600">{REFUND_RECORD.amount}</p>
          <RefreshCw className="mt-2 h-4 w-4 text-[#5EC283]" aria-hidden />
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — invoices & checkout (60%) */}
        <div className="space-y-6">
          <section aria-label="Active bills and invoices" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-lg font-black text-[#00758C]">Active Bills &amp; Invoices</h2>
            </div>

            <ul className="space-y-4">
              {INVOICES.map((invoice) => {
                const isUnpaid = invoice.status !== 'Paid';
                const isOverdue = invoice.status === 'Overdue';

                return (
                  <li
                    key={invoice.id}
                    className={`rounded-xl border p-5 shadow-sm ${
                      isOverdue
                        ? 'border-rose-500/30 bg-rose-500/5 ring-1 ring-rose-500/20'
                        : 'border-slate-200/60 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-black text-[#008588]">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {invoice.department}
                        </p>
                        <p className="text-xs font-medium text-slate-600">{invoice.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-[#00758C]">{invoice.amount}</p>
                        <span className={`mt-1 inline-flex uppercase ${INVOICE_STATUS_STYLES[invoice.status]}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>

                    {isUnpaid ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-black uppercase text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        Unpaid · due {invoice.dueDate}
                      </p>
                    ) : null}

                    <ul className="mt-3 space-y-1 border-t border-slate-200/60 pt-3">
                      {invoice.lineItems.map((item) => (
                        <li
                          key={item.label}
                          className="flex justify-between text-xs font-medium text-slate-700"
                        >
                          <span>{item.label}</span>
                          <span className="font-bold tabular-nums">{item.amount}</span>
                        </li>
                      ))}
                    </ul>

                    {isUnpaid ? (
                      <button
                        type="button"
                        onClick={() => handlePayment(invoice)}
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00758C] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#008588]"
                      >
                        <CreditCard className="h-4 w-4" aria-hidden />
                        Proceed to Online Payment
                      </button>
                    ) : (
                      <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[#00A481]">
                        <Wallet className="h-3.5 w-3.5" aria-hidden />
                        Settled · {invoice.issueDate}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Payment history" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-lg font-black text-[#00758C]">Payment History Archive</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-[#00758C]">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENT_HISTORY.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-200/60">
                      <td className="px-3 py-3 text-xs font-bold text-[#008588]">{entry.date}</td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-bold text-slate-900">{entry.description}</p>
                        <p className="font-mono text-[10px] text-slate-500">{entry.transactionId}</p>
                        <p className="text-[10px] text-slate-500">{entry.method}</p>
                      </td>
                      <td className="px-3 py-3 font-black tabular-nums text-[#00758C]">
                        {entry.amount}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(entry)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#008588] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          Download Receipt PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column — insurance claims (40%) */}
        <aside className="space-y-6">
          <section
            aria-label="Insurance coverage profile"
            className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Insurance Coverage Profile</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Provider
                </dt>
                <dd className="font-bold text-slate-900">{INSURANCE.providerName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Policy ID
                </dt>
                <dd className="font-mono font-black text-[#008588]">{INSURANCE.policyId}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Member ID
                </dt>
                <dd className="font-bold text-slate-800">{INSURANCE.memberId}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  OPD Coverage
                </dt>
                <dd className="font-bold text-slate-800">{INSURANCE.opdCoverage}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  IPD Coverage
                </dt>
                <dd className="font-bold text-slate-800">{INSURANCE.ipdCoverage}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Valid Until
                </dt>
                <dd className="font-bold text-[#5EC283]">{INSURANCE.validUntil}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Network
                </dt>
                <dd className="text-xs font-medium text-slate-700">{INSURANCE.networkHospitals}</dd>
              </div>
            </dl>
            <span className={`mt-4 inline-flex uppercase ${VERIFIED_CHIP}`}>
              {INSURANCE.coverageStatus}
            </span>
          </section>

          <section aria-label="Claims and refunds tracker" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Claims Status &amp; Refunds</h2>
            </div>

            <ul className="space-y-4">
              {INSURANCE_CLAIMS.map((claim) => (
                <li key={claim.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[10px] font-black text-[#008588]">{claim.claimRef}</p>
                    <span className={`inline-flex uppercase ${CLAIM_STATUS_STYLES[claim.status]}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">{claim.service}</p>
                  <p className="text-xs font-medium text-slate-600">
                    Submitted {claim.submittedDate} · Reimbursed {claim.reimbursed}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {claim.timeline.map((step, index) => (
                      <span
                        key={step}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          index === claim.timeline.length - 1
                            ? 'bg-[#00A481]/10 text-[#00A481]'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-lg border border-[#5EC283]/30 bg-[#5EC283]/10 p-3 text-[#00758C]">
              <p className="text-xs font-black uppercase tracking-wider">Refund Tracker</p>
              <p className="mt-1 text-sm font-bold">{REFUND_RECORD.reference}</p>
              <p className="text-xs font-medium">{REFUND_RECORD.reason}</p>
              <p className="mt-2 text-lg font-black">{REFUND_RECORD.amount}</p>
              <p className="mt-1 text-xs font-bold">{refundStatus}</p>
              <p className="text-[10px] text-slate-600">Initiated {REFUND_RECORD.initiatedDate}</p>
              {refundStatus === 'Processing by Bank' ? (
                <button
                  type="button"
                  onClick={handleAdvanceRefund}
                  className="mt-3 text-xs font-bold text-[#008588] hover:underline"
                >
                  Simulate settlement update
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
