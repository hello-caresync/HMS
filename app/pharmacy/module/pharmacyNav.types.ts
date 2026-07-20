export type PharmacyWorkspaceTab = 'dispensing' | 'inventory' | 'compliance';

export type PharmacyModalType =
  | 'dispense'
  | 'search-drug'
  | 'purchase-request'
  | 'receive-stock'
  | 'transfer-stock'
  | 'print-invoice'
  | 'print-label'
  | null;

export const PHARMACY_WORKSPACE_TABS: { id: PharmacyWorkspaceTab; label: string; description: string }[] = [
  { id: 'dispensing', label: 'Dispensing Console & Live Queue', description: 'Census · prescription queue · patient tokens · quick actions' },
  { id: 'inventory', label: 'Drug Inventory, Expiry & Procurement', description: 'Batch vault · FEFO · purchase requests · GRN · vendors' },
  { id: 'compliance', label: 'Regulatory Compliance & Billing', description: 'Narcotic register · audit log · billing · drug information' },
];

export type PrescriptionSource = 'OPD' | 'IPD' | 'Emergency';

export type PrescriptionPriority = 'Routine' | 'STAT' | 'Controlled';

export type PrescriptionStatus =
  | 'Pending Verification'
  | 'Verified'
  | 'Processing'
  | 'Ready to Dispense'
  | 'Dispensed';

export type BatchAvailability = 'Available' | 'Low Stock' | 'Out of Stock' | 'Substitute Required';

export type BarcodeStatus = 'Pending' | 'Printed' | 'Scanned';

export type QueueTokenStatus = 'Waiting' | 'Called' | 'At Counter' | 'Completed';

export type GrnStatus = 'Pending QC' | 'Verified' | 'Rejected';

export type ControlledApprovalStage = 'Pending Chief Pharmacist' | 'Approved' | 'Dispensed' | 'Audit Logged';

export const PRESCRIPTION_FLOW: PrescriptionStatus[] = [
  'Pending Verification',
  'Verified',
  'Processing',
  'Ready to Dispense',
  'Dispensed',
];

export function advancePrescriptionStatus(current: PrescriptionStatus): PrescriptionStatus {
  if (current === 'Dispensed') return current;
  const idx = PRESCRIPTION_FLOW.indexOf(current);
  if (idx === -1 || idx === PRESCRIPTION_FLOW.length - 1) return current;
  return PRESCRIPTION_FLOW[idx + 1];
}

export function advanceControlledStage(current: ControlledApprovalStage): ControlledApprovalStage {
  const flow: ControlledApprovalStage[] = ['Pending Chief Pharmacist', 'Approved', 'Dispensed', 'Audit Logged'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}
