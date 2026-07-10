import type { DashboardMetrics, DashboardNotification } from '../types';

export const INITIAL_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: 'n1',
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg below safety threshold — 142 units remaining (min 500).',
    severity: 'warning',
    module: 'Pharmacy',
    timestamp: '2026-07-09T06:12:00Z',
    read: false,
  },
  {
    id: 'n2',
    title: 'Emergency Case',
    message: 'Red Alert in ER — Trauma bay T-2, multi-vehicle collision, ETA 4 min.',
    severity: 'critical',
    module: 'Emergency',
    timestamp: '2026-07-09T06:08:00Z',
    read: false,
  },
  {
    id: 'n3',
    title: 'Critical Patient',
    message: 'ICU-4 — SpO₂ drop to 88%, rapid response team dispatched.',
    severity: 'critical',
    module: 'ICU',
    timestamp: '2026-07-09T05:55:00Z',
    read: false,
  },
  {
    id: 'n4',
    title: 'Pending Payment',
    message: 'Invoice INV-8842 (₹1,24,500) overdue by 12 days — vendor MedSupply Co.',
    severity: 'warning',
    module: 'Finance',
    timestamp: '2026-07-09T05:30:00Z',
    read: true,
  },
  {
    id: 'n5',
    title: 'System Sync',
    message: 'HL7/ADT feed synchronized — 47 patient records updated.',
    severity: 'info',
    module: 'Integration',
    timestamp: '2026-07-09T05:00:00Z',
    read: true,
  },
];

export const DASHBOARD_METRICS: DashboardMetrics = {
  todaysPatients: {
    count: 47,
    upcoming: [
      { id: 'p1', name: 'Ananya Sharma', time: '09:30', department: 'Cardiology' },
      { id: 'p2', name: 'Rajesh Kumar', time: '10:15', department: 'Orthopedics' },
      { id: 'p3', name: 'Priya Menon', time: '11:00', department: 'Endocrinology' },
      { id: 'p4', name: 'Vikram Patel', time: '11:45', department: 'General Medicine' },
    ],
  },
  appointments: {
    today: 32,
    yesterday: 28,
  },
  revenue: {
    amount: 1284500,
    currency: 'INR',
    sparkline: [820, 910, 880, 960, 1020, 990, 1140, 1080, 1200, 1284],
    changePercent: 8.4,
  },
  pendingBills: {
    count: 18,
    totalValue: 342800,
  },
  pendingPayments: {
    count: 7,
    oldestDays: 12,
    topInvoices: [
      { id: 'INV-8842', amount: 124500, vendor: 'MedSupply Co.' },
      { id: 'INV-8819', amount: 89200, vendor: 'PharmaLink Ltd.' },
      { id: 'INV-8801', amount: 45600, vendor: 'Surgical Hub' },
    ],
  },
  lowStock: [
    { id: 's1', name: 'Paracetamol 500mg', currentUnits: 142, safetyThreshold: 500, unit: 'tabs' },
    { id: 's2', name: 'Omez 20mg Capsules', currentUnits: 89, safetyThreshold: 300, unit: 'caps' },
    { id: 's3', name: 'Normal Saline 500ml', currentUnits: 34, safetyThreshold: 100, unit: 'bags' },
    { id: 's4', name: 'Insulin Glargine 100IU', currentUnits: 18, safetyThreshold: 80, unit: 'vials' },
  ],
  criticalPatients: [
    { id: 'c1', name: 'Meera Iyer', ward: 'ICU-4', vitals: 'SpO₂ 88%', priority: 'critical' },
    { id: 'c2', name: 'Arjun Das', ward: 'CCU-2', vitals: 'BP 190/120', priority: 'critical' },
    { id: 'c3', name: 'Lakshmi Nair', ward: 'Ward-7B', vitals: 'Temp 39.8°C', priority: 'high' },
  ],
  admissions: { today: 12, yesterday: 9 },
  discharges: { today: 8, yesterday: 11 },
  emergencyCases: [
    {
      id: 'e1',
      patient: 'Unknown — MVA',
      location: 'ER Trauma Bay T-2',
      triage: 'Red Alert',
      etaMinutes: 4,
    },
    {
      id: 'e2',
      patient: 'Sanjay Rao',
      location: 'ER Bay T-4',
      triage: 'Orange Alert',
      etaMinutes: 0,
    },
  ],
  executive: {
    operational: {
      opdCount: 142,
      ipdCount: 89,
      emergencyCount: 7,
      bedOccupancyPercent: 84,
      bedsFilled: 301,
      bedsTotal: 358,
      doctorsOnDuty: 24,
      doctorsOnCall: 4,
    },
    commercial: {
      todaysCollection: 2847500,
      collectionTrend: [
        { hour: '08', amount: 142000 },
        { hour: '09', amount: 318000 },
        { hour: '10', amount: 456000 },
        { hour: '11', amount: 612000 },
        { hour: '12', amount: 890000 },
        { hour: '13', amount: 1045000 },
        { hour: '14', amount: 1280000 },
        { hour: '15', amount: 1560000 },
        { hour: '16', amount: 1890000 },
        { hour: '17', amount: 2280000 },
        { hour: '18', amount: 2847500 },
      ],
      pendingBillsCount: 18,
      pendingBillsValue: 342800,
      pharmacy: {
        label: 'Pharmacy Sales',
        value: 486200,
        unit: 'INR',
        trend: [42, 58, 64, 72, 81, 88, 94],
        changePercent: 11.2,
      },
      laboratory: {
        label: 'Lab Samples',
        value: 312,
        unit: 'processed',
        trend: [28, 34, 41, 48, 52, 58, 62],
        changePercent: 6.8,
      },
      radiology: {
        label: 'Radiology Studies',
        value: 94,
        unit: 'completed',
        trend: [8, 12, 14, 18, 22, 26, 28],
        changePercent: 4.1,
      },
      scmAlerts: [
        {
          id: 'scm1',
          message: 'Insulin Stock Low in Main Pharmacy — 18 vials remaining (min 80)',
          severity: 'critical',
          module: 'Pharmacy SCM',
        },
        {
          id: 'scm2',
          message: '3 Purchase Requests Awaiting Approval — total value ₹8.4L',
          severity: 'warning',
          module: 'Procurement',
        },
        {
          id: 'scm3',
          message: 'Central Store: Surgical Gloves batch expiring in 14 days',
          severity: 'warning',
          module: 'Inventory',
        },
        {
          id: 'scm4',
          message: 'Vendor SLA breach — MedSupply Co. delivery delayed 2 days',
          severity: 'info',
          module: 'Vendor Hub',
        },
      ],
    },
    governance: {
      staffAttendancePercent: 94.2,
      patientSatisfaction: 4.7,
      aiInsights: [
        {
          id: 'ai1',
          type: 'predictive',
          message:
            'Predictive Alert: 12% ER influx surge expected between 19:00 – 22:00 based on historical Thursday patterns.',
          confidence: 87,
        },
        {
          id: 'ai2',
          type: 'operational',
          message:
            'ICU-4 bed turnover projected to free at 21:30 — recommend pre-admit from ER queue (2 candidates).',
          confidence: 79,
        },
        {
          id: 'ai3',
          type: 'financial',
          message:
            'Pharmacy revenue pacing 11% above forecast — high-margin oncology scripts driving uplift.',
          confidence: 92,
        },
        {
          id: 'ai4',
          type: 'predictive',
          message:
            'Staffing gap forecast: OPD peak at 10:00 tomorrow — suggest +2 duty nurses in Block C.',
          confidence: 74,
        },
      ],
    },
  },
};

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}
