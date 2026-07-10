export type AlertSeverity = 'info' | 'warning' | 'critical';

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  module: string;
  timestamp: string;
  read: boolean;
};

export type UpcomingPatient = {
  id: string;
  name: string;
  time: string;
  department: string;
};

export type LowStockItem = {
  id: string;
  name: string;
  currentUnits: number;
  safetyThreshold: number;
  unit: string;
};

export type CriticalPatient = {
  id: string;
  name: string;
  ward: string;
  vitals: string;
  priority: 'critical' | 'high';
};

export type EmergencyCase = {
  id: string;
  patient: string;
  location: string;
  triage: string;
  etaMinutes: number;
};

export type ScmAlert = {
  id: string;
  message: string;
  severity: AlertSeverity;
  module: string;
};

export type AiInsight = {
  id: string;
  type: 'predictive' | 'operational' | 'financial';
  message: string;
  confidence: number;
};

export type AncillaryMetric = {
  label: string;
  value: number;
  unit: string;
  trend: number[];
  changePercent: number;
};

export type ExecutiveOperationalMetrics = {
  opdCount: number;
  ipdCount: number;
  emergencyCount: number;
  bedOccupancyPercent: number;
  bedsFilled: number;
  bedsTotal: number;
  doctorsOnDuty: number;
  doctorsOnCall: number;
};

export type ExecutiveCommercialMetrics = {
  todaysCollection: number;
  collectionTrend: { hour: string; amount: number }[];
  pendingBillsCount: number;
  pendingBillsValue: number;
  pharmacy: AncillaryMetric;
  laboratory: AncillaryMetric;
  radiology: AncillaryMetric;
  scmAlerts: ScmAlert[];
};

export type ExecutiveGovernanceMetrics = {
  staffAttendancePercent: number;
  patientSatisfaction: number;
  aiInsights: AiInsight[];
};

export type DashboardMetrics = {
  todaysPatients: {
    count: number;
    upcoming: UpcomingPatient[];
  };
  appointments: {
    today: number;
    yesterday: number;
  };
  revenue: {
    amount: number;
    currency: string;
    sparkline: number[];
    changePercent: number;
  };
  pendingBills: {
    count: number;
    totalValue: number;
  };
  pendingPayments: {
    count: number;
    oldestDays: number;
    topInvoices: { id: string; amount: number; vendor: string }[];
  };
  lowStock: LowStockItem[];
  criticalPatients: CriticalPatient[];
  admissions: { today: number; yesterday: number };
  discharges: { today: number; yesterday: number };
  emergencyCases: EmergencyCase[];
  executive: {
    operational: ExecutiveOperationalMetrics;
    commercial: ExecutiveCommercialMetrics;
    governance: ExecutiveGovernanceMetrics;
  };
};

export type ConfigurableWidgetId =
  | 'appointments'
  | 'critical-patients'
  | 'admissions'
  | 'discharges'
  | 'low-stock'
  | 'pending-payments'
  | 'emergency-detail';

export type ConfigurableWidget = {
  id: ConfigurableWidgetId;
  label: string;
  description: string;
  visible: boolean;
  order: number;
};
