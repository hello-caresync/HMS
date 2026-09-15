import type { SupabaseClient } from '@supabase/supabase-js';

import {
  loadPatientBillsLive,
  type ConsultationBill,
} from '@/lib/hospital/operations/consultation-billing-sync';
import { formatINR } from '@/lib/utils/currency';

export type UnifiedBillingStatus = ConsultationBill['status'] | 'none';

export type PatientBillingSnapshot = {
  appointmentId: string | null;
  bills: ConsultationBill[];
  status: UnifiedBillingStatus;
  statusLabel: string;
  summaryLabel: string;
  totalOutstanding: number;
  hasBills: boolean;
};

function worstStatus(statuses: UnifiedBillingStatus[]): UnifiedBillingStatus {
  if (statuses.length === 0) return 'none';
  if (statuses.some((s) => s === 'unpaid')) return 'unpaid';
  if (statuses.some((s) => s === 'partial')) return 'partial';
  if (statuses.some((s) => s === 'insurance_pending')) return 'insurance_pending';
  if (statuses.every((s) => s === 'paid')) return 'paid';
  return 'none';
}

export function billingStatusLabel(status: UnifiedBillingStatus): string {
  if (status === 'paid') return 'All settled';
  if (status === 'partial') return 'Partial payment due';
  if (status === 'insurance_pending') return 'Insurance pending';
  if (status === 'unpaid') return 'Payment due';
  return 'No bills yet';
}

export function billLineStatusLabel(status: ConsultationBill['status']): string {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial payment';
  if (status === 'insurance_pending') return 'Insurance pending';
  return 'Payment due';
}

export function billingStatusBadgeClass(status: UnifiedBillingStatus): string {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-900 border-emerald-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-950 border-amber-200';
  if (status === 'insurance_pending') return 'bg-sky-50 text-sky-950 border-sky-200';
  if (status === 'unpaid') return 'bg-rose-50 text-rose-900 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

async function fetchLatestPatientAppointmentId(
  supabase: SupabaseClient,
  patientId: string,
  patientUhid?: string,
): Promise<string | null> {
  const filters = [`patient_id.eq.${patientId}`];
  if (patientUhid && patientUhid !== patientId) {
    filters.push(`patient_id.eq.${patientUhid}`, `uhid.eq.${patientUhid}`);
  }

  for (const table of ['patient_appointments', 'appointments'] as const) {
    const { data } = await supabase
      .from(table)
      .select('id, appointment_id')
      .or(filters.join(','))
      .order('created_at', { ascending: false })
      .limit(1);

    const row = data?.[0] as Record<string, unknown> | undefined;
    if (!row) continue;
    const id = String(row.appointment_id ?? row.id ?? '').trim();
    if (id) return id;
  }

  return null;
}

async function loadAppointmentInvoices(
  supabase: SupabaseClient,
  appointmentId: string,
  patientId: string,
): Promise<ConsultationBill[]> {
  const allPatientBills = await loadPatientBillsLive(supabase, patientId, 50);
  const scoped = allPatientBills.filter((bill) => bill.appointment_id === appointmentId);
  return scoped.length > 0 ? scoped : allPatientBills.slice(0, 5);
}

export async function loadPatientBillingSnapshot(
  supabase: SupabaseClient,
  patientId: string,
  patientUhid?: string,
): Promise<PatientBillingSnapshot> {
  if (!patientId) {
    return {
      appointmentId: null,
      bills: [],
      status: 'none',
      statusLabel: billingStatusLabel('none'),
      summaryLabel: billingStatusLabel('none'),
      totalOutstanding: 0,
      hasBills: false,
    };
  }

  const appointmentId = await fetchLatestPatientAppointmentId(supabase, patientId, patientUhid);
  const bills = appointmentId
    ? await loadAppointmentInvoices(supabase, appointmentId, patientId)
    : await loadPatientBillsLive(supabase, patientId, 5);

  const statuses = bills.map((bill) => bill.status);
  const status = worstStatus(statuses);
  const totalOutstanding = bills.reduce(
    (sum, bill) => sum + Math.max(bill.total_amount - bill.paid_amount, 0),
    0,
  );

  const summaryLabel =
    status === 'none'
      ? billingStatusLabel('none')
      : totalOutstanding > 0
        ? `${formatINR(totalOutstanding)} due`
        : billingStatusLabel(status);

  return {
    appointmentId,
    bills,
    status,
    statusLabel: billingStatusLabel(status),
    summaryLabel,
    totalOutstanding,
    hasBills: bills.length > 0,
  };
}

export function buildBillingSnapshotFromBills(
  bills: ConsultationBill[],
  appointmentId?: string | null,
): PatientBillingSnapshot {
  const scoped = appointmentId
    ? bills.filter((bill) => bill.appointment_id === appointmentId)
    : bills;
  const effective = scoped.length > 0 ? scoped : bills;
  const statuses = effective.map((bill) => bill.status);
  const status = worstStatus(statuses);
  const totalOutstanding = effective.reduce(
    (sum, bill) => sum + Math.max(bill.total_amount - bill.paid_amount, 0),
    0,
  );

  return {
    appointmentId: appointmentId ?? effective[0]?.appointment_id ?? null,
    bills: effective,
    status,
    statusLabel: billingStatusLabel(status),
    summaryLabel:
      status === 'none'
        ? billingStatusLabel('none')
        : totalOutstanding > 0
          ? `${formatINR(totalOutstanding)} due`
          : billingStatusLabel(status),
    totalOutstanding,
    hasBills: effective.length > 0,
  };
}
