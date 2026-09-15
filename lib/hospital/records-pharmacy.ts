import type { SupabaseClient } from '@supabase/supabase-js';

import { hospitalIdQueryValues, isUuidColumnError, isUuidValue } from '@/lib/hospital/hospital-node';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export type MedicineStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type FormularyMedicine = {
  id: string;
  hospital_id: string;
  name: string;
  sku: string;
  category: string;
  strength: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  batch_number: string;
  expiry_date: string;
  status: MedicineStatus;
};

export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  medicine_id?: string;
  medicine_name: string;
  sku: string;
  dosage: string;
  frequency: string;
  qty_required: number;
  qty_dispensed: number;
};

export type PharmacyPrescription = {
  id: string;
  hospital_id: string;
  appointment_id?: string;
  uhid: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name: string;
  status: 'new' | 'partially_dispensed' | 'dispensed';
  items: PrescriptionItem[];
  created_at: string;
  dispensed_at?: string;
};

export type ClinicalRecord = {
  id: string;
  hospital_id: string;
  uhid: string;
  patient_name: string;
  activity_type: string;
  activity: string;
  doctor_name: string;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
  diagnosis?: string;
  clinical_notes?: string;
  vitals?: Record<string, unknown>;
  medications?: Array<{ name: string; dosage?: string; frequency?: string }>;
};

export type InventoryTransaction = {
  id: string;
  hospital_id: string;
  medicine_id?: string;
  sku: string;
  medicine_name: string;
  txn_type: string;
  quantity: number;
  balance_after?: number;
  notes: string;
  created_at: string;
};

