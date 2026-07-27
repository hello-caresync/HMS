import { getSupabaseBrowserClient } from '@/lib/supabase/client';

import type {
  DbAdmission,
  DbAppointment,
  DbBillingInvoice,
  DbPatient,
  DbPharmacyInventory,
  DbStaff,
  HospitalEntityTable,
  HospitalRecordInput,
  HospitalUiRecord,
} from './hospital-db.types';

export function resolveTableForModule(moduleId: string): HospitalEntityTable {
  if (moduleId === 'patients') return 'patients';
  if (moduleId === 'appointments') return 'appointments';
  if (moduleId === 'pharmacy' || moduleId === 'dept-pharmacy') return 'pharmacy_inventory';
  if (['admissions', 'ipd', 'discharge', 'emergency', 'ot'].includes(moduleId)) return 'admissions';
  if (moduleId.startsWith('staff')) return 'staff';
  if (
    moduleId.startsWith('bill') ||
    moduleId === 'billing' ||
    moduleId === 'invoices' ||
    moduleId === 'payments' ||
    moduleId === 'receipts' ||
    moduleId === 'insurance'
  ) {
    return 'billing_invoices';
  }
  return 'patients';
}

function formatUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

function mapPatient(row: DbPatient): HospitalUiRecord {
  return {
    id: row.id,
    reference: row.uhid,
    subject: row.full_name,
    department: row.department ?? '—',
    status: row.status,
    updatedAt: formatUpdated(row.updated_at),
  };
}

function mapAdmission(row: DbAdmission): HospitalUiRecord {
  return {
    id: row.id,
    reference: row.uhid ?? row.id.slice(0, 8),
    subject: row.patient_name,
    department: row.ward ?? row.department ?? '—',
    status: row.status,
    updatedAt: formatUpdated(row.updated_at),
  };
}

function mapBilling(row: DbBillingInvoice): HospitalUiRecord {
  const total = Number(row.total_amount);
  const paid = Number(row.paid_amount ?? 0);
  return {
    id: row.id,
    reference: row.invoice_number,
    subject: row.patient_name,
    department: row.department ?? 'Billing',
    amount: `₹${total.toLocaleString('en-IN')} · paid ₹${paid.toLocaleString('en-IN')}`,
    status: row.payment_status ?? row.status,
    updatedAt: formatUpdated(row.updated_at),
    totalDue: total,
    paidAmount: paid,
  };
}

function mapPharmacy(row: DbPharmacyInventory): HospitalUiRecord {
  return {
    id: row.id,
    reference: row.sku,
    subject: row.item_name,
    department: row.category ?? 'General',
    amount: `${Number(row.quantity_in_stock)} units`,
    status: row.status,
    updatedAt: formatUpdated(row.updated_at),
  };
}

function mapStaff(row: DbStaff): HospitalUiRecord {
  return {
    id: row.id,
    reference: row.role_title ?? 'Staff',
    subject: row.full_name,
    department: row.department ?? '—',
    status: row.status,
    updatedAt: formatUpdated(row.updated_at),
  };
}

