export type LaboratoryWorkspaceTab = 'command' | 'processing' | 'verification';

export type LaboratoryModalType =
  | 'collect-sample'
  | 'print-barcode'
  | 'assign-test'
  | 'verify-result'
  | 'release-report'
  | 'report-critical'
  | null;

export const LABORATORY_WORKSPACE_TABS: { id: LaboratoryWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'Command Center & Collection Queue', description: 'Census · intake · sample flow · quick actions' },
  { id: 'processing', label: 'Processing, Automation & QC', description: 'Analyzers · transport · calibration · IQC' },
  { id: 'verification', label: 'Verification, Reagents & Billing', description: 'Path review · critical values · inventory · billing' },
];

export type TestPriority = 'Routine' | 'STAT Emergency';

export type BarcodeStatus = 'Pending' | 'Printed' | 'Scanned';

export type CollectionStatus = 'Pending Collection' | 'Collected' | 'Recollection Requested';

export type SamplePipelineStatus =
  | 'Pending Collection'
  | 'Collected'
  | 'In Transit'
  | 'In Process'
  | 'Completed'
  | 'Report Released'
  | 'Delayed';

export type VerificationStage = 'Pending Tech' | 'Tech Verified' | 'Pathologist Review' | 'Released';

export type EquipmentStatus = 'Online' | 'Maintenance' | 'Offline' | 'Calibrating';

export type QcStatus = 'Pass' | 'Fail' | 'Review';

export const SAMPLE_FLOW: SamplePipelineStatus[] = [
  'Pending Collection',
  'Collected',
  'In Transit',
  'In Process',
  'Completed',
  'Report Released',
];

export function advanceSampleStatus(current: SamplePipelineStatus): SamplePipelineStatus {
  if (current === 'Delayed' || current === 'Report Released') return current;
  const idx = SAMPLE_FLOW.indexOf(current);
  if (idx === -1 || idx === SAMPLE_FLOW.length - 1) return current;
  return SAMPLE_FLOW[idx + 1];
}
