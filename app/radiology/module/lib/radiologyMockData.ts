import type {
  EquipmentStatus,
  Modality,
  PatientReadiness,
  ReportStage,
  ScanPipelineStatus,
  ScanPriority,
} from '../radiologyNav.types';
import { advanceReportStage, advanceScanStatus } from '../radiologyNav.types';

export type ImagingOrder = {
  id: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  studyDescription: string;
  modality: Modality;
  priority: ScanPriority;
  machineAllocation: string;
  readiness: PatientReadiness;
  pipelineStatus: ScanPipelineStatus;
  orderedBy: string;
  scheduledAt: string;
  criticalFinding: boolean;
  identityVerified: boolean;
};

export type DicomSeries = {
  id: string;
  seriesNumber: string;
  description: string;
  modality: Modality;
  sliceCount: number;
  acquisitionTime: string;
};

export type SafetyChecklist = {
  id: string;
  patientName: string;
  uhid: string;
  pregnancyScreening: 'Cleared' | 'Pending' | 'Positive — Contraindicated';
  contrastAllergy: 'No Known Allergy' | 'Premedicated' | 'Allergy Documented';
  fastingStatus: 'NPO Verified' | 'Not Required' | 'Pending Verification';
  identityVerified: boolean;
};

export type RadiationDoseLog = {
  id: string;
  patientName: string;
  study: string;
  modality: Modality;
  ctdiVol: string;
  dlp: string;
  effectiveDose: string;
  timestamp: string;
};

export type ReportRecord = {
  id: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: Modality;
  impression: string;
  stage: ReportStage;
  critical: boolean;
  techSignature?: string;
  radiologistSignature?: string;
};

export type ImagingEquipment = {
  id: string;
  name: string;
  modality: Modality;
  room: string;
  status: EquipmentStatus;
  nextCalibration: string;
  lastMaintenance: string;
  utilizationPct: number;
};

export type ContrastInventory = {
  id: string;
  agentName: string;
  concentration: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  lowStock: boolean;
};

export const RIS_CENSUS = {
  todayImagingOrders: 187,
  scheduledScans: 42,
  waitingPatients: 11,
  ongoingScans: 6,
  completedScans: 128,
  pendingReports: 23,
  criticalFindings: 3,
  equipmentOnline: 8,
};

