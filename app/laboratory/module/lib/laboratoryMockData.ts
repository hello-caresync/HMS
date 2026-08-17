import type {
  BarcodeStatus,
  CollectionStatus,
  EquipmentStatus,
  QcStatus,
  SamplePipelineStatus,
  TestPriority,
  VerificationStage,
} from '../laboratoryNav.types';
import { advanceSampleStatus } from '../laboratoryNav.types';

export type SampleOrder = {
  id: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  testType: string;
  testPanel: string;
  priority: TestPriority;
  barcodeStatus: BarcodeStatus;
  collectionStatus: CollectionStatus;
  pipelineStatus: SamplePipelineStatus;
  orderedBy: string;
  orderedAt: string;
  criticalResult: boolean;
  identityVerified: boolean;
};

export type ProcessingLog = {
  id: string;
  sampleId: string;
  patientName: string;
  barcode: string;
  status: SamplePipelineStatus;
  transportLeg: string;
  analyzer: string;
  resultEntry: string;
  tech: string;
  timestamp: string;
};

export type AnalyzerAssignment = {
  id: string;
  analyzerName: string;
  interface: 'HL7 / ASTM' | 'Manual';
  samplesQueued: number;
  status: EquipmentStatus;
  lastHeartbeat: string;
};

export type QcCheck = {
  id: string;
  instrument: string;
  checkType: string;
  level: string;
  status: QcStatus;
  performedAt: string;
  operator: string;
};

export type CalibrationSchedule = {
  id: string;
  instrument: string;
  nextDue: string;
  lastCompleted: string;
  status: 'Due' | 'Scheduled' | 'Completed';
};

export type VerificationRecord = {
  id: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  testName: string;
  result: string;
  referenceRange: string;
  deltaCheck: string;
  stage: VerificationStage;
  critical: boolean;
  techSignature?: string;
  pathologistSignature?: string;
};

export type ReagentStock = {
  id: string;
  reagentName: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  lowStock: boolean;
  reorderTriggered: boolean;
};

export type TestBillingLine = {
  id: string;
  orderNumber: string;
  patientName: string;
  testName: string;
  amount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Outstanding' | 'Billed to IPD';
};

export const LIMS_CENSUS = {
  todayTestOrders: 342,
  pendingSamples: 28,
  samplesCollected: 186,
  samplesInProcess: 64,
  completedTests: 248,
  criticalResults: 5,
  delayedReports: 9,
  laboratoryRevenue: 428600,
  activeEquipment: 11,
};

export const INITIAL_SAMPLE_ORDERS: SampleOrder[] = [
  {
    id: 'so1',
    orderNumber: 'LAB-2026-8841',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    testType: 'Hematology',
    testPanel: 'Complete Blood Count (CBC)',
    priority: 'Routine',
    barcodeStatus: 'Scanned',
    collectionStatus: 'Collected',
    pipelineStatus: 'In Process',
    orderedBy: 'Dr. Rajesh Kumar',
    orderedAt: '2026-07-18T08:30:00',
    criticalResult: false,
    identityVerified: true,
  },
  {
    id: 'so2',
    orderNumber: 'LAB-2026-8842',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    testType: 'Critical Care',
    testPanel: 'ABG + Lactate + Electrolytes',
    priority: 'STAT Emergency',
    barcodeStatus: 'Printed',
    collectionStatus: 'Collected',
    pipelineStatus: 'In Process',
    orderedBy: 'Dr. B. Joseph — ER',
    orderedAt: '2026-07-18T11:05:00',
    criticalResult: true,
    identityVerified: true,
  },
  {
    id: 'so3',
    orderNumber: 'LAB-2026-8843',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    testType: 'Microbiology',
    testPanel: 'Blood Culture × 2',
    priority: 'STAT Emergency',
    barcodeStatus: 'Pending',
    collectionStatus: 'Pending Collection',
    pipelineStatus: 'Pending Collection',
    orderedBy: 'Dr. Anita Roy — ICU',
    orderedAt: '2026-07-18T11:20:00',
    criticalResult: false,
    identityVerified: true,
  },
  {
    id: 'so4',
    orderNumber: 'LAB-2026-8839',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    testType: 'Biochemistry',
    testPanel: 'Lipid Profile + LFT',
    priority: 'Routine',
    barcodeStatus: 'Scanned',
    collectionStatus: 'Collected',
    pipelineStatus: 'Report Released',
    orderedBy: 'Dr. Kapoor',
    orderedAt: '2026-07-18T07:15:00',
    criticalResult: false,
    identityVerified: true,
  },
  {
    id: 'so5',
    orderNumber: 'LAB-2026-8840',
    patientName: 'Priya Patel',
    uhid: 'NX-2026-000413',
    testType: 'Serology',
    testPanel: 'D-Dimer + Troponin-I',
    priority: 'STAT Emergency',
    barcodeStatus: 'Scanned',
    collectionStatus: 'Collected',
    pipelineStatus: 'Completed',
    orderedBy: 'Dr. Meera Iyer — ER',
    orderedAt: '2026-07-18T10:45:00',
    criticalResult: true,
    identityVerified: true,
  },
  {
    id: 'so6',
    orderNumber: 'LAB-2026-8835',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    testType: 'Coagulation',
    testPanel: 'PT/INR + APTT',
    priority: 'Routine',
    barcodeStatus: 'Printed',
    collectionStatus: 'Recollection Requested',
    pipelineStatus: 'Delayed',
    orderedBy: 'Dr. Kapoor — Pre-op',
    orderedAt: '2026-07-17T16:00:00',
    criticalResult: false,
    identityVerified: true,
  },
];

