export type {
  AmbulanceTelemetry,
  CriticalAlertBanner,
  DietTag,
  EmergencyTriageEntry,
  InstrumentChecklistItem,
  IpdWardAssignment,
  IpdWardBed,
  MarAdministrationLog,
  MarPrescriptionLine,
  MarTimeSlot,
  OtScheduleSlot,
  OtSlotStatus,
  TriageUrgency,
  WardBedOccupancy,
} from './types';

export {
  DIET_TAG_STYLES,
  OT_STATUS_STYLES,
  TRIAGE_URGENCY_STYLES,
} from './types';

export {
  DEFAULT_INSTRUMENT_CHECKLIST,
  OT_THEATERS,
  SEED_AMBULANCE_TELEMETRY,
  SEED_CRITICAL_ALERTS,
  SEED_MAR_LINES,
  SEED_OT_SLOTS,
  SEED_TRIAGE_QUEUE,
  SEED_WARD_ASSIGNMENT,
  TIME_SLOTS,
  TRAUMA_BEDS,
  generateTriageId,
} from './seedPatientCare';
