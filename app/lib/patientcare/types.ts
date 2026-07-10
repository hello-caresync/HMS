/** Phase 4 — Patient Care Operations types (Modules 11–13) */

export type DietTag =
  | 'NPO / Nil Per Os'
  | 'Low Sodium'
  | 'Diabetic'
  | 'Regular'
  | 'Soft Diet';

export type WardBedOccupancy = 'vacant' | 'occupied';

export interface IpdWardBed {
  bedId: string;
  label: string;
  occupancy: WardBedOccupancy;
  patientName?: string;
  patientUhid?: string;
  dietTag?: DietTag;
}

export interface IpdWardAssignment {
  wardId: string;
  wardName: string;
  floorLabel: string;
  beds: IpdWardBed[];
}

export type MarTimeSlot = 'Morning' | 'Afternoon' | 'Night';

export interface MarAdministrationLog {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface MarPrescriptionLine {
  id: string;
  bedId: string;
  drugName: string;
  dosage: string;
  route: string;
  logs: MarAdministrationLog;
}

export type TriageUrgency =
  | 'Critical / Resuscitation'
  | 'Urgent'
  | 'Non-Urgent';

export interface EmergencyTriageEntry {
  triageId: string;
  patientIdentifier: string;
  chiefComplaint: string;
  urgency: TriageUrgency;
  registeredAt: string;
  traumaBedAssigned: string | null;
}

export interface AmbulanceTelemetry {
  id: string;
  unitId: string;
  etaMinutes: number;
  patientCount: number;
  status: 'En Route' | 'Arrived' | 'Offloading';
  lastUpdate: string;
}

export interface CriticalAlertBanner {
  id: string;
  message: string;
  severity: 'critical' | 'warning';
  triggeredAt: string;
}

export type OtSlotStatus =
  | 'Scheduled'
  | 'Pre-Op Checklist Pending'
  | 'In Surgery'
  | 'Post-Op Recovery';

export interface OtScheduleSlot {
  slotId: string;
  theaterId: string;
  theaterName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  patientName: string;
  leadSurgeon: string;
  procedureType: string;
  status: OtSlotStatus;
}

export interface InstrumentChecklistItem {
  itemId: string;
  instrumentName: string;
  sterilizationBatch: string;
  verified: boolean;
}

export const TRIAGE_URGENCY_STYLES: Record<TriageUrgency, string> = {
  'Critical / Resuscitation': 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
  Urgent: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Non-Urgent': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
};

export const OT_STATUS_STYLES: Record<OtSlotStatus, string> = {
  Scheduled: 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  'Pre-Op Checklist Pending': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'In Surgery': 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold',
  'Post-Op Recovery': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
};

export const DIET_TAG_STYLES: Record<DietTag, string> = {
  'NPO / Nil Per Os': 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
  'Low Sodium': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  Diabetic: 'bg-violet-100 text-violet-950 border border-violet-400 font-bold',
  Regular: 'bg-slate-100 text-slate-950 border border-slate-400 font-bold',
  'Soft Diet': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
};
