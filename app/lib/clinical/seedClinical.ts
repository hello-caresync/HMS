import type {
  ActivePrescription,
  LabResultFieldEntry,
  LabSamplePacket,
  MedicationInventoryBatch,
  PrescriptionLineItem,
  RadiologyScanSession,
} from './types';

export const CBC_RESULT_MATRIX: LabResultFieldEntry[] = [
  { parameterKey: 'wbc', label: 'WBC', unit: '×10³/µL', referenceMin: 4.5, referenceMax: 11.0, value: '' },
  { parameterKey: 'rbc', label: 'RBC', unit: '×10⁶/µL', referenceMin: 4.2, referenceMax: 5.4, value: '' },
  { parameterKey: 'hgb', label: 'Hemoglobin', unit: 'g/dL', referenceMin: 12.0, referenceMax: 16.0, value: '' },
  { parameterKey: 'hct', label: 'Hematocrit', unit: '%', referenceMin: 36.0, referenceMax: 46.0, value: '' },
  { parameterKey: 'plt', label: 'Platelets', unit: '×10³/µL', referenceMin: 150, referenceMax: 400, value: '' },
];

export const HBA1C_RESULT_MATRIX: LabResultFieldEntry[] = [
  { parameterKey: 'hba1c', label: 'HbA1c', unit: '%', referenceMin: 4.0, referenceMax: 5.6, value: '' },
  { parameterKey: 'eag', label: 'Estimated Avg Glucose', unit: 'mg/dL', referenceMin: 70, referenceMax: 126, value: '' },
];

export const LFT_RESULT_MATRIX: LabResultFieldEntry[] = [
  { parameterKey: 'alt', label: 'ALT (SGPT)', unit: 'U/L', referenceMin: 7, referenceMax: 56, value: '' },
  { parameterKey: 'ast', label: 'AST (SGOT)', unit: 'U/L', referenceMin: 10, referenceMax: 40, value: '' },
  { parameterKey: 'alp', label: 'Alkaline Phosphatase', unit: 'U/L', referenceMin: 44, referenceMax: 147, value: '' },
  { parameterKey: 'tbil', label: 'Total Bilirubin', unit: 'mg/dL', referenceMin: 0.1, referenceMax: 1.2, value: '' },
];

function cloneMatrix(matrix: LabResultFieldEntry[]): LabResultFieldEntry[] {
  return matrix.map((f) => ({ ...f }));
}

export const SEED_LAB_ORDERS: LabSamplePacket[] = [
  {
    trackingId: 'LAB-ORD-2401',
    patientReferenceId: 'NX-2026-482910',
    patientInitials: 'R.K.',
    testName: 'HbA1c / CBC',
    specimenCategory: 'Blood',
    collectionTimestamp: null,
    status: 'Awaiting Collection',
    resultMatrix: [...cloneMatrix(HBA1C_RESULT_MATRIX), ...cloneMatrix(CBC_RESULT_MATRIX)],
  },
  {
    trackingId: 'LAB-ORD-2402',
    patientReferenceId: 'NX-2026-301882',
    patientInitials: 'P.N.',
    testName: 'Complete Blood Count',
    specimenCategory: 'Blood',
    collectionTimestamp: '2026-07-10T07:15:00Z',
    status: 'Barcode Printed',
    resultMatrix: cloneMatrix(CBC_RESULT_MATRIX),
  },
  {
    trackingId: 'LAB-ORD-2403',
    patientReferenceId: 'NX-2026-119045',
    patientInitials: 'S.M.',
    testName: 'Liver Function Panel',
    specimenCategory: 'Blood',
    collectionTimestamp: '2026-07-10T06:40:00Z',
    status: 'Processing',
    resultMatrix: cloneMatrix(LFT_RESULT_MATRIX),
  },
  {
    trackingId: 'LAB-ORD-2404',
    patientReferenceId: 'NX-2026-774320',
    patientInitials: 'A.K.',
    testName: 'Urinalysis · Routine',
    specimenCategory: 'Urine',
    collectionTimestamp: '2026-07-10T08:00:00Z',
    status: 'Awaiting Verification',
    resultMatrix: [
      { parameterKey: 'ph', label: 'pH', unit: '', referenceMin: 4.5, referenceMax: 8.0, value: '6.2' },
      { parameterKey: 'sg', label: 'Specific Gravity', unit: '', referenceMin: 1.005, referenceMax: 1.030, value: '1.018' },
      { parameterKey: 'protein', label: 'Protein', unit: 'mg/dL', referenceMin: 0, referenceMax: 15, value: '8' },
    ],
  },
  {
    trackingId: 'LAB-ORD-2405',
    patientReferenceId: 'NX-2026-558901',
    patientInitials: 'H.D.',
    testName: 'Throat Swab · Culture',
    specimenCategory: 'Swab',
    collectionTimestamp: '2026-07-10T08:22:00Z',
    status: 'Processing',
    resultMatrix: [
      { parameterKey: 'gram', label: 'Gram Stain', unit: '', referenceMin: 0, referenceMax: 0, value: '' },
      { parameterKey: 'culture', label: 'Culture Result', unit: '', referenceMin: 0, referenceMax: 0, value: '' },
    ],
  },
];

