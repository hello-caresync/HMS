import type { ExecutiveOperationsData } from '../types/executiveOperations';

export const EXECUTIVE_OPERATIONS_DATA: ExecutiveOperationsData = {
  liveAlerts: [
    {
      id: 'la1',
      category: 'Critical Lab',
      message: 'STAT Troponin-I elevated — Patient MRN-88421 (ICU-4), repeat draw in 15 min',
      severity: 'critical',
      timestamp: '2026-07-17T05:42:00Z',
    },
    {
      id: 'la2',
      category: 'Emergency',
      message: 'Red triage — MVA with polytrauma, Trauma Bay T-2, ETA 3 min via 108',
      severity: 'critical',
      timestamp: '2026-07-17T05:38:00Z',
    },
    {
      id: 'la3',
      category: 'Equipment',
      message: 'MRI Suite-2 chiller fault — scan backlog +45 min, biomedical ticket #BM-4421',
      severity: 'warning',
      timestamp: '2026-07-17T05:22:00Z',
    },
    {
      id: 'la4',
      category: 'Inventory',
      message: 'Insulin Glargine 100IU — 18 vials (min 80), central pharmacy reorder triggered',
      severity: 'warning',
      timestamp: '2026-07-17T05:10:00Z',
    },
    {
      id: 'la5',
      category: 'Patient Load',
      message: 'OPD Block C at 118% capacity — avg wait 34 min, 2 overflow bays activated',
      severity: 'warning',
      timestamp: '2026-07-17T04:55:00Z',
    },
  ],
  quickActions: [
    { id: 'qa1', label: 'Register Patient', moduleId: 'patient-registration' },
    { id: 'qa2', label: 'Book Appointment', moduleId: 'appointments' },
    { id: 'qa3', label: 'Admit Patient', moduleId: 'admissions' },
    { id: 'qa4', label: 'Generate Invoice', moduleId: 'billing' },
    { id: 'qa5', label: 'Create Purchase Request', moduleId: 'procurement' },
    { id: 'qa6', label: 'Emergency Admission', moduleId: 'emergency' },
  ],
  occupancy: {
    totalToday: 847,
    opd: 412,
    ipd: 389,
    emergency: 46,
  },
  beds: {
    occupied: 301,
    available: 57,
    total: 358,
    icuOccupancyPercent: 91,
    icuOccupied: 41,
    icuTotal: 45,
    wards: [
      { name: 'General Medicine A', occupied: 38, total: 42, status: 'high' },
      { name: 'Orthopedics B', occupied: 34, total: 36, status: 'critical' },
      { name: 'Pediatrics C', occupied: 22, total: 28, status: 'normal' },
      { name: 'Maternity D', occupied: 18, total: 24, status: 'normal' },
    ],
  },
  staffing: {
    onDuty: 186,
    doctorsAvailable: 24,
    nursesOnShift: 92,
    shortageAlerts: [
      { department: 'Emergency', gap: 2, shift: 'Morning (07:00–15:00)' },
      { department: 'ICU', gap: 1, shift: 'Morning (07:00–15:00)' },
    ],
  },
  financial: {
    totalRevenue: 2847500,
    opdCollections: 1124800,
    ipdCollections: 1236500,
    pharmacyCollections: 486200,
    currency: 'INR',
  },
  opdQueue: {
    queueLength: 68,
    inConsultation: 14,
    waiting: 54,
    avgWaitMinutes: 28,
    roomsActive: 18,
    peakHour: '10:30–12:00',
  },
  laboratory: {
    pendingSamples: 47,
    criticalResults: 3,
    inProcessing: 112,
    tatBreaches: 5,
    rows: [
      { id: 'l1', test: 'CBC + CRP Panel', patient: 'Ananya Sharma', priority: 'STAT', status: 'Processing' },
      { id: 'l2', test: 'HbA1c', patient: 'Rajesh Kumar', priority: 'Routine', status: 'Collected' },
      { id: 'l3', test: 'LFT + KFT', patient: 'Meera Iyer', priority: 'STAT', status: 'Critical Hold' },
      { id: 'l4', test: 'Blood Culture ×2', patient: 'Vikram Patel', priority: 'STAT', status: 'Incubating' },
    ],
  },
  radiology: {
    mriQueue: 8,
    ctQueue: 12,
    xrayQueue: 19,
    urgentReads: 4,
    rows: [
      { id: 'r1', modality: 'MRI', patient: 'Priya Menon', orderedAt: '09:12', status: 'In Scanner' },
      { id: 'r2', modality: 'CT', patient: 'Arjun Das', orderedAt: '09:28', status: 'Awaiting Contrast' },
      { id: 'r3', modality: 'X-Ray', patient: 'Lakshmi Nair', orderedAt: '09:41', status: 'Queued' },
      { id: 'r4', modality: 'CT', patient: 'Sanjay Rao', orderedAt: '09:55', status: 'Radiologist Review' },
    ],
  },
  pharmacy: {
    pendingPrescriptions: 34,
    lowStockItems: 7,
    controlledDrugAudits: 2,
    rows: [
      { id: 'p1', drug: 'Amoxicillin 500mg ×21', patient: 'Ananya Sharma', qty: '21 tabs', status: 'Awaiting' },
      { id: 'p2', drug: 'Metformin 850mg ×60', patient: 'Rajesh Kumar', qty: '60 tabs', status: 'Partial' },
      { id: 'p3', drug: 'Morphine 10mg amp', patient: 'Meera Iyer', qty: '2 amp', status: 'Ready' },
      { id: 'p4', drug: 'Insulin Glargine pen', patient: 'Vikram Patel', qty: '1 pen', status: 'Awaiting' },
    ],
  },
  trends: {
    revenue: [
      { label: 'Mon', value: 2180000 },
      { label: 'Tue', value: 2310000 },
      { label: 'Wed', value: 2450000 },
      { label: 'Thu', value: 2847500 },
      { label: 'Fri', value: 2620000 },
      { label: 'Sat', value: 1980000 },
      { label: 'Sun', value: 1740000 },
    ],
    patientsOpd: [
      { label: 'Mon', value: 378 },
      { label: 'Tue', value: 392 },
      { label: 'Wed', value: 401 },
      { label: 'Thu', value: 412 },
      { label: 'Fri', value: 388 },
      { label: 'Sat', value: 264 },
      { label: 'Sun', value: 198 },
    ],
    patientsIpd: [
      { label: 'Mon', value: 362 },
      { label: 'Tue', value: 371 },
      { label: 'Wed', value: 380 },
      { label: 'Thu', value: 389 },
      { label: 'Fri', value: 376 },
      { label: 'Sat', value: 348 },
      { label: 'Sun', value: 331 },
    ],
    bedOccupancy: [
      { label: 'Mon', value: 78 },
      { label: 'Tue', value: 81 },
      { label: 'Wed', value: 82 },
      { label: 'Thu', value: 84 },
      { label: 'Fri', value: 83 },
      { label: 'Sat', value: 76 },
      { label: 'Sun', value: 72 },
    ],
  },
  aiInsights: [
    {
      id: 'ai1',
      type: 'bed-shortage',
      title: 'Predicted Bed Shortage — Orthopedics B',
      detail: 'Model forecasts 100% occupancy by 18:00 with 3 pending admissions. Recommend diversion to Ward 6A (+4 beds).',
      confidence: 88,
      horizon: 'Next 6 hours',
    },
    {
      id: 'ai2',
      type: 'stock-out',
      title: 'Impending Stock-out — Insulin Glargine',
      detail: 'Consumption rate 4.2 vials/day vs 18 on hand. Projected stock-out in 4.2 days without expedited PO.',
      confidence: 94,
      horizon: 'Next 5 days',
    },
    {
      id: 'ai3',
      type: 'operational',
      title: 'OPD Throughput Optimization',
      detail: 'Reassign Dr. Nair to Block C overflow — projected wait reduction 28 → 19 min based on queue simulation.',
      confidence: 81,
      horizon: 'Today',
    },
    {
      id: 'ai4',
      type: 'bed-shortage',
      title: 'ICU Turnover Window',
      detail: 'Bed ICU-2 expected discharge 21:30 — pre-admit candidate from ER (MRN-77219, sepsis protocol).',
      confidence: 76,
      horizon: 'Tonight',
    },
  ],
  emergency: {
    ambulancesEnRoute: 3,
    triage: [
      { level: 'Red', count: 2, color: '#DC2626' },
      { level: 'Orange', count: 4, color: '#EA580C' },
      { level: 'Yellow', count: 11, color: '#CA8A04' },
      { level: 'Green', count: 29, color: '#16A34A' },
    ],
    erBedsAvailable: 4,
    erBedsTotal: 18,
    codeBlueActive: [
      { id: 'cb1', location: 'Ward 7B — Bed 14', time: '11:04' },
      { id: 'cb2', location: 'ICU-4', time: '10:52' },
    ],
  },
  activities: [
    {
      id: 'act1',
      type: 'admission',
      title: 'New IPD Admission',
      detail: 'Rajesh Kumar — MRN-90124 → Orthopedics B, Bed 12',
      timestamp: '2026-07-17T05:40:00Z',
    },
    {
      id: 'act2',
      type: 'billing',
      title: 'Invoice Generated',
      detail: 'INV-2026-8847 · ₹42,800 · IPD Day-3 package — Meera Iyer',
      timestamp: '2026-07-17T05:35:00Z',
    },
    {
      id: 'act3',
      type: 'login',
      title: 'Staff Login',
      detail: 'Dr. Priya Nair — Cardiology, workstation ER-Console-02',
      timestamp: '2026-07-17T05:28:00Z',
    },
    {
      id: 'act4',
      type: 'admission',
      title: 'ER to IPD Transfer',
      detail: 'Sanjay Rao — MRN-77204 → General Medicine A, Bed 08',
      timestamp: '2026-07-17T05:15:00Z',
    },
    {
      id: 'act5',
      type: 'billing',
      title: 'OPD Bill Settled',
      detail: 'INV-2026-8842 · ₹2,450 cash — Vikram Patel',
      timestamp: '2026-07-17T05:02:00Z',
    },
  ],
  schedule: [
    {
      id: 'sch1',
      kind: 'surgery',
      title: 'Laparoscopic Cholecystectomy',
      subtitle: 'OT-3 · Dr. Menon · MRN-88402',
      time: '12:30',
    },
    {
      id: 'sch2',
      kind: 'surgery',
      title: 'Total Knee Replacement',
      subtitle: 'OT-1 · Dr. Kapoor · MRN-77188',
      time: '14:00',
    },
    {
      id: 'sch3',
      kind: 'shift',
      title: 'Cardiology Handover',
      subtitle: 'Dr. Nair → Dr. Iyer · Block A',
      time: '15:00',
    },
    {
      id: 'sch4',
      kind: 'ot',
      title: 'OT-2 Sterilization Cycle',
      subtitle: 'Biomedical · 45 min turnaround',
      time: '16:15',
    },
    {
      id: 'sch5',
      kind: 'surgery',
      title: 'C-Section (Emergency)',
      subtitle: 'OT-4 · Dr. Rao · MRN-90131',
      time: '17:45',
    },
  ],
};

import { formatINR } from '@/lib/utils/currency';

export function formatInr(amount: number): string {
  return formatINR(amount);
}

export function formatCompact(amount: number): string {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return formatINR(amount);
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}
