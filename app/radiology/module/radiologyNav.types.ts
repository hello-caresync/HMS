export type RadiologyWorkspaceTab = 'command' | 'pacs' | 'verification';

export type RadiologyModalType =
  | 'schedule-scan'
  | 'check-in'
  | 'assign-tech'
  | 'upload-images'
  | 'verify-report'
  | 'release-report'
  | null;

export const RADIOLOGY_WORKSPACE_TABS: { id: RadiologyWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'Command Center & Scan Queue', description: 'RIS census · modality intake · scan flow · quick actions' },
  { id: 'pacs', label: 'PACS Simulation & Patient Safety', description: 'Image viewer · DICOM metadata · safety screening · dose tracking' },
  { id: 'verification', label: 'Report Verification & Equipment', description: 'Radiologist sign-off · analytics · machinery · contrast inventory' },
];

export type ScanPriority = 'Routine' | 'STAT Emergency';

export type Modality = 'CT' | 'MRI' | 'X-Ray' | 'Ultrasound';

export type ScanPipelineStatus =
  | 'Scheduled'
  | 'Waiting'
  | 'Scan In Progress'
  | 'Completed'
  | 'Pending Report'
  | 'Report Released';

export type PatientReadiness = 'Not Ready' | 'Checked In' | 'Prepared' | 'In Scanner';

export type EquipmentStatus = 'Online' | 'Maintenance' | 'Offline' | 'Calibrating';

export type ReportStage = 'Draft' | 'Tech Review' | 'Radiologist Verified' | 'Released';

export const SCAN_FLOW: ScanPipelineStatus[] = [
  'Scheduled',
  'Waiting',
  'Scan In Progress',
  'Completed',
  'Pending Report',
  'Report Released',
];

export function advanceScanStatus(current: ScanPipelineStatus): ScanPipelineStatus {
  if (current === 'Report Released') return current;
  const idx = SCAN_FLOW.indexOf(current);
  if (idx === -1 || idx === SCAN_FLOW.length - 1) return current;
  return SCAN_FLOW[idx + 1];
}

export function advanceReportStage(current: ReportStage): ReportStage {
  const flow: ReportStage[] = ['Draft', 'Tech Review', 'Radiologist Verified', 'Released'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}