export const INITIAL_IMAGING_ORDERS: ImagingOrder[] = [
  {
    id: 'io1',
    orderNumber: 'RAD-2026-5521',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    studyDescription: 'CT Chest with Contrast — Pulmonary Embolism Protocol',
    modality: 'CT',
    priority: 'STAT Emergency',
    machineAllocation: 'Siemens SOMATOM go.Top — CT-2',
    readiness: 'In Scanner',
    pipelineStatus: 'Scan In Progress',
    orderedBy: 'Dr. B. Joseph — ER',
    scheduledAt: '2026-07-18T11:30:00',
    criticalFinding: false,
    identityVerified: true,
  },
  {
    id: 'io2',
    orderNumber: 'RAD-2026-5522',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    studyDescription: 'MRI Brain — Stroke Protocol (DWI/ADC)',
    modality: 'MRI',
    priority: 'STAT Emergency',
    machineAllocation: 'Philips Ingenia 1.5T — MR-1',
    readiness: 'Prepared',
    pipelineStatus: 'Waiting',
    orderedBy: 'Dr. Anita Roy — Neurology',
    scheduledAt: '2026-07-18T11:45:00',
    criticalFinding: true,
    identityVerified: true,
  },
  {
    id: 'io3',
    orderNumber: 'RAD-2026-5518',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    studyDescription: 'Chest X-Ray PA & Lateral',
    modality: 'X-Ray',
    priority: 'Routine',
    machineAllocation: 'Carestream DRX-Evolution — XR-3',
    readiness: 'Checked In',
    pipelineStatus: 'Scheduled',
    orderedBy: 'Dr. Kapoor — OPD',
    scheduledAt: '2026-07-18T12:00:00',
    criticalFinding: false,
    identityVerified: true,
  },
  {
    id: 'io4',
    orderNumber: 'RAD-2026-5515',
    patientName: 'Priya Patel',
    uhid: 'NX-2026-000413',
    studyDescription: 'Ultrasound Abdomen — RUQ Pain',
    modality: 'Ultrasound',
    priority: 'Routine',
    machineAllocation: 'GE Logiq E10 — US-2',
    readiness: 'Prepared',
    pipelineStatus: 'Completed',
    orderedBy: 'Dr. Meera Iyer — Surgery',
    scheduledAt: '2026-07-18T10:15:00',
    criticalFinding: false,
    identityVerified: true,
  },
  {
    id: 'io5',
    orderNumber: 'RAD-2026-5510',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    studyDescription: 'CT Abdomen/Pelvis with IV Contrast',
    modality: 'CT',
    priority: 'Routine',
    machineAllocation: 'Siemens SOMATOM go.Top — CT-2',
    readiness: 'Checked In',
    pipelineStatus: 'Pending Report',
    orderedBy: 'Dr. Rajesh Kumar — GI',
    scheduledAt: '2026-07-18T09:30:00',
    criticalFinding: true,
    identityVerified: true,
  },
  {
    id: 'io6',
    orderNumber: 'RAD-2026-5508',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    studyDescription: 'MRI Lumbar Spine — Disc Herniation',
    modality: 'MRI',
    priority: 'Routine',
    machineAllocation: 'Philips Ingenia 1.5T — MR-1',
    readiness: 'Not Ready',
    pipelineStatus: 'Scheduled',
    orderedBy: 'Dr. Neha Gupta — Ortho',
    scheduledAt: '2026-07-18T14:00:00',
    criticalFinding: false,
    identityVerified: true,
  },
  {
    id: 'io7',
    orderNumber: 'RAD-2026-5502',
    patientName: 'Kavitha Nair',
    uhid: 'NX-2026-000401',
    studyDescription: 'Chest X-Ray Portable — ICU Bedside',
    modality: 'X-Ray',
    priority: 'STAT Emergency',
    machineAllocation: 'Mobile DR — XR-M1',
    readiness: 'In Scanner',
    pipelineStatus: 'Scan In Progress',
    orderedBy: 'Dr. Joseph — ICU',
    scheduledAt: '2026-07-18T11:20:00',
    criticalFinding: false,
    identityVerified: true,
  },
  {
    id: 'io8',
    orderNumber: 'RAD-2026-5499',
    patientName: 'Deepak Menon',
    uhid: 'NX-2026-000390',
    studyDescription: 'CT Head without Contrast',
    modality: 'CT',
    priority: 'Routine',
    machineAllocation: 'Siemens SOMATOM go.Top — CT-2',
    readiness: 'Prepared',
    pipelineStatus: 'Report Released',
    orderedBy: 'Dr. Sanjay Mehta — Neuro',
    scheduledAt: '2026-07-18T08:00:00',
    criticalFinding: false,
    identityVerified: true,
  },
];

export const MOCK_DICOM_SERIES: DicomSeries[] = [
  { id: 'ds1', seriesNumber: '001', description: 'Scout — AP/Lateral', modality: 'CT', sliceCount: 2, acquisitionTime: '2026-07-18 11:32' },
  { id: 'ds2', seriesNumber: '002', description: 'CT Pulmonary Angiography — 1.0mm', modality: 'CT', sliceCount: 412, acquisitionTime: '2026-07-18 11:34' },
  { id: 'ds3', seriesNumber: '003', description: 'Coronal MPR Reconstruction', modality: 'CT', sliceCount: 128, acquisitionTime: '2026-07-18 11:36' },
  { id: 'ds4', seriesNumber: '004', description: 'Prior Study — 2026-06-12 Chest CT', modality: 'CT', sliceCount: 380, acquisitionTime: '2026-06-12 14:20' },
];