export const SEED_RADIOLOGY_SESSIONS: RadiologyScanSession[] = [
  {
    sessionId: 'RAD-SES-901',
    appointmentSlotNumber: 'SLOT-14',
    machineRoomLocator: 'Block B · MRI Suite 2 · Floor 1',
    patientReferenceId: 'NX-2026-482910',
    patientInitials: 'R.K.',
    studyName: 'MRI Brain Plain',
    imageFileUrls: ['/mock-imaging/mri-brain-001.dcm'],
    technicianNotes: 'Patient claustrophobic — mild sedation administered.',
    status: 'In Progress',
  },
  {
    sessionId: 'RAD-SES-902',
    appointmentSlotNumber: 'SLOT-18',
    machineRoomLocator: 'Block A · X-Ray Room 3 · Ground',
    patientReferenceId: 'NX-2026-301882',
    patientInitials: 'P.N.',
    studyName: 'Chest X-Ray PA View',
    imageFileUrls: ['/mock-imaging/cxr-pa-002.dcm', '/mock-imaging/cxr-lat-002.dcm'],
    technicianNotes: '',
    status: 'Scheduled',
  },
  {
    sessionId: 'RAD-SES-903',
    appointmentSlotNumber: 'SLOT-09',
    machineRoomLocator: 'Block C · CT Suite 1 · Floor 2',
    patientReferenceId: 'NX-2026-119045',
    patientInitials: 'S.M.',
    studyName: 'CT Abdomen Contrast',
    imageFileUrls: ['/mock-imaging/ct-abd-003.dcm'],
    technicianNotes: 'Contrast tolerated well. Hydration advised post-scan.',
    status: 'Report Pending',
  },
];

export const SEED_MEDICATION_BATCHES: MedicationInventoryBatch[] = [
  {
    batchNumberCode: 'BT-DOLO-26A',
    manufacturedDate: '2025-11-01',
    expiryDate: '2027-10-31',
    stockCountRemaining: 420,
    genericCompoundKey: 'paracetamol',
  },
  {
    batchNumberCode: 'BT-AUG-25X',
    manufacturedDate: '2025-06-15',
    expiryDate: '2026-08-14',
    stockCountRemaining: 0,
    genericCompoundKey: 'amoxicillin-clavulanic',
  },
  {
    batchNumberCode: 'BT-PANTO-26C',
    manufacturedDate: '2026-01-20',
    expiryDate: '2028-01-19',
    stockCountRemaining: 8,
    genericCompoundKey: 'pantoprazole',
  },
  {
    batchNumberCode: 'BT-INS-25Z',
    manufacturedDate: '2025-09-01',
    expiryDate: '2026-09-30',
    stockCountRemaining: 34,
    genericCompoundKey: 'insulin-glargine',
  },
  {
    batchNumberCode: 'BT-CEFT-26B',
    manufacturedDate: '2026-02-10',
    expiryDate: '2027-02-09',
    stockCountRemaining: 56,
    genericCompoundKey: 'ceftriaxone',
  },
];

const RX_LINES: PrescriptionLineItem[] = [
  {
    id: 'rxl-1',
    catalogId: 'PHM-001',
    drugName: 'Dolo 650',
    genericFormula: 'Paracetamol 650 mg',
    dosageInstructions: '1 tab PO TID after meals · 5 days',
    quantityOrdered: 15,
    unitPrice: 2.8,
    stockLevel: 'In Stock',
    batch: SEED_MEDICATION_BATCHES[0] ?? null,
    fulfilled: true,
  },
  {
    id: 'rxl-2',
    catalogId: 'PHM-002',
    drugName: 'Augmentin 625',
    genericFormula: 'Amoxicillin + Clavulanic Acid',
    dosageInstructions: '1 tab PO BID · 7 days',
    quantityOrdered: 14,
    unitPrice: 18.5,
    stockLevel: 'Out of Stock',
    batch: SEED_MEDICATION_BATCHES[1] ?? null,
    fulfilled: false,
  },
  {
    id: 'rxl-3',
    catalogId: 'PHM-005',
    drugName: 'Pantocid 40',
    genericFormula: 'Pantoprazole 40 mg',
    dosageInstructions: '1 tab PO OD before breakfast · 14 days',
    quantityOrdered: 14,
    unitPrice: 6.2,
    stockLevel: 'Low Stock',
    batch: SEED_MEDICATION_BATCHES[2] ?? null,
    fulfilled: true,
  },
  {
    id: 'rxl-4',
    catalogId: 'PHM-003',
    drugName: 'Insulin Glargine',
    genericFormula: 'Insulin Glargine 100 IU/mL',
    dosageInstructions: '12 units SC at bedtime',
    quantityOrdered: 2,
    unitPrice: 890,
    stockLevel: 'In Stock',
    batch: SEED_MEDICATION_BATCHES[3] ?? null,
    fulfilled: true,
  },
];

export const SEED_ACTIVE_PRESCRIPTION: ActivePrescription = {
  scriptId: 'RX-2026-8842',
  patientName: 'P.N.',
  patientUhid: 'NX-2026-301882',
  doctorName: 'Dr. Meera Iyer',
  issuedAt: '2026-07-10T09:12:00Z',
  lines: RX_LINES,
};

export const DEFAULT_GST_PERCENT = 5;

export function findMoleculeAlternatives(genericFormula: string): string[] {
  const key = genericFormula.toLowerCase();
  const alternatives: Record<string, string[]> = {
    'amoxicillin + clavulanic acid': [
      'Clavam 625 · Amoxicillin + Clavulanate',
      'Moxclav 625 · Same molecule · In stock',
      'Amoxyclav 625 · Substitutable generic',
    ],
    'pantoprazole 40 mg': ['Pan 40 · Pantoprazole', 'Pantodac 40 · Generic equivalent'],
    paracetamol: ['Calpol 650 · Paracetamol', 'Tylenol 650 · Import brand'],
  };

  for (const [pattern, list] of Object.entries(alternatives)) {
    if (key.includes(pattern.split(' ')[0] ?? '')) return list;
  }
  return [`Generic substitute for ${genericFormula} · Query master catalog`];
}
