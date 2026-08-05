/**
 * Nexora Ecosystem Hub — Hospital-centric orchestration layer.
 * All cross-app mutations flow through here: DB first, then realtime fan-out.
 * Patient App NEVER notifies Doctor App directly.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { mapHubToBusEvent } from '@/lib/events/event-bus';

import type { EcosystemAppointment, AppointmentStatus } from '@/lib/ecosystem/types';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  persistCrossAppAppointment,
  persistCrossAppNotification,
} from '@/lib/realtime/cross-app-sync';
import { useHospitalStore } from '@/lib/nexora-hospital/store';
import type {
  BillingInvoice,
  HospitalAdmission,
  HospitalAppointment,
  OpdVisit,
} from '@/lib/nexora-hospital/types';

export type HubActorRole = 'patient' | 'doctor' | 'hospital' | 'vendor' | 'system';

export type HubEventType =
  | 'appointment.booked'
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'appointment.checked_in'
  | 'consultation.started'
  | 'consultation.completed'
  | 'admission.requested'
  | 'admission.approved'
  | 'invoice.generated'
  | 'payment.received'
  | 'inventory.low_stock'
  | 'purchase_order.created'
  | 'vendor.delivery';

export type EcosystemActivityItem = {
  id: string;
  eventType: HubEventType;
  actorRole: HubActorRole;
  message: string;
  createdAt: string;
  relatedId?: string;
};

/** Canonical appointment statuses for the ecosystem */
export const APPOINTMENT_STATUSES = [
  'Pending',
  'Confirmed',
  'Checked-In',
  'In Consultation',
  'Completed',
  'Cancelled',
  'No Show',
] as const;

export type CanonicalAppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export function normalizeAppointmentStatus(status: string): CanonicalAppointmentStatus {
  const s = status.trim();
  if (s === 'Requested') return 'Pending';
  if (s === 'BOOKED' || s === 'Booked') return 'Pending';
  if (APPOINTMENT_STATUSES.includes(s as CanonicalAppointmentStatus)) {
    return s as CanonicalAppointmentStatus;
  }
  if (s.toLowerCase().includes('consultation')) return 'In Consultation';
  if (s.toLowerCase().includes('confirm')) return 'Confirmed';
  if (s.toLowerCase().includes('complete')) return 'Completed';
  if (s.toLowerCase().includes('cancel')) return 'Cancelled';
  if (s.toLowerCase().includes('check')) return 'Checked-In';
  return 'Pending';
}

function ecoStatusFromCanonical(status: CanonicalAppointmentStatus): AppointmentStatus {
  if (status === 'Pending') return 'Requested';
  if (status === 'No Show') return 'Cancelled';
  return status as AppointmentStatus;
}

