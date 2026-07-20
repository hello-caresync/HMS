export type EmergencyWorkspaceTab = 'command' | 'logistics' | 'disposition';

export type EmergencyModalType =
  | 'register-patient'
  | 'start-triage'
  | 'assign-doctor'
  | 'allocate-er-bed'
  | 'dispatch-ambulance'
  | 'activate-code-blue'
  | null;

export const EMERGENCY_WORKSPACE_TABS: { id: EmergencyWorkspaceTab; label: string; description: string }[] = [
  { id: 'command', label: 'ER Command Center & Triage', description: 'Census · live triage · ER beds · quick actions' },
  { id: 'logistics', label: 'Logistics & Care Coordination', description: 'Urgent orders · procedures · ambulance fleet' },
  { id: 'disposition', label: 'Disposition, Compliance & Codes', description: 'MLC ledger · transfers · billing · analytics' },
];

export type TriagePriority = 'Critical' | 'Emergent' | 'Urgent' | 'Non-Urgent';

export type TriageColor = 'red' | 'orange' | 'yellow' | 'green';

export type ErBedStatus = 'Occupied' | 'Available' | 'Reserved' | 'Cleaning';

export type TreatmentStatus = 'Waiting' | 'Under Treatment' | 'Observation' | 'Discharged';

export type InvestigationStatus = 'Ordered' | 'Sample Collected' | 'In Progress' | 'Report Ready';

export type ProcedureStatus = 'Not Started' | 'In Progress' | 'Completed';

export type AmbulanceStatus = 'Available' | 'Dispatched' | 'En Route' | 'At Scene' | 'Returning' | 'Maintenance';

export type MlcStatus = 'Open' | 'Police Notified' | 'Documentation Complete' | 'Closed';

export type TransferDisposition = 'Admit to IPD' | 'Transfer to ICU' | 'Transfer to OT' | 'Discharge' | 'Refer External';

export type CodeBlueStatus = 'Active' | 'Standby' | 'Resolved';

export const TRIAGE_PRIORITY_ORDER: TriagePriority[] = ['Critical', 'Emergent', 'Urgent', 'Non-Urgent'];

export function triageToColor(priority: TriagePriority): TriageColor {
  const map: Record<TriagePriority, TriageColor> = {
    Critical: 'red',
    Emergent: 'orange',
    Urgent: 'yellow',
    'Non-Urgent': 'green',
  };
  return map[priority];
}

export function bumpTriagePriority(current: TriagePriority): TriagePriority {
  const idx = TRIAGE_PRIORITY_ORDER.indexOf(current);
  if (idx <= 0) return current;
  return TRIAGE_PRIORITY_ORDER[idx - 1];
}
