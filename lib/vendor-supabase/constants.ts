export const DEFAULT_VENDOR_ID = '11111111-1111-1111-1111-111111111111';

export const PRODUCT_CATEGORIES = ['Medicine', 'Surgical', 'Equipment', 'Laboratory'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PO_STATUS_FILTERS = ['All', 'Issued', 'Accepted', 'Completed'] as const;

export type PoStatusFilter = (typeof PO_STATUS_FILTERS)[number];

export const PO_STATUS_DB: Record<Exclude<PoStatusFilter, 'All'>, string> = {
  Issued: 'ISSUED',
  Accepted: 'ACCEPTED',
  Completed: 'COMPLETED',
};

export const REQUIRED_COMPLIANCE_DOC_TYPES = [
  'Drug License',
  'GST Certificate',
  'ISO Certification',
  'NABH Compliance',
] as const;

export type RequiredComplianceDocType = (typeof REQUIRED_COMPLIANCE_DOC_TYPES)[number];

export const COMPLIANCE_UPLOAD_DOC_TYPES = [
  'Drug License',
  'GST Certificate',
  'ISO Certification',
  'NABH Compliance',
  'Other',
] as const;

export const SERVICE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const FORECAST_HORIZONS = [30, 60, 90] as const;

export const FORECAST_CATEGORIES = ['Medicine', 'Surgical', 'Equipment'] as const;
