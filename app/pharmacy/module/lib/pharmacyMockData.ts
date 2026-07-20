import type {
  BarcodeStatus,
  BatchAvailability,
  ControlledApprovalStage,
  GrnStatus,
  PrescriptionPriority,
  PrescriptionSource,
  PrescriptionStatus,
  QueueTokenStatus,
} from '../pharmacyNav.types';
import { advanceControlledStage, advancePrescriptionStatus } from '../pharmacyNav.types';

export type PrescriptionOrder = {
  id: string;
  rxNumber: string;
  patientName: string;
  uhid: string;
  source: PrescriptionSource;
  medicines: string;
  itemCount: number;
  priority: PrescriptionPriority;
  verified: boolean;
  batchAvailability: BatchAvailability;
  barcodeStatus: BarcodeStatus;
  status: PrescriptionStatus;
  orderedBy: string;
  orderedAt: string;
  controlledDrug: boolean;
  identityVerified: boolean;
};

export type QueueToken = {
  id: string;
  tokenNumber: string;
  patientName: string;
  uhid: string;
  rxNumber: string;
  priority: PrescriptionPriority;
  status: QueueTokenStatus;
  waitMinutes: number;
};

export type BatchStock = {
  id: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  store: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  reorderLevel: number;
  fefoRank: number;
  nearExpiry: boolean;
  outOfStock: boolean;
  recallTriggered: boolean;
};

export type PurchaseRequest = {
  id: string;
  prNumber: string;
  vendor: string;
  items: string;
  totalValue: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'PO Issued';
  requestedBy: string;
  requestedAt: string;
};

export type VendorScore = {
  id: string;
  vendorName: string;
  onTimeDeliveryPct: number;
  qualityScore: number;
  activePos: number;
  lastDelivery: string;
};

export type GrnRecord = {
  id: string;
  grnNumber: string;
  poReference: string;
  vendor: string;
  itemsReceived: number;
  status: GrnStatus;
  receivedBy: string;
  receivedAt: string;
};

export type NarcoticRegisterEntry = {
  id: string;
  rxNumber: string;
  patientName: string;
  uhid: string;
  drugName: string;
  schedule: 'Schedule H' | 'Schedule H1' | 'Schedule X';
  quantity: string;
  stage: ControlledApprovalStage;
  chiefPharmacistSignature?: string;
  auditLogged: boolean;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  action: string;
  drugName: string;
  performedBy: string;
  reference: string;
};

export type BillingLine = {
  id: string;
  rxNumber: string;
  patientName: string;
  medicine: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  insuranceVerified: boolean;
  paymentStatus: 'Paid' | 'Partial' | 'Outstanding' | 'Insurance Pending';
};

export type DrugInfoRecord = {
  id: string;
  brandName: string;
  genericName: string;
  interactions: string;
  contraindications: string;
  alternatives: string;
};

export const PHARMACY_CENSUS = {
  todayPrescriptions: 412,
  pendingPrescriptions: 34,
  medicinesDispensed: 286,
  pendingDispensing: 18,
  lowStockMedicines: 14,
  outOfStockMedicines: 5,
  expiringMedicines: 22,
  controlledDrugAlerts: 4,
  pharmacyRevenue: 892400,
};

