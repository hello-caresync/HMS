import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  hubCreatePurchaseOrder,
  hubDoctorStartConsultation,
  hubGenerateInvoice,
  hubLowStockAlert,
  hubProcessPayment,
  hubReceptionCheckIn,
  hubPatientBookAppointment,
  hubVendorDeliveryReceived,
} from '@/lib/ecosystem/ecosystem-hub';
import type { EcosystemAppointment } from '@/lib/ecosystem/types';

import { inventoryStatus, useHospitalStore } from '../store';
import type {
  BillingInvoice,
  HospitalAdmission,
  HospitalAppointment,
  HospitalNotification,
  HospitalPatient,
  InventoryItem,
  OpdVisit,
  PurchaseOrder,
  Vendor,
} from '../types';

function supabaseReady() {
  return Boolean(
    typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function mapPatientRow(row: Record<string, unknown>): HospitalPatient {
  const fullName = String(row.full_name ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim());
  const { first, last } = splitName(fullName);
  return {
    id: String(row.id),
    uhid: String(row.uhid ?? row.patient_mrn ?? '—'),
    firstName: String(row.first_name ?? first),
    lastName: String(row.last_name ?? last),
    fullName: fullName || 'Unknown',
    phone: String(row.phone ?? ''),
    age: Number(row.age ?? 0),
    gender: String(row.gender ?? '—'),
    bloodGroup: String(row.blood_group ?? '—'),
    medicalHistory: String(row.medical_history ?? row.medical_history_text ?? ''),
    department: String(row.department ?? 'General'),
    status: String(row.status ?? 'Active'),
    emergencyContact: row.emergency_contact ? String(row.emergency_contact) : undefined,
    insuranceProvider: row.insurance_provider ? String(row.insurance_provider) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAppointmentRow(row: Record<string, unknown>): HospitalAppointment {
  const timeSlot = String(row.time_slot ?? row.scheduled_time ?? row.appointment_time ?? '09:00').slice(0, 5);
  return {
    id: String(row.id),
    patientId: String(row.patient_id ?? ''),
    patientName: String(row.patient_name ?? 'Patient'),
    doctorId: String(row.doctor_id ?? row.provider ?? ''),
    doctorName: String(row.doctor_name ?? row.provider ?? 'Doctor'),
    appointmentDate: String(row.appointment_date ?? new Date().toISOString().slice(0, 10)),
    timeSlot,
    department: String(row.department ?? 'General'),
    status: String(row.ecosystem_status ?? row.status ?? 'Pending'),
    token: row.token ? String(row.token) : undefined,
    reason: row.reason ? String(row.reason) : undefined,
  };
}

function mapOpdRow(row: Record<string, unknown>): OpdVisit {
  return {
    id: String(row.id),
    patientId: String(row.patient_id ?? ''),
    patientName: String(row.patient_name ?? 'Patient'),
    doctorId: String(row.doctor_id ?? ''),
    doctorName: String(row.doctor_name ?? 'Doctor'),
    queueNumber: String(row.queue_number ?? row.token ?? '—'),
    department: String(row.department ?? 'General'),
    status: (row.status as OpdVisit['status']) ?? 'Waiting',
    appointmentId: row.appointment_id ? String(row.appointment_id) : undefined,
    checkedInAt: row.checked_in_at ? String(row.checked_in_at) : undefined,
  };
}

function mapAdmissionRow(row: Record<string, unknown>): HospitalAdmission {
  return {
    id: String(row.id),
    patientId: String(row.patient_id ?? ''),
    patientName: String(row.patient_name ?? row.patient_name_legacy ?? 'Patient'),
    attendingDoctorId: String(row.attending_doctor_id ?? row.doctor_id ?? ''),
    attendingDoctorName: String(row.attending_doctor_name ?? row.doctor_name ?? 'Doctor'),
    wardNumber: String(row.ward_number ?? row.ward ?? '—'),
    bedNumber: String(row.bed_number ?? '—'),
    status: (row.status as HospitalAdmission['status']) ?? 'Admitted',
    diagnosis: String(row.diagnosis ?? ''),
    uhid: row.uhid ? String(row.uhid) : undefined,
  };
}

function mapInvoiceRow(row: Record<string, unknown>): BillingInvoice {
  const total = Number(row.total_amount ?? row.amount ?? 0);
  const paid = Number(row.paid_amount ?? 0);
  const lineItems = Array.isArray(row.line_items)
    ? (row.line_items as BillingInvoice['lineItems'])
    : [];
  return {
    id: String(row.id),
    patientId: String(row.patient_id ?? ''),
    patientName: String(row.patient_name ?? 'Patient'),
    totalAmount: total,
    paidAmount: paid,
    paymentStatus: (row.payment_status as BillingInvoice['paymentStatus']) ?? (paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'),
    lineItems,
    invoiceNumber: String(row.invoice_number ?? row.id.slice(0, 8)),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapInventoryRow(row: Record<string, unknown>): InventoryItem {
  const qty = Number(row.quantity_in_stock ?? 0);
  const reorder = Number(row.reorder_level ?? 10);
  return {
    id: String(row.id),
    itemName: String(row.item_name ?? ''),
    category: String(row.category ?? 'General'),
    quantityInStock: qty,
    unitPrice: Number(row.unit_price ?? 0),
    reorderLevel: reorder,
    status: (row.status as InventoryItem['status']) ?? inventoryStatus(qty, reorder),
    sku: row.sku ? String(row.sku) : undefined,
  };
}

function mapVendorRow(row: Record<string, unknown>): Vendor {
  return {
    id: String(row.id),
    companyName: String(row.company_name ?? ''),
    contactPerson: String(row.contact_person ?? ''),
    email: String(row.email ?? ''),
    rating: Number(row.rating ?? 4),
    phone: row.phone ? String(row.phone) : undefined,
  };
}

function mapPoRow(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id ?? ''),
    vendorName: String(row.vendor_name ?? 'Vendor'),
    itemDetails: String(row.item_details ?? ''),
    status: (row.status as PurchaseOrder['status']) ?? 'Draft',
    totalCost: Number(row.total_cost ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapNotificationRow(row: Record<string, unknown>): HospitalNotification {
  return {
    id: String(row.id),
    recipientRole: (row.recipient_role as HospitalNotification['recipientRole']) ?? 'hospital',
    title: String(row.title ?? ''),
    message: String(row.message ?? row.body ?? ''),
    category: String(row.category ?? 'system'),
    severity: (row.severity as HospitalNotification['severity']) ?? 'info',
    readStatus: Boolean(row.read_status ?? row.read ?? false),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    relatedId: row.related_id ? String(row.related_id) : undefined,
  };
}

export async function fetchHospitalData(): Promise<void> {
  if (!supabaseReady()) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const store = useHospitalStore.getState();
  const [patients, appointments, opd, admissions, invoices, inventory, vendors, pos, notifications] =
    await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('appointments').select('*').order('updated_at', { ascending: false }).limit(100),
      supabase.from('opd_visits').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('admissions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('billing_invoices').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('pharmacy_inventory').select('*').order('item_name').limit(200),
      supabase.from('vendors').select('*').order('company_name').limit(50),
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }).limit(50),
      supabase
        .from('notifications')
        .select('*')
        .or('recipient_role.eq.hospital,target_audience.eq.both')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  if (patients.data?.length) store.setPatients(patients.data.map((r: Record<string, unknown>) => mapPatientRow(r)));
  if (appointments.data?.length)
    store.setAppointments(appointments.data.map((r: Record<string, unknown>) => mapAppointmentRow(r)));
  if (opd.data?.length) store.setOpdVisits(opd.data.map((r: Record<string, unknown>) => mapOpdRow(r)));
  if (admissions.data?.length)
    store.setAdmissions(admissions.data.map((r: Record<string, unknown>) => mapAdmissionRow(r)));
  if (invoices.data?.length)
    store.setInvoices(invoices.data.map((r: Record<string, unknown>) => mapInvoiceRow(r)));
  if (inventory.data?.length)
    store.setInventory(inventory.data.map((r: Record<string, unknown>) => mapInventoryRow(r)));
  if (vendors.data?.length) store.setVendors(vendors.data.map((r: Record<string, unknown>) => mapVendorRow(r)));
  if (pos.data?.length) store.setPurchaseOrders(pos.data.map((r: Record<string, unknown>) => mapPoRow(r)));
  if (notifications.data?.length)
    store.setNotifications(notifications.data.map((r: Record<string, unknown>) => mapNotificationRow(r)));

  store.recomputeMetrics();
}

async function insertHospitalNotification(
  title: string,
  message: string,
  category: string,
  severity: HospitalNotification['severity'] = 'info',
  relatedId?: string,
) {
  const store = useHospitalStore.getState();
  store.addNotification({ recipientRole: 'hospital', title, message, category, severity, relatedId });

  if (!supabaseReady()) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  await supabase.from('notifications').insert({
    recipient_role: 'hospital',
    title,
    body: message,
    message,
    category,
    severity,
    related_id: relatedId ?? null,
    target_audience: 'both',
    read: false,
    read_status: false,
  });
}

export async function registerPatient(input: Omit<HospitalPatient, 'id' | 'createdAt' | 'fullName'> & { fullName?: string }): Promise<HospitalPatient> {
  const fullName = input.fullName ?? `${input.firstName} ${input.lastName}`.trim();
  const patient: HospitalPatient = {
    ...input,
    fullName,
    id: `pat-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  useHospitalStore.getState().upsertPatient(patient);

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          uhid: patient.uhid,
          full_name: fullName,
          first_name: patient.firstName,
          last_name: patient.lastName,
          phone: patient.phone,
          age: patient.age,
          gender: patient.gender,
          blood_group: patient.bloodGroup,
          medical_history: patient.medicalHistory,
          department: patient.department,
          status: patient.status,
          emergency_contact: patient.emergencyContact,
          insurance_provider: patient.insuranceProvider,
        })
        .select('*')
        .single();
      if (!error && data) {
        const mapped = mapPatientRow(data as Record<string, unknown>);
        useHospitalStore.getState().upsertPatient(mapped);
        patient.id = mapped.id;
      }
    }
  }

  await insertHospitalNotification('Patient registered', `${fullName} · UHID ${patient.uhid}`, 'patients');
  return patient;
}

export async function bookHospitalAppointment(
  input: Omit<HospitalAppointment, 'id' | 'status'> & { status?: string },
): Promise<HospitalAppointment> {
  const appt: HospitalAppointment = {
    ...input,
    id: `apt-${Date.now()}`,
    status: input.status ?? 'Pending',
  };

  const eco: EcosystemAppointment = {
    id: appt.id,
    patientId: appt.patientId,
    patientName: appt.patientName,
    patientMrn: '',
    doctorId: appt.doctorId,
    doctorName: appt.doctorName,
    department: appt.department,
    date: appt.appointmentDate,
    time: appt.timeSlot,
    endTime: '',
    reason: appt.reason ?? '',
    status: 'Requested',
    type: 'OPD',
    token: appt.token ?? '',
    location: 'OPD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await hubPatientBookAppointment(eco);
  return appt;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
): Promise<void> {
  const store = useHospitalStore.getState();
  const appt = store.appointments.find((a) => a.id === appointmentId);
  if (!appt) return;

  const updated = { ...appt, status };
  store.upsertAppointment(updated);

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase
        .from('appointments')
        .update({ status, ecosystem_status: status, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);
    }
  }
}

export async function checkInOpdPatient(visitId: string): Promise<void> {
  await hubReceptionCheckIn(visitId);
}

export async function createOpdFromAppointment(appointmentId: string): Promise<OpdVisit | null> {
  const appt = useHospitalStore.getState().appointments.find((a) => a.id === appointmentId);
  if (!appt) return null;

  const visit: OpdVisit = {
    id: `opd-${Date.now()}`,
    patientId: appt.patientId,
    patientName: appt.patientName,
    doctorId: appt.doctorId,
    doctorName: appt.doctorName,
    queueNumber: appt.token ?? `Q-${Date.now().toString().slice(-3)}`,
    department: appt.department,
    status: 'Waiting',
    appointmentId: appt.id,
  };

  useHospitalStore.getState().upsertOpdVisit(visit);

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from('opd_visits').insert({
        patient_id: visit.patientId,
        patient_name: visit.patientName,
        doctor_id: visit.doctorId,
        doctor_name: visit.doctorName,
        queue_number: visit.queueNumber,
        department: visit.department,
        status: visit.status,
        appointment_id: visit.appointmentId,
      });
    }
  }

  return visit;
}

export async function updateOpdStatus(visitId: string, status: OpdVisit['status']): Promise<void> {
  const store = useHospitalStore.getState();
  const visit = store.opdVisits.find((v) => v.id === visitId);
  if (!visit) return;

  if (status === 'In Consultation' && visit.appointmentId) {
    const appt = store.appointments.find((a) => a.id === visit.appointmentId);
    if (appt) {
      await hubDoctorStartConsultation({
        id: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName,
        patientMrn: '',
        doctorId: appt.doctorId,
        doctorName: appt.doctorName,
        department: appt.department,
        date: appt.appointmentDate,
        time: appt.timeSlot,
        endTime: '',
        reason: appt.reason ?? '',
        status: 'In Consultation',
        type: 'OPD',
        token: appt.token ?? visit.queueNumber,
        location: 'OPD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }
  }

  store.upsertOpdVisit({ ...visit, status });

  if (visit.appointmentId) {
    const ecoStatus =
      status === 'In Consultation' ? 'In Consultation' : status === 'Completed' ? 'Completed' : status;
    await updateAppointmentStatus(visit.appointmentId, ecoStatus);
  }

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from('opd_visits').update({ status }).eq('id', visitId);
    }
  }
}

export async function approveAdmission(input: Omit<HospitalAdmission, 'id' | 'status'>): Promise<HospitalAdmission> {
  const admission: HospitalAdmission = { ...input, id: `adm-${Date.now()}`, status: 'Admitted' };
  useHospitalStore.getState().upsertAdmission(admission);

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from('admissions').insert({
        patient_id: admission.patientId,
        patient_name: admission.patientName,
        attending_doctor_id: admission.attendingDoctorId,
        attending_doctor_name: admission.attendingDoctorName,
        ward_number: admission.wardNumber,
        bed_number: admission.bedNumber,
        status: admission.status,
        diagnosis: admission.diagnosis,
        uhid: admission.uhid,
      });
    }
  }

  await insertHospitalNotification(
    'Admission approved',
    `${admission.patientName} · ${admission.wardNumber} / ${admission.bedNumber}`,
    'admissions',
    'info',
    admission.id,
  );
  return admission;
}

export async function processDischarge(admissionId: string): Promise<void> {
  const store = useHospitalStore.getState();
  const adm = store.admissions.find((a) => a.id === admissionId);
  if (!adm) return;

  store.upsertAdmission({ ...adm, status: 'Discharged' });

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from('admissions').update({ status: 'Discharged' }).eq('id', admissionId);
    }
  }

  await insertHospitalNotification('Discharge processed', adm.patientName, 'admissions', 'info', admissionId);
}

export async function generateInvoice(input: {
  patientId: string;
  patientName: string;
  lineItems: BillingInvoice['lineItems'];
}): Promise<BillingInvoice> {
  return hubGenerateInvoice(input);
}

export async function processPayment(
  invoiceId: string,
  amount: number,
  method: string,
): Promise<void> {
  await hubProcessPayment(invoiceId, amount, method);
}

export async function updateInventoryQuantity(itemId: string, delta: number): Promise<void> {
  const store = useHospitalStore.getState();
  const item = store.inventory.find((i) => i.id === itemId);
  if (!item) return;

  const quantityInStock = Math.max(0, item.quantityInStock + delta);
  const updated: InventoryItem = {
    ...item,
    quantityInStock,
    status: inventoryStatus(quantityInStock, item.reorderLevel),
  };
  store.upsertInventoryItem(updated);

  if (supabaseReady()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase
        .from('pharmacy_inventory')
        .update({ quantity_in_stock: quantityInStock, status: updated.status })
        .eq('id', itemId);
    }
  }

  if (updated.status !== 'In Stock') {
    await hubLowStockAlert(itemId, updated.itemName, quantityInStock);
  }
}

export async function createPurchaseOrder(input: {
  vendorId: string;
  vendorName: string;
  itemDetails: string;
  totalCost: number;
}): Promise<PurchaseOrder> {
  const po: PurchaseOrder = {
    id: `po-${Date.now()}`,
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    itemDetails: input.itemDetails,
    status: 'Issued',
    totalCost: input.totalCost,
    createdAt: new Date().toISOString(),
  };

  useHospitalStore.getState().upsertPurchaseOrder(po);
  await hubCreatePurchaseOrder(input);
  return po;
}

export async function receiveDelivery(poId: string, itemId?: string, qty = 0): Promise<void> {
  const store = useHospitalStore.getState();
  const po = store.purchaseOrders.find((p) => p.id === poId);
  if (!po) return;

  store.upsertPurchaseOrder({ ...po, status: 'Delivered' });
  if (itemId && qty > 0) await updateInventoryQuantity(itemId, qty);
  await hubVendorDeliveryReceived(poId, po.itemDetails, po.vendorName);
}

export async function autoGeneratePoForLowStock(): Promise<PurchaseOrder | null> {
  const store = useHospitalStore.getState();
  const low = store.inventory.find((i) => i.status === 'Low Stock' || i.status === 'Out of Stock');
  const vendor = store.vendors[0];
  if (!low || !vendor) return null;

  const qty = Math.max(low.reorderLevel * 2, 100);
  return createPurchaseOrder({
    vendorId: vendor.id,
    vendorName: vendor.companyName,
    itemDetails: `${low.itemName} × ${qty} units (auto-reorder)`,
    totalCost: qty * low.unitPrice,
  });
}

export function markNotificationsRead(ids: string[]) {
  const store = useHospitalStore.getState();
  ids.forEach((id) => store.markNotificationRead(id));
}
