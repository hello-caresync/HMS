import type { AiReportInsightStatus, AnalyticsTreeNodeId, TrendDirection } from '../reportsNav.types';

export type ExecutiveCensus = {
  opdToday: number;
  ipdCensus: number;
  erActive: number;
  bedOccupancyPct: number;
  alosDays: number;
  otUtilizationPct: number;
  icuOccupancyPct: number;
  totalRevenue: number;
  collections: number;
  expenses: number;
  netProfitLoss: number;
};

export type DepartmentStatusRow = {
  id: string;
  department: string;
  metric: string;
  value: string;
  status: 'Normal' | 'Warning' | 'Critical';
  lastUpdated: string;
};

export type DoctorPerformanceRow = {
  doctor: string;
  department: string;
  consultations: number;
  avgWaitMin: number;
  satisfaction: number;
};

export type WaitingTimeHeatCell = {
  hour: string;
  day: string;
  waitMin: number;
};

export type AiReportInsight = {
  id: string;
  category: 'Capacity' | 'Demand' | 'Revenue' | 'Resource' | 'Quality';
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  status: AiReportInsightStatus;
  confidencePct: number;
  generatedAt: string;
};

export type ProcurementVarianceRow = {
  vendor: string;
  category: string;
  quotedPrice: number;
  invoicedPrice: number;
  variancePct: number;
};

export type InventoryWastageRow = {
  item: string;
  consumed: number;
  wasted: number;
  wastagePct: number;
  trend: TrendDirection;
};

export type ClaimAnalysisRow = {
  tpa: string;
  submitted: number;
  approved: number;
  rejected: number;
  rejectionRatePct: number;
};

export type HrProductivityRow = {
  department: string;
  staffCount: number;
  overtimeHrs: number;
  productivityIndex: number;
  trend: TrendDirection;
};

export const EXECUTIVE_CENSUS: ExecutiveCensus = {
  opdToday: 486,
  ipdCensus: 312,
  erActive: 14,
  bedOccupancyPct: 82.1,
  alosDays: 3.8,
  otUtilizationPct: 74.5,
  icuOccupancyPct: 87.5,
  totalRevenue: 4280000,
  collections: 3910000,
  expenses: 3180000,
  netProfitLoss: 730000,
};

export const DEPARTMENT_STATUS_STREAM: DepartmentStatusRow[] = [
  { id: 'ds-1', department: 'ICU', metric: 'Occupancy', value: '28/32 (87.5%)', status: 'Warning', lastUpdated: '2026-07-18T08:45:00' },
  { id: 'ds-2', department: 'General Wards', metric: 'Available Beds', value: '18 beds free · 342 occupied', status: 'Normal', lastUpdated: '2026-07-18T08:44:00' },
  { id: 'ds-3', department: 'Laboratory', metric: 'Pending Reports', value: '142 backlog · 28 critical TAT breach', status: 'Critical', lastUpdated: '2026-07-18T08:43:00' },
  { id: 'ds-4', department: 'Pharmacy', metric: 'Low Reagent Alert', value: 'Piperacillin-Tazobactam · Enoxaparin · NS 500mL', status: 'Warning', lastUpdated: '2026-07-18T08:42:00' },
  { id: 'ds-5', department: 'Emergency', metric: 'Critical Notifications', value: 'Trauma activation · 2 STEMI pathways open', status: 'Critical', lastUpdated: '2026-07-18T08:41:00' },
  { id: 'ds-6', department: 'Radiology', metric: 'Scanner Queue', value: 'CT wait 42 min · MRI 68 min avg', status: 'Warning', lastUpdated: '2026-07-18T08:40:00' },
];

