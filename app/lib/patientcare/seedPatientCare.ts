import type {
  AmbulanceTelemetry,
  CriticalAlertBanner,
  EmergencyTriageEntry,
  InstrumentChecklistItem,
  IpdWardAssignment,
  MarPrescriptionLine,
  OtScheduleSlot,
} from './types';

export const SEED_WARD_ASSIGNMENT: IpdWardAssignment = {
  wardId: 'WARD-GEN-3A',
  wardName: 'General Ward · 3A',
  floorLabel: 'Floor 3 · East Wing',
  beds: [
    { bedId: 'GEN-3A-01', label: '3A-01', occupancy: 'occupied', patientName: 'P.N.', patientUhid: 'NX-2026-301882', dietTag: 'Low Sodium' },
    { bedId: 'GEN-3A-02', label: '3A-02', occupancy: 'occupied', patientName: 'R.K.', patientUhid: 'NX-2026-482910', dietTag: 'Diabetic' },
    { bedId: 'GEN-3A-03', label: '3A-03', occupancy: 'vacant' },
    { bedId: 'GEN-3A-04', label: '3A-04', occupancy: 'occupied', patientName: 'S.M.', patientUhid: 'NX-2026-119045', dietTag: 'NPO / Nil Per Os' },
    { bedId: 'GEN-3A-05', label: '3A-05', occupancy: 'occupied', patientName: 'A.D.', patientUhid: 'NX-2026-558901', dietTag: 'Soft Diet' },
    { bedId: 'GEN-3A-06', label: '3A-06', occupancy: 'vacant' },
    { bedId: 'GEN-3A-07', label: '3A-07', occupancy: 'occupied', patientName: 'L.I.', patientUhid: 'NX-2026-774320', dietTag: 'Regular' },
    { bedId: 'GEN-3A-08', label: '3A-08', occupancy: 'occupied', patientName: 'V.P.', patientUhid: 'NX-2026-901234', dietTag: 'Low Sodium' },
  ],
};

export const SEED_MAR_LINES: MarPrescriptionLine[] = [
  { id: 'mar-1', bedId: 'GEN-3A-01', drugName: 'Pantoprazole 40 mg', dosage: '1 tab OD', route: 'PO', logs: { morning: true, afternoon: false, night: false } },
  { id: 'mar-2', bedId: 'GEN-3A-01', drugName: 'Amlodipine 5 mg', dosage: '1 tab OD', route: 'PO', logs: { morning: true, afternoon: false, night: false } },
  { id: 'mar-3', bedId: 'GEN-3A-02', drugName: 'Metformin 500 mg', dosage: '1 tab BID', route: 'PO', logs: { morning: true, afternoon: true, night: false } },
  { id: 'mar-4', bedId: 'GEN-3A-02', drugName: 'Insulin Glargine', dosage: '12 units', route: 'SC', logs: { morning: false, afternoon: false, night: true } },
  { id: 'mar-5', bedId: 'GEN-3A-04', drugName: 'Normal Saline 500 mL', dosage: 'IV infusion', route: 'IV', logs: { morning: true, afternoon: true, night: true } },
  { id: 'mar-6', bedId: 'GEN-3A-04', drugName: 'Ondansetron 4 mg', dosage: '1 tab TID PRN', route: 'PO', logs: { morning: false, afternoon: false, night: false } },
  { id: 'mar-7', bedId: 'GEN-3A-05', drugName: 'Paracetamol 650 mg', dosage: '1 tab TID', route: 'PO', logs: { morning: true, afternoon: false, night: false } },
  { id: 'mar-8', bedId: 'GEN-3A-07', drugName: 'Atorvastatin 10 mg', dosage: '1 tab HS', route: 'PO', logs: { morning: false, afternoon: false, night: false } },
  { id: 'mar-9', bedId: 'GEN-3A-08', drugName: 'Furosemide 40 mg', dosage: '1 tab OD', route: 'PO', logs: { morning: true, afternoon: false, night: false } },
];

export const SEED_TRIAGE_QUEUE: EmergencyTriageEntry[] = [
  { triageId: 'TRI-2401', patientIdentifier: 'Unknown Male · ~45y', chiefComplaint: 'Road traffic accident · head trauma', urgency: 'Critical / Resuscitation', registeredAt: '2026-07-10T09:02:00Z', traumaBedAssigned: null },
  { triageId: 'TRI-2402', patientIdentifier: 'K.V. · NX-2026-331002', chiefComplaint: 'Chest pain · radiating to arm', urgency: 'Urgent', registeredAt: '2026-07-10T09:08:00Z', traumaBedAssigned: 'TR-BED-03' },
  { triageId: 'TRI-2403', patientIdentifier: 'Walk-in · ankle sprain', chiefComplaint: 'Sports injury · swelling', urgency: 'Non-Urgent', registeredAt: '2026-07-10T09:15:00Z', traumaBedAssigned: null },
];

