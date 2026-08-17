export type AppointmentLifecycleStatus =
  | 'booked'
  | 'checked_in'
  | 'in_consultation'
  | 'completed';

export type TriagePriority = 'P1' | 'P2' | 'P3';

export type SystemEventType =
  | 'PATIENT_CHECKED_IN'
  | 'EMERGENCY_BYPASS_TRIGGERED'
  | 'PURCHASE_ORDER_CREATED'
  | 'PRESCRIPTION_DISPENSED'
  | 'BED_ALLOCATED'
  | 'LOW_STOCK_ALERT';

export type OpdAppointmentRow = {
  id: string;
  patient_id?: string;
  patient_name?: string;
  doctor_name?: string;
  token_number?: string;
  appointment_time?: string;
  slot_time?: string;
  status?: string;
  queue_status?: string;
  created_at?: string;
};

export type EmergencyTriageRow = {
  id: string;
  patient_name: string;
  patient_id?: string;
  chief_complaint?: string;
  priority: TriagePriority;
  status?: string;
  created_at?: string;
};

export type HospitalBedRow = {
  id: string;
  ward: string;
  bed_number: string;
  bed_type?: string;
  is_occupied: boolean;
  patient_name?: string;
  patient_id?: string;
};

export type InventoryItemRow = {
  id: string;
  item_name: string;
  sku?: string;
  quantity_in_stock: number;
  reorder_level: number;
  batch_number?: string;
  expiry_date?: string;
  unit_price?: number;
};

export type PrescriptionRow = {
  id: string;
  patient_id?: string;
  patient_name?: string;
  doctor_name?: string;
  medications?: unknown[];
  status?: string;
  created_at?: string;
};

export type SidebarBadgeCounts = {
  opd: number;
  emergency: number;
  ipd: number;
  pharmacy: number;
  inventory: number;
};