export type FormularyDraft = {
  name: string;
  sku: string;
  category: string;
  strength: string;
  unit: string;
  reorder_level: number;
  opening_stock: number;
  batch_number: string;
  expiry_date: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function medicineStatus(stock: number, reorderLevel: number): MedicineStatus {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export function isLowStock(item: FormularyMedicine): boolean {
  return item.current_stock > 0 && item.current_stock <= item.reorder_level;
}

export function isOutOfStock(item: FormularyMedicine): boolean {
  return item.current_stock <= 0;
}

export function isExpiringSoon(item: FormularyMedicine, days = 60): boolean {
  if (!item.expiry_date) return false;
  const expiry = new Date(item.expiry_date);
  if (Number.isNaN(expiry.getTime())) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return expiry.getTime() <= limit.getTime();
}

export function isSameLocalDay(iso?: string | null): boolean {
  if (!iso) return false;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

function mapMedicine(row: Record<string, unknown>, hospitalId: string): FormularyMedicine {
  const stock = Number(row.current_stock ?? row.stock ?? row.quantity_in_stock ?? row.stock_quantity ?? 0);
  const reorder = Number(row.reorder_level ?? row.reorder_threshold ?? 10);
  const name = String(row.name ?? row.item_name ?? '').trim();
  const sku = String(row.sku ?? '').trim() || `SKU-${name.slice(0, 8).toUpperCase().replace(/\s+/g, '') || 'ITEM'}`;
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    name,
    sku,
    category: String(row.category ?? 'Medicine').trim() || 'Medicine',
    strength: String(row.strength ?? ''),
    unit: String(row.unit ?? 'strip'),
    current_stock: stock,
    reorder_level: reorder,
    batch_number: String(row.batch_number ?? ''),
    expiry_date: row.expiry_date ? String(row.expiry_date).slice(0, 10) : '',
    status: medicineStatus(stock, reorder),
  };
}

function mapPrescriptionItem(row: Record<string, unknown>, prescriptionId: string): PrescriptionItem {
  return {
    id: String(row.id ?? `${prescriptionId}-${row.medicine_name ?? row.name ?? 'item'}`),
    prescription_id: prescriptionId,
    medicine_id: row.medicine_id ? String(row.medicine_id) : undefined,
    medicine_name: String(row.medicine_name ?? row.name ?? row.drug ?? '').trim(),
    sku: String(row.sku ?? ''),
    dosage: String(row.dosage ?? row.dose ?? ''),
    frequency: String(row.frequency ?? row.timing ?? ''),
    qty_required: Math.max(1, Number(row.qty_required ?? row.qty ?? row.quantity ?? 1) || 1),
    qty_dispensed: Math.max(0, Number(row.qty_dispensed ?? 0) || 0),
  };
}

function normalizePrescriptionStatus(raw: string): PharmacyPrescription['status'] {
  const value = raw.toLowerCase();
  if (value.includes('partial')) return 'partially_dispensed';
  if (value.includes('dispense') || value === 'fulfilled' || value === 'issued') {
    return value === 'issued' || value === 'new' ? 'new' : 'dispensed';
  }
  if (value === 'new' || value === 'pending') return 'new';
  return 'new';
}

function parseJsonList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapPrescription(row: Record<string, unknown>, items: PrescriptionItem[]): PharmacyPrescription {
  const id = String(row.id ?? '');
  const jsonItems = [
    ...parseJsonList(row.items),
    ...parseJsonList(row.medicines),
    ...parseJsonList(row.medications),
  ];
  const resolved =
    items.length > 0
      ? items
      : jsonItems.map((item) => mapPrescriptionItem(asRecord(item), id)).filter((item) => item.medicine_name);
  return {
    id,
    hospital_id: String(row.hospital_id ?? HOSPITAL_TENANT_ID),
    appointment_id: row.appointment_id ? String(row.appointment_id) : undefined,
    uhid: String(row.uhid ?? row.patient_id ?? row.patient_uhid ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    doctor_id: row.doctor_id ? String(row.doctor_id) : undefined,
    doctor_name: String(row.doctor_name ?? 'Physician'),
    status: normalizePrescriptionStatus(String(row.status ?? 'new')),
    items: resolved,
    created_at: String(row.created_at ?? new Date().toISOString()),
    dispensed_at: row.dispensed_at ? String(row.dispensed_at) : undefined,
  };
}

function parseMedications(raw: unknown): Array<{ name: string; dosage?: string; frequency?: string }> {
  const next: Array<{ name: string; dosage?: string; frequency?: string }> = [];
  for (const item of parseJsonList(raw)) {
    const row = asRecord(item);
    const name = String(row.name ?? row.medicine_name ?? row.drug ?? '').trim();
    if (!name) continue;
    next.push({
      name,
      dosage: String(row.dosage ?? row.dose ?? ''),
      frequency: String(row.frequency ?? row.timing ?? ''),
    });
  }
  return next;
}

function parseVitals(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asRecord(parsed);
    } catch {
      return { summary: raw };
    }
  }
  return asRecord(raw);
}

function mapClinicalRecord(row: Record<string, unknown>, hospitalId: string): ClinicalRecord {
  const details = asRecord(row.details);
  const medications = parseMedications(
    row.medications ?? row.medicines ?? details.medications ?? details.prescribed_medications,
  );
  const vitals = parseVitals(row.vitals ?? details.vitals);
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    uhid: String(row.uhid ?? row.patient_id ?? row.patient_uhid ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    activity_type: String(row.activity_type ?? row.record_type ?? 'record_update'),
    activity: String(row.activity ?? row.summary ?? row.diagnosis ?? 'Clinical update'),
    doctor_name: String(row.doctor_name ?? ''),
    status: String(row.status ?? 'recorded'),
    details,
    created_at: String(row.created_at ?? new Date().toISOString()),
    diagnosis: String(row.diagnosis ?? details.diagnosis ?? ''),
    clinical_notes: String(row.clinical_notes ?? row.notes ?? details.notes ?? details.clinical_notes ?? ''),
    vitals,
    medications,
  };
}

function mapInventoryTxn(row: Record<string, unknown>, hospitalId: string): InventoryTransaction {
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    medicine_id: row.medicine_id ? String(row.medicine_id) : undefined,
    sku: String(row.sku ?? ''),
    medicine_name: String(row.medicine_name ?? ''),
    txn_type: String(row.txn_type ?? 'adjust'),
    quantity: Number(row.quantity ?? 0),
    balance_after: row.balance_after == null ? undefined : Number(row.balance_after),
    notes: String(row.notes ?? ''),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function missingColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  return (
    text.match(/Could not find the '([^']+)' column/i)?.[1] ??
    text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i)?.[1] ??
    null
  );
}

