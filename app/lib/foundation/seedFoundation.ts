import type {
  FacilityBedContainer,
  HospitalBranchConfig,
  InsuranceProviderConfig,
  MedicalTestItem,
  PharmacyMasterEntry,
} from './types';

export const SEED_BRANCHES: HospitalBranchConfig[] = [
  {
    branchId: 'BR-NEX-MAIN',
    branchName: 'Nexora Multi-Specialty · Main Campus',
    branchAddress: '42 Healthcare Avenue, Bengaluru, KA 560001',
    defaultTaxGst: {
      defaultGstPercent: 5,
      gstRegistrationNumber: '29AABCN1234F1Z5',
      placeOfSupply: 'Karnataka',
    },
  },
  {
    branchId: 'BR-NEX-NORTH',
    branchName: 'Nexora North Wing',
    branchAddress: '18 Ring Road North, Bengaluru, KA 560045',
    defaultTaxGst: {
      defaultGstPercent: 5,
      gstRegistrationNumber: '29AABCN5678G1Z2',
      placeOfSupply: 'Karnataka',
    },
  },
];

export const SEED_MEDICAL_TESTS: MedicalTestItem[] = [
  {
    itemCode: 'LAB-CBC-001',
    testName: 'Complete Blood Count',
    modality: 'Lab',
    standardPrice: 450,
    categoryCode: 'HEMATOLOGY',
  },
  {
    itemCode: 'LAB-LFT-014',
    testName: 'Liver Function Panel',
    modality: 'Lab',
    standardPrice: 980,
    categoryCode: 'BIOCHEMISTRY',
  },
  {
    itemCode: 'RAD-CXR-PA',
    testName: 'Chest X-Ray PA View',
    modality: 'Radiology',
    standardPrice: 650,
    categoryCode: 'IMAGING',
  },
  {
    itemCode: 'RAD-MRI-BRAIN',
    testName: 'MRI Brain Plain',
    modality: 'Radiology',
    standardPrice: 8500,
    categoryCode: 'IMAGING',
  },
];

export const SEED_INSURANCE_PROVIDERS: InsuranceProviderConfig[] = [
  {
    providerId: 'INS-STAR-001',
    tpaName: 'Star Health · Medi Assist',
    clearanceActive: true,
    settlementCapLimit: 500000,
  },
  {
    providerId: 'INS-HDFC-002',
    tpaName: 'HDFC ERGO · Paramount TPA',
    clearanceActive: true,
    settlementCapLimit: 750000,
  },
  {
    providerId: 'INS-ICICI-003',
    tpaName: 'ICICI Lombard · Health India',
    clearanceActive: false,
    settlementCapLimit: 300000,
  },
];

export const SEED_PHARMACY_CATALOG: PharmacyMasterEntry[] = [
  {
    id: 'PHM-001',
    drugName: 'Dolo 650',
    genericFormula: 'Paracetamol 650 mg',
    manufacturer: 'Micro Labs Ltd.',
    hsnCode: '30049061',
    packagingUnit: 'Strips',
    isActive: true,
  },
  {
    id: 'PHM-002',
    drugName: 'Augmentin 625',
    genericFormula: 'Amoxicillin + Clavulanic Acid',
    manufacturer: 'GlaxoSmithKline',
    hsnCode: '30041090',
    packagingUnit: 'Strips',
    isActive: true,
  },
  {
    id: 'PHM-003',
    drugName: 'Insulin Glargine',
    genericFormula: 'Insulin Glargine 100 IU/mL',
    manufacturer: 'Sanofi India',
    hsnCode: '30043100',
    packagingUnit: 'Vials',
    isActive: true,
  },
  {
    id: 'PHM-004',
    drugName: 'Normal Saline 500 mL',
    genericFormula: 'Sodium Chloride 0.9%',
    manufacturer: 'Baxter India',
    hsnCode: '30049099',
    packagingUnit: 'Boxes',
    isActive: true,
  },
  {
    id: 'PHM-005',
    drugName: 'Pantocid 40',
    genericFormula: 'Pantoprazole 40 mg',
    manufacturer: 'Sun Pharma',
    hsnCode: '30049079',
    packagingUnit: 'Strips',
    isActive: false,
  },
  {
    id: 'PHM-006',
    drugName: 'Ceftriaxone 1g',
    genericFormula: 'Ceftriaxone Sodium',
    manufacturer: 'Alkem Laboratories',
    hsnCode: '30042019',
    packagingUnit: 'Vials',
    isActive: true,
  },
];

export const SEED_BED_CONTAINERS: FacilityBedContainer[] = [
  {
    id: 'BED-CNT-001',
    branchId: 'BR-NEX-MAIN',
    floorName: 'Floor 4 · Critical Care',
    wardCategory: 'ICU',
    roomIdentifier: 'ICU-A',
    maxBedCount: 8,
    generatedBedIds: ['ICU-A-01', 'ICU-A-02', 'ICU-A-03', 'ICU-A-04', 'ICU-A-05', 'ICU-A-06', 'ICU-A-07', 'ICU-A-08'],
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'BED-CNT-002',
    branchId: 'BR-NEX-MAIN',
    floorName: 'Floor 3 · Cardiac',
    wardCategory: 'CCU',
    roomIdentifier: 'CCU-01',
    maxBedCount: 6,
    generatedBedIds: ['CCU-01-01', 'CCU-01-02', 'CCU-01-03', 'CCU-01-04', 'CCU-01-05', 'CCU-01-06'],
    createdAt: '2026-02-15T10:30:00.000Z',
  },
];

export function generateBedIds(roomIdentifier: string, count: number): string[] {
  const prefix = roomIdentifier.trim().toUpperCase().replace(/\s+/g, '-');
  return Array.from({ length: count }, (_, i) =>
    `${prefix}-${String(i + 1).padStart(2, '0')}`,
  );
}

export function generateContainerId(): string {
  return `BED-CNT-${Date.now().toString(36).toUpperCase()}`;
}

export function generatePharmacyId(): string {
  return `PHM-${String(Date.now()).slice(-6)}`;
}
