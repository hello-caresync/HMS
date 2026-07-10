export type RadiologyModality = 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound';

export type RadiologyStatus =
  | 'Pending Capture'
  | 'Ready for Interpretation'
  | 'In Interpretation'
  | 'Completed';

export interface RadiologyOrder {
  id: string;
  patientName: string;
  uhid: string;
  orderingDoctor: string;
  modality: RadiologyModality;
  scanDetails: string;
  clinicalHistory: string[];
  status: RadiologyStatus;
  uploadedFileName?: string;
  uploadedAt?: string;
  findings?: string;
  impression?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  emrAppended?: boolean;
}

export const MODALITIES: RadiologyModality[] = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound'];

export const STATUS_STYLES: Record<RadiologyStatus, string> = {
  'Pending Capture': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Ready for Interpretation': 'bg-sky-100 text-sky-800 ring-sky-200',
  'In Interpretation': 'bg-violet-100 text-violet-800 ring-violet-200',
  Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

export function generateRadiologyOrderId(): string {
  return `rad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export type ViewerType = 'chest-xray' | 'brain-mri' | 'generic';

export function viewerTypeForModality(modality: RadiologyModality): ViewerType {
  if (modality === 'X-Ray') return 'chest-xray';
  if (modality === 'MRI') return 'brain-mri';
  return 'generic';
}