export const INITIAL_PRESCRIPTIONS: PrescriptionOrder[] = [
  {
    id: 'rx1',
    rxNumber: 'RX-2026-11842',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    source: 'IPD',
    medicines: 'Amoxicillin 500mg · Paracetamol 650mg · Pantoprazole 40mg',
    itemCount: 3,
    priority: 'Routine',
    verified: true,
    batchAvailability: 'Available',
    barcodeStatus: 'Scanned',
    status: 'Processing',
    orderedBy: 'Dr. Rajesh Kumar',
    orderedAt: '2026-07-18T09:15:00',
    controlledDrug: false,
    identityVerified: true,
  },
  {
    id: 'rx2',
    rxNumber: 'RX-2026-11848',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    source: 'Emergency',
    medicines: 'Adrenaline 1:1000 · Normal Saline 500mL · Hydrocortisone 100mg IV',
    itemCount: 3,
    priority: 'STAT',
    verified: true,
    batchAvailability: 'Available',
    barcodeStatus: 'Printed',
    status: 'Ready to Dispense',
    orderedBy: 'Dr. B. Joseph — ER',
    orderedAt: '2026-07-18T11:40:00',
    controlledDrug: false,
    identityVerified: true,
  },
  {
    id: 'rx3',
    rxNumber: 'RX-2026-11850',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    source: 'OPD',
    medicines: 'Tramadol 50mg · Aceclofenac 100mg',
    itemCount: 2,
    priority: 'Controlled',
    verified: false,
    batchAvailability: 'Low Stock',
    barcodeStatus: 'Pending',
    status: 'Pending Verification',
    orderedBy: 'Dr. Kapoor — Ortho',
    orderedAt: '2026-07-18T11:55:00',
    controlledDrug: true,
    identityVerified: true,
  },
  {
    id: 'rx4',
    rxNumber: 'RX-2026-11835',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    source: 'OPD',
    medicines: 'Atorvastatin 20mg · Metformin 500mg · Telmisartan 40mg',
    itemCount: 3,
    priority: 'Routine',
    verified: true,
    batchAvailability: 'Available',
    barcodeStatus: 'Scanned',
    status: 'Dispensed',
    orderedBy: 'Dr. Meera Iyer',
    orderedAt: '2026-07-18T08:30:00',
    controlledDrug: false,
    identityVerified: true,
  },
  {
    id: 'rx5',
    rxNumber: 'RX-2026-11844',
    patientName: 'Priya Patel',
    uhid: 'NX-2026-000413',
    source: 'IPD',
    medicines: 'Insulin Glargine 100IU/mL · Insulin Aspart',
    itemCount: 2,
    priority: 'Routine',
    verified: true,
    batchAvailability: 'Substitute Required',
    barcodeStatus: 'Pending',
    status: 'Verified',
    orderedBy: 'Dr. Anita Roy — Endo',
    orderedAt: '2026-07-18T10:20:00',
    controlledDrug: false,
    identityVerified: true,
  },
  {
    id: 'rx6',
    rxNumber: 'RX-2026-11846',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    source: 'Emergency',
    medicines: 'Morphine 10mg/mL (Schedule X)',
    itemCount: 1,
    priority: 'Controlled',
    verified: true,
    batchAvailability: 'Available',
    barcodeStatus: 'Printed',
    status: 'Processing',
    orderedBy: 'Dr. Joseph — ICU',
    orderedAt: '2026-07-18T11:25:00',
    controlledDrug: true,
    identityVerified: true,
  },
  {
    id: 'rx7',
    rxNumber: 'RX-2026-11838',
    patientName: 'Kavitha Nair',
    uhid: 'NX-2026-000401',
    source: 'OPD',
    medicines: 'Azithromycin 500mg · Cetirizine 10mg',
    itemCount: 2,
    priority: 'Routine',
    verified: false,
    batchAvailability: 'Out of Stock',
    barcodeStatus: 'Pending',
    status: 'Pending Verification',
    orderedBy: 'Dr. Sanjay Mehta',
    orderedAt: '2026-07-18T11:10:00',
    controlledDrug: false,
    identityVerified: true,
  },
];

