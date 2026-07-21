/** String literals matching prisma/schema.prisma — no @prisma/client import in edge bundles */

export const AppointmentType = {
  OPD: 'OPD',
  TELEMEDICINE: 'TELEMEDICINE',
  FOLLOWUP: 'FOLLOWUP',
} as const;

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CHECKED_IN: 'CHECKED_IN',
  IN_CONSULT: 'IN_CONSULT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const EncounterStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const LabUrgency = {
  NORMAL: 'NORMAL',
  STAT: 'STAT',
} as const;

export const ClinicalOrderStatus = {
  ORDERED: 'ORDERED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  SENT_TO_PHARMACY: 'SENT_TO_PHARMACY',
} as const;

export const DocumentType = {
  PROGRESS_NOTE: 'PROGRESS_NOTE',
  DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
  REFERRAL_LETTER: 'REFERRAL_LETTER',
  MEDICAL_CERTIFICATE: 'MEDICAL_CERTIFICATE',
  FITNESS_CERTIFICATE: 'FITNESS_CERTIFICATE',
  SICK_LEAVE: 'SICK_LEAVE',
} as const;

export const DischargeStatus = {
  ADMITTED: 'ADMITTED',
  DISCHARGE_PLANNED: 'DISCHARGE_PLANNED',
  DISCHARGED: 'DISCHARGED',
} as const;