export const MOCK_PROCESSING_LOGS: ProcessingLog[] = [
  { id: 'pl1', sampleId: 'LAB-2026-8841', patientName: 'Rahul Sharma', barcode: 'BC-LAB-8841-A', status: 'In Process', transportLeg: 'Phlebotomy → Hematology Bench', analyzer: 'Sysmex XN-1000', resultEntry: 'Auto-interfaced — pending validation', tech: 'Tech Anita R.', timestamp: '2026-07-18 09:12' },
  { id: 'pl2', sampleId: 'LAB-2026-8842', patientName: 'Meera Krishnan', barcode: 'BC-LAB-8842-STAT', status: 'In Process', transportLeg: 'ER → Blood Gas Analyzer', analyzer: 'Radiometer ABL90', resultEntry: 'Lactate 4.8 mmol/L ↑ CRITICAL', tech: 'Tech Joseph M.', timestamp: '2026-07-18 11:18' },
  { id: 'pl3', sampleId: 'LAB-2026-8840', patientName: 'Priya Patel', barcode: 'BC-LAB-8840-STAT', status: 'Completed', transportLeg: 'ER → Immunoassay', analyzer: 'Architect i2000SR', resultEntry: 'Troponin-I 0.82 ng/mL ↑', tech: 'Tech Lakshmi N.', timestamp: '2026-07-18 11:35' },
];

export const MOCK_ANALYZERS: AnalyzerAssignment[] = [
  { id: 'an1', analyzerName: 'Sysmex XN-1000', interface: 'HL7 / ASTM', samplesQueued: 12, status: 'Online', lastHeartbeat: '2026-07-18 11:42' },
  { id: 'an2', analyzerName: 'Cobas c702', interface: 'HL7 / ASTM', samplesQueued: 18, status: 'Online', lastHeartbeat: '2026-07-18 11:41' },
  { id: 'an3', analyzerName: 'Architect i2000SR', interface: 'HL7 / ASTM', samplesQueued: 6, status: 'Online', lastHeartbeat: '2026-07-18 11:40' },
  { id: 'an4', analyzerName: 'Radiometer ABL90 FLEX', interface: 'HL7 / ASTM', samplesQueued: 2, status: 'Calibrating', lastHeartbeat: '2026-07-18 11:38' },
  { id: 'an5', analyzerName: 'VITEK 2 Compact', interface: 'Manual', samplesQueued: 4, status: 'Maintenance', lastHeartbeat: '2026-07-18 09:00' },
];

export const MOCK_QC_CHECKS: QcCheck[] = [
  { id: 'qc1', instrument: 'Sysmex XN-1000', checkType: 'Daily IQC — Level 1', level: 'Normal', status: 'Pass', performedAt: '2026-07-18 06:00', operator: 'Tech Anita R.' },
  { id: 'qc2', instrument: 'Cobas c702', checkType: 'Daily IQC — Level 2', level: 'Abnormal', status: 'Pass', performedAt: '2026-07-18 06:15', operator: 'Tech Joseph M.' },
  { id: 'qc3', instrument: 'Architect i2000SR', checkType: 'Daily IQC — Troponin', level: 'Low', status: 'Review', performedAt: '2026-07-18 06:30', operator: 'Tech Lakshmi N.' },
];

export const MOCK_CALIBRATION: CalibrationSchedule[] = [
  { id: 'cal1', instrument: 'Radiometer ABL90 FLEX', nextDue: '2026-07-18', lastCompleted: '2026-07-11', status: 'Due' },
  { id: 'cal2', instrument: 'Sysmex XN-1000', nextDue: '2026-07-25', lastCompleted: '2026-07-18', status: 'Completed' },
  { id: 'cal3', instrument: 'Cobas c702', nextDue: '2026-07-22', lastCompleted: '2026-07-15', status: 'Scheduled' },
];