function supabaseReady(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function getSupabase(): SupabaseClient | null {
  if (!supabaseReady()) return null;
  return getSupabaseBrowserClient();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function pushLocalActivity(
  eventType: HubEventType,
  actorRole: HubActorRole,
  message: string,
  relatedId?: string,
) {
  const item: EcosystemActivityItem = {
    id: uid('act'),
    eventType,
    actorRole,
    message,
    createdAt: new Date().toISOString(),
    relatedId,
  };
  useHospitalStore.getState().prependActivity(item);
}

async function logActivity(
  supabase: SupabaseClient | null,
  eventType: HubEventType,
  actorRole: HubActorRole,
  message: string,
  meta?: {
    actorId?: string;
    patientId?: string;
    doctorId?: string;
    relatedId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  pushLocalActivity(eventType, actorRole, message, meta?.relatedId);

  mapHubToBusEvent(eventType, {
    actorRole,
    entityType: meta?.metadata?.entityType as string ?? 'ecosystem',
    entityId: meta?.relatedId ?? uid('evt'),
    patientId: meta?.patientId,
    doctorId: meta?.doctorId,
    message,
    metadata: meta?.metadata,
    actorId: meta?.actorId,
  });

  if (!supabase) return;
  await supabase.from('ecosystem_activity').insert({
    event_type: eventType,
    actor_role: actorRole,
    actor_id: meta?.actorId ?? null,
    patient_id: meta?.patientId ?? null,
    doctor_id: meta?.doctorId ?? null,
    related_id: meta?.relatedId ?? null,
    message,
    metadata: meta?.metadata ?? {},
  });
}

async function logAudit(
  supabase: SupabaseClient | null,
  action: string,
  actorRole: HubActorRole,
  entityType: string,
  entityId: string,
  payload?: Record<string, unknown>,
  actorId?: string,
) {
  if (!supabase) return;
  await supabase.from('audit_logs').insert({
    action,
    actor_role: actorRole,
    actor_id: actorId ?? null,
    entity_type: entityType,
    entity_id: entityId,
    payload: payload ?? {},
  });
}

/** Route notifications through the hub — never direct patient→doctor from UI */
async function notifyRoles(
  supabase: SupabaseClient | null,
  roles: Array<{
    role: 'hospital' | 'doctor' | 'patient' | 'vendor';
    patientId?: string;
    doctorId?: string;
    vendorId?: string;
    title: string;
    body: string;
    category: string;
    relatedId?: string;
    severity?: 'info' | 'warning' | 'critical';
  }>,
) {
  const hospitalStore = useHospitalStore.getState();

  for (const n of roles) {
    if (n.role === 'hospital') {
      hospitalStore.addNotification({
        recipientRole: 'hospital',
        title: n.title,
        message: n.body,
        category: n.category,
        severity: n.severity ?? 'info',
        relatedId: n.relatedId,
      });
    }

    if (!supabase) continue;

    if (n.role === 'hospital') {
      await supabase.from('notifications').insert({
        recipient_role: 'hospital',
        title: n.title,
        body: n.body,
        message: n.body,
        category: n.category,
        severity: n.severity ?? 'info',
        related_id: n.relatedId ?? null,
        target_audience: 'both',
        read: false,
        read_status: false,
      });
    } else if (n.role === 'patient') {
      await persistCrossAppNotification(supabase, {
        patientId: n.patientId,
        title: n.title,
        body: n.body,
        category: n.category,
        relatedId: n.relatedId,
        targetAudience: 'patient',
      });
    } else if (n.role === 'doctor') {
      await persistCrossAppNotification(supabase, {
        doctorId: n.doctorId,
        patientId: n.patientId,
        title: n.title,
        body: n.body,
        category: n.category,
        relatedId: n.relatedId,
        targetAudience: 'doctor',
      });
    } else if (n.role === 'vendor') {
      await supabase.from('notifications').insert({
        vendor_id: n.vendorId ?? null,
        recipient_role: 'vendor',
        title: n.title,
        body: n.body,
        message: n.body,
        category: n.category,
        related_id: n.relatedId ?? null,
        target_audience: 'both',
        read: false,
      });
    }
  }
}

function upsertHospitalAppointment(appt: HospitalAppointment) {
  useHospitalStore.getState().upsertAppointment(appt);
}

function upsertHospitalOpd(visit: OpdVisit) {
  useHospitalStore.getState().upsertOpdVisit(visit);
}

async function persistAppointment(
  supabase: SupabaseClient | null,
  appt: EcosystemAppointment,
  canonicalStatus: CanonicalAppointmentStatus,
) {
  const ecoAppt: EcosystemAppointment = {
    ...appt,
    status: ecoStatusFromCanonical(canonicalStatus),
    updatedAt: new Date().toISOString(),
  };

  if (supabase) {
    await persistCrossAppAppointment(supabase, ecoAppt);
  }

  upsertHospitalAppointment({
    id: ecoAppt.id,
    patientId: ecoAppt.patientId,
    patientName: ecoAppt.patientName,
    doctorId: ecoAppt.doctorId,
    doctorName: ecoAppt.doctorName,
    appointmentDate: ecoAppt.date,
    timeSlot: ecoAppt.time,
    department: ecoAppt.department,
    status: canonicalStatus,
    token: ecoAppt.token,
    reason: ecoAppt.reason,
  });

  return ecoAppt;
}

/** USE CASE 1 — Patient books appointment (hub routes all side-effects) */
export async function hubPatientBookAppointment(appt: EcosystemAppointment): Promise<void> {
  const supabase = getSupabase();
  const status: CanonicalAppointmentStatus = 'Pending';

  await persistAppointment(supabase, appt, status);

  const visit: OpdVisit = {
    id: uid('opd'),
    patientId: appt.patientId,
    patientName: appt.patientName,
    doctorId: appt.doctorId,
    doctorName: appt.doctorName,
    queueNumber: appt.token,
    department: appt.department,
    status: 'Waiting',
    appointmentId: appt.id,
    appointmentTime: appt.time,
    waitMinutes: 0,
  };
  upsertHospitalOpd(visit);

  if (supabase) {
    await supabase.from('opd_visits').insert({
      id: visit.id,
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

  await logActivity(supabase, 'appointment.booked', 'patient', `Appointment booked by ${appt.patientName}`, {
    patientId: appt.patientId,
    doctorId: appt.doctorId,
    relatedId: appt.id,
  });
  await logAudit(supabase, 'appointment.book', 'patient', 'appointment', appt.id, { status }, appt.patientId);

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'New Appointment',
      body: `${appt.patientName} · ${appt.department} · ${appt.date} ${appt.time}`,
      category: 'appointments',
      relatedId: appt.id,
    },
    {
      role: 'patient',
      patientId: appt.patientId,
      title: 'Appointment Request Received',
      body: `Your visit with ${appt.doctorName} on ${appt.date} at ${appt.time} is pending confirmation.`,
      category: 'appointment',
      relatedId: appt.id,
    },
    {
      role: 'doctor',
      doctorId: appt.doctorId,
      patientId: appt.patientId,
      title: 'New Appointment',
      body: `${appt.patientName} · ${appt.date} ${appt.time} · routed via Hospital Hub`,
      category: 'appointment',
      relatedId: appt.id,
    },
  ]);
}

/** USE CASE 2 — Doctor accepts appointment */
export async function hubDoctorAcceptAppointment(appt: EcosystemAppointment): Promise<void> {
  const supabase = getSupabase();
  await persistAppointment(supabase, appt, 'Confirmed');

  await logActivity(supabase, 'appointment.confirmed', 'doctor', `Doctor accepted appointment for ${appt.patientName}`, {
    doctorId: appt.doctorId,
    patientId: appt.patientId,
    relatedId: appt.id,
  });
  await logAudit(supabase, 'appointment.confirm', 'doctor', 'appointment', appt.id, {}, appt.doctorId);

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Doctor Accepted',
      body: `${appt.doctorName} confirmed ${appt.patientName} · Reception: Confirmed`,
      category: 'appointments',
      relatedId: appt.id,
    },
    {
      role: 'patient',
      patientId: appt.patientId,
      title: 'Appointment Confirmed',
      body: `Your visit with ${appt.doctorName} on ${appt.date} at ${appt.time} is confirmed.`,
      category: 'appointment',
      relatedId: appt.id,
    },
  ]);
}

