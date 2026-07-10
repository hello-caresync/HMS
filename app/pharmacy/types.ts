import type { MedicineUnit } from '../master-data/types';

export type PharmacyOrderStatus = 'Pending Verification' | 'Partially Dispensed' | 'Completed';

export interface PharmacyInventoryItem {
  medicineId: string;
  genericName: string;
  brandName: string;
  batchNumber: string;
  expiryDate: string;
  stockCount: number;
  safetyThreshold: number;
  barcode: string;
  unit: MedicineUnit;
}

export interface DispenseLineItem {
  id: string;
  medicineId: string;
  genericName: string;
  brandName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  verified: boolean;
}

export interface PharmacyDispatchOrder {
  id: string;
  encounterId: string;
  patientName: string;
  uhid: string;
  prescribingDoctor: string;
  receivedAt: string;
  status: PharmacyOrderStatus;
  lineItems: DispenseLineItem[];
  dispensedAt?: string;
}

export interface PharmacyToast {
  id: string;
  message: string;
  type: 'alert' | 'success' | 'info';
  createdAt: string;
}

export interface LowStockAlert {
  medicineId: string;
  brandName: string;
  genericName: string;
  currentUnits: number;
  safetyThreshold: number;
  unit: MedicineUnit;
  dispatchedAt: string;
}

export const STATUS_STYLES: Record<PharmacyOrderStatus, string> = {
  'Pending Verification': 'bg-amber-100 text-amber-900 ring-amber-200',
  'Partially Dispensed': 'bg-sky-100 text-sky-900 ring-sky-200',
  Completed: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
};

export function deriveOrderStatus(
  lineItems: DispenseLineItem[],
  finalized: boolean,
): PharmacyOrderStatus {
  if (finalized) return 'Completed';
  const verified = lineItems.filter((l) => l.verified).length;
  if (verified === 0) return 'Pending Verification';
  return 'Partially Dispensed';
}

export function generatePharmacyOrderId(): string {
  return `phr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function generateLineItemId(): string {
  return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`;
}