export const INITIAL_QUEUE_TOKENS: QueueToken[] = [
  { id: 'qt1', tokenNumber: 'PH-042', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', rxNumber: 'RX-2026-11835', priority: 'Routine', status: 'Completed', waitMinutes: 12 },
  { id: 'qt2', tokenNumber: 'PH-043', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', rxNumber: 'RX-2026-11848', priority: 'STAT', status: 'At Counter', waitMinutes: 3 },
  { id: 'qt3', tokenNumber: 'PH-044', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', rxNumber: 'RX-2026-11850', priority: 'Controlled', status: 'Called', waitMinutes: 8 },
  { id: 'qt4', tokenNumber: 'PH-045', patientName: 'Kavitha Nair', uhid: 'NX-2026-000401', rxNumber: 'RX-2026-11838', priority: 'Routine', status: 'Waiting', waitMinutes: 15 },
  { id: 'qt5', tokenNumber: 'PH-046', patientName: 'Deepak Menon', uhid: 'NX-2026-000390', rxNumber: 'RX-2026-11852', priority: 'Routine', status: 'Waiting', waitMinutes: 6 },
];

export const MOCK_BATCH_STOCK: BatchStock[] = [
  { id: 'bs1', medicineName: 'Amoxicillin 500mg Cap', genericName: 'Amoxicillin', batchNumber: 'AMX-8841-A', store: 'Main Pharmacy', quantity: 2400, unit: 'caps', expiryDate: '2027-03-15', reorderLevel: 500, fefoRank: 3, nearExpiry: false, outOfStock: false, recallTriggered: false },
  { id: 'bs2', medicineName: 'Tramadol 50mg Tab', genericName: 'Tramadol HCl', batchNumber: 'TRM-7720-B', store: 'Controlled Vault', quantity: 48, unit: 'tabs', expiryDate: '2026-09-01', reorderLevel: 100, fefoRank: 1, nearExpiry: false, outOfStock: false, recallTriggered: false },
  { id: 'bs3', medicineName: 'Morphine 10mg/mL Inj', genericName: 'Morphine Sulphate', batchNumber: 'MOR-6633-C', store: 'Narcotic Vault', quantity: 12, unit: 'ampoules', expiryDate: '2026-08-20', reorderLevel: 20, fefoRank: 1, nearExpiry: false, outOfStock: false, recallTriggered: false },
  { id: 'bs4', medicineName: 'Azithromycin 500mg Tab', genericName: 'Azithromycin', batchNumber: 'AZI-9012-D', store: 'Main Pharmacy', quantity: 0, unit: 'tabs', expiryDate: '2026-07-25', reorderLevel: 200, fefoRank: 0, nearExpiry: true, outOfStock: true, recallTriggered: false },
  { id: 'bs5', medicineName: 'Insulin Glargine 100IU', genericName: 'Insulin Glargine', batchNumber: 'INS-5521-E', store: 'Cold Chain Store', quantity: 18, unit: 'pens', expiryDate: '2026-07-28', reorderLevel: 30, fefoRank: 1, nearExpiry: true, outOfStock: false, recallTriggered: false },
  { id: 'bs6', medicineName: 'Paracetamol 650mg Tab', genericName: 'Paracetamol', batchNumber: 'PCM-4410-F', store: 'Main Pharmacy', quantity: 8600, unit: 'tabs', expiryDate: '2027-01-10', reorderLevel: 1000, fefoRank: 2, nearExpiry: false, outOfStock: false, recallTriggered: false },
  { id: 'bs7', medicineName: 'Ranitidine 150mg Tab', genericName: 'Ranitidine', batchNumber: 'RAN-3300-G', store: 'Main Pharmacy', quantity: 120, unit: 'tabs', expiryDate: '2026-07-20', reorderLevel: 300, fefoRank: 1, nearExpiry: true, outOfStock: false, recallTriggered: true },
];

export const MOCK_PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: 'pr1', prNumber: 'PR-2026-3310', vendor: 'MedSupply India Pvt Ltd', items: 'Azithromycin 500mg × 5000 tabs', totalValue: 185000, status: 'Approved', requestedBy: 'Pharm. Ravi K.', requestedAt: '2026-07-17' },
  { id: 'pr2', prNumber: 'PR-2026-3315', vendor: 'Apollo Pharma Distribution', items: 'Insulin Glargine × 50 pens · Tramadol × 500 tabs', totalValue: 342000, status: 'Submitted', requestedBy: 'Pharm. Anita R.', requestedAt: '2026-07-18' },
  { id: 'pr3', prNumber: 'PR-2026-3318', vendor: 'Cipla Healthcare Logistics', items: 'Morphine 10mg/mL × 100 ampoules', totalValue: 98000, status: 'PO Issued', requestedBy: 'Chief Pharm. Joseph M.', requestedAt: '2026-07-18' },
];

export const MOCK_VENDOR_SCORES: VendorScore[] = [
  { id: 'vs1', vendorName: 'MedSupply India Pvt Ltd', onTimeDeliveryPct: 94, qualityScore: 4.6, activePos: 3, lastDelivery: '2026-07-15' },
  { id: 'vs2', vendorName: 'Apollo Pharma Distribution', onTimeDeliveryPct: 88, qualityScore: 4.2, activePos: 2, lastDelivery: '2026-07-12' },
  { id: 'vs3', vendorName: 'Cipla Healthcare Logistics', onTimeDeliveryPct: 97, qualityScore: 4.8, activePos: 1, lastDelivery: '2026-07-18' },
  { id: 'vs4', vendorName: 'Sun Pharma Wholesale', onTimeDeliveryPct: 82, qualityScore: 3.9, activePos: 4, lastDelivery: '2026-07-10' },
];

export const MOCK_GRN_RECORDS: GrnRecord[] = [
  { id: 'gr1', grnNumber: 'GRN-2026-8821', poReference: 'PO-2026-4410', vendor: 'Cipla Healthcare Logistics', itemsReceived: 100, status: 'Verified', receivedBy: 'Store Incharge Lakshmi N.', receivedAt: '2026-07-18 09:30' },
  { id: 'gr2', grnNumber: 'GRN-2026-8824', poReference: 'PO-2026-4415', vendor: 'MedSupply India Pvt Ltd', itemsReceived: 5000, status: 'Pending QC', receivedBy: 'Store Incharge Lakshmi N.', receivedAt: '2026-07-18 11:00' },
  { id: 'gr3', grnNumber: 'GRN-2026-8818', poReference: 'PO-2026-4408', vendor: 'Apollo Pharma Distribution', itemsReceived: 250, status: 'Rejected', receivedBy: 'QC Tech Joseph M.', receivedAt: '2026-07-17 16:45' },
];

export const INITIAL_NARCOTIC_ENTRIES: NarcoticRegisterEntry[] = [
  { id: 'nr1', rxNumber: 'RX-2026-11846', patientName: 'Arjun Das', uhid: 'NX-2026-000377', drugName: 'Morphine 10mg/mL Injection', schedule: 'Schedule X', quantity: '2 ampoules', stage: 'Approved', chiefPharmacistSignature: 'Chief Pharm. Joseph M. — 11:30', auditLogged: false },
  { id: 'nr2', rxNumber: 'RX-2026-11850', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', drugName: 'Tramadol 50mg Tablet', schedule: 'Schedule H1', quantity: '10 tabs (5 days)', stage: 'Pending Chief Pharmacist', auditLogged: false },
  { id: 'nr3', rxNumber: 'RX-2026-11820', patientName: 'Deepak Menon', uhid: 'NX-2026-000390', drugName: 'Fentanyl 50mcg/hr Patch', schedule: 'Schedule X', quantity: '2 patches', stage: 'Dispensed', chiefPharmacistSignature: 'Chief Pharm. Joseph M. — 2026-07-17', auditLogged: true },
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'al1', timestamp: '2026-07-18 11:30', action: 'Controlled Drug Approved', drugName: 'Morphine 10mg/mL', performedBy: 'Chief Pharm. Joseph M.', reference: 'RX-2026-11846' },
  { id: 'al2', timestamp: '2026-07-18 10:15', action: 'Batch Recall Initiated', drugName: 'Ranitidine 150mg', performedBy: 'Pharm. Anita R.', reference: 'Batch RAN-3300-G' },
  { id: 'al3', timestamp: '2026-07-17 16:00', action: 'GRN Rejected — QC Fail', drugName: 'Insulin Aspart', performedBy: 'QC Tech Joseph M.', reference: 'GRN-2026-8818' },
  { id: 'al4', timestamp: '2026-07-17 14:22', action: 'Narcotic Register Entry', drugName: 'Fentanyl 50mcg/hr Patch', performedBy: 'Chief Pharm. Joseph M.', reference: 'RX-2026-11820' },
];

export const MOCK_BILLING_LINES: BillingLine[] = [
  { id: 'bl1', rxNumber: 'RX-2026-11835', patientName: 'Vikram Patel', medicine: 'Atorvastatin 20mg × 30', qty: 30, unitPrice: 12, discountPct: 0, insuranceVerified: true, paymentStatus: 'Paid' },
  { id: 'bl2', rxNumber: 'RX-2026-11842', patientName: 'Rahul Sharma', medicine: 'Amoxicillin 500mg × 21', qty: 21, unitPrice: 8, discountPct: 0, insuranceVerified: true, paymentStatus: 'Insurance Pending' },
  { id: 'bl3', rxNumber: 'RX-2026-11848', patientName: 'Meera Krishnan', medicine: 'ER Medication Bundle', qty: 1, unitPrice: 4200, discountPct: 0, insuranceVerified: false, paymentStatus: 'Outstanding' },
  { id: 'bl4', rxNumber: 'RX-2026-11850', patientName: 'Sanjay Rao', medicine: 'Tramadol 50mg × 10', qty: 10, unitPrice: 18, discountPct: 0, insuranceVerified: true, paymentStatus: 'Partial' },
];

export const MOCK_DRUG_INFO: DrugInfoRecord[] = [
  { id: 'di1', brandName: 'Azithromycin 500mg', genericName: 'Azithromycin', interactions: 'Warfarin ↑ INR · Antacids ↓ absorption', contraindications: 'Macrolide allergy · QT prolongation', alternatives: 'Doxycycline 100mg BID · Clarithromycin 500mg BD' },
  { id: 'di2', brandName: 'Tramadol 50mg', genericName: 'Tramadol HCl', interactions: 'SSRIs/SNRIs — serotonin syndrome risk · CYP2D6 inhibitors', contraindications: 'Respiratory depression · Seizure disorder · MAOIs', alternatives: 'Tapentadol · Paracetamol + Aceclofenac (non-opioid)' },
  { id: 'di3', brandName: 'Insulin Glargine', genericName: 'Insulin Glargine', interactions: 'Beta-blockers mask hypoglycemia · Corticosteroids ↑ glucose', contraindications: 'Hypoglycemia episodes · Insulin allergy', alternatives: 'Insulin Detemir · Insulin Degludec' },
  { id: 'di4', brandName: 'Morphine 10mg/mL', genericName: 'Morphine Sulphate', interactions: 'CNS depressants · MAOIs · Mixed agonist/antagonists', contraindications: 'Respiratory depression · Paralytic ileus · Head injury', alternatives: 'Fentanyl (controlled) · Tapentadol (Schedule H1)' },
];

export const REVENUE_TREND = [
  { day: 'Mon', opd: 142000, ipd: 98000, er: 45000 },
  { day: 'Tue', opd: 138000, ipd: 102000, er: 52000 },
  { day: 'Wed', opd: 155000, ipd: 95000, er: 38000 },
  { day: 'Thu', opd: 148000, ipd: 110000, er: 61000 },
  { day: 'Fri', opd: 162000, ipd: 105000, er: 48000 },
  { day: 'Sat', opd: 98000, ipd: 72000, er: 32000 },
  { day: 'Sun', opd: 76000, ipd: 58000, er: 28000 },
];

export function searchPharmacy(query: string, prescriptions: PrescriptionOrder[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.rxNumber.toLowerCase().includes(q) ||
      p.medicines.toLowerCase().includes(q),
  ).length;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export { advancePrescriptionStatus, advanceControlledStage };
