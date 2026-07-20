export type SettingsWorkspaceTab = 'control' | 'workflow' | 'integrations';

export type SettingsModalType =
  | 'create-user'
  | 'configure-role'
  | 'add-department'
  | 'setup-integration'
  | 'manage-notifications'
  | 'backup-system'
  | null;

export type SettingsStatus =
  | 'Active'
  | 'Operational'
  | 'Healthy'
  | 'Interfaced'
  | 'FHIR Synced'
  | 'Pending'
  | 'Security Alert'
  | 'Error'
  | 'License Expired'
  | 'Disabled';

export type UserAccountType = 'Doctor' | 'Nurse' | 'Finance' | 'Admin' | 'Pharmacist';

export type RegistryTreeNodeId =
  | 'hospital-general'
  | 'branch-credentials'
  | 'localization'
  | 'module-opd'
  | 'module-ipd'
  | 'module-emergency'
  | 'module-ot'
  | 'module-emr'
  | 'appointment-slots'
  | 'billing-tax'
  | 'pharmacy-lab-radiology'
  | 'scm-triggers'
  | 'workflow-approvals';

export type IntegrationLogId =
  | 'hl7-adt'
  | 'fhir-patient'
  | 'pacs-dicom'
  | 'lis-lab'
  | 'payment-gateway'
  | 'sms-webhook';

export const SETTINGS_WORKSPACE_TABS: { id: SettingsWorkspaceTab; label: string; description: string }[] = [
  { id: 'control', label: 'ERP Control Dashboard & Access Management', description: 'System health · user provisioning · RBAC · quick actions' },
  { id: 'workflow', label: 'Functional Sub-Module Architecture & Workflow Builder', description: 'Master registries · module toggles · process customizer · approval rules' },
  { id: 'integrations', label: 'Healthcare Integrations, Security & Compliance', description: 'HL7 · FHIR · PACS · LIS · security · AI · audit logs' },
];

export type RegistryTreeGroup = {
  id: string;
  label: string;
  children: { id: RegistryTreeNodeId; label: string }[];
};

export const REGISTRY_CONFIG_TREE: RegistryTreeGroup[] = [
  {
    id: 'hospital',
    label: 'Hospital General Parameters',
    children: [
      { id: 'hospital-general', label: 'Institutional Profile & Branding' },
      { id: 'branch-credentials', label: 'Multi-Branch Credentials' },
      { id: 'localization', label: 'Localization — INR · DD-MM-YYYY' },
    ],
  },
  {
    id: 'modules',
    label: 'Module Feature Toggles',
    children: [
      { id: 'module-opd', label: 'OPD Module Configuration' },
      { id: 'module-ipd', label: 'IPD Module Configuration' },
      { id: 'module-emergency', label: 'Emergency Module Configuration' },
      { id: 'module-ot', label: 'OT Coordination Configuration' },
      { id: 'module-emr', label: 'EMR Module Configuration' },
    ],
  },
  {
    id: 'process',
    label: 'Process Customizer Profiles',
    children: [
      { id: 'appointment-slots', label: 'Appointment Slot Limits' },
      { id: 'billing-tax', label: 'Billing & Tax Rules (GST/CGST)' },
      { id: 'pharmacy-lab-radiology', label: 'Pharmacy · Lab · Radiology Criteria' },
      { id: 'scm-triggers', label: 'SCM Automated Tracking Triggers' },
      { id: 'workflow-approvals', label: 'Workflow & Approval Rules' },
    ],
  },
];

export const DEFAULT_REGISTRY_NODE: RegistryTreeNodeId = 'hospital-general';

export function toggleUserStatus(current: SettingsStatus): SettingsStatus {
  return current === 'Active' ? 'Disabled' : 'Active';
}
