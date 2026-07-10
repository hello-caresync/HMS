export type WardId = 'icu' | 'ccu' | 'general-ward' | 'private-suite';

export type FloorId = 'floor-1' | 'floor-2' | 'floor-3';

export type BedStatus = 'Available' | 'Occupied' | 'Housekeeping';

export type AdmissionStatus = 'Active' | 'Discharge Pending' | 'Discharged';

export interface Ward {
  id: WardId;
  name: string;
  floorId: FloorId;
  floorLabel: string;
  dailyRate: number;
  roomTypeLabel: string;
}

export interface Floor {
  id: FloorId;
  label: string;
  shortLabel: string;
}

export interface DischargeSummary {
  reasonForAdmission: string;
  courseInHospital: string;
  finalDiagnosis: string;
  operativeFindings: string;
  dischargeCondition: string;
  followUpInstructions: string;
  finalizedAt?: string;
}

export interface ProgressNote {
  id: string;
  timestamp: string;
  author: string;
  note: string;
}

export interface CarePlan {
  id: string;
  title: string;
  status: 'Active' | 'Completed';
  details: string;
}

export interface DietOrder {
  id: string;
  order: string;
  restrictions?: string;
  status: 'Active' | 'Discontinued';
}

export interface MarScheduleSlot {
  time: string;
  administered: boolean;
  administeredAt?: string;
  administeredBy?: string;
}

export interface MarEntry {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  schedules: MarScheduleSlot[];
}

export interface ClinicalChart {
  progressNotes: ProgressNote[];
  carePlans: CarePlan[];
  dietOrders: DietOrder[];
  marEntries: MarEntry[];
}

export interface BillingClearancePayload {
  ledgerId: string;
  roomTariffTotal: number;
  pharmacyCharges: number;
  totalOutstanding: number;
  lockedAt: string;
}

export interface IPDAdmission {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  admittingDoctor: string;
  admittedAt: string;
  status: AdmissionStatus;
  dischargeSummary?: DischargeSummary;
  clinical: ClinicalChart;
  recordLocked: boolean;
  billingClearanceSent: boolean;
  billingClearanceAt?: string;
  billingPayload?: BillingClearancePayload;
  currentDailyRate: number;
  rateHistory: RateSegment[];
}

export interface RateSegment {
  wardId: WardId;
  wardName: string;
  dailyRate: number;
  from: string;
  to?: string;
}

export interface IPDBed {
  id: string;
  wardId: WardId;
  bedLabel: string;
  status: BedStatus;
  admissionId?: string;
}

export interface BedTransferPayload {
  fromBedId: string;
  toBedId: string;
  transferTimestamp: string;
}

export interface IPDToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'alert';
}

export const FLOORS: Floor[] = [
  { id: 'floor-1', label: '1st Floor', shortLabel: '1st' },
  { id: 'floor-2', label: '2nd Floor', shortLabel: '2nd' },
  { id: 'floor-3', label: '3rd Floor', shortLabel: '3rd' },
];

export function getPatientInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function generateAdmissionId(): string {
  return `adm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function emptyDischargeSummary(): DischargeSummary {
  return {
    reasonForAdmission: '',
    courseInHospital: '',
    finalDiagnosis: '',
    operativeFindings: '',
    dischargeCondition: '',
    followUpInstructions: '',
  };
}

export function getWardRate(wards: Ward[], wardId: WardId): number {
  return wards.find((w) => w.id === wardId)?.dailyRate ?? 0;
}

export function computeRoomTariff(admission: IPDAdmission): number {
  const admitted = new Date(admission.admittedAt).getTime();
  const end = admission.billingClearanceAt
    ? new Date(admission.billingClearanceAt).getTime()
    : Date.now();
  const days = Math.max(1, Math.ceil((end - admitted) / (24 * 60 * 60 * 1000)));
  return days * admission.currentDailyRate;
}
