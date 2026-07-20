export type OtWorkspaceTab = 'command' | 'resources' | 'postop';

export type OtModalType =
  | 'schedule-surgery'
  | 'assign-room'
  | 'assign-team'
  | 'verify-checklist'
  | 'request-blood'
  | 'print-schedule'
  | null;

export const OT_WORKSPACE_TABS: { id: OtWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'Surgical Command & Live Timeline', description: 'Census · workflow board · quick actions' },
  { id: 'resources', label: 'Resource Allocation & Prep', description: 'OT rooms · teams · pre-op checklist · equipment' },
  { id: 'postop', label: 'Post-Op Routing & Analytics', description: 'Recovery · transfers · billing · utilization' },
];

export type TimelineStep =
  | 'Preparation'
  | 'Patient Shifted'
  | 'Anesthesia Started'
  | 'In Progress'
  | 'Recovery Transfer'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled';

export type OtRoomStatus = 'Occupied' | 'Available' | 'Cleaning' | 'Sterilization' | 'Maintenance';

export type AnesthesiaClearance = 'Cleared' | 'Pending' | 'In Review';

export type ChecklistStatus = 'Verified' | 'Pending' | 'Not Applicable';

export type EquipmentStatus = 'Ready' | 'In Use' | 'Sterilizing' | 'Maintenance';

export type PostOpStepStatus = 'Pending' | 'In Progress' | 'Completed';

export const TIMELINE_FLOW: TimelineStep[] = [
  'Preparation',
  'Patient Shifted',
  'Anesthesia Started',
  'In Progress',
  'Recovery Transfer',
  'Completed',
];

export function advanceTimelineStep(current: TimelineStep): TimelineStep {
  if (current === 'Delayed' || current === 'Cancelled' || current === 'Completed') return current;
  const idx = TIMELINE_FLOW.indexOf(current);
  if (idx === -1 || idx === TIMELINE_FLOW.length - 1) return current;
  return TIMELINE_FLOW[idx + 1];
}