export const QC_TREND = [
  { day: 'Mon', pass: 98, fail: 2 },
  { day: 'Tue', pass: 97, fail: 3 },
  { day: 'Wed', pass: 99, fail: 1 },
  { day: 'Thu', pass: 96, fail: 4 },
  { day: 'Fri', pass: 98, fail: 2 },
  { day: 'Sat', pass: 99, fail: 1 },
  { day: 'Sun', pass: 100, fail: 0 },
];

export const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  { id: 'vr1', orderNumber: 'LAB-2026-8842', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', testName: 'Lactate', result: '4.8 mmol/L', referenceRange: '0.5–2.2', deltaCheck: '+142% vs prior (2.0)', stage: 'Pathologist Review', critical: true, techSignature: 'Tech Joseph M. — 11:20' },
  { id: 'vr2', orderNumber: 'LAB-2026-8840', patientName: 'Priya Patel', uhid: 'NX-2026-000413', testName: 'Troponin-I', result: '0.82 ng/mL', referenceRange: '<0.04', deltaCheck: 'New elevation — no prior', stage: 'Tech Verified', critical: true, techSignature: 'Tech Lakshmi N. — 11:36' },
  { id: 'vr3', orderNumber: 'LAB-2026-8841', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', testName: 'CBC — WBC', result: '11.2 ×10³/µL', referenceRange: '4.0–11.0', deltaCheck: '+8% vs 2026-07-14', stage: 'Pending Tech', critical: false },
  { id: 'vr4', orderNumber: 'LAB-2026-8839', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', testName: 'Lipid Panel', result: 'Within limits', referenceRange: '—', deltaCheck: 'Stable trend', stage: 'Released', critical: false, techSignature: 'Tech Anita R.', pathologistSignature: 'Dr. Sanjay Mehta — 09:45' },
];

export const MOCK_REAGENTS: ReagentStock[] = [
  { id: 'rg1', reagentName: 'CBC Lyse Reagent', lotNumber: 'LOT-8841-A', quantity: 42, unit: 'bottles', expiryDate: '2026-09-15', lowStock: false, reorderTriggered: false },
  { id: 'rg2', reagentName: 'Troponin-I Reagent Kit', lotNumber: 'LOT-7720-B', quantity: 8, unit: 'kits', expiryDate: '2026-08-01', lowStock: true, reorderTriggered: true },
  { id: 'rg3', reagentName: 'Glucose Enzyme Reagent', lotNumber: 'LOT-9012-C', quantity: 24, unit: 'bottles', expiryDate: '2026-07-25', lowStock: false, reorderTriggered: false },
  { id: 'rg4', reagentName: 'Coagulation PT Reagent', lotNumber: 'LOT-6633-D', quantity: 3, unit: 'kits', expiryDate: '2026-06-30', lowStock: true, reorderTriggered: true },
];

export const MOCK_TEST_BILLING: TestBillingLine[] = [
  { id: 'TB-901', orderNumber: 'LAB-2026-8839', patientName: 'Vikram Patel', testName: 'Lipid Profile + LFT', amount: 2400, paymentStatus: 'Paid' },
  { id: 'TB-902', orderNumber: 'LAB-2026-8841', patientName: 'Rahul Sharma', testName: 'CBC', amount: 450, paymentStatus: 'Billed to IPD' },
  { id: 'TB-903', orderNumber: 'LAB-2026-8842', patientName: 'Meera Krishnan', testName: 'ABG + Lactate Panel', amount: 3200, paymentStatus: 'Billed to IPD' },
  { id: 'TB-904', orderNumber: 'LAB-2026-8840', patientName: 'Priya Patel', testName: 'D-Dimer + Troponin', amount: 4100, paymentStatus: 'Outstanding' },
];

export const DELTA_TREND = [
  { date: 'Jul 12', value: 2.0 },
  { date: 'Jul 14', value: 2.2 },
  { date: 'Jul 16', value: 3.1 },
  { date: 'Jul 18', value: 4.8 },
];

export function searchLaboratory(query: string, orders: SampleOrder[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return orders.filter(
    (o) =>
      o.patientName.toLowerCase().includes(q) ||
      o.uhid.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.testPanel.toLowerCase().includes(q),
  ).length;
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function advanceVerificationStage(current: VerificationStage): VerificationStage {
  const flow: VerificationStage[] = ['Pending Tech', 'Tech Verified', 'Pathologist Review', 'Released'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}

export { advanceSampleStatus };