async function selectHospitalRows(
  supabase: SupabaseClient,
  table: string,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const primary = await supabase
    .from(table)
    .select('*')
    .eq('hospital_id', nodeId)
    .order('created_at', { ascending: false });
  if (!primary.error && Array.isArray(primary.data)) {
    return primary.data as Record<string, unknown>[];
  }

  const aliases = hospitalIdQueryValues(nodeId);
  const ids = isUuidColumnError(primary.error?.message) ? aliases.filter(isUuidValue) : aliases;
  if (ids.length > 0) {
    const aliased = await supabase.from(table).select('*').in('hospital_id', ids).order('created_at', { ascending: false });
    if (!aliased.error && Array.isArray(aliased.data)) {
      return aliased.data as Record<string, unknown>[];
    }
  }

  const missing = missingColumn(primary.error?.message);
  if (missing === 'hospital_id' || isUuidColumnError(primary.error?.message) || primary.error) {
    const open = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(250);
    if (!open.error && Array.isArray(open.data)) {
      return open.data as Record<string, unknown>[];
    }
  }
  return [];
}

async function selectHospitalOrRecent(
  supabase: SupabaseClient,
  table: string,
  hospitalId: string,
): Promise<Record<string, unknown>[]> {
  const scoped = await selectHospitalRows(supabase, table, hospitalId);
  if (scoped.length > 0) return scoped;
  const open = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(250);
  if (!open.error && Array.isArray(open.data)) return open.data as Record<string, unknown>[];
  return [];
}

function isCompletedStatus(raw?: string | null): boolean {
  const value = String(raw ?? '').toLowerCase();
  return value.includes('complete') || value === 'done' || value === 'discharged' || value === 'closed';
}

