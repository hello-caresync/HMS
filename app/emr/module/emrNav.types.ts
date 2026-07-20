export type EmrWorkspaceTab = 'command' | 'discovery' | 'compliance';

export type EmrModalType =
  | 'print-record'
  | 'download-audited'
  | 'share-record'
  | 'verify-documents'
  | 'patient-summary'
  | 'print-full'
  | 'export-summary'
  | null;

export const EMR_WORKSPACE_TABS: { id: EmrWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'EMR Command Center & Timeline', description: 'Census · chronological journey · quick actions' },
  { id: 'discovery', label: 'Audited Clinical Discovery Vault', description: 'Historical folders · immutable record panels' },
  { id: 'compliance', label: 'Compliance & Security Audit Trails', description: 'Access logs · consent · NABH checkpoints · analytics' },
];

export type FolderCategory =
  | 'clinical-history'
  | 'medications'
  | 'laboratory'
  | 'radiology'
  | 'nursing'
  | 'clinical-documents';

export type AuditEventType = 'Access' | 'Modification' | 'Consent' | 'Export' | 'Compliance Check';

export type ComplianceStatus = 'Pass' | 'Pending' | 'Fail' | 'Review';

export type TimelineEventType =
  | 'Registration'
  | 'Consultation'
  | 'Laboratory'
  | 'Radiology'
  | 'Procedure'
  | 'Pharmacy'
  | 'Financial Clearance';

export type SignOffStatus = 'Signed' | 'Pending Sign-off' | 'Not Applicable';
