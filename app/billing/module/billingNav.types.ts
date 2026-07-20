export type BillingWorkspaceTab = 'command' | 'rcm' | 'accounting';

export type BillingModalType =
  | 'generate-invoice'
  | 'collect-payment'
  | 'approve-discount'
  | 'process-refund'
  | 'update-charge-master'
  | 'daily-closing'
  | 'select-package'
  | null;

export const BILLING_WORKSPACE_TABS: { id: BillingWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'Financial Command Center & Patient Billing', description: 'Revenue KPIs · billing queues · collections · quick actions' },
  { id: 'rcm', label: 'RCM, Insurance & Payables', description: 'Claims pipeline · AP ledger · AR aging · corporate tie-ups' },
  { id: 'accounting', label: 'Accounting, Compliance & AI Intelligence', description: 'GL · GST · trial balance · fraud detection · P&L charts' },
];

export type BillingQueueType = 'OPD' | 'IPD' | 'Emergency';

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Corporate Credit';

export type BillPaymentStatus = 'Pending' | 'Partial' | 'Paid' | 'Disputed';

export type ClaimStage =
  | 'Pre-Authorization'
  | 'Claim Submission'
  | 'Under Review'
  | 'Denial Management'
  | 'Settlement';

export type ApInvoiceStatus = 'Pending Match' | 'Matched' | 'Approved' | 'Paid';

export type AiFinanceInsightStatus = 'Pending Review' | 'Accepted' | 'Rejected';

export type FraudRiskLevel = 'Normal' | 'Review' | 'Suspicious';

export const CLAIM_FLOW: ClaimStage[] = [
  'Pre-Authorization',
  'Claim Submission',
  'Under Review',
  'Denial Management',
  'Settlement',
];

export function advanceClaimStage(current: ClaimStage): ClaimStage {
  if (current === 'Settlement') return current;
  const idx = CLAIM_FLOW.indexOf(current);
  if (idx === -1 || idx === CLAIM_FLOW.length - 1) return current;
  if (current === 'Under Review') return 'Settlement';
  return CLAIM_FLOW[idx + 1];
}

export function advanceClaimFromDenial(current: ClaimStage): ClaimStage {
  if (current === 'Denial Management') return 'Settlement';
  return advanceClaimStage(current);
}