export const VISIT_VOLUME_TREND = [
  { month: 'Jan', opd: 11200, ipd: 820, er: 980 },
  { month: 'Feb', opd: 11800, ipd: 840, er: 920 },
  { month: 'Mar', opd: 12100, ipd: 860, er: 1010 },
  { month: 'Apr', opd: 11900, ipd: 855, er: 990 },
  { month: 'May', opd: 12400, ipd: 880, er: 1050 },
  { month: 'Jun', opd: 12800, ipd: 910, er: 1100 },
  { month: 'Jul', opd: 13200, ipd: 920, er: 1140 },
];

export const DEMOGRAPHIC_DISTRIBUTION = [
  { band: '0-18', male: 820, female: 760 },
  { band: '19-35', male: 1420, female: 1580 },
  { band: '36-50', male: 1180, female: 1240 },
  { band: '51-65', male: 980, female: 1020 },
  { band: '65+', male: 720, female: 880 },
];

export const DOCTOR_PERFORMANCE: DoctorPerformanceRow[] = [
  { doctor: 'Dr. Vikram Patil', department: 'Cardiology', consultations: 186, avgWaitMin: 22, satisfaction: 4.6 },
  { doctor: 'Dr. Meera Iyer', department: 'Emergency', consultations: 142, avgWaitMin: 8, satisfaction: 4.4 },
  { doctor: 'Dr. Arjun Rao', department: 'Orthopedics', consultations: 128, avgWaitMin: 31, satisfaction: 4.2 },
  { doctor: 'Dr. Sneha Kulkarni', department: 'General Medicine', consultations: 210, avgWaitMin: 28, satisfaction: 4.5 },
];

export const PEAK_HOUR_LOAD = [
  { hour: '08:00', opd: 42, er: 8 },
  { hour: '09:00', opd: 68, er: 12 },
  { hour: '10:00', opd: 86, er: 10 },
  { hour: '11:00', opd: 92, er: 14 },
  { hour: '12:00', opd: 74, er: 18 },
  { hour: '14:00', opd: 58, er: 11 },
  { hour: '16:00', opd: 64, er: 9 },
  { hour: '18:00', opd: 48, er: 16 },
];

export const ALOS_TREND = [
  { week: 'W1', medical: 4.2, surgical: 5.8, icu: 6.1 },
  { week: 'W2', medical: 4.0, surgical: 5.5, icu: 5.9 },
  { week: 'W3', medical: 3.9, surgical: 5.2, icu: 5.8 },
  { week: 'W4', medical: 3.8, surgical: 5.0, icu: 5.6 },
];

export const MORTALITY_TREND = [
  { quarter: 'Q1', observed: 1.8, expected: 2.1 },
  { quarter: 'Q2', observed: 1.6, expected: 2.0 },
  { quarter: 'Q3', observed: 1.7, expected: 1.9 },
  { quarter: 'Q4', observed: 1.5, expected: 1.8 },
];

export const READMISSION_RATES = [
  { dept: 'Cardiology', rate: 8.2, benchmark: 10 },
  { dept: 'Orthopedics', rate: 4.1, benchmark: 5 },
  { dept: 'General Med', rate: 6.8, benchmark: 8 },
  { dept: 'Nephrology', rate: 11.4, benchmark: 12 },
];

export const INFECTION_CONTROL = [
  { month: 'Jan', hai: 2.4, clabsi: 0.8, cauti: 1.2 },
  { month: 'Feb', hai: 2.2, clabsi: 0.6, cauti: 1.0 },
  { month: 'Mar', hai: 2.0, clabsi: 0.5, cauti: 0.9 },
  { month: 'Apr', hai: 1.9, clabsi: 0.4, cauti: 0.8 },
  { month: 'May', hai: 1.8, clabsi: 0.4, cauti: 0.7 },
  { month: 'Jun', hai: 1.7, clabsi: 0.3, cauti: 0.7 },
];

