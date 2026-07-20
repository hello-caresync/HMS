export type AlertPillSeverity = 'critical' | 'warning' | 'info';

export type LiveAlert = {
  id: string;
  category: 'Critical Lab' | 'Emergency' | 'Equipment' | 'Inventory' | 'Patient Load';
  message: string;
  severity: AlertPillSeverity;
  timestamp: string;
};

export type QuickAction = {
  id: string;
  label: string;
  moduleId: string;
};

export type OccupancySnapshot = {
  totalToday: number;
  opd: number;
  ipd: number;
  emergency: number;
};

export type BedCluster = {
  occupied: number;
  available: number;
  total: number;
  icuOccupancyPercent: number;
  icuOccupied: number;
  icuTotal: number;
  wards: { name: string; occupied: number; total: number; status: 'normal' | 'high' | 'critical' }[];
};

export type StaffingSnapshot = {
  onDuty: number;
  doctorsAvailable: number;
  nursesOnShift: number;
  shortageAlerts: { department: string; gap: number; shift: string }[];
};

export type FinancialPulse = {
  totalRevenue: number;
  opdCollections: number;
  ipdCollections: number;
  pharmacyCollections: number;
  currency: string;
};

export type OpdQueueMetrics = {
  queueLength: number;
  inConsultation: number;
  waiting: number;
  avgWaitMinutes: number;
  roomsActive: number;
  peakHour: string;
};

export type LabOverview = {
  pendingSamples: number;
  criticalResults: number;
  inProcessing: number;
  tatBreaches: number;
  rows: { id: string; test: string; patient: string; priority: 'STAT' | 'Routine'; status: string }[];
};

export type RadiologyOverview = {
  mriQueue: number;
  ctQueue: number;
  xrayQueue: number;
  urgentReads: number;
  rows: { id: string; modality: 'MRI' | 'CT' | 'X-Ray'; patient: string; orderedAt: string; status: string }[];
};

export type PharmacyStatus = {
  pendingPrescriptions: number;
  lowStockItems: number;
  controlledDrugAudits: number;
  rows: { id: string; drug: string; patient: string; qty: string; status: 'Awaiting' | 'Partial' | 'Ready' }[];
};

export type TrendPoint = { label: string; value: number };

export type MultiTrendSeries = {
  revenue: TrendPoint[];
  patientsOpd: TrendPoint[];
  patientsIpd: TrendPoint[];
  bedOccupancy: TrendPoint[];
};

export type PredictiveInsight = {
  id: string;
  type: 'bed-shortage' | 'stock-out' | 'operational';
  title: string;
  detail: string;
  confidence: number;
  horizon: string;
};

export type EmergencyOps = {
  ambulancesEnRoute: number;
  triage: { level: string; count: number; color: string }[];
  erBedsAvailable: number;
  erBedsTotal: number;
  codeBlueActive: { id: string; location: string; time: string }[];
};

export type ActivityEvent = {
  id: string;
  type: 'admission' | 'billing' | 'login';
  title: string;
  detail: string;
  timestamp: string;
};

export type ScheduleItem = {
  id: string;
  kind: 'surgery' | 'shift' | 'ot';
  title: string;
  subtitle: string;
  time: string;
};

export type ExecutiveOperationsData = {
  liveAlerts: LiveAlert[];
  quickActions: QuickAction[];
  occupancy: OccupancySnapshot;
  beds: BedCluster;
  staffing: StaffingSnapshot;
  financial: FinancialPulse;
  opdQueue: OpdQueueMetrics;
  laboratory: LabOverview;
  radiology: RadiologyOverview;
  pharmacy: PharmacyStatus;
  trends: MultiTrendSeries;
  aiInsights: PredictiveInsight[];
  emergency: EmergencyOps;
  activities: ActivityEvent[];
  schedule: ScheduleItem[];
};