function mapCompletedAppointment(row: Record<string, unknown>, hospitalId: string): ClinicalRecord {
  const department = String(row.department ?? row.specialty ?? '').trim();
  const doctor = String(row.doctor_name ?? '').trim();
  const patient = String(row.patient_name ?? 'Patient').trim();
  return {
    id: String(row.id ?? row.appointment_id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    uhid: String(row.uhid ?? row.patient_uhid ?? row.patient_id ?? '').trim(),
    patient_name: patient,
    activity_type: 'consultation',
    activity: department
      ? `Completed consultation · ${department}`
      : `Completed consultation for ${patient}`,
    doctor_name: doctor,
    status: 'completed',
    details: {
      source: 'hospital_appointments',
      department,
      slot_time: row.slot_time ?? row.appointment_time ?? null,
    },
    created_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    diagnosis: String(row.diagnosis ?? row.chief_complaint ?? row.reason_for_visit ?? ''),
    clinical_notes: String(row.clinical_notes ?? row.notes ?? ''),
  };
}

export async function fetchFormularyMedicines(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<FormularyMedicine[]> {
  const seen = new Set<string>();
  const medicines: FormularyMedicine[] = [];
  for (const table of [
    'hospital_medicines',
    'hospital_pharmacy_inventory',
    'pharmacy_inventory',
    'inventory_items',
  ] as const) {
    const rows = await selectHospitalOrRecent(supabase, table, hospitalId);
    for (const row of rows) {
      const mapped = mapMedicine(row, hospitalId);
      const key = mapped.id || mapped.sku || mapped.name;
      if (!mapped.name || !key || seen.has(key)) continue;
      seen.add(key);
      medicines.push(mapped);
    }
    if (medicines.length > 0 && table === 'hospital_medicines') break;
  }
  return medicines;
}

export async function fetchPharmacyPrescriptions(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<PharmacyPrescription[]> {
  const seen = new Set<string>();
  const prescriptions: PharmacyPrescription[] = [];

  for (const table of ['hospital_prescriptions', 'pharmacy_prescriptions', 'prescriptions'] as const) {
    const rows = await selectHospitalOrRecent(supabase, table, hospitalId);
    const ids = rows.map((row) => String(row.id ?? '')).filter(Boolean);
    const grouped = new Map<string, PrescriptionItem[]>();
    if (ids.length > 0 && table === 'hospital_prescriptions') {
      const { data: itemRows } = await supabase
        .from('hospital_prescription_items')
        .select('*')
        .in('prescription_id', ids);
      for (const raw of itemRows || []) {
        const row = asRecord(raw);
        const prescriptionId = String(row.prescription_id ?? '');
        const item = mapPrescriptionItem(row, prescriptionId);
        if (!item.medicine_name) continue;
        const list = grouped.get(prescriptionId) ?? [];
        list.push(item);
        grouped.set(prescriptionId, list);
      }
    }
    for (const row of rows) {
      const mapped = mapPrescription(row, grouped.get(String(row.id ?? '')) ?? []);
      if (!mapped.id || seen.has(mapped.id) || !mapped.patient_name.trim()) continue;
      seen.add(mapped.id);
      prescriptions.push(mapped);
    }
  }

  return prescriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function clinicalRecordIdentity(mapped: ClinicalRecord): string {
  const date = String(mapped.created_at ?? '').slice(0, 10);
  const activity = mapped.activity.trim().toLowerCase();
  const name = mapped.patient_name.trim().toLowerCase();
  const uhid = mapped.uhid.trim().toLowerCase();
  return `${name}|${date}|${activity}|${uhid}`;
}

export async function fetchClinicalRecords(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<ClinicalRecord[]> {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const seen = new Set<string>();
  const records: ClinicalRecord[] = [];

  const ingest = (mapped: ClinicalRecord) => {
    if (!mapped.patient_name.trim()) return;
    const idKey = mapped.id ? `id:${mapped.id}` : '';
    const secondary = clinicalRecordIdentity(mapped);
    if ((idKey && seen.has(idKey)) || seen.has(secondary)) return;
    if (idKey) seen.add(idKey);
    seen.add(secondary);
    records.push(mapped);
  };

  for (const table of ['clinical_medical_records', 'hospital_clinical_records', 'medical_records', 'consultations'] as const) {
    const rows = await selectHospitalOrRecent(supabase, table, nodeId);
    for (const row of rows) ingest(mapClinicalRecord(row, nodeId));
  }

  for (const table of ['hospital_appointments', 'appointments'] as const) {
    const rows = await selectHospitalRows(supabase, table, nodeId);
    for (const row of rows) {
      if (!isCompletedStatus(String(row.status ?? row.queue_status ?? ''))) continue;
      ingest(mapCompletedAppointment(row, nodeId));
    }
  }

  return records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function countTodayAppointments(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<number> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  for (const table of ['hospital_appointments', 'appointments'] as const) {
    const counted = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('appointment_date', todayStr);
    if (!counted.error && typeof counted.count === 'number') return counted.count;
  }
  return 0;
}

export async function fetchInventoryTransactions(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<InventoryTransaction[]> {
  const rows = await selectHospitalRows(supabase, 'hospital_inventory_transactions', hospitalId);
  return rows.map((row) => mapInventoryTxn(row, hospitalId));
}

export async function addFormularyMedicine(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: FormularyDraft,
  existing: FormularyMedicine[],
): Promise<{ ok: boolean; medicine?: FormularyMedicine; error?: string }> {
  const name = draft.name.trim();
  const sku = draft.sku.trim().toUpperCase();
  if (!name) return { ok: false, error: 'Medicine name is required' };
  if (!sku) return { ok: false, error: 'SKU is required' };

  const duplicate = existing.some((item) => item.sku.trim().toLowerCase() === sku.toLowerCase());
  if (duplicate) {
    return { ok: false, error: `SKU ${sku} already exists in the formulary` };
  }

  const stock = Math.max(0, Number(draft.opening_stock) || 0);
  const reorder = Math.max(0, Number(draft.reorder_level) || 0);
  const status = medicineStatus(stock, reorder);
  const payload: Record<string, unknown> = {
    hospital_id: hospitalId,
    name,
    sku,
    category: draft.category.trim() || 'Medicine',
    strength: draft.strength.trim() || null,
    unit: draft.unit.trim() || 'strip',
    current_stock: stock,
    reorder_level: reorder,
    batch_number: draft.batch_number.trim() || null,
    expiry_date: draft.expiry_date || null,
    status,
  };

  const inserted = await supabase.from('hospital_medicines').insert([payload]).select().maybeSingle();
  if (inserted.error) {
    const message = inserted.error.message || 'Could not save formulary item';
    if (/duplicate|unique|already exists/i.test(message)) {
      return { ok: false, error: `SKU ${sku} already exists in the formulary` };
    }
    return { ok: false, error: message };
  }

  await supabase.from('hospital_pharmacy_inventory').insert([
    {
      hospital_id: hospitalId,
      item_name: name,
      name,
      category: payload.category,
      stock,
      quantity_in_stock: stock,
      status,
    },
  ]);

  await supabase.from('hospital_inventory_transactions').insert([
    {
      hospital_id: hospitalId,
      medicine_id: inserted.data ? String((inserted.data as { id?: string }).id ?? '') : null,
      sku,
      medicine_name: name,
      txn_type: 'restock',
      quantity: stock,
      balance_after: stock,
      notes: `Opening stock for ${name} (${sku})`,
    },
  ]);

  await supabase.from('hospital_clinical_records').insert([
    {
      hospital_id: hospitalId,
      uhid: hospitalId,
      patient_name: 'Pharmacy Desk',
      activity_type: 'record_update',
      activity: `Formulary added ${name} · ${sku}`,
      doctor_name: 'Pharmacy',
      status: 'recorded',
      details: { sku, stock },
    },
  ]);

  return {
    ok: true,
    medicine: inserted.data ? mapMedicine(asRecord(inserted.data), hospitalId) : mapMedicine(payload, hospitalId),
  };
}

export type DispenseLineInput = {
  item_id?: string;
  medicine_id?: string;
  sku?: string;
  medicine_name: string;
  qty: number;
};

export async function dispensePrescription(
  supabase: SupabaseClient,
  hospitalId: string,
  prescriptionId: string,
  lines: DispenseLineInput[],
  dispensedBy = 'Pharmacy Desk',
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const safeLines = lines.filter((line) => line.qty > 0);
  if (safeLines.length === 0) return { ok: false, error: 'Enter at least one quantity to dispense' };

  const rpc = await supabase.rpc('dispense_prescription_atomic', {
    p_prescription_id: prescriptionId,
    p_hospital_id: hospitalId,
    p_lines: safeLines,
    p_dispensed_by: dispensedBy,
  });

  if (!rpc.error) {
    const payload = asRecord(rpc.data);
    return { ok: true, status: String(payload.status ?? 'dispensed') };
  }

  return dispensePrescriptionFallback(supabase, hospitalId, prescriptionId, safeLines, dispensedBy);
}

async function dispensePrescriptionFallback(
  supabase: SupabaseClient,
  hospitalId: string,
  prescriptionId: string,
  lines: DispenseLineInput[],
  dispensedBy: string,
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const medicines = await fetchFormularyMedicines(supabase, hospitalId);
  const byId = new Map(medicines.map((item) => [item.id, item]));
  const bySku = new Map(medicines.map((item) => [item.sku.toLowerCase(), item]));
  const byName = new Map(medicines.map((item) => [item.name.toLowerCase(), item]));

  for (const line of lines) {
    const match =
      (line.medicine_id && byId.get(line.medicine_id)) ||
      (line.sku && bySku.get(line.sku.toLowerCase())) ||
      byName.get(line.medicine_name.toLowerCase());
    if (!match) return { ok: false, error: `${line.medicine_name} is not in the formulary` };
    if (line.qty > match.current_stock) {
      return { ok: false, error: `Cannot dispense ${line.qty} of ${match.name}. Available: ${match.current_stock}` };
    }

    const nextStock = match.current_stock - line.qty;
    const status = medicineStatus(nextStock, match.reorder_level);
    const { error } = await supabase
      .from('hospital_medicines')
      .update({ current_stock: nextStock, status, updated_at: new Date().toISOString() })
      .eq('id', match.id);
    if (error) return { ok: false, error: error.message };

    await supabase
      .from('hospital_pharmacy_inventory')
      .update({ stock: nextStock, status })
      .eq('hospital_id', hospitalId)
      .ilike('item_name', match.name);

    if (line.item_id) {
      const { data: itemRow } = await supabase
        .from('hospital_prescription_items')
        .select('qty_dispensed')
        .eq('id', line.item_id)
        .maybeSingle();
      const already = Number((itemRow as { qty_dispensed?: number } | null)?.qty_dispensed ?? 0);
      await supabase
        .from('hospital_prescription_items')
        .update({ qty_dispensed: already + line.qty })
        .eq('id', line.item_id);
    }

    await supabase.from('hospital_inventory_transactions').insert([
      {
        hospital_id: hospitalId,
        medicine_id: match.id,
        sku: match.sku,
        medicine_name: match.name,
        txn_type: 'dispense',
        quantity: -line.qty,
        balance_after: nextStock,
        reference_id: prescriptionId,
        notes: `Dispensed ${line.qty} × ${match.name} by ${dispensedBy}`,
      },
    ]);

    match.current_stock = nextStock;
  }

  const { data: itemRows } = await supabase
    .from('hospital_prescription_items')
    .select('qty_required, qty_dispensed')
    .eq('prescription_id', prescriptionId);
  const items = (itemRows || []) as Array<{ qty_required?: number; qty_dispensed?: number }>;
  const allFilled = items.length > 0 && items.every((item) => Number(item.qty_dispensed ?? 0) >= Number(item.qty_required ?? 1));
  const anyFilled = items.some((item) => Number(item.qty_dispensed ?? 0) > 0);
  const status = allFilled ? 'dispensed' : anyFilled ? 'partially_dispensed' : 'new';

  await supabase
    .from('hospital_prescriptions')
    .update({
      status,
      dispensed_at: status === 'dispensed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prescriptionId);

  const { data: rx } = await supabase.from('hospital_prescriptions').select('*').eq('id', prescriptionId).maybeSingle();
  const rxRow = asRecord(rx);
  await supabase.from('hospital_clinical_records').insert([
    {
      hospital_id: hospitalId,
      uhid: String(rxRow.uhid ?? ''),
      patient_name: String(rxRow.patient_name ?? 'Patient'),
      activity_type: 'dispense',
      activity: `Pharmacy fulfilled prescription for ${String(rxRow.patient_name ?? 'patient')}`,
      doctor_name: dispensedBy,
      status,
      details: { prescription_id: prescriptionId, status },
    },
  ]);

  return { ok: true, status };
}

export type ConsultationPharmacyInput = {
  hospitalId?: string;
  appointmentId?: string;
  uhid: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  medicines: Array<{ name: string; qty?: number; dosage?: string; frequency?: string }>;
};

export async function postConsultationPharmacyBridge(
  supabase: SupabaseClient,
  input: ConsultationPharmacyInput,
): Promise<void> {
  try {
    await writeConsultationPharmacyBridge(supabase, input);
  } catch (err: unknown) {
    console.error('Pharmacy command-center bridge skipped:', err);
  }
}

async function writeConsultationPharmacyBridge(
  supabase: SupabaseClient,
  input: ConsultationPharmacyInput,
): Promise<void> {
  const hospitalId = input.hospitalId || HOSPITAL_TENANT_ID;
  const medicines = input.medicines.filter((item) => item.name.trim());
  const now = new Date().toISOString();

  await supabase.from('hospital_clinical_records').insert([
    {
      hospital_id: hospitalId,
      uhid: input.uhid,
      patient_name: input.patientName,
      activity_type: 'consultation',
      activity: `OPD consultation completed for ${input.patientName}`,
      doctor_name: input.doctorName || 'Physician',
      status: 'completed',
      details: { appointment_id: input.appointmentId || null },
      created_at: now,
    },
  ]);

  if (medicines.length === 0) return;

  const formulary = await fetchFormularyMedicines(supabase, hospitalId);
  const items = medicines.map((med) => {
    const match = formulary.find((row) => row.name.toLowerCase() === med.name.trim().toLowerCase());
    return {
      medicine_id: match?.id || null,
      medicine_name: med.name.trim(),
      sku: match?.sku || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      qty_required: Math.max(1, Number(med.qty) || 1),
      qty_dispensed: 0,
    };
  });

  const { data, error } = await supabase
    .from('hospital_prescriptions')
    .insert([
      {
        hospital_id: hospitalId,
        appointment_id: input.appointmentId || null,
        uhid: input.uhid,
        patient_name: input.patientName,
        doctor_id: input.doctorId || null,
        doctor_name: input.doctorName || 'Physician',
        status: 'new',
        items,
      },
    ])
    .select()
    .maybeSingle();

  if (error || !data) return;

  const prescriptionId = String((data as { id?: string }).id ?? '');
  if (prescriptionId) {
    await supabase.from('hospital_prescription_items').insert(
      items.map((item) => ({
        prescription_id: prescriptionId,
        ...item,
      })),
    );
  }

  await supabase.from('hospital_clinical_records').insert([
    {
      hospital_id: hospitalId,
      uhid: input.uhid,
      patient_name: input.patientName,
      activity_type: 'prescription',
      activity: `${input.doctorName || 'Physician'} prescribed ${items.length} medicine${items.length === 1 ? '' : 's'} for ${input.patientName}`,
      doctor_name: input.doctorName || 'Physician',
      status: 'new',
      details: { prescription_id: prescriptionId, medicines: items },
    },
  ]);
}
