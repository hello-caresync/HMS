export type ReportDimension =
  | 'patient'
  | 'revenue'
  | 'inventory'
  | 'purchase'
  | 'doctor'
  | 'lab'
  | 'hr'
  | 'audit';

export type ExportFormat = 'pdf' | 'csv';

export interface DimensionSummary {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface RevenueReportRow {
  id: string;
  period: string;
  department: string;
  grossRevenue: number;
  gstCollected: number;
  deductions: number;
  netProfit: number;
}

export interface RevenueTrendPoint {
  month: string;
  netProfit: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  componentChecked: string;
  actionUndertaken: string;
  impactValue: number;
}

export interface GenericReportRow {
  id: string;
  label: string;
  metric: string;
  value: string;
  status: string;
  period: string;
}

export interface ReportsToast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

export const DIMENSION_LABELS: Record<ReportDimension, string> = {
  patient: 'Patient Reports',
  revenue: 'Revenue Reports',
  inventory: 'Inventory Reports',
  purchase: 'Purchase Reports',
  doctor: 'Doctor Reports',
  lab: 'Lab Reports',
  hr: 'HR Reports',
  audit: 'Audit Reports',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}
