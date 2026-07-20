export type StaffWorkspaceTab = 'operations' | 'directory' | 'privileges';

export type StaffModalType = 'add-employee' | 'assign-shift' | 'approve-leave' | 'reset-password' | 'generate-id' | null;

export const STAFF_WORKSPACE_TABS: { id: StaffWorkspaceTab; label: string; description: string }[] = [
  { id: 'operations', label: 'Workforce Operations & Roster', description: 'Census · shifts · attendance · quick actions' },
  { id: 'directory', label: 'Central Profile Vault', description: 'Org filters · employee profiles · compliance' },
  { id: 'privileges', label: 'System Privileges & Enterprise', description: 'RBAC matrix · payroll integration' },
];

export type EmployeeStatus = 'Active' | 'On Duty' | 'Off Duty' | 'On Leave';

export type SystemRole = 'Admin' | 'HR' | 'Dept Head' | 'IT' | 'Employee Self-Service';
