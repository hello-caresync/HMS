export type AssetWorkspaceTab = 'cockpit' | 'maintenance' | 'financial';

export type AssetModalType =
  | 'register-asset'
  | 'assign-asset'
  | 'log-breakdown'
  | 'allocate-spare-parts'
  | 'renew-amc'
  | 'print-tag-labels'
  | 'schedule-audit'
  | null;

export type RequestPriority = 'Emergency' | 'Critical' | 'Normal';

export type RequestApprovalStage = 'Request' | 'Manager Review' | 'Finance' | 'Procurement' | 'Approved';

export type AssetOperationalStatus =
  | 'Active'
  | 'Under Maintenance'
  | 'Damaged'
  | 'Idle'
  | 'In Transit'
  | 'Breakdown'
  | 'Disposed'
  | 'Recall';

export type AssetCategory =
  | 'MRI'
  | 'CT Scanner'
  | 'Ventilator'
  | 'Patient Monitor'
  | 'ECG'
  | 'Lab Analyzer'
  | 'Infrastructure'
  | 'IT Asset';

export type PmRoutine = 'Monthly' | 'Quarterly' | 'Yearly';

export type BreakdownTicketStatus = 'Open' | 'Assigned' | 'In Repair' | 'Resolved';

export type AiAssetInsightStatus = 'Active' | 'Acknowledged' | 'Dismissed';

export type DisposalWorkflowStatus = 'Pending' | 'Finance Review' | 'Approved' | 'Completed';

export const ASSET_WORKSPACE_TABS: { id: AssetWorkspaceTab; label: string; description: string }[] = [
  { id: 'cockpit', label: 'Operational Cockpit & Logistics Pipeline', description: 'ALM KPIs · requisition queue · location tracker · quick actions' },
  { id: 'maintenance', label: 'Asset Master, Maintenance & Calibration', description: 'Master register · PM/AMC · breakdown · spare parts · calibration' },
  { id: 'financial', label: 'Financial Governance, Audits & AI Intelligence', description: 'TCO · depreciation · warranty · audits · predictive maintenance AI' },
];

export const REQUEST_APPROVAL_FLOW: RequestApprovalStage[] = ['Request', 'Manager Review', 'Finance', 'Procurement', 'Approved'];

export function advanceRequestStage(current: RequestApprovalStage): RequestApprovalStage {
  const idx = REQUEST_APPROVAL_FLOW.indexOf(current);
  if (idx === -1 || idx === REQUEST_APPROVAL_FLOW.length - 1) return current;
  return REQUEST_APPROVAL_FLOW[idx + 1];
}

export function cycleAssetStatus(current: AssetOperationalStatus): AssetOperationalStatus {
  const cycle: AssetOperationalStatus[] = ['Active', 'Under Maintenance', 'Breakdown', 'Active'];
  const idx = cycle.indexOf(current);
  if (idx === -1) return 'Active';
  return cycle[(idx + 1) % cycle.length];
}

export function advanceBreakdownTicket(current: BreakdownTicketStatus): BreakdownTicketStatus {
  const flow: BreakdownTicketStatus[] = ['Open', 'Assigned', 'In Repair', 'Resolved'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}
