/** Phase 1 Core Foundation — system definition types (Modules 3 & 4) */

export interface TaxGstParameters {
  defaultGstPercent: number;
  gstRegistrationNumber: string;
  placeOfSupply: string;
}

export interface HospitalBranchConfig {
  branchId: string;
  branchName: string;
  branchAddress: string;
  defaultTaxGst: TaxGstParameters;
}

export type DiagnosticModality = 'Lab' | 'Radiology';

export interface MedicalTestItem {
  itemCode: string;
  testName: string;
  modality: DiagnosticModality;
  standardPrice: number;
  categoryCode: string;
}

export interface InsuranceProviderConfig {
  providerId: string;
  tpaName: string;
  clearanceActive: boolean;
  settlementCapLimit: number;
}

export type WardCategory = 'ICU' | 'CCU' | 'General' | 'Semi-Private';

export interface FacilityBedContainer {
  id: string;
  branchId: string;
  floorName: string;
  wardCategory: WardCategory;
  roomIdentifier: string;
  maxBedCount: number;
  generatedBedIds: string[];
  createdAt: string;
}

export interface BedSetupDraft {
  branchId: string;
  floorName: string;
  wardCategory: WardCategory;
  roomIdentifier: string;
  maxBedCount: number;
}

export type PackagingUnitCategory =
  | 'Strips'
  | 'Vials'
  | 'Boxes'
  | 'Bottles'
  | 'Ampoules'
  | 'Tubes';

export interface PharmacyMasterEntry {
  id: string;
  drugName: string;
  genericFormula: string;
  manufacturer: string;
  hsnCode: string;
  packagingUnit: PackagingUnitCategory;
  isActive: boolean;
}

export interface CreatePharmacyEntryDraft {
  drugName: string;
  genericFormula: string;
  manufacturer: string;
  hsnCode: string;
  packagingUnit: PackagingUnitCategory;
  isActive: boolean;
}

export const WARD_CATEGORIES: WardCategory[] = [
  'ICU',
  'CCU',
  'General',
  'Semi-Private',
];

export const PACKAGING_UNITS: PackagingUnitCategory[] = [
  'Strips',
  'Vials',
  'Boxes',
  'Bottles',
  'Ampoules',
  'Tubes',
];
