export type AdministrationWorkspaceTab = 'governance' | 'organization' | 'compliance';

export type AdministrationModalType =
  | 'create-user'
  | 'incident-report'
  | 'process-approval'
  | 'publish-policy'
  | 'register-visitor'
  | 'emergency-protocol'
  | null;

export type GovernanceStatus = 'Active' | 'Approved' | 'Resolved' | 'In Progress' | 'Scheduled' | 'Pending' | 'Critical' | 'Open' | 'Expired';

export type ApprovalLifecycle = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export type IncidentStatus = 'Open' | 'Investigating' | 'Root Cause Identified' | 'Resolved';

export type AiAdminInsightStatus = 'Active' | 'Acknowledged' | 'Dismissed';

export type OrgTreeNodeId =
  | 'hospital-profile'
  | 'buildings-floors'
  | 'departments-map'
  | 'org-structure'
  | 'reporting-hierarchy'
  | 'employee-admin'
  | 'dept-working-hours'
  | 'dept-service-setup';

export const ADMINISTRATION_WORKSPACE_TABS: { id: AdministrationWorkspaceTab; label: string; description: string }[] = [
  { id: 'governance', label: 'Governance Cockpit & Operations', description: 'Admin KPIs · live monitoring · quick actions' },
  { id: 'organization', label: 'Organizational Structure, Access & Workforce', description: 'Hierarchy tree · RBAC · user profiles · shift rosters' },
  { id: 'compliance', label: 'Quality, Compliance, Incidents & AI Intelligence', description: 'Complaints · incidents · NABH · audits · AI forecasting' },
];

export type OrgTreeGroup = {
  id: string;
  label: string;
  children: { id: OrgTreeNodeId; label: string }[];
};

export const ORG_CONFIG_TREE: OrgTreeGroup[] = [
  {
    id: 'hospital',
    label: 'Hospital Profile',
    children: [
      { id: 'hospital-profile', label: 'Registration & Legal Profile' },
      { id: 'buildings-floors', label: 'Buildings & Floors Mapping' },
      { id: 'departments-map', label: 'Departments & Units Map' },
    ],
  },
  {
    id: 'structure',
    label: 'Organization Structure',
    children: [
      { id: 'org-structure', label: 'Corporate Hierarchy' },
      { id: 'reporting-hierarchy', label: 'Reporting Lines & Escalation' },
    ],
  },
  {
    id: 'workforce',
    label: 'Employee Administration',
    children: [{ id: 'employee-admin', label: 'Employee Records & Onboarding' }],
  },
  {
    id: 'dept-ops',
    label: 'Departmental Parameters',
    children: [
      { id: 'dept-working-hours', label: 'Working Hours & Shift Templates' },
      { id: 'dept-service-setup', label: 'Service Setup & OPD Slots' },
    ],
  },
];

export const DEFAULT_ORG_NODE: OrgTreeNodeId = 'hospital-profile';

export function advanceApprovalLifecycle(current: ApprovalLifecycle): ApprovalLifecycle {
  const flow: ApprovalLifecycle[] = ['Pending', 'Under Review', 'Approved'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}

export function advanceIncidentStatus(current: IncidentStatus): IncidentStatus {
  const flow: IncidentStatus[] = ['Open', 'Investigating', 'Root Cause Identified', 'Resolved'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}