export async function fetchModuleRecords(
  moduleId: string,
  searchQuery?: string,
): Promise<{ data: HospitalUiRecord[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const table = resolveTableForModule(moduleId);
  const q = searchQuery?.trim();

  try {
    if (table === 'patients') {
      let query = supabase.from('patients').select('*').eq('module_id', moduleId).order('created_at', { ascending: false }).limit(50);
      if (q) {
        query = query.or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: ((data as DbPatient[]) ?? []).map(mapPatient), error: null };
    }

    if (table === 'admissions') {
      let query = supabase.from('admissions').select('*').order('created_at', { ascending: false }).limit(50);
      if (moduleId === 'discharge') {
        query = query.in('status', ['Admitted', 'Active']);
      } else {
        query = query.eq('module_id', moduleId);
      }
      if (q) {
        query = query.or(`patient_name.ilike.%${q}%,uhid.ilike.%${q}%,bed_number.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: ((data as DbAdmission[]) ?? []).map(mapAdmission), error: null };
    }

    if (table === 'billing_invoices') {
      let query = supabase
        .from('billing_invoices')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) {
        query = query.or(`patient_name.ilike.%${q}%,invoice_number.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: ((data as DbBillingInvoice[]) ?? []).map(mapBilling), error: null };
    }

    if (table === 'staff') {
      let query = supabase.from('staff').select('*').eq('module_id', moduleId).order('created_at', { ascending: false }).limit(50);
      if (q) {
        query = query.or(`full_name.ilike.%${q}%,role_title.ilike.%${q}%,department.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: ((data as DbStaff[]) ?? []).map(mapStaff), error: null };
    }

    if (table === 'pharmacy_inventory') {
      let query = supabase
        .from('pharmacy_inventory')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (q) {
        query = query.or(`item_name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: ((data as DbPharmacyInventory[]) ?? []).map(mapPharmacy), error: null };
    }

    return { data: [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Failed to load records' };
  }
}

export async function insertModuleRecord(input: HospitalRecordInput): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const table = resolveTableForModule(input.moduleId);
  const now = new Date().toISOString();

  try {
    if (table === 'patients') {
      const { error } = await supabase.from('patients').insert([
        {
          full_name: input.subject,
          uhid: input.reference,
          phone: input.phone ?? null,
          department: input.department,
          status: 'Active',
          module_id: input.moduleId,
          updated_at: now,
        },
      ]);
      return { error: error?.message ?? null };
    }

    if (table === 'admissions') {
      const { error } = await supabase.from('admissions').insert([
        {
          patient_name: input.subject,
          uhid: input.reference,
          ward: input.department,
          department: input.department,
          doctor_name: input.doctorName ?? null,
          bed_number: input.bedNumber ?? null,
          status: 'Admitted',
          module_id: input.moduleId,
          updated_at: now,
        },
      ]);
      return { error: error?.message ?? null };
    }

    if (table === 'billing_invoices') {
      const subtotal = Number(input.amount) || 0;
      const tax = subtotal * 0.18;
      const total = subtotal + tax;
      const { error } = await supabase.from('billing_invoices').insert([
        {
          invoice_number: input.reference,
          patient_name: input.subject,
          department: input.department,
          amount: subtotal,
          tax_amount: tax,
          total_amount: total,
          paid_amount: 0,
          payment_status: 'Unpaid',
          status: 'Submitted',
          module_id: input.moduleId,
          updated_at: now,
        },
      ]);
      return { error: error?.message ?? null };
    }

    if (table === 'staff') {
      const { error } = await supabase.from('staff').insert([
        {
          full_name: input.subject,
          role_title: input.reference,
          department: input.department,
          status: 'Active',
          module_id: input.moduleId,
          updated_at: now,
        },
      ]);
      return { error: error?.message ?? null };
    }

    if (table === 'pharmacy_inventory') {
      const qty = Number(input.amount) || 0;
      const { error } = await supabase.from('pharmacy_inventory').insert([
        {
          sku: input.reference,
          item_name: input.subject,
          category: input.department,
          quantity_in_stock: qty,
          status: qty <= 10 ? 'Low Stock' : 'In Stock',
          module_id: input.moduleId,
          updated_at: now,
        },
      ]);
      return { error: error?.message ?? null };
    }

    return { error: 'Unsupported table mapping' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Insert failed' };
  }
}

export async function dischargeAdmission(recordId: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('admissions')
      .update({ status: 'Discharged', discharge_date: now, updated_at: now })
      .eq('id', recordId);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Discharge failed' };
  }
}

export async function recordInvoicePayment(
  recordId: string,
  payAmount?: number,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('billing_invoices')
      .select('total_amount, paid_amount')
      .eq('id', recordId)
      .maybeSingle();
    if (fetchErr) return { error: fetchErr.message };
    if (!row) return { error: 'Invoice not found' };

    const total = Number(row.total_amount);
    const alreadyPaid = Number(row.paid_amount ?? 0);
    const increment = payAmount ?? Math.max(0, total - alreadyPaid);
    const newPaid = Math.min(total, alreadyPaid + increment);
    const payment_status = newPaid >= total ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';
    const status = payment_status === 'Paid' ? 'Paid' : 'Submitted';

    const { error } = await supabase
      .from('billing_invoices')
      .update({ paid_amount: newPaid, payment_status, status, updated_at: now })
      .eq('id', recordId);

    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Payment update failed' };
  }
}

export async function adjustPharmacyStock(recordId: string, delta: number): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('pharmacy_inventory')
      .select('quantity_in_stock, reorder_level')
      .eq('id', recordId)
      .maybeSingle();
    if (fetchErr) return { error: fetchErr.message };
    if (!row) return { error: 'Item not found' };

    const nextQty = Math.max(0, Number(row.quantity_in_stock) + delta);
    const status = nextQty <= Number(row.reorder_level ?? 10) ? 'Low Stock' : 'In Stock';

    const { error } = await supabase
      .from('pharmacy_inventory')
      .update({ quantity_in_stock: nextQty, status, updated_at: now })
      .eq('id', recordId);

    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Stock update failed' };
  }
}

export async function insertPatientRegistration(input: {
  fullName: string;
  uhid: string;
  phone?: string;
  department?: string;
}): Promise<{ error: string | null }> {
  return insertModuleRecord({
    moduleId: 'patients',
    subject: input.fullName,
    reference: input.uhid,
    department: input.department ?? 'Registration',
    phone: input.phone,
  });
}

export async function completeModuleRecord(
  moduleId: string,
  recordId: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  const table = resolveTableForModule(moduleId);
  const status =
    table === 'billing_invoices' ? 'Paid' : table === 'admissions' ? 'Discharged' : 'Completed';

  try {
    const { error } = await supabase
      .from(table)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', recordId);

    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed' };
  }
}

export async function fetchAppointments(): Promise<{ data: DbAppointment[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return { data: [], error: error.message };
    return { data: (data as DbAppointment[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Failed to load appointments' };
  }
}

export async function insertAppointment(row: {
  token: string;
  patient_name: string;
  department: string;
  provider: string;
  scheduled_time: string;
  location: string;
  status: string;
  channels: { sms: boolean; email: boolean; whatsapp: boolean };
}): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { error } = await supabase.from('appointments').insert([{ ...row, updated_at: new Date().toISOString() }]);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Insert failed' };
  }
}

export async function updateAppointment(
  id: string,
  patch: Partial<Pick<DbAppointment, 'status' | 'scheduled_time'>>,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed' };
  }
}

export async function deleteAppointment(id: string): Promise<{ error: string | null }> {
  return updateAppointment(id, { status: 'Cancelled' });
}

export async function completeAppointment(id: string): Promise<{ error: string | null }> {
  return updateAppointment(id, { status: 'Completed' });
}

export async function fetchHospitalDashboardCounts(): Promise<{
  opdQueue: number;
  admissions: number;
  staff: number;
  error: string | null;
}> {
  const supabase = getSupabaseBrowserClient();
  try {
    const [appt, adm, st] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['In-Queue', 'IN_QUEUE', 'Waiting List', 'Confirmed']),
      supabase
        .from('admissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Admitted', 'Active']),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    ]);

    const error = appt.error?.message ?? adm.error?.message ?? st.error?.message ?? null;
    return {
      opdQueue: appt.count ?? 0,
      admissions: adm.count ?? 0,
      staff: st.count ?? 0,
      error,
    };
  } catch (e) {
    return { opdQueue: 0, admissions: 0, staff: 0, error: e instanceof Error ? e.message : 'Dashboard load failed' };
  }
}

export function dbAppointmentToQueueEntry(row: DbAppointment): {
  id: string;
  token: string;
  patientName: string;
  department: string;
  provider: string;
  scheduledTime: string;
  location: string;
  channels: { sms: boolean; email: boolean; whatsapp: boolean };
  status: 'Confirmed' | 'In-Queue' | 'Waiting List' | 'Completed' | 'Cancelled';
} {
  const statusMap: Record<string, 'Confirmed' | 'In-Queue' | 'Waiting List' | 'Completed' | 'Cancelled'> = {
    Confirmed: 'Confirmed',
    'In-Queue': 'In-Queue',
    IN_QUEUE: 'In-Queue',
    'Waiting List': 'Waiting List',
    Cancelled: 'Cancelled',
    Completed: 'Completed',
  };
  const ch = row.channels ?? {};
  return {
    id: row.id,
    token: row.token,
    patientName: row.patient_name,
    department: row.department,
    provider: row.provider ?? '—',
    scheduledTime: row.scheduled_time ?? '—',
    location: row.location ?? 'Main Campus',
    channels: { sms: !!ch.sms, email: !!ch.email, whatsapp: !!ch.whatsapp },
    status: statusMap[row.status] ?? 'Confirmed',
  };
}
