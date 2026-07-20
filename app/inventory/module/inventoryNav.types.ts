export type InventoryWorkspaceTab = 'procure' | 'master' | 'audit';

export type InventoryModalType =
  | 'register-item'
  | 'create-pr'
  | 'generate-po'
  | 'log-grn'
  | 'issue-stock'
  | 'transfer-stock'
  | null;

export const INVENTORY_WORKSPACE_TABS: { id: InventoryWorkspaceTab; label: string; description: string }[] = [
  { id: 'procure', label: 'Operational Census & Procure-to-Pay', description: 'KPIs · PR/PO queue · GRN intake · quick actions' },
  { id: 'master', label: 'Item Master, Stock & Warehousing', description: 'Item registry · spatial stores · FEFO · recall engine' },
  { id: 'audit', label: 'Audits, Equipment Assets & AI Vault', description: 'Physical audit · biomedical assets · demand forecasting' },
];

export type RequestPriority = 'Emergency' | 'High' | 'Normal';

export type PoWorkflowStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent to Vendor' | 'PO Issued';

export type GrnQcStatus = 'Pending QC' | 'QC Passed' | 'QC Failed';

export type ItemCategory = 'Medicine' | 'Surgical Consumable' | 'Implant' | 'Medical Equipment';

export type CriticalityLevel = 'Critical' | 'High' | 'Standard' | 'Low';

export type BarcodeStatus = 'Pending' | 'Printed' | 'Scanned';

export type StorageType = 'Ambient' | 'Cold Chain 2-8°C' | 'Controlled Room' | 'Freezer -20°C';

export type StoreLocation =
  | 'Main Store'
  | 'Pharmacy Store'
  | 'ICU Store'
  | 'OT Store'
  | 'Emergency Store'
  | 'Laboratory Store'
  | 'Departmental';

export type StockStatus = 'Available' | 'Reserved' | 'In Transit' | 'Low Stock' | 'Out of Stock' | 'Expired';

export type AuditStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Variance Reported';

export type AdjustmentReason = 'Damage' | 'Theft' | 'Expiry' | 'Correction';

export type EquipmentStatus = 'Operational' | 'Under Maintenance' | 'Calibration Due' | 'Decommissioned';

export type AiSuggestionStatus = 'Pending Review' | 'Accepted' | 'Rejected';

export const PO_WORKFLOW: PoWorkflowStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Sent to Vendor', 'PO Issued'];

export function advancePoStatus(current: PoWorkflowStatus): PoWorkflowStatus {
  if (current === 'PO Issued') return current;
  const idx = PO_WORKFLOW.indexOf(current);
  if (idx === -1 || idx === PO_WORKFLOW.length - 1) return current;
  return PO_WORKFLOW[idx + 1];
}
