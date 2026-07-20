export type IpdWorkspaceTab = 'console' | 'ward' | 'discharge';

export type IpdModalType =
  | 'view-inpatient'
  | 'allocate-bed'
  | 'transfer-patient'
  | 'assign-nurse'
  | 'schedule-round'
  | 'initiate-discharge'
  | 'print-wristband'
  | null;

export const IPD_WORKSPACE_TABS: { id: IpdWorkspaceTab; label: string; description: string }[] = [
  { id: 'console', label: 'Operational Console & Census', description: 'Census KPIs · inpatient directory · quick actions' },
  { id: 'ward', label: 'Ward Capacity & Nursing Stations', description: 'Bed map · nursing · vitals · movement tracker' },
  { id: 'discharge', label: 'Discharge Coordination & Finance', description: 'Billing ledger · clearance matrix · analytics' },
];

export type DirectoryGroupBy = 'ward' | 'room' | 'bed';

export type ClinicalStatus = 'Stable' | 'Under Review' | 'Critical' | 'ICU' | 'High Risk';

export type VitalCompliance = 'Compliant' | 'Due Soon' | 'Overdue';

export type BedAssetStatus = 'Occupied' | 'Available' | 'Reserved' | 'Cleaning';

export type RoomType = 'General' | 'Semi-Private' | 'Private' | 'Isolation';

export type MovementType = 'OT Transfer' | 'Diagnostic Transfer' | 'ICU Transfer' | 'Ward Transfer';

export type MovementStatus = 'Scheduled' | 'In Transit' | 'Completed' | 'Pending Approval';

export type ClearanceStepStatus = 'Cleared' | 'Pending' | 'Under Review' | 'Blocked';

export type PaymentValidation = 'Validated' | 'Pending' | 'Denied' | 'Self Pay';

export type CareAlertType = 'Fall Risk' | 'Infection Control' | 'Diet Order';
