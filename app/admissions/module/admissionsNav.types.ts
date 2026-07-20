export type AdmissionsWorkspaceTab = 'executive' | 'spatial' | 'financial';

export type AdmissionModalType =
  | 'admit-patient'
  | 'allocate-bed'
  | 'transfer-patient'
  | 'collect-deposit'
  | 'verify-insurance'
  | 'print-slip'
  | 'visitor-pass'
  | null;

export const ADMISSIONS_WORKSPACE_TABS: { id: AdmissionsWorkspaceTab; label: string; description: string }[] = [
  { id: 'executive', label: 'Executive Desk & Requests', description: 'Census · intake queues · inpatient console · quick actions' },
  { id: 'spatial', label: 'Spatial Capacity & Matrix', description: 'Bed map · ward grid · transfer routing' },
  { id: 'financial', label: 'Financial, Discharge & Compliance', description: 'Deposits · TPA · clearance · analytics' },
];

export type RequestPriority = 'Emergency' | 'Urgent' | 'Elective' | 'Referral';

export type RequestStatus = 'Pending' | 'Approved' | 'In Progress' | 'Rejected';

export type BedStatus = 'Occupied' | 'Available' | 'Reserved' | 'Cleaning';

export type WardCategory = 'General Ward' | 'Semi-Private' | 'Private Room' | 'ICU';

export type DischargeStepStatus = 'Complete' | 'Pending' | 'Blocked';
