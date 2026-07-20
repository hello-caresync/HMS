export type ProcurementWorkspaceTab = 'p2p' | 'vendor' | 'logistics';

export type ProcurementModalType =
  | 'create-pr'
  | 'generate-po'
  | 'process-rfq'
  | 'upload-invoice'
  | 'emergency-purchase'
  | null;

export const PROCUREMENT_WORKSPACE_TABS: { id: ProcurementWorkspaceTab; label: string; description: string }[] = [
  { id: 'p2p', label: 'P2P Command Center & Requisitions', description: 'KPIs · PR queue · multi-level approvals · quick actions' },
  { id: 'vendor', label: 'Vendor Vault, Sourcing & Bidding', description: 'Supplier directory · catalogues · RFQ · tender comparison' },
  { id: 'logistics', label: 'Logistics, Accounting & AI Intelligence', description: 'Three-way match · returns · demand forecasting · vendor AI' },
];

export type RequestPriority = 'Emergency' | 'Critical' | 'Normal';

export type PrLifecycleStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'PO Generated'
  | 'Sent to Vendor'
  | 'Completed';

export type ApprovalStageName = 'Department Head' | 'Inventory Manager' | 'Finance' | 'Admin';

export type StageSignOff = 'Pending' | 'Approved' | 'Rejected';

export type StockAvailability = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type DeliveryStatus = 'On Track' | 'Pending' | 'Delayed' | 'Delivered';

export type PaymentDueStatus = 'Due' | 'Partial' | 'Paid' | 'Overdue';

export type ThreeWayMatchStatus = 'Pending' | 'Matched' | 'Variance' | 'Approved for Payment';

export type RfqStatus = 'Open' | 'Evaluating' | 'Awarded' | 'Closed';

export type TenderStatus = 'Draft' | 'Published' | 'Evaluation' | 'Awarded';

export type AiProcurementStatus = 'Pending Review' | 'Accepted' | 'Rejected';

export const PR_LIFECYCLE: PrLifecycleStatus[] = [
  'Draft',
  'Pending Approval',
  'Approved',
  'PO Generated',
  'Sent to Vendor',
  'Completed',
];

export function advancePrLifecycle(current: PrLifecycleStatus): PrLifecycleStatus {
  if (current === 'Completed') return current;
  const idx = PR_LIFECYCLE.indexOf(current);
  if (idx === -1 || idx === PR_LIFECYCLE.length - 1) return current;
  return PR_LIFECYCLE[idx + 1];
}

export function advanceApprovalStage(stages: Record<ApprovalStageName, StageSignOff>, stage: ApprovalStageName): Record<ApprovalStageName, StageSignOff> {
  const order: ApprovalStageName[] = ['Department Head', 'Inventory Manager', 'Finance', 'Admin'];
  const idx = order.indexOf(stage);
  if (idx === -1) return stages;
  const next = { ...stages, [stage]: 'Approved' as StageSignOff };
  return next;
}

export function allApprovalsComplete(stages: Record<ApprovalStageName, StageSignOff>): boolean {
  return Object.values(stages).every((s) => s === 'Approved');
}
