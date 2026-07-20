export type HospitalModuleConfig = {
  id: string;
  title: string;
  description: string;
  layer: string;
  features: string[];
  metrics?: { label: string; value: string }[];
};

export const HOSPITAL_MODULES: Record<string, HospitalModuleConfig> = {
  patients: {
    id: 'patients',
    title: 'Patient Management',
    description: 'Unified registration, demographic intake, and cross-department patient lifecycle tracking.',
    layer: 'Layer 3 · Core Operations',
    features: ['Registration desk', 'Demographics vault', 'Visit history', 'Consent tracking'],
    metrics: [
      { label: 'Active profiles', value: '12,842' },
      { label: 'Intake today', value: '186' },
    ],
  },
  appointments: {
    id: 'appointments',
    title: 'Appointment Scheduling',
    description: 'Token queue orchestration, provider slot allocation, and walk-in coordination.',
    layer: 'Layer 3 · Core Operations',
    features: ['Slot matrix', 'Walk-in queue', 'Provider calendars', 'SMS reminders'],
    metrics: [
      { label: 'Booked today', value: '342' },
      { label: 'Open slots', value: '48' },
    ],
  },
  opd: {
    id: 'opd',
    title: 'OPD Consultation',
    description: 'Outpatient intake pipeline, consult routing, and department wait-time telemetry.',
    layer: 'Layer 3 · Core Operations',
    features: ['Token routing', 'Triage lanes', 'Consult handoff', 'Vitals sync'],
    metrics: [
      { label: 'Queue depth', value: '24' },
      { label: 'Avg wait', value: '14m' },
    ],
  },
  emr: {
    id: 'emr',
    title: 'EMR Updates',
    description: 'Clinical charting updates, encounter notes, and structured documentation workflows.',
    layer: 'Layer 3 · Core Operations',
    features: ['Encounter notes', 'Problem list', 'Care plans', 'Audit trail'],
  },
  laboratory: {
    id: 'laboratory',
    title: 'Laboratory Handoff',
    description: 'Sample processing queues, result posting, and lab-to-ward communication bridges.',
    layer: 'Layer 3 · Core Operations',
    features: ['Order intake', 'Sample tracking', 'Result validation', 'Critical alerts'],
  },
  radiology: {
    id: 'radiology',
    title: 'Radiology Handoff',
    description: 'Imaging order routing, modality scheduling, and report distribution.',
    layer: 'Layer 3 · Core Operations',
    features: ['Modality slots', 'PACS bridge', 'Report sign-off', 'Contrast protocols'],
  },
  pharmacy: {
    id: 'pharmacy',
    title: 'Pharmacy Handoff',
    description: 'Dispensing fulfillment, verification queues, and ward batch dispatch.',
    layer: 'Layer 3 · Core Operations',
    features: ['Rx verification', 'Batch dispatch', 'Interaction checks', 'Inventory tie-in'],
  },
  admissions: {
    id: 'admissions',
    title: 'Inpatient Admission',
    description: 'Bed matrix allocation, intake authorization, and ward assignment workflows.',
    layer: 'Layer 3 · Core Operations',
    features: ['Bed matrix', 'Pre-auth', 'Ward routing', 'Care team assign'],
  },
  ipd: {
    id: 'ipd',
    title: 'IPD Care',
    description: 'Inpatient ward census, nursing dashboards, and active bed load monitoring.',
    layer: 'Layer 3 · Core Operations',
    features: ['Ward census', 'MAR charting', 'Nursing notes', 'Transfer requests'],
    metrics: [
      { label: 'Occupied beds', value: '115/132' },
      { label: 'Available', value: '17' },
    ],
  },
  emergency: {
    id: 'emergency',
    title: 'Emergency',
    description: 'Triage intake board, priority escalation lanes, and resuscitation bay status.',
    layer: 'Layer 3 · Core Operations',
    features: ['P1/P2 triage', 'Bay allocation', 'Ambulance intake', 'Mass casualty mode'],
  },
  ot: {
    id: 'ot',
    title: 'Operating Theatre Coordination',
    description: 'Theater schedule control, sterile field verification, and surgical safety checklists.',
    layer: 'Layer 3 · Core Operations',
    features: ['Theater grid', 'WHO checklist', 'Anesthesia roster', 'Instrument trace'],
  },
  discharge: {
    id: 'discharge',
    title: 'Patient Discharge',
    description: 'Discharge summary compilation, billing clearance, and follow-up scheduling.',
    layer: 'Layer 3 · Core Operations',
    features: ['Summary builder', 'Clearance gates', 'Follow-up slots', 'Medication reconciliation'],
  },
  billing: {
    id: 'billing',
    title: 'Billing Ledger',
    description: 'Invoice generation, GST compliance tracking, and revenue reconciliation.',
    layer: 'Layer 3 · Core Operations',
    features: ['Invoice builder', 'GST ledger', 'Payer mapping', 'Write-off controls'],
  },
  'dept-opd': {
    id: 'dept-opd',
    title: 'OPD Clinics',
    description: 'Active outpatient clinic spaces, consult rooms, and department throughput.',
    layer: 'Layer 4 · Clinical Departments',
    features: ['Clinic rooms', 'Provider roster', 'Wait boards', 'Referral intake'],
  },
  'dept-laboratory': {
    id: 'dept-laboratory',
    title: 'Laboratory Registry',
    description: 'Central lab registry, analyzer status, and specimen processing lanes.',
    layer: 'Layer 4 · Clinical Departments',
    features: ['Analyzer grid', 'QC logs', 'Specimen registry', 'Turnaround SLA'],
  },
  'dept-radiology': {
    id: 'dept-radiology',
    title: 'Radiology Scanning Terminal',
    description: 'Modality consoles, scan session control, and imaging workflow terminals.',
    layer: 'Layer 4 · Clinical Departments',
    features: ['MRI/CT/US slots', 'Technologist desk', 'Contrast logs', 'Archive bridge'],
  },
  'dept-pharmacy': {
    id: 'dept-pharmacy',
    title: 'Pharmacy Inventory',
    description: 'Formulary stock matrix, expiry watch, and dispensing counter operations.',
    layer: 'Layer 4 · Clinical Departments',
    features: ['Formulary index', 'Expiry watch', 'Cold chain', 'Narcotics vault'],
  },
  'dept-emr-vault': {
    id: 'dept-emr-vault',
    title: 'Unified EMR Vault',
    description: 'Enterprise clinical record repository with structured history and document spine.',
    layer: 'Layer 4 · Clinical Departments',
    features: ['Chart search', 'Document spine', 'Allergy flags', 'Surgical history'],
  },
  'bill-opd': {
    id: 'bill-opd',
    title: 'OPD Charges',
    description: 'Consultation, procedure, and outpatient service line itemization.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Consult fees', 'Procedure codes', 'Package bundles', 'Discount rules'],
  },
  'bill-lab': {
    id: 'bill-lab',
    title: 'Lab Charges',
    description: 'Laboratory test billing, panel pricing, and external lab pass-through.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Test catalog', 'Panel pricing', 'External lab fees', 'Pre-auth tie-in'],
  },
  'bill-radiology': {
    id: 'bill-radiology',
    title: 'Radiology Charges',
    description: 'Imaging modality charges, contrast fees, and reporting tariffs.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Modality tariffs', 'Contrast billing', 'Reporting fees', 'Emergency surcharge'],
  },
  'bill-medicine': {
    id: 'bill-medicine',
    title: 'Medicine Charges',
    description: 'Pharmacy dispensing charges, formulary pricing, and ward stock billing.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Rx pricing', 'Ward stock', 'IV fluids', 'High-cost drugs'],
  },
  'bill-admission': {
    id: 'bill-admission',
    title: 'Admission Charges',
    description: 'Bed category tariffs, nursing packages, and admission deposit tracking.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Bed tariffs', 'Package rates', 'Deposits', 'Length-of-stay calc'],
  },
  'bill-ot': {
    id: 'bill-ot',
    title: 'OT Charges',
    description: 'Surgical theater billing, implant tracking, and anesthesia fee schedules.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Theater time', 'Implant trace', 'Anesthesia fees', 'Surgeon share'],
  },
  invoices: {
    id: 'invoices',
    title: 'Final Invoice Generation',
    description: 'Consolidated invoice assembly, GST breakdown, and payer submission.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Line merge', 'GST split', 'TPA submit', 'PDF release'],
  },
  payments: {
    id: 'payments',
    title: 'Payment Gateway Status',
    description: 'Cashier operations, split-payment intake, and settlement confirmation.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['UPI/cards', 'Split pay', 'Settlement log', 'Refund queue'],
  },
  receipts: {
    id: 'receipts',
    title: 'Receipt Release',
    description: 'Payment receipt generation, digital delivery, and audit stamping.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Receipt PDF', 'SMS/email', 'Audit stamp', 'Reprint controls'],
  },
  insurance: {
    id: 'insurance',
    title: 'Insurance & TPA',
    description: 'Pre-authorization queues, claim batch processing, and payer reconciliation.',
    layer: 'Layer 5 · Integrated Billing',
    features: ['Pre-auth', 'Claim batches', 'Denial rework', 'Payer ledger'],
  },
  staff: {
    id: 'staff',
    title: 'Staff Directory',
    description: 'On-shift practitioners, departmental roster, and credential index.',
    layer: 'Layer 6 · Human Capital',
    features: ['Roster search', 'Credentials', 'Department map', 'On-call index'],
  },
  'staff-employees': {
    id: 'staff-employees',
    title: 'Employee Details Ledger',
    description: 'HR profile records, employment history, and compliance documentation.',
    layer: 'Layer 6 · Human Capital',
    features: ['HR profiles', 'Contracts', 'Licenses', 'Performance notes'],
  },
  'staff-departments': {
    id: 'staff-departments',
    title: 'Departmental Breakdown',
    description: 'Organizational unit hierarchy, headcount, and coverage matrices.',
    layer: 'Layer 6 · Human Capital',
    features: ['Org chart', 'Headcount', 'Coverage gaps', 'Unit budgets'],
  },
  'staff-shifts': {
    id: 'staff-shifts',
    title: 'Shift Management',
    description: 'Roster calendars, swap requests, and overtime tracking.',
    layer: 'Layer 6 · Human Capital',
    features: ['Shift grid', 'Swap requests', 'OT tracking', 'Holiday roster'],
  },
  'staff-attendance': {
    id: 'staff-attendance',
    title: 'Attendance Sheets',
    description: 'Clock-in/out logs, leave balances, and absence pattern monitoring.',
    layer: 'Layer 6 · Human Capital',
    features: ['Clock logs', 'Leave balance', 'Late flags', 'Biometric sync'],
  },
  'staff-roles': {
    id: 'staff-roles',
    title: 'Role Permissions',
    description: 'RBAC role mapping, permission matrices, and access audit trails.',
    layer: 'Layer 6 · Human Capital',
    features: ['RBAC matrix', 'Permission sets', 'Access audit', 'Role templates'],
  },
};

export function getModuleConfig(key: string): HospitalModuleConfig {
  const config = HOSPITAL_MODULES[key];
  if (!config) {
    return {
      id: key,
      title: 'Hospital Module',
      description: 'Operational module canvas.',
      layer: 'Nexora Hospital',
      features: ['Module registry pending'],
    };
  }
  return config;
}
