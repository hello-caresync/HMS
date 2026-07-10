import { SEED_PATIENTS } from '../../patients/lib/seedPatients';
import type {
  DepartmentRevenueRow,
  DoctorRevenueRow,
  InvoiceLineItem,
  PatientInvoice,
} from '../types';
import { generateInvoiceId, generateInvoiceNumber, generateLineItemId } from '../types';

export const PATIENT_LOOKUP = SEED_PATIENTS.map((p) => ({
  patientId: p.profile.id,
  uhid: p.profile.uhid,
  name: `${p.profile.firstName} ${p.profile.lastName}`.trim(),
  defaultBillingType: p.insurance?.billingType ?? 'Self',
  insurer: p.insurance?.providerName,
}));

/** Default line items for a typical OPD encounter invoice */
export const PRESET_LINE_ITEMS: InvoiceLineItem[] = [
  {
    id: generateLineItemId(),
    description: 'Consultation Fee — Senior Physician',
    department: 'General Medicine',
    basePrice: 800,
    gstPercent: 0,
    quantity: 1,
  },
  {
    id: generateLineItemId(),
    description: 'CBC — Complete Blood Count',
    department: 'Laboratory',
    basePrice: 450,
    gstPercent: 12,
    quantity: 1,
  },
  {
    id: generateLineItemId(),
    description: 'Pharmacy Consumables — Dolo 650 (10 strips)',
    department: 'Pharmacy',
    basePrice: 320,
    gstPercent: 12,
    quantity: 1,
  },
];

export function createDraftInvoice(
  patientId: string,
  billingType?: PatientInvoice['billingType'],
): PatientInvoice | null {
  const patient = PATIENT_LOOKUP.find((p) => p.patientId === patientId);
  if (!patient) return null;

  return {
    id: generateInvoiceId(),
    invoiceNumber: generateInvoiceNumber(),
    patientId: patient.patientId,
    patientName: patient.name,
    uhid: patient.uhid,
    billingType: billingType ?? patient.defaultBillingType,
    lineItems: PRESET_LINE_ITEMS.map((l) => ({ ...l, id: generateLineItemId() })),
    discount: 0,
    status: 'Draft',
    createdAt: new Date().toISOString(),
  };
}

export const SEED_PENDING_INVOICES: PatientInvoice[] = [
  {
    id: 'inv-seed-001',
    invoiceNumber: 'NEX-INV-2026-4421',
    patientId: 'pat-seed-002',
    patientName: 'R.K.',
    uhid: 'NEX-2026-1002',
    billingType: 'Insurance',
    lineItems: PRESET_LINE_ITEMS,
    discount: 50,
    status: 'Pending Payment',
    createdAt: '2026-07-09T08:00:00Z',
  },
  {
    id: 'inv-seed-002',
    invoiceNumber: 'NEX-INV-2026-4398',
    patientId: 'pat-seed-001',
    patientName: 'A.S.',
    uhid: 'NEX-2026-1001',
    billingType: 'Corporate',
    lineItems: PRESET_LINE_ITEMS,
    discount: 0,
    status: 'Claim Pending',
    createdAt: '2026-07-09T07:30:00Z',
  },
];

export const SEED_DOCTOR_REVENUE: DoctorRevenueRow[] = [
  { doctorName: 'Dr. Priya Menon', department: 'Cardiology', consultations: 14, revenue: 184200 },
  { doctorName: 'Dr. Arjun Das', department: 'Orthopedics', consultations: 11, revenue: 156800 },
  { doctorName: 'Dr. Lakshmi Nair', department: 'Pediatrics', consultations: 9, revenue: 98400 },
  { doctorName: 'Dr. Priya Menon', department: 'General Medicine', consultations: 6, revenue: 62400 },
];

export const SEED_DEPARTMENT_REVENUE: DepartmentRevenueRow[] = [
  { department: 'General Medicine', itemCount: 42, revenue: 336000, gstCollected: 0 },
  { department: 'Laboratory', itemCount: 68, revenue: 306000, gstCollected: 32892 },
  { department: 'Pharmacy', itemCount: 124, revenue: 248500, gstCollected: 29820 },
  { department: 'Radiology', itemCount: 22, revenue: 264000, gstCollected: 31680 },
  { department: 'Cardiology', itemCount: 18, revenue: 198400, gstCollected: 14280 },
];

export const SEED_TODAYS_COLLECTION = 428750;
export const SEED_PENDING_BILLS_TOTAL = 186420;
export const SEED_PENDING_BILLS_COUNT = 12;
export const SEED_CLAIMS_AWAITING = 94200;
export const SEED_CLAIMS_COUNT = 4;
export const SEED_TOTAL_GST = 108672;