export const MOCK_SAFETY_CHECKLISTS: SafetyChecklist[] = [
  { id: 'sc1', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', pregnancyScreening: 'Cleared', contrastAllergy: 'No Known Allergy', fastingStatus: 'NPO Verified', identityVerified: true },
  { id: 'sc2', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', pregnancyScreening: 'Cleared', contrastAllergy: 'No Known Allergy', fastingStatus: 'Not Required', identityVerified: true },
  { id: 'sc3', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', pregnancyScreening: 'Cleared', contrastAllergy: 'Premedicated', fastingStatus: 'NPO Verified', identityVerified: true },
  { id: 'sc4', patientName: 'Arjun Das', uhid: 'NX-2026-000377', pregnancyScreening: 'Pending', contrastAllergy: 'No Known Allergy', fastingStatus: 'Not Required', identityVerified: true },
];

export const MOCK_DOSE_LOGS: RadiationDoseLog[] = [
  { id: 'dl1', patientName: 'Rahul Sharma', study: 'CT Chest PE Protocol', modality: 'CT', ctdiVol: '12.4 mGy', dlp: '420 mGy·cm', effectiveDose: '6.2 mSv', timestamp: '2026-07-18 11:36' },
  { id: 'dl2', patientName: 'Deepak Menon', study: 'CT Head w/o Contrast', modality: 'CT', ctdiVol: '45.2 mGy', dlp: '780 mGy·cm', effectiveDose: '1.8 mSv', timestamp: '2026-07-18 08:12' },
  { id: 'dl3', patientName: 'Kavitha Nair', study: 'Portable Chest X-Ray', modality: 'X-Ray', ctdiVol: '0.3 mGy', dlp: '0.8 mGy·cm', effectiveDose: '0.02 mSv', timestamp: '2026-07-18 11:22' },
  { id: 'dl4', patientName: 'Vikram Patel', study: 'Chest X-Ray PA/Lat', modality: 'X-Ray', ctdiVol: '0.2 mGy', dlp: '0.5 mGy·cm', effectiveDose: '0.01 mSv', timestamp: '2026-07-17 16:45' },
];

export const INITIAL_REPORTS: ReportRecord[] = [
  { id: 'rr1', orderNumber: 'RAD-2026-5515', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', study: 'CT Abdomen/Pelvis w/ Contrast', modality: 'CT', impression: 'Large heterogeneous hepatic mass — 8.2 cm segment VII. Urgent oncology referral recommended.', stage: 'Radiologist Verified', critical: true, techSignature: 'Tech Ravi K. — 10:45', radiologistSignature: 'Dr. Neha Gupta — 11:05' },
  { id: 'rr2', orderNumber: 'RAD-2026-5522', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', study: 'MRI Brain — Stroke Protocol', modality: 'MRI', impression: 'Acute infarct — left MCA territory. DWI restriction with ADC correlate.', stage: 'Draft', critical: true },
  { id: 'rr3', orderNumber: 'RAD-2026-5515', patientName: 'Priya Patel', uhid: 'NX-2026-000413', study: 'US Abdomen RUQ', modality: 'Ultrasound', impression: 'Gallbladder wall thickening with pericholecystic fluid — consistent with acute cholecystitis.', stage: 'Tech Review', critical: false, techSignature: 'Tech Anita R. — 10:30' },
  { id: 'rr4', orderNumber: 'RAD-2026-5499', patientName: 'Deepak Menon', uhid: 'NX-2026-000390', study: 'CT Head w/o Contrast', modality: 'CT', impression: 'No acute intracranial hemorrhage or mass effect. Chronic small vessel ischemic changes.', stage: 'Released', critical: false, techSignature: 'Tech Joseph M.', radiologistSignature: 'Dr. Sanjay Mehta — 08:45' },
  { id: 'rr5', orderNumber: 'RAD-2026-5521', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', study: 'CT Chest PE Protocol', modality: 'CT', impression: 'Pending — scan in progress. Preliminary: bilateral lower lobe segmental filling defects.', stage: 'Draft', critical: false },
];

export const MOCK_EQUIPMENT: ImagingEquipment[] = [
  { id: 'eq1', name: 'Siemens SOMATOM go.Top', modality: 'CT', room: 'CT Suite 2', status: 'Online', nextCalibration: '2026-07-22', lastMaintenance: '2026-07-01', utilizationPct: 78 },
  { id: 'eq2', name: 'Philips Ingenia 1.5T', modality: 'MRI', room: 'MRI Suite 1', status: 'Online', nextCalibration: '2026-07-25', lastMaintenance: '2026-06-28', utilizationPct: 65 },
  { id: 'eq3', name: 'Carestream DRX-Evolution', modality: 'X-Ray', room: 'XR Room 3', status: 'Online', nextCalibration: '2026-08-01', lastMaintenance: '2026-07-10', utilizationPct: 52 },
  { id: 'eq4', name: 'GE Logiq E10', modality: 'Ultrasound', room: 'US Room 2', status: 'Online', nextCalibration: '2026-07-30', lastMaintenance: '2026-07-05', utilizationPct: 44 },
  { id: 'eq5', name: 'Mobile DR Unit XR-M1', modality: 'X-Ray', room: 'Portable — ICU/Wards', status: 'Online', nextCalibration: '2026-07-20', lastMaintenance: '2026-07-15', utilizationPct: 88 },
  { id: 'eq6', name: 'Siemens Avanto 1.5T', modality: 'MRI', room: 'MRI Suite 2', status: 'Maintenance', nextCalibration: '2026-07-18', lastMaintenance: '2026-07-18', utilizationPct: 0 },
];

export const MOCK_CONTRAST: ContrastInventory[] = [
  { id: 'ci1', agentName: 'Iohexol 350 mgI/mL', concentration: '350 mgI/mL', lotNumber: 'LOT-IOH-8841', quantity: 48, unit: 'vials (50mL)', expiryDate: '2026-10-15', lowStock: false },
  { id: 'ci2', agentName: 'Gadoterate Meglumine', concentration: '0.5 mmol/mL', lotNumber: 'LOT-GAD-7720', quantity: 12, unit: 'syringes (10mL)', expiryDate: '2026-09-01', lowStock: true },
  { id: 'ci3', agentName: 'Iodixanol 320 mgI/mL', concentration: '320 mgI/mL', lotNumber: 'LOT-IOD-6633', quantity: 36, unit: 'vials (100mL)', expiryDate: '2026-08-20', lowStock: false },
  { id: 'ci4', agentName: 'Barium Sulfate Suspension', concentration: '2.1% w/v', lotNumber: 'LOT-BAR-9012', quantity: 6, unit: 'bottles (450mL)', expiryDate: '2026-07-25', lowStock: true },
];

export const TAT_ANALYTICS = [
  { day: 'Mon', routine: 42, stat: 18 },
  { day: 'Tue', routine: 38, stat: 22 },
  { day: 'Wed', routine: 45, stat: 15 },
  { day: 'Thu', routine: 40, stat: 20 },
  { day: 'Fri', routine: 48, stat: 12 },
  { day: 'Sat', routine: 35, stat: 10 },
  { day: 'Sun', routine: 28, stat: 8 },
];

export function searchRadiology(query: string, orders: ImagingOrder[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return orders.filter(
    (o) =>
      o.patientName.toLowerCase().includes(q) ||
      o.uhid.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.studyDescription.toLowerCase().includes(q) ||
      o.modality.toLowerCase().includes(q),
  ).length;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export { advanceScanStatus, advanceReportStage };
