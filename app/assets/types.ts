export type AssetTab = 'master' | 'calibration';

export type AmcStatus = 'Active' | 'Expired';

export type AssetOperationalStatus = 'Operational' | 'Under Repair' | 'Pending Calibration';

export type FaultUrgency = 'Low' | 'High' | 'Critical Breakdown';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface MedicalAsset {
  id: string;
  assetId: string;
  name: string;
  department: string;
  manufacturer: string;
  amcStatus: AmcStatus;
  amcRenewalDeadline: string;
  lastServiceDate: string;
  nextCalibrationDate: string;
  status: AssetOperationalStatus;
}

export interface MaintenanceTicket {
  id: string;
  assetId: string;
  assetName: string;
  urgency: FaultUrgency;
  description: string;
  reportedAt: string;
  status: TicketStatus;
}

export interface AssetMetrics {
  totalTrackedAssets: number;
  outOfService: number;
  calibrationsDue7Days: number;
  activeMaintenanceTickets: number;
}

export interface AssetToast {
  id: string;
  message: string;
  type: 'alert' | 'success' | 'info';
}

export const AMC_STYLES: Record<AmcStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Expired: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export const STATUS_STYLES: Record<AssetOperationalStatus, string> = {
  Operational: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  'Under Repair': 'bg-rose-100 text-rose-900 ring-rose-200',
  'Pending Calibration': 'bg-amber-100 text-amber-900 ring-amber-200',
};

export const URGENCY_STYLES: Record<FaultUrgency, string> = {
  Low: 'bg-slate-100 text-slate-900',
  High: 'bg-amber-100 text-amber-800',
  'Critical Breakdown': 'bg-rose-100 text-rose-900',
};

export function generateTicketId(): string {
  return `MNT-${Date.now().toString(36).toUpperCase()}`;
}

export function isCalibrationDueWithinDays(dateStr: string, days: number, now = new Date()): boolean {
  const target = new Date(dateStr);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return target >= now && target <= limit;
}

export function rollCalibrationDate(from: string, months = 6): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function computeAssetMetrics(
  assets: MedicalAsset[],
  tickets: MaintenanceTicket[],
  now = new Date(),
): AssetMetrics {
  return {
    totalTrackedAssets: assets.length,
    outOfService: assets.filter((a) => a.status === 'Under Repair').length,
    calibrationsDue7Days: assets.filter((a) =>
      isCalibrationDueWithinDays(a.nextCalibrationDate, 7, now),
    ).length,
    activeMaintenanceTickets: tickets.filter((t) => t.status !== 'Resolved').length,
  };
}
