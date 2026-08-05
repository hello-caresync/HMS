import type { SupabaseClient } from '@supabase/supabase-js';

import type { DashboardMetrics } from '@/lib/nexora-hospital/types';
import { computeMetrics } from '@/lib/nexora-hospital/seed-data';
import type {
  HospitalAdmission,
  HospitalAppointment,
  BillingInvoice,
  InventoryItem,
  OpdVisit,
  PurchaseOrder,
  HospitalStaff,
} from '@/lib/nexora-hospital/types';

/** Aggregate live KPIs from Supabase — single source of truth */
export async function fetchHospitalMetricsFromDb(
  supabase: SupabaseClient,
  staff: HospitalStaff[] = [],
): Promise<DashboardMetrics> {
  const today = new Date().toISOString().slice(0, 10);

  const [apptRes, opdRes, admRes, invRes, stockRes, poRes] = await Promise.all([
    supabase.from('appointments').select('id, appointment_date, ecosystem_status, status').eq('appointment_date', today),
    supabase.from('opd_visits').select('id, status'),
    supabase.from('admissions').select('id, status'),
    supabase.from('billing_invoices').select('id, payment_status, paid_amount, total_amount, created_at'),
    supabase.from('pharmacy_inventory').select('id, status, quantity_in_stock, reorder_level'),
    supabase.from('purchase_orders').select('id, status'),
  ]);

  const appointments: HospitalAppointment[] = (apptRes.data ?? []).map((r) => ({
    id: String(r.id),
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: String(r.appointment_date),
    timeSlot: '',
    department: '',
    status: String(r.ecosystem_status ?? r.status ?? 'Pending'),
  }));

  const opd: OpdVisit[] = (opdRes.data ?? []).map((r) => ({
    id: String(r.id),
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    queueNumber: '',
    department: '',
    status: (r.status as OpdVisit['status']) ?? 'Waiting',
  }));

  const admissions: HospitalAdmission[] = (admRes.data ?? []).map((r) => ({
    id: String(r.id),
    patientId: '',
    patientName: '',
    attendingDoctorId: '',
    attendingDoctorName: '',
    wardNumber: '',
    bedNumber: '',
    status: (r.status as HospitalAdmission['status']) ?? 'Admitted',
    diagnosis: '',
  }));

  const invoices: BillingInvoice[] = (invRes.data ?? []).map((r) => ({
    id: String(r.id),
    patientId: '',
    patientName: '',
    totalAmount: Number(r.total_amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    paymentStatus: (r.payment_status as BillingInvoice['paymentStatus']) ?? 'Unpaid',
    lineItems: [],
    invoiceNumber: '',
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }));

  const inventory: InventoryItem[] = (stockRes.data ?? []).map((r) => {
    const qty = Number(r.quantity_in_stock ?? 0);
    const reorder = Number(r.reorder_level ?? 10);
    let status: InventoryItem['status'] = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';
    return {
      id: String(r.id),
      itemName: '',
      category: '',
      quantityInStock: qty,
      unitPrice: 0,
      reorderLevel: reorder,
      status,
    };
  });

  const pos: PurchaseOrder[] = (poRes.data ?? []).map((r) => ({
    id: String(r.id),
    vendorId: '',
    vendorName: '',
    itemDetails: '',
    status: (r.status as PurchaseOrder['status']) ?? 'Draft',
    totalCost: 0,
    createdAt: new Date().toISOString(),
  }));

  return computeMetrics(appointments, opd, admissions, invoices, inventory, pos, staff);
}
