export type HospitalEntityTable =
  | 'patients'
  | 'admissions'
  | 'appointments'
  | 'billing_invoices'
  | 'staff'
  | 'pharmacy_inventory';

export type DbPatient = {
  id: string;
  full_name: string;
  uhid: string;
  department: string | null;
  phone: string | null;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbAdmission = {
  id: string;
  patient_name: string;
  uhid: string | null;
  ward: string | null;
  department: string | null;
  doctor_name: string | null;
  bed_number: string | null;
  discharge_date: string | null;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbAppointment = {
  id: string;
  token: string;
  patient_name: string;
  department: string;
  provider: string | null;
  scheduled_time: string | null;
  location: string | null;
  status: string;
  channels: { sms?: boolean; email?: boolean; whatsapp?: boolean } | null;
  created_at: string;
  updated_at: string;
};

export type DbBillingInvoice = {
  id: string;
  invoice_number: string;
  patient_name: string;
  department: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbStaff = {
  id: string;
  full_name: string;
  role_title: string | null;
  department: string | null;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPharmacyInventory = {
  id: string;
  sku: string;
  item_name: string;
  category: string | null;
  quantity_in_stock: number;
  reorder_level: number;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
};

export type HospitalRecordInput = {
  moduleId: string;
  subject: string;
  department: string;
  reference: string;
  amount?: string;
  phone?: string;
  doctorName?: string;
  bedNumber?: string;
};

export type HospitalUiRecord = {
  id: string;
  reference: string;
  subject: string;
  department: string;
  amount?: string;
  status: string;
  updatedAt: string;
  /** Billing: total due in INR (numeric) */
  totalDue?: number;
  paidAmount?: number;
};