/** USE CASE 3 — Reception check-in */
export async function hubReceptionCheckIn(visitId: string): Promise<void> {
  const supabase = getSupabase();
  const store = useHospitalStore.getState();
  const visit = store.opdVisits.find((v) => v.id === visitId);
  if (!visit) return;

  const updated: OpdVisit = {
    ...visit,
    status: 'Checked-In',
    checkedInAt: new Date().toISOString(),
  };
  upsertHospitalOpd(updated);

  if (visit.appointmentId) {
    const appt = store.appointments.find((a) => a.id === visit.appointmentId);
    if (appt) {
      await persistAppointment(
        supabase,
        {
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
          status: 'Checked-In',
          type: 'OPD',
          token: appt.token ?? visit.queueNumber,
          location: 'OPD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'Checked-In',
      );
    }
  }

  if (supabase) {
    await supabase.from('opd_visits').update({ status: 'Checked-In', checked_in_at: updated.checkedInAt }).eq('id', visitId);
  }

  await logActivity(supabase, 'appointment.checked_in', 'hospital', `Patient checked in · ${visit.patientName}`, {
    patientId: visit.patientId,
    doctorId: visit.doctorId,
    relatedId: visit.appointmentId ?? visitId,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Patient Checked-In',
      body: `${visit.patientName} · Token ${visit.queueNumber}`,
      category: 'opd',
      relatedId: visitId,
    },
    {
      role: 'doctor',
      doctorId: visit.doctorId,
      patientId: visit.patientId,
      title: 'Patient Waiting',
      body: `${visit.patientName} checked in and is waiting for consultation.`,
      category: 'appointment',
      relatedId: visit.appointmentId,
    },
    {
      role: 'patient',
      patientId: visit.patientId,
      title: 'Checked In',
      body: `You are checked in. Token ${visit.queueNumber}. Please wait in the OPD lounge.`,
      category: 'appointment',
      relatedId: visit.appointmentId,
    },
  ]);
}