export const LAB_TAT_DATA = [
  { test: 'CBC', avgHrs: 2.1, targetHrs: 4, breach: 8 },
  { test: 'BMP', avgHrs: 3.4, targetHrs: 6, breach: 12 },
  { test: 'Troponin', avgHrs: 0.8, targetHrs: 1, breach: 2 },
  { test: 'Culture', avgHrs: 48, targetHrs: 72, breach: 5 },
  { test: 'HbA1c', avgHrs: 4.2, targetHrs: 8, breach: 6 },
];

export const RADIOLOGY_UTILIZATION = [
  { modality: 'CT', hoursUsed: 376, capacity: 400, pct: 94 },
  { modality: 'MRI', hoursUsed: 288, capacity: 400, pct: 72 },
  { modality: 'X-Ray', hoursUsed: 320, capacity: 480, pct: 67 },
  { modality: 'Ultrasound', hoursUsed: 210, capacity: 320, pct: 66 },
];

export const PHARMACY_TURNOVER = [
  { category: 'Antibiotics', turnoverDays: 18, target: 21 },
  { category: 'Cardiac', turnoverDays: 24, target: 28 },
  { category: 'Surgical Cons.', turnoverDays: 32, target: 30 },
  { category: 'IV Fluids', turnoverDays: 8, target: 10 },
];

export const WAITING_TIME_HEATMAP: WaitingTimeHeatCell[] = [
  { hour: '09', day: 'Mon', waitMin: 32 },
  { hour: '10', day: 'Mon', waitMin: 48 },
  { hour: '11', day: 'Mon', waitMin: 52 },
  { hour: '09', day: 'Wed', waitMin: 38 },
  { hour: '10', day: 'Wed', waitMin: 44 },
  { hour: '11', day: 'Wed', waitMin: 41 },
  { hour: '09', day: 'Fri', waitMin: 28 },
  { hour: '10', day: 'Fri', waitMin: 36 },
  { hour: '11', day: 'Fri', waitMin: 42 },
];

export const PROCUREMENT_VARIANCE: ProcurementVarianceRow[] = [
  { vendor: 'MedSupply India Pvt Ltd', category: 'Surgical Consumables', quotedPrice: 842000, invoicedPrice: 918000, variancePct: 9.0 },
  { vendor: 'PharmaCore Distributors', category: 'IV Antibiotics', quotedPrice: 420000, invoicedPrice: 425000, variancePct: 1.2 },
  { vendor: 'GE Healthcare Service', category: 'Imaging Spares', quotedPrice: 2100000, invoicedPrice: 2100000, variancePct: 0 },
];

export const INVENTORY_WASTAGE: InventoryWastageRow[] = [
  { item: 'Insulin Glargine', consumed: 420, wasted: 18, wastagePct: 4.1, trend: 'down' },
  { item: 'O-negative PRBC', consumed: 86, wasted: 4, wastagePct: 4.4, trend: 'stable' },
  { item: 'Contrast Media 100mL', consumed: 240, wasted: 22, wastagePct: 8.4, trend: 'up' },
  { item: 'Surgical Gloves (L)', consumed: 12000, wasted: 180, wastagePct: 1.5, trend: 'down' },
];

export const CLAIM_ANALYSIS: ClaimAnalysisRow[] = [
  { tpa: 'Star Health', submitted: 142, approved: 128, rejected: 14, rejectionRatePct: 9.9 },
  { tpa: 'ICICI Lombard', submitted: 98, approved: 82, rejected: 16, rejectionRatePct: 16.3 },
  { tpa: 'Tata AIG', submitted: 76, approved: 71, rejected: 5, rejectionRatePct: 6.6 },
  { tpa: 'Niva Bupa', submitted: 54, approved: 48, rejected: 6, rejectionRatePct: 11.1 },
];

export const HR_PRODUCTIVITY: HrProductivityRow[] = [
  { department: 'ICU Nursing', staffCount: 48, overtimeHrs: 312, productivityIndex: 92, trend: 'stable' },
  { department: 'Emergency', staffCount: 36, overtimeHrs: 428, productivityIndex: 88, trend: 'down' },
  { department: 'Laboratory', staffCount: 22, overtimeHrs: 86, productivityIndex: 95, trend: 'up' },
  { department: 'Housekeeping', staffCount: 64, overtimeHrs: 520, productivityIndex: 78, trend: 'down' },
];

