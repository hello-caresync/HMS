/** Phase 2 — Front Office workflow types */

export type Gender = 'Male' | 'Female' | 'Other';

export type IdentityDocType =
  | 'none'
  | 'national_id'
  | 'passport'
  | 'aadhaar'
  | 'driving_license';

export interface PatientRegistrationDraft {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  insuranceProvider: string;
  emergencyContact: string;
  identityDocType: IdentityDocType;
  identityDocValue: string;
}

export interface RegistrationSuccessPayload {
  /** Format: NX-2026-XXXXXX */
  uhid: string;
  registeredAt: string;
  patientName: string;
}

export type QueueTokenStatus =
  | 'Waiting'
  | 'In Consultation'
  | 'Rescheduled'
  | 'Cancelled';

export interface QueueTokenEntry {
  id: string;
  tokenId: string;
  patientInitials: string;
  department: string;
  doctor: string;
  waitingMinutes: number;
  status: QueueTokenStatus;
  bookedAt: string;
}

export interface DepartmentOption {
  code: string;
  label: string;
}

export interface DoctorAvailabilityOption {
  id: string;
  name: string;
  departmentCode: string;
  slotLabel: string;
  available: boolean;
}

export type WardTypeOption = 'General Bed' | 'ICU Chamber' | 'Private Suite';

export type BedOccupancyState = 'vacant' | 'occupied' | 'maintenance';

export interface SimulatedBedCell {
  bedId: string;
  label: string;
  wardType: WardTypeOption;
  state: BedOccupancyState;
  patientInitials?: string;
  uhid?: string;
}

export interface AdmissionPackageOption {
  id: string;
  label: string;
  baseRate: number;
}

export interface AdmissionAllocationDraft {
  wardType: WardTypeOption;
  packageId: string;
  depositAmount: number;
}

export interface BedAllocationSelection {
  bed: SimulatedBedCell;
  draft: AdmissionAllocationDraft;
}

export const IDENTITY_DOC_LABELS: Record<IdentityDocType, string> = {
  none: 'No ID Verification',
  national_id: 'National ID Card',
  passport: 'Passport',
  aadhaar: 'Aadhaar (UIDAI)',
  driving_license: 'Driving License',
};

export const WARD_TYPE_OPTIONS: WardTypeOption[] = [
  'General Bed',
  'ICU Chamber',
  'Private Suite',
];
