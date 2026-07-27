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

import {
  PatientHeaderBadge,
  PatientStatusBanner,
  patientVerifiedChipClass,
} from '@/components/patient/PatientStatusBanner';
import { formatHeaderBadge, patientToastCopy } from '@/lib/patient/status-copy';

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

const PANEL_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const SUMMARY_CARD_CLASS =
  'flex flex-col justify-between rounded-xl border border-patient-lavender/30 border-t-4 border-t-[#572E54] bg-white p-4 shadow-sm';

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
  Paid: patientVerifiedChipClass,
  Pending: 'border border-amber-500/20 bg-amber-500/10 text-amber-800 font-bold px-3 py-1 rounded-full text-[11px] tracking-wide',
  Overdue: 'border border-rose-500/20 bg-rose-500/10 text-rose-700 font-black px-3 py-1 rounded-full text-[11px] tracking-wide',
};

const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  'Under Review': 'border border-patient-primary/40 bg-patient-card text-patient-plum font-semibold px-3 py-1 rounded-full text-xs tracking-wide',
  Approved: patientVerifiedChipClass,
  Settled: patientVerifiedChipClass,
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
      showNotice(patientToastCopy.paymentInitiated(invoice.invoiceNumber, invoice.amount));
    },
    [showNotice],
  );

  const handleDownloadReceipt = useCallback(
    (entry: PaymentHistoryEntry) => {
      showNotice(patientToastCopy.receiptReady(entry.transactionId));
    },
    [showNotice],
  );

  const handleAdvanceRefund = useCallback(() => {
    if (refundStatus === 'Processing by Bank') {
      setRefundStatus('Settled to Account');
      showNotice(patientToastCopy.refundSettled);
    }
  }, [refundStatus, showNotice]);

  return (
    <div className="min-h-screen w-full space-y-6 bg-patient-canvas p-6 font-sans text-patient-charcoal">
      {/* Central HUD financial header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-patient-plum">
            Financial Statements &amp; Insurance Claims Ledger
          </h1>
          <p className="mt-1 text-sm font-medium text-patient-lavender">
            Secure transactional portal · verified payment gateway · claims processing hub · 14 Jul
            2026
          </p>
        </div>
        <PatientHeaderBadge
          label={formatHeaderBadge('PAYMENT_GATEWAY_VERIFIED')}
          tone="verified"
          icon={ShieldCheck}
        />
      </header>

      {actionNotice ? <PatientStatusBanner message={actionNotice} variant="info" /> : null}

      {/* Top highlight bar — financial summary */}
      <section
        aria-label="Active financial summary"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
            Total Outstanding Balance
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-patient-plum">
            ₹{metrics.outstanding.toLocaleString('en-IN')}
          </p>
          <Wallet className="mt-2 h-4 w-4 text-patient-primary" aria-hidden />
        </div>
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
            Active Claims Pending
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-patient-primary">
            {metrics.pendingClaims}
          </p>
          <FileText className="mt-2 h-4 w-4 text-patient-primary" aria-hidden />
        </div>
        <div className={SUMMARY_CARD_CLASS}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
            Last Processed Refund
          </p>
          <p className="mt-2 text-lg font-black text-patient-plum">{refundStatus}</p>
          <p className="mt-0.5 text-xs font-bold text-patient-lavender">{REFUND_RECORD.amount}</p>
          <RefreshCw className="mt-2 h-4 w-4 text-patient-plum" aria-hidden />
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — invoices & checkout (60%) */}
        <div className="space-y-6">
          <section aria-label="Active bills and invoices" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Active Bills &amp; Invoices</h2>
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
                        : 'border-patient-lavender/30 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-black text-patient-primary">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-sm font-black text-patient-charcoal">
                          {invoice.department}
                        </p>
                        <p className="text-xs font-medium text-patient-lavender">{invoice.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-patient-plum">{invoice.amount}</p>
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

                    <ul className="mt-3 space-y-1 border-t border-patient-lavender/30 pt-3">
                      {invoice.lineItems.map((item) => (
                        <li
                          key={item.label}
                          className="flex justify-between text-xs font-medium text-patient-charcoal"
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
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-patient-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-patient-plum"
                      >
                        <CreditCard className="h-4 w-4" aria-hidden />
                        Proceed to Online Payment
                      </button>
                    ) : (
                      <p className="mt-3 flex items-center gap-1 text-xs font-bold text-patient-primary">
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
              <History className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Payment History Archive</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-patient-lavender/30 bg-patient-lavender/10/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-patient-plum">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENT_HISTORY.map((entry) => (
                    <tr key={entry.id} className="border-b border-patient-lavender/30">
                      <td className="px-3 py-3 text-xs font-bold text-patient-primary">{entry.date}</td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-bold text-patient-charcoal">{entry.description}</p>
                        <p className="font-mono text-[10px] text-patient-lavender">{entry.transactionId}</p>
                        <p className="text-[10px] text-patient-lavender">{entry.method}</p>
                      </td>
                      <td className="px-3 py-3 font-black tabular-nums text-patient-plum">
                        {entry.amount}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(entry)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-patient-primary hover:underline"
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
            className="rounded-xl border border-patient-lavender/30 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Insurance Coverage Profile</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  Provider
                </dt>
                <dd className="font-bold text-patient-charcoal">{INSURANCE.providerName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  Policy ID
                </dt>
                <dd className="font-mono font-black text-patient-primary">{INSURANCE.policyId}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  Member ID
                </dt>
                <dd className="font-bold text-patient-text">{INSURANCE.memberId}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  OPD Coverage
                </dt>
                <dd className="font-bold text-patient-text">{INSURANCE.opdCoverage}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  IPD Coverage
                </dt>
                <dd className="font-bold text-patient-text">{INSURANCE.ipdCoverage}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  Valid Until
                </dt>
                <dd className="font-bold text-patient-plum">{INSURANCE.validUntil}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                  Network
                </dt>
                <dd className="text-xs font-medium text-patient-charcoal">{INSURANCE.networkHospitals}</dd>
              </div>
            </dl>
            <span className={`mt-4 ${patientVerifiedChipClass}`}>✓ {INSURANCE.coverageStatus}</span>
          </section>

          <section aria-label="Claims and refunds tracker" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Claims Status &amp; Refunds</h2>
            </div>

            <ul className="space-y-4">
              {INSURANCE_CLAIMS.map((claim) => (
                <li key={claim.id} className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[10px] font-black text-patient-primary">{claim.claimRef}</p>
                    <span className={`inline-flex uppercase ${CLAIM_STATUS_STYLES[claim.status]}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-patient-charcoal">{claim.service}</p>
                  <p className="text-xs font-medium text-patient-lavender">
                    Submitted {claim.submittedDate} · Reimbursed {claim.reimbursed}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {claim.timeline.map((step, index) => (
                      <span
                        key={step}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          index === claim.timeline.length - 1
                            ? 'bg-patient-card text-patient-primary'
                            : 'bg-slate-200/80 text-patient-lavender'
                        }`}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-lg border border-patient-primary/30 bg-patient-card p-3 text-patient-plum">
              <p className="text-xs font-black uppercase tracking-wider">Refund Tracker</p>
              <p className="mt-1 text-sm font-bold">{REFUND_RECORD.reference}</p>
              <p className="text-xs font-medium">{REFUND_RECORD.reason}</p>
              <p className="mt-2 text-lg font-black">{REFUND_RECORD.amount}</p>
              <p className="mt-1 text-xs font-bold">{refundStatus}</p>
              <p className="text-[10px] text-patient-lavender">Initiated {REFUND_RECORD.initiatedDate}</p>
              {refundStatus === 'Processing by Bank' ? (
                <button
                  type="button"
                  onClick={handleAdvanceRefund}
                  className="mt-3 text-xs font-bold text-patient-primary hover:underline"
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
