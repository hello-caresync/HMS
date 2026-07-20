export type ReportsWorkspaceTab = 'executive' | 'operational' | 'finance';

export type ReportsModalType =
  | 'custom-report-builder'
  | 'export-dashboard'
  | 'schedule-report'
  | 'ai-forecast'
  | 'report-access-security'
  | null;

export type AnalyticsTreeNodeId =
  | 'patient-demographics'
  | 'patient-visits'
  | 'opd-doctor-performance'
  | 'opd-peak-hours'
  | 'ipd-alos'
  | 'quality-mortality'
  | 'quality-readmission'
  | 'quality-infection'
  | 'ancillary-lab-tat'
  | 'ancillary-radiology'
  | 'ancillary-pharmacy';

export type AiReportInsightStatus = 'Active' | 'Acknowledged' | 'Dismissed';

export type TrendDirection = 'up' | 'down' | 'stable';

export const REPORTS_WORKSPACE_TABS: { id: ReportsWorkspaceTab; label: string; description: string }[] = [
  { id: 'executive', label: 'Executive Command Dashboard & Live Performance', description: 'Census KPIs · departmental stream · export & AI quick actions' },
  { id: 'operational', label: 'Operational & Clinical Intelligence', description: 'Analytics directory · trend graphs · heat maps · performance tables' },
  { id: 'finance', label: 'Procurement, Finance & AI Hospital Intelligence', description: 'Supply chain ledger · claims · HR productivity · predictive AI' },
];

export type AnalyticsTreeGroup = {
  id: string;
  label: string;
  children: { id: AnalyticsTreeNodeId; label: string }[];
};

export const ANALYTICS_TREE: AnalyticsTreeGroup[] = [
  {
    id: 'patient',
    label: 'Patient Analytics',
    children: [
      { id: 'patient-demographics', label: 'Demographic Distribution' },
      { id: 'patient-visits', label: 'Visit Volume Curves' },
    ],
  },
  {
    id: 'opd-ipd',
    label: 'OPD / IPD Reports',
    children: [
      { id: 'opd-doctor-performance', label: 'Doctor Performance' },
      { id: 'opd-peak-hours', label: 'Peak Hour Loads' },
      { id: 'ipd-alos', label: 'ALOS Tracking' },
    ],
  },
  {
    id: 'clinical-quality',
    label: 'Clinical Quality Analytics',
    children: [
      { id: 'quality-mortality', label: 'Mortality Rates' },
      { id: 'quality-readmission', label: 'Readmission Rates' },
      { id: 'quality-infection', label: 'Infection Control Trends' },
    ],
  },
  {
    id: 'ancillary',
    label: 'EMR / Ancillary Services',
    children: [
      { id: 'ancillary-lab-tat', label: 'Lab Turnaround Time' },
      { id: 'ancillary-radiology', label: 'Radiology Scanner Utilization' },
      { id: 'ancillary-pharmacy', label: 'Pharmacy Stock Turnover' },
    ],
  },
];

export const DEFAULT_ANALYTICS_NODE: AnalyticsTreeNodeId = 'patient-visits';
