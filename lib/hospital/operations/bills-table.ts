import type { SupabaseClient } from '@supabase/supabase-js';

import { BILLS_TABLE, LEGACY_BILLS_TABLE } from '@/lib/regal/constants';

export { BILLS_TABLE, LEGACY_BILLS_TABLE };

export async function resolveBillsTable(client: SupabaseClient): Promise<string> {
  const probe = await client.from(BILLS_TABLE).select('id').limit(1);
  if (!probe.error) return BILLS_TABLE;
  return LEGACY_BILLS_TABLE;
}

export function normalizeBillRow(row: Record<string, unknown>): Record<string, unknown> {
  const consultation = Number(row.consultation_fee ?? 0);
  const pharmacy = Number(row.pharmacy_charges ?? 0);
  const other = Number(row.other_charges ?? 0);
  const total = Number(row.total_amount ?? consultation + pharmacy + other);
  const paid = Number(row.paid_amount ?? 0);

  return {
    ...row,
    patient_id: row.patient_id ?? row.patient_uhid ?? null,
    total_amount: total,
    paid_amount: paid,
    payment_mode: row.payment_mode ?? row.payment_method ?? null,
    payment_status: row.payment_status ?? row.status ?? 'unpaid',
    facility_code: row.facility_code ?? 'RH-BLR-01',
    line_items: row.line_items ?? row.lines ?? row.items ?? [],
    lines: row.lines ?? row.line_items ?? row.items ?? [],
  };
}

export function toEnterpriseBillPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const lines = (payload.line_items ?? payload.lines ?? []) as { amount?: number; category?: string }[];
  const pharmacy = lines
    .filter((line) => line.category === 'pharmacy')
    .reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
  const other = lines
    .filter((line) => line.category && line.category !== 'consultation' && line.category !== 'pharmacy')
    .reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
  const consultation =
    lines.find((line) => line.category === 'consultation')?.amount ??
    payload.consultation_fee ??
    payload.total_amount;

  const total = Number(payload.total_amount ?? 0);
  const paid = Number(payload.paid_amount ?? 0);

  return {
    id: payload.id,
    invoice_number: payload.invoice_number,
    hospital_id: payload.hospital_id,
    appointment_id: payload.appointment_id,
    patient_id: payload.patient_id,
    patient_uhid: payload.patient_uhid,
    patient_name: payload.patient_name,
    patient_phone: payload.patient_phone ?? null,
    booking_source: payload.booking_source ?? 'hospital_walkin',
    doctor_id: payload.doctor_id,
    doctor_name: payload.doctor_name,
    department: payload.department ?? 'OPD',
    consultation_fee: Number(consultation ?? 0),
    pharmacy_charges: pharmacy,
    other_charges: other,
    total_amount: total,
    paid_amount: paid,
    balance_amount: Math.max(total - paid, 0),
    payment_method: payload.payment_mode ?? payload.payment_method ?? null,
    payment_reference: payload.payment_reference ?? null,
    status: payload.status ?? 'unpaid',
    facility_code: payload.facility_code ?? 'RH-BLR-01',
    line_items: payload.line_items ?? payload.lines ?? [],
    bill_type: payload.bill_type ?? 'opd_consultation',
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    settled_at: payload.status === 'paid' ? payload.updated_at : null,
  };
}
