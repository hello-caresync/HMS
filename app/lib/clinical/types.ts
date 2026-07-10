/** Phase 3 — Clinical Support workflow types (Modules 8–10) */

export type SpecimenCategory = 'Blood' | 'Urine' | 'Swab';

export type LabSampleStatus =
  | 'Awaiting Collection'
  | 'Barcode Printed'
  | 'Processing'
  | 'Awaiting Verification';

export interface LabResultFieldEntry {
  parameterKey: string;
  label: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  value: string;
}

/** Sample order packet tracked through lab lifecycle */
export interface LabSamplePacket {
  trackingId: string;
  patientReferenceId: string;
  patientInitials: string;
  testName: string;
  specimenCategory: SpecimenCategory;
  collectionTimestamp: string | null;
  status: LabSampleStatus;
  resultMatrix: LabResultFieldEntry[];
}

export type RadiologySessionStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Report Pending'
  | 'Completed';

/** Imaging session with machine room routing and file payload */
export interface RadiologyScanSession {
  sessionId: string;
  appointmentSlotNumber: string;
  machineRoomLocator: string;
  patientReferenceId: string;
  patientInitials: string;
  studyName: string;
  imageFileUrls: string[];
  technicianNotes: string;
  status: RadiologySessionStatus;
}

/** Batch-level stock record keyed by generic compound */
export interface MedicationInventoryBatch {
  batchNumberCode: string;
  manufacturedDate: string;
  expiryDate: string;
  stockCountRemaining: number;
  genericCompoundKey: string;
}

export type StockLevelTag = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface PrescriptionLineItem {
  id: string;
  catalogId: string;
  drugName: string;
  genericFormula: string;
  dosageInstructions: string;
  quantityOrdered: number;
  unitPrice: number;
  stockLevel: StockLevelTag;
  batch: MedicationInventoryBatch | null;
  fulfilled: boolean;
}

export interface ActivePrescription {
  scriptId: string;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  issuedAt: string;
  lines: PrescriptionLineItem[];
}

export interface CheckoutLineSummary {
  lineId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
}

export const LAB_STATUS_STYLES: Record<LabSampleStatus, string> = {
  'Awaiting Collection': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Barcode Printed': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  Processing: 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold',
  'Awaiting Verification': 'bg-violet-100 text-violet-950 border border-violet-400 font-bold',
};

export const STOCK_LEVEL_STYLES: Record<StockLevelTag, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  'Low Stock': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Out of Stock': 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};