/** USE CASE 4 — Doctor starts consultation */
export async function hubDoctorStartConsultation(appt: EcosystemAppointment): Promise<void> {
  const supabase = getSupabase();
  await persistAppointment(supabase, appt, 'In Consultation');

  const store = useHospitalStore.getState();
  const visit = store.opdVisits.find((v) => v.appointmentId === appt.id);
  if (visit) {
    upsertHospitalOpd({ ...visit, status: 'In Consultation' });
    if (supabase) {
      await supabase.from('opd_visits').update({ status: 'In Consultation' }).eq('id', visit.id);
    }
  }

  await logActivity(supabase, 'consultation.started', 'doctor', `Consultation started · ${appt.patientName}`, {
    doctorId: appt.doctorId,
    patientId: appt.patientId,
    relatedId: appt.id,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Consultation In Progress',
      body: `${appt.patientName} with ${appt.doctorName}`,
      category: 'opd',
      relatedId: appt.id,
    },
    {
      role: 'patient',
      patientId: appt.patientId,
      title: 'Consultation Started',
      body: `Dr. ${appt.doctorName} has started your consultation.`,
      category: 'appointment',
      relatedId: appt.id,
    },
  ]);
}

/** USE CASE 5 — Doctor completes consultation */
export async function hubDoctorCompleteConsultation(
  appt: EcosystemAppointment,
  options?: { generateBillingDraft?: boolean; consultationFee?: number },
): Promise<BillingInvoice | null> {
  const supabase = getSupabase();
  await persistAppointment(supabase, appt, 'Completed');

  const store = useHospitalStore.getState();
  const visit = store.opdVisits.find((v) => v.appointmentId === appt.id);
  if (visit) {
    upsertHospitalOpd({ ...visit, status: 'Completed' });
    if (supabase) await supabase.from('opd_visits').update({ status: 'Completed' }).eq('id', visit.id);
  }

  await logActivity(supabase, 'consultation.completed', 'doctor', `Consultation completed · ${appt.patientName}`, {
    doctorId: appt.doctorId,
    patientId: appt.patientId,
    relatedId: appt.id,
  });

  let invoice: BillingInvoice | null = null;
  if (options?.generateBillingDraft !== false) {
    const fee = options?.consultationFee ?? 800;
    invoice = await hubGenerateInvoice({
      patientId: appt.patientId,
      patientName: appt.patientName,
      lineItems: [{ description: 'OPD Consultation', category: 'Consultation', amount: fee }],
      relatedAppointmentId: appt.id,
      draft: true,
    });
  }

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Consultation Completed',
      body: `${appt.patientName} · EMR synced · billing draft ready`,
      category: 'clinical',
      relatedId: appt.id,
    },
    {
      role: 'patient',
      patientId: appt.patientId,
      title: 'Prescription Ready',
      body: 'Your consultation is complete. Prescription and records are in your vault.',
      category: 'prescription',
      relatedId: appt.id,
    },
  ]);

  return invoice;
}

/** USE CASE 6 — Doctor requests admission */
export async function hubDoctorRequestAdmission(input: Omit<HospitalAdmission, 'id' | 'status'>): Promise<HospitalAdmission> {
  const supabase = getSupabase();
  const admission: HospitalAdmission = { ...input, id: uid('adm-req'), status: 'Requested' };
  useHospitalStore.getState().upsertAdmission(admission);

  if (supabase) {
    await supabase.from('admissions').insert({
      id: admission.id,
      patient_id: admission.patientId,
      patient_name: admission.patientName,
      attending_doctor_id: admission.attendingDoctorId,
      attending_doctor_name: admission.attendingDoctorName,
      ward_number: admission.wardNumber,
      bed_number: admission.bedNumber,
      status: 'Requested',
      diagnosis: admission.diagnosis,
      uhid: admission.uhid,
    });
  }

  await logActivity(supabase, 'admission.requested', 'doctor', `Admission request · ${admission.patientName}`, {
    doctorId: admission.attendingDoctorId,
    patientId: admission.patientId,
    relatedId: admission.id,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Admission Request',
      body: `${admission.patientName} · ${admission.diagnosis}`,
      category: 'admissions',
      relatedId: admission.id,
    },
    {
      role: 'patient',
      patientId: admission.patientId,
      title: 'Admission Request Submitted',
      body: 'Your admission request is being processed by the hospital.',
      category: 'system',
      relatedId: admission.id,
    },
  ]);

  return admission;
}

