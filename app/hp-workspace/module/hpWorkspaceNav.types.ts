export type HpWorkspaceTab = 'cockpit' | 'clinical' | 'enterprise';

export type HpRolePersona = 'Admin' | 'Doctor' | 'Nurse' | 'Staff' | 'Finance' | 'Procurement';

export type HpModalType =
  | 'register-patient'
  | 'create-appointment'
  | 'admit-patient'
  | 'generate-bill'
  | 'create-purchase-request'
  | 'approve-request'
  | null;

export type TaskPriority = 'Emergency' | 'High' | 'Normal';

export type TaskStatus = 'Pending' | 'In Progress' | 'Verified' | 'Completed';

export type ApprovalType = 'Purchase Approval' | 'Leave Request' | 'Discount Adjustment' | 'Insurance Pre-Auth';

export type ApprovalStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export type AiInsightStatus = 'Active' | 'Acknowledged' | 'Dismissed';

export type CommSubTab = 'chat' | 'documents' | 'meetings';

export const HP_WORKSPACE_TABS: { id: HpWorkspaceTab; label: string; description: string }[] = [
  { id: 'cockpit', label: 'My Cockpit & Collaboration', description: 'Activity feed · tasks · communication · quick actions' },
  { id: 'clinical', label: 'Clinical & Departmental Suites', description: 'Patient workspace · EMR · capacity · beds · shifts · equipment' },
  { id: 'enterprise', label: 'Clearance, Compliance & AI Insights', description: 'Approvals · shift governance · AI assistant · audit trails' },
];

export const TASK_STATUS_FLOW: TaskStatus[] = ['Pending', 'In Progress', 'Verified', 'Completed'];

export function advanceTaskStatus(current: TaskStatus): TaskStatus {
  const idx = TASK_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === TASK_STATUS_FLOW.length - 1) return current;
  return TASK_STATUS_FLOW[idx + 1];
}

export const APPROVAL_STATUS_FLOW: ApprovalStatus[] = ['Pending', 'Under Review', 'Approved'];

export function advanceApprovalStatus(current: ApprovalStatus): ApprovalStatus {
  if (current === 'Approved' || current === 'Rejected') return current;
  const idx = APPROVAL_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === APPROVAL_STATUS_FLOW.length - 1) return 'Approved';
  return APPROVAL_STATUS_FLOW[idx + 1];
}

export const ROLE_PERSONAS: HpRolePersona[] = ['Admin', 'Doctor', 'Nurse', 'Staff', 'Finance', 'Procurement'];
