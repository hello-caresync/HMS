export type OpdWorkspaceTab = 'console' | 'clinical' | 'accounting';

export type OpdModalType =
  | 'check-in'
  | 'generate-token'
  | 'assign-doctor'
  | 'refer-patient'
  | 'recommend-admission'
  | 'print-slip'
  | null;

export const OPD_WORKSPACE_TABS: { id: OpdWorkspaceTab; label: string; description: string }[] = [
  { id: 'console', label: 'Operational Console & Queue', description: 'Census · live token stream · queue controls · quick actions' },
  { id: 'clinical', label: 'Clinical Workflow & Orders', description: 'Lab · radiology · pharmacy · procedures · referrals' },
  { id: 'accounting', label: 'Accounting, Timeline & Analytics', description: 'Billing · follow-up · doctor reports · wait analysis' },
];

export type QueueStatus = 'Waiting for Consultation' | 'Consultation in Progress' | 'Consultation Completed' | 'No-show';

export type PriorityTier = 'General' | 'VIP' | 'Emergency Queue';

export type LabRadStatus = 'Ordered' | 'Sample Collected' | 'In Progress' | 'Report Ready' | 'Dispatched';

export type PrescriptionStatus = 'Generated' | 'Sent to Pharmacy' | 'Partially Dispensed' | 'Fully Dispensed';

export type PaymentStatus = 'Paid' | 'Partial' | 'Outstanding' | 'Waived';
