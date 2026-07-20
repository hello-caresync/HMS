export type MasterDataWorkspaceTab = 'foundation' | 'registries' | 'audit';

export type MasterDataModalType =
  | 'new-master-record'
  | 'duplicate-scan'
  | 'audit-logs'
  | 'assign-permissions'
  | 'update-charge-master'
  | 'sync-submodules'
  | 'auto-merger'
  | null;

export type MasterRecordStatus = 'Active' | 'Inactive' | 'Pending' | 'Duplicate' | 'Mapped' | 'Synchronized';

export type ApprovalWorkflowStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export type AiMdmInsightStatus = 'Active' | 'Merged' | 'Dismissed';

export type RegistryTreeNodeId =
  | 'doctor-master'
  | 'employee-master'
  | 'user-roles'
  | 'patient-config'
  | 'diagnosis-templates'
  | 'service-charge'
  | 'room-bed'
  | 'pharmacy-master'
  | 'lab-master'
  | 'radiology-master'
  | 'inventory-master'
  | 'vendor-master'
  | 'insurance-tpa';

export const MASTER_DATA_WORKSPACE_TABS: { id: MasterDataWorkspaceTab; label: string; description: string }[] = [
  { id: 'foundation', label: 'Data Quality Dashboard & Hierarchy Setup', description: 'MDM KPIs · org structure · numbering · quick actions' },
  { id: 'registries', label: 'Module Registries & Mapping Matrix', description: 'Clinical/support masters · charges · rooms · ancillary · SCM' },
  { id: 'audit', label: 'Audits, Data Quality & AI Intelligence', description: 'Workflow approvals · audit ledger · duplicate detection · auto-merge' },
];

export type RegistryTreeGroup = {
  id: string;
  label: string;
  cluster: 'Clinical' | 'Support' | 'Ancillary' | 'SCM';
  children: { id: RegistryTreeNodeId; label: string }[];
};

export const REGISTRY_TREE: RegistryTreeGroup[] = [
  {
    id: 'clinical',
    label: 'Clinical Masters',
    cluster: 'Clinical',
    children: [
      { id: 'doctor-master', label: 'Doctor Master & Consultation Charges' },
      { id: 'diagnosis-templates', label: 'Diagnosis / ICD Templates' },
      { id: 'patient-config', label: 'Patient Registration Config' },
    ],
  },
  {
    id: 'support',
    label: 'Support & Access',
    cluster: 'Support',
    children: [
      { id: 'employee-master', label: 'Employee Master & Shift Roles' },
      { id: 'user-roles', label: 'User Role & Permission Maps' },
    ],
  },
  {
    id: 'ancillary',
    label: 'Ancillary Services',
    cluster: 'Ancillary',
    children: [
      { id: 'service-charge', label: 'Service & Charge Master' },
      { id: 'room-bed', label: 'Room & Bed Master' },
      { id: 'pharmacy-master', label: 'Pharmacy / Dosage Index' },
      { id: 'lab-master', label: 'Laboratory / Sample Types & Ranges' },
      { id: 'radiology-master', label: 'Radiology Modality Master' },
    ],
  },
  {
    id: 'scm',
    label: 'SCM & Finance Reference',
    cluster: 'SCM',
    children: [
      { id: 'inventory-master', label: 'Inventory Item Master' },
      { id: 'vendor-master', label: 'Procurement / Vendor Master' },
      { id: 'insurance-tpa', label: 'Insurance / TPA Policy Master' },
    ],
  },
];

export const DEFAULT_REGISTRY_NODE: RegistryTreeNodeId = 'service-charge';

export function advanceApprovalStatus(current: ApprovalWorkflowStatus): ApprovalWorkflowStatus {
  const flow: ApprovalWorkflowStatus[] = ['Pending', 'Under Review', 'Approved'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}

export function advanceRecordStatus(current: MasterRecordStatus): MasterRecordStatus {
  if (current === 'Pending') return 'Active';
  if (current === 'Duplicate') return 'Mapped';
  return current;
}
