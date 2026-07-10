export type LabUrgency = 'Routine' | 'Urgent' | 'STAT';

export type LabOrderStatus =
  | 'pending_collection'
  | 'collected'
  | 'awaiting_results'
  | 'pending_approval'
  | 'approved';

export interface LabTestDefinition {
  code: string;
  name: string;
  unit: string;
  refMin: number;
  refMax: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface LabResultValue {
  testCode: string;
  value: number | null;
  isCritical: boolean;
  alertLevel: 'normal' | 'warning' | 'critical';
}

export interface LabOrder {
  id: string;
  patientName: string;
  uhid: string;
  orderedTests: string[];
  testCodes: string[];
  urgency: LabUrgency;
  status: LabOrderStatus;
  barcode?: string;
  collectedAt?: string;
  results: LabResultValue[];
  orderedBy: string;
  orderedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export const URGENCY_STYLES: Record<LabUrgency, string> = {
  Routine: 'bg-slate-100 text-slate-900 ring-slate-200',
  Urgent: 'bg-amber-100 text-amber-800 ring-amber-200',
  STAT: 'bg-rose-600 text-white ring-rose-700',
};

export function generateLabOrderId(): string {
  return `lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function generateBarcode(): string {
  const num = Math.floor(99000 + Math.random() * 999);
  return `NEX-LAB-${num}`;
}

export function evaluateResult(
  test: LabTestDefinition,
  value: number | null,
): { isCritical: boolean; alertLevel: 'normal' | 'warning' | 'critical' } {
  if (value === null || Number.isNaN(value)) {
    return { isCritical: false, alertLevel: 'normal' };
  }

  const critLow = test.criticalLow ?? test.refMin * 0.5;
  const critHigh = test.criticalHigh ?? test.refMax * 1.5;

  if (value <= critLow || value >= critHigh) {
    return { isCritical: true, alertLevel: 'critical' };
  }
  if (value < test.refMin || value > test.refMax) {
    return { isCritical: true, alertLevel: 'warning' };
  }
  return { isCritical: false, alertLevel: 'normal' };
}