/** USE CASE 7 — Hospital generates invoice */
export async function hubGenerateInvoice(input: {
  patientId: string;
  patientName: string;
  lineItems: BillingInvoice['lineItems'];
  relatedAppointmentId?: string;
  draft?: boolean;
}): Promise<BillingInvoice> {
  const supabase = getSupabase();
  const totalAmount = input.lineItems.reduce((s, l) => s + l.amount, 0);
  const invoice: BillingInvoice = {
    id: uid('inv'),
    patientId: input.patientId,
    patientName: input.patientName,
    totalAmount,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    lineItems: input.lineItems,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    createdAt: new Date().toISOString(),
  };

  useHospitalStore.getState().upsertInvoice(invoice);

  if (supabase) {
    await supabase.from('billing_invoices').insert({
      id: invoice.id,
      patient_id: invoice.patientId,
      patient_name: invoice.patientName,
      invoice_number: invoice.invoiceNumber,
      total_amount: invoice.totalAmount,
      paid_amount: 0,
      payment_status: 'Unpaid',
      line_items: invoice.lineItems,
      amount: invoice.totalAmount,
      status: input.draft ? 'Draft' : 'Submitted',
    });
  }

  await logActivity(supabase, 'invoice.generated', 'hospital', `Invoice generated · ${input.patientName}`, {
    patientId: input.patientId,
    relatedId: invoice.id,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Invoice Generated',
      body: `${input.patientName} · ₹${totalAmount.toLocaleString('en-IN')}`,
      category: 'billing',
      relatedId: invoice.id,
    },
    {
      role: 'patient',
      patientId: input.patientId,
      title: 'Bill Available',
      body: `Invoice ${invoice.invoiceNumber} · ₹${totalAmount.toLocaleString('en-IN')} · Payment pending`,
      category: 'billing',
      relatedId: invoice.id,
    },
  ]);

  return invoice;
}

/** USE CASE 8 — Patient / hospital processes payment */
export async function hubProcessPayment(
  invoiceId: string,
  amount: number,
  method: string,
): Promise<void> {
  const supabase = getSupabase();
  const store = useHospitalStore.getState();
  const inv = store.invoices.find((i) => i.id === invoiceId);
  if (!inv) return;

  const paidAmount = inv.paidAmount + amount;
  const paymentStatus: BillingInvoice['paymentStatus'] =
    paidAmount >= inv.totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';

  useHospitalStore.getState().upsertInvoice({ ...inv, paidAmount, paymentStatus });

  if (supabase) {
    await supabase
      .from('billing_invoices')
      .update({ paid_amount: paidAmount, payment_status: paymentStatus })
      .eq('id', invoiceId);
  }

  await logActivity(supabase, 'payment.received', 'hospital', `Payment received · ${inv.patientName} · ₹${amount}`, {
    patientId: inv.patientId,
    relatedId: invoiceId,
    metadata: { method, amount },
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Payment Received',
      body: `${inv.patientName} · ₹${amount.toLocaleString('en-IN')} via ${method}`,
      category: 'billing',
      relatedId: invoiceId,
    },
    {
      role: 'patient',
      patientId: inv.patientId,
      title: 'Payment Success',
      body: `₹${amount.toLocaleString('en-IN')} received for invoice ${inv.invoiceNumber}.`,
      category: 'billing',
      relatedId: invoiceId,
    },
    {
      role: 'doctor',
      doctorId: undefined,
      patientId: inv.patientId,
      title: 'Consultation Closed',
      body: `Payment received for ${inv.patientName}. Consultation billing closed.`,
      category: 'billing',
      relatedId: invoiceId,
    },
  ]);
}

