export type ProductRow = {
  id: string;
  vendor_id: string;
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  available_stock: number;
  unit_of_measure: string;
  spec_title?: string | null;
  spec_text?: string | null;
  spec_file_url?: string | null;
  created_at: string;
};

export type QuotationRow = {
  id: string;
  vendor_id: string;
  rfq_id: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
};

export type PurchaseOrderRow = {
  id: string;
  po_number: string;
  vendor_id: string;
  hospital_name: string;
  status: 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  total_amount: number;
  delivery_deadline: string;
  created_at: string;
};

export type ShipmentRow = {
  id: string;
  po_id: string;
  tracking_number: string;
  carrier_name: string;
  driver_contact: string | null;
  status: string;
  dispatched_at: string | null;
  created_at?: string;
  purchase_orders?: Pick<PurchaseOrderRow, 'po_number' | 'hospital_name' | 'vendor_id'> | null;
};

export type ShipmentInsert = {
  po_id: string;
  tracking_number: string;
  carrier_name: string;
  driver_contact: string;
  status: 'DISPATCHED';
  dispatched_at: string;
};

export type InvoiceInsert = {
  invoice_number: string;
  po_id: string;
  vendor_id: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'SUBMITTED';
  due_date: string;
};

export type NewProductInput = {
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  available_stock: number;
  unit_of_measure: string;
};

export type ComplianceDocStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'EXPIRED' | 'ACTION_REQUIRED';

export type ComplianceDocumentRow = {
  id: string;
  vendor_id: string;
  document_type: string;
  registration_number: string | null;
  expiry_date: string | null;
  file_url: string | null;
  status: ComplianceDocStatus;
  created_at: string;
};

export type VendorContractRow = {
  id: string;
  vendor_id: string;
  title: string;
  hospital_name: string;
  effective_date: string;
  expiry_date: string;
  status: 'Active' | 'Expiring' | 'Expired' | string;
  pdf_url: string | null;
  terms_url: string | null;
};

export type VendorProfileRow = {
  id: string;
  compliance_status: string | null;
  performance_rating: number | null;
  on_time_delivery_pct: number | null;
  name?: string | null;
  legal_name?: string | null;
  contact_email?: string | null;
};

export type VendorMeetingRequestRow = {
  id: string;
  vendor_id: string;
  channel: string;
  subject: string;
  scheduled_at: string;
  notes: string | null;
  created_at: string;
};

export type VendorMessageRow = {
  id: string;
  vendor_id: string;
  channel: string;
  subject: string;
  body: string;
  created_at: string;
};

export type ServiceTicketRow = {
  id: string;
  vendor_id: string;
  equipment_name: string;
  issue_description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_details?: string | null;
  fsr_file_url?: string | null;
  created_at: string;
};

export type InvoiceRow = {
  id: string;
  invoice_number?: string;
  po_id?: string | null;
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  status: string;
  vendor_id: string;
  due_date?: string | null;
  purchase_orders?: { po_number: string; hospital_name: string } | { po_number: string; hospital_name: string }[] | null;
};