export const INITIAL_AI_INSIGHTS: AiReportInsight[] = [
  { id: 'rai-1', category: 'Capacity', message: 'ICU beds may reach 95% occupancy tomorrow due to seasonal demand shifts and 3 pending cardiac surgery admissions', severity: 'Warning', status: 'Active', confidencePct: 87, generatedAt: '2026-07-18T08:00:00' },
  { id: 'rai-2', category: 'Demand', message: 'OPD patient load expected to surge by 20% next month — monsoon respiratory illness pattern detected across 3 prior seasons', severity: 'Info', status: 'Active', confidencePct: 82, generatedAt: '2026-07-18T07:30:00' },
  { id: 'rai-3', category: 'Revenue', message: 'Revenue forecast Q3 FY26: ₹12.8 Cr (+8.2% YoY) driven by cath lab expansion and corporate tie-up volume', severity: 'Info', status: 'Active', confidencePct: 79, generatedAt: '2026-07-17T18:00:00' },
  { id: 'rai-4', category: 'Quality', message: 'ICICI Lombard claim rejection rate elevated 16.3% — documentation gap on pre-auth codes flagged for billing review', severity: 'Critical', status: 'Active', confidencePct: 91, generatedAt: '2026-07-18T06:30:00' },
];

export const REVENUE_FORECAST = [
  { month: 'Aug', actual: 38, forecast: 40 },
  { month: 'Sep', actual: 0, forecast: 42 },
  { month: 'Oct', actual: 0, forecast: 44 },
  { month: 'Nov', actual: 0, forecast: 43 },
  { month: 'Dec', actual: 0, forecast: 46 },
  { month: 'Jan', actual: 0, forecast: 48 },
];

export const REPORT_BUILDER_FIELDS = [
  { id: 'patient-volume', label: 'Patient Volume', group: 'Clinical' },
  { id: 'bed-occupancy', label: 'Bed Occupancy %', group: 'Operational' },
  { id: 'revenue-stream', label: 'Revenue by Stream', group: 'Financial' },
  { id: 'lab-tat', label: 'Lab TAT Metrics', group: 'Ancillary' },
  { id: 'claim-rejection', label: 'Claim Rejection Rate', group: 'Finance' },
  { id: 'doctor-productivity', label: 'Doctor Productivity', group: 'Clinical' },
];

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatInrCr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return formatInr(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function searchReports(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const pool = [
    ...DOCTOR_PERFORMANCE.map((d) => d.doctor),
    ...DEPARTMENT_STATUS_STREAM.map((d) => d.department),
    ...CLAIM_ANALYSIS.map((c) => c.tpa),
    'executive dashboard',
    'clinical quality',
    'revenue forecast',
  ];
  return pool.filter((s) => s.toLowerCase().includes(q)).length;
}

export function getNodeTitle(nodeId: AnalyticsTreeNodeId): string {
  const map: Record<AnalyticsTreeNodeId, string> = {
    'patient-demographics': 'Demographic Distribution',
    'patient-visits': 'Visit Volume Curves',
    'opd-doctor-performance': 'Doctor Performance Analytics',
    'opd-peak-hours': 'Peak Hour Load Analysis',
    'ipd-alos': 'Average Length of Stay Tracking',
    'quality-mortality': 'Mortality Rate Benchmarking',
    'quality-readmission': '30-Day Readmission Analysis',
    'quality-infection': 'HAI / Infection Control Trends',
    'ancillary-lab-tat': 'Laboratory Turnaround Time',
    'ancillary-radiology': 'Radiology Scanner Utilization',
    'ancillary-pharmacy': 'Pharmacy Stock Turnover Ratios',
  };
  return map[nodeId];
}