export const SEED_AMBULANCE_TELEMETRY: AmbulanceTelemetry[] = [
  { id: 'amb-1', unitId: 'AMB-07 · ALS', etaMinutes: 4, patientCount: 1, status: 'En Route', lastUpdate: '2026-07-10T09:18:00Z' },
  { id: 'amb-2', unitId: 'AMB-12 · BLS', etaMinutes: 0, patientCount: 2, status: 'Arrived', lastUpdate: '2026-07-10T09:16:00Z' },
  { id: 'amb-3', unitId: 'AMB-03 · ALS', etaMinutes: 12, patientCount: 1, status: 'En Route', lastUpdate: '2026-07-10T09:14:00Z' },
];

export const SEED_CRITICAL_ALERTS: CriticalAlertBanner[] = [
  { id: 'alert-1', message: 'Code Blue · Resuscitation Bay 2 · Activate crash team', severity: 'critical', triggeredAt: '2026-07-10T09:17:00Z' },
  { id: 'alert-2', message: 'Mass casualty protocol standby — 2 ambulances inbound', severity: 'warning', triggeredAt: '2026-07-10T09:12:00Z' },
];

export const TRAUMA_BEDS = ['TR-BED-01', 'TR-BED-02', 'TR-BED-03', 'TR-BED-04', 'TR-BED-05'];

export const SEED_OT_SLOTS: OtScheduleSlot[] = [
  { slotId: 'ot-1', theaterId: 'OT-1', theaterName: 'OT-1 · General Surgery', dateLabel: 'Today · 10 Jul 2026', startTime: '08:00', endTime: '10:30', patientName: 'S.M.', leadSurgeon: 'Dr. Arjun Das', procedureType: 'Laparoscopic Cholecystectomy', status: 'Post-Op Recovery' },
  { slotId: 'ot-2', theaterId: 'OT-1', theaterName: 'OT-1 · General Surgery', dateLabel: 'Today · 10 Jul 2026', startTime: '11:00', endTime: '13:00', patientName: 'R.K.', leadSurgeon: 'Dr. Meera Iyer', procedureType: 'Inguinal Hernia Repair', status: 'Pre-Op Checklist Pending' },
  { slotId: 'ot-3', theaterId: 'OT-2', theaterName: 'OT-2 · Orthopedics', dateLabel: 'Today · 10 Jul 2026', startTime: '09:00', endTime: '11:30', patientName: 'V.P.', leadSurgeon: 'Dr. Lakshmi Nair', procedureType: 'Total Knee Replacement', status: 'In Surgery' },
  { slotId: 'ot-4', theaterId: 'OT-2', theaterName: 'OT-2 · Orthopedics', dateLabel: 'Today · 10 Jul 2026', startTime: '12:30', endTime: '14:00', patientName: 'P.N.', leadSurgeon: 'Dr. Arjun Das', procedureType: 'ACL Reconstruction', status: 'Scheduled' },
  { slotId: 'ot-5', theaterId: 'OT-CARD', theaterName: 'Cardiac Suite', dateLabel: 'Today · 10 Jul 2026', startTime: '10:00', endTime: '14:00', patientName: 'Unknown Male', leadSurgeon: 'Dr. Priya Menon', procedureType: 'Emergency CABG', status: 'Pre-Op Checklist Pending' },
  { slotId: 'ot-6', theaterId: 'OT-CARD', theaterName: 'Cardiac Suite', dateLabel: 'Today · 10 Jul 2026', startTime: '15:00', endTime: '17:00', patientName: 'L.I.', leadSurgeon: 'Dr. Vikram Patel', procedureType: 'Pacemaker Implant', status: 'Scheduled' },
];

export const DEFAULT_INSTRUMENT_CHECKLIST: InstrumentChecklistItem[] = [
  { itemId: 'inst-1', instrumentName: 'Scalpel Handle #3', sterilizationBatch: 'STZ-2026-0710-A', verified: false },
  { itemId: 'inst-2', instrumentName: 'Mayo Scissors · Curved', sterilizationBatch: 'STZ-2026-0710-A', verified: false },
  { itemId: 'inst-3', instrumentName: 'Kelly Forceps · Straight', sterilizationBatch: 'STZ-2026-0710-B', verified: false },
  { itemId: 'inst-4', instrumentName: 'Needle Holder · Mayo-Hegar', sterilizationBatch: 'STZ-2026-0710-B', verified: false },
  { itemId: 'inst-5', instrumentName: 'Retractor · Weitlaner', sterilizationBatch: 'STZ-2026-0709-C', verified: false },
  { itemId: 'inst-6', instrumentName: 'Electrocautery Tip · Bipolar', sterilizationBatch: 'STZ-2026-0710-D', verified: false },
];

export function generateTriageId(existing: EmergencyTriageEntry[]): string {
  const n = existing.length + 1;
  return `TRI-${String(2400 + n)}`;
}

export const OT_THEATERS = [
  { id: 'OT-1', name: 'OT-1 · General Surgery' },
  { id: 'OT-2', name: 'OT-2 · Orthopedics' },
  { id: 'OT-CARD', name: 'Cardiac Suite' },
] as const;

export const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