/** USE CASE 9 — Low stock triggers vendor PO */
export async function hubLowStockAlert(itemId: string, itemName: string, qty: number): Promise<void> {
  const supabase = getSupabase();
  await logActivity(supabase, 'inventory.low_stock', 'system', `Low stock · ${itemName} (${qty} units)`, {
    relatedId: itemId,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Low Stock Alert',
      body: `${itemName} · ${qty} units remaining`,
      category: 'inventory',
      relatedId: itemId,
      severity: 'warning',
    },
  ]);
}

export async function hubCreatePurchaseOrder(input: {
  vendorId: string;
  vendorName: string;
  itemDetails: string;
  totalCost: number;
}): Promise<void> {
  const supabase = getSupabase();
  const poId = uid('po');

  if (supabase) {
    await supabase.from('purchase_orders').insert({
      id: poId,
      vendor_id: input.vendorId,
      vendor_name: input.vendorName,
      item_details: input.itemDetails,
      status: 'Issued',
      total_cost: input.totalCost,
    });
  }

  await logActivity(supabase, 'purchase_order.created', 'hospital', `Purchase order created · ${input.vendorName}`, {
    relatedId: poId,
  });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Purchase Order',
      body: input.itemDetails,
      category: 'vendors',
      relatedId: poId,
    },
    {
      role: 'vendor',
      vendorId: input.vendorId,
      title: 'Purchase Order',
      body: input.itemDetails,
      category: 'purchase_order',
      relatedId: poId,
    },
  ]);
}

/** USE CASE 10 — Vendor dispatch / delivery received */
export async function hubVendorDeliveryReceived(
  poId: string,
  itemDetails: string,
  vendorName: string,
): Promise<void> {
  const supabase = getSupabase();

  if (supabase) {
    await supabase.from('purchase_orders').update({ status: 'Delivered' }).eq('id', poId);
  }

  await logActivity(supabase, 'vendor.delivery', 'vendor', `Delivery received · ${vendorName}`, { relatedId: poId });

  await notifyRoles(supabase, [
    {
      role: 'hospital',
      title: 'Delivery Incoming',
      body: `${vendorName} · ${itemDetails}`,
      category: 'vendors',
      relatedId: poId,
    },
  ]);
}

/** Fetch activity feed for hospital dashboard */
export async function fetchEcosystemActivity(limit = 30): Promise<EcosystemActivityItem[]> {
  const supabase = getSupabase();
  if (!supabase) return useHospitalStore.getState().activityFeed.slice(0, limit);

  const { data } = await supabase
    .from('ecosystem_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const items: EcosystemActivityItem[] = (data ?? []).map((row) => ({
    id: String(row.id),
    eventType: row.event_type as HubEventType,
    actorRole: row.actor_role as HubActorRole,
    message: String(row.message),
    createdAt: String(row.created_at),
    relatedId: row.related_id ? String(row.related_id) : undefined,
  }));

  if (items.length > 0) {
    useHospitalStore.getState().setActivityFeed(items);
  }
  return items.length > 0 ? items : useHospitalStore.getState().activityFeed;
}

/** Unified status transition — all apps should call this */
export async function hubTransitionAppointmentStatus(
  appt: EcosystemAppointment,
  nextStatus: CanonicalAppointmentStatus,
): Promise<void> {
  switch (nextStatus) {
    case 'Pending':
      await persistAppointment(getSupabase(), appt, 'Pending');
      break;
    case 'Confirmed':
      await hubDoctorAcceptAppointment(appt);
      break;
    case 'Checked-In':
      await hubReceptionCheckIn(
        useHospitalStore.getState().opdVisits.find((v) => v.appointmentId === appt.id)?.id ?? '',
      );
      break;
    case 'In Consultation':
      await hubDoctorStartConsultation(appt);
      break;
    case 'Completed':
      await hubDoctorCompleteConsultation(appt);
      break;
    case 'Cancelled':
    case 'No Show':
      await persistAppointment(getSupabase(), appt, nextStatus);
      await logActivity(getSupabase(), 'appointment.cancelled', 'system', `Appointment ${nextStatus} · ${appt.patientName}`, {
        relatedId: appt.id,
      });
      break;
    default:
      await persistAppointment(getSupabase(), appt, nextStatus);
  }
}
