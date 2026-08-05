import { getSupabaseBrowserClient } from '@/lib/supabase/client';

import { DEFAULT_SETTINGS } from '../seed-data';
import type { HospitalSettings } from '../types';
import { useHospitalStore } from '../store';

export type HospitalProfileRow = {
  id: string;
  hospital_name: string;
  logo_url: string | null;
  address: string | null;
  tax_gst_id: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  emergency_line: string | null;
  tax_percentage: number;
  currency_symbol: string;
  invoice_prefix: string;
  payment_methods: string[];
  opd_working_days: string[];
  opd_hours_start: string;
  opd_hours_end: string;
  departments: string[];
  wards: Array<{ name: string; beds: number }>;
  setup_completed: boolean;
  setup_step: number;
};

export type SetupWizardDraft = {
  hospitalName: string;
  logoUrl: string;
  address: string;
  taxGstId: string;
  licenseNumber: string;
  phone: string;
  email: string;
  emergencyLine: string;
  departments: string[];
  doctors: Array<{
    fullName: string;
    department: string;
    licenseNo: string;
    consultationFee: number;
    slotStart: string;
    slotEnd: string;
  }>;
  staff: Array<{ fullName: string; role: string; email: string }>;
  taxPercentage: number;
  currencySymbol: string;
  invoicePrefix: string;
  paymentMethods: string[];
  opdWorkingDays: string[];
  opdHoursStart: string;
  opdHoursEnd: string;
  wards: Array<{ name: string; beds: number }>;
};

function supabaseReady() {
  return Boolean(
    typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function rowToSettings(row: HospitalProfileRow): HospitalSettings {
  return {
    hospitalName: row.hospital_name,
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    departments: row.departments.length ? row.departments : DEFAULT_SETTINGS.departments,
    workingHoursStart: row.opd_hours_start?.slice(0, 5) ?? '08:00',
    workingHoursEnd: row.opd_hours_end?.slice(0, 5) ?? '20:00',
    rbacEnabled: true,
  };
}

export async function fetchHospitalProfile(): Promise<{
  profile: HospitalProfileRow | null;
  setupRequired: boolean;
}> {
  if (!supabaseReady()) {
    const settings = useHospitalStore.getState().settings;
    const setupRequired = settings.hospitalName === DEFAULT_SETTINGS.hospitalName;
    return { profile: null, setupRequired };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { profile: null, setupRequired: true };

  const { data, error } = await supabase.from('hospital_profile').select('*').limit(1).maybeSingle();
  if (error || !data) {
    return { profile: null, setupRequired: true };
  }

  const row = data as Record<string, unknown>;
  const profile: HospitalProfileRow = {
    id: String(row.id),
    hospital_name: String(row.hospital_name ?? ''),
    logo_url: row.logo_url ? String(row.logo_url) : null,
    address: row.address ? String(row.address) : null,
    tax_gst_id: row.tax_gst_id ? String(row.tax_gst_id) : null,
    license_number: row.license_number ? String(row.license_number) : null,
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    emergency_line: row.emergency_line ? String(row.emergency_line) : null,
    tax_percentage: Number(row.tax_percentage ?? 0),
    currency_symbol: String(row.currency_symbol ?? '₹'),
    invoice_prefix: String(row.invoice_prefix ?? 'INV'),
    payment_methods: (row.payment_methods as string[]) ?? ['Cash', 'UPI'],
    opd_working_days: (row.opd_working_days as string[]) ?? [],
    opd_hours_start: String(row.opd_hours_start ?? '08:00'),
    opd_hours_end: String(row.opd_hours_end ?? '20:00'),
    departments: (row.departments as string[]) ?? [],
    wards: (row.wards as HospitalProfileRow['wards']) ?? [],
    setup_completed: Boolean(row.setup_completed),
    setup_step: Number(row.setup_step ?? 0),
  };

  useHospitalStore.getState().updateSettings(rowToSettings(profile));
  return { profile, setupRequired: !profile.setup_completed };
}

export async function saveSetupWizardStep(step: number, draft: Partial<SetupWizardDraft>): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    if (draft.hospitalName) {
      useHospitalStore.getState().updateSettings({
        hospitalName: draft.hospitalName,
        address: draft.address ?? '',
        phone: draft.phone ?? '',
        email: draft.email ?? '',
        departments: draft.departments ?? DEFAULT_SETTINGS.departments,
        workingHoursStart: draft.opdHoursStart ?? '08:00',
        workingHoursEnd: draft.opdHoursEnd ?? '20:00',
      });
    }
    return;
  }

  const payload: Record<string, unknown> = {
    setup_step: step,
    updated_at: new Date().toISOString(),
  };
  if (draft.hospitalName != null) payload.hospital_name = draft.hospitalName;
  if (draft.logoUrl != null) payload.logo_url = draft.logoUrl;
  if (draft.address != null) payload.address = draft.address;
  if (draft.taxGstId != null) payload.tax_gst_id = draft.taxGstId;
  if (draft.licenseNumber != null) payload.license_number = draft.licenseNumber;
  if (draft.phone != null) payload.phone = draft.phone;
  if (draft.email != null) payload.email = draft.email;
  if (draft.emergencyLine != null) payload.emergency_line = draft.emergencyLine;
  if (draft.departments != null) payload.departments = draft.departments;
  if (draft.taxPercentage != null) payload.tax_percentage = draft.taxPercentage;
  if (draft.currencySymbol != null) payload.currency_symbol = draft.currencySymbol;
  if (draft.invoicePrefix != null) payload.invoice_prefix = draft.invoicePrefix;
  if (draft.paymentMethods != null) payload.payment_methods = draft.paymentMethods;
  if (draft.opdWorkingDays != null) payload.opd_working_days = draft.opdWorkingDays;
  if (draft.opdHoursStart != null) payload.opd_hours_start = draft.opdHoursStart;
  if (draft.opdHoursEnd != null) payload.opd_hours_end = draft.opdHoursEnd;
  if (draft.wards != null) payload.wards = draft.wards;

  const { data: existing } = await supabase.from('hospital_profile').select('id').limit(1).maybeSingle();
  if (existing?.id) {
    await supabase.from('hospital_profile').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('hospital_profile').insert(payload);
  }
}

export async function finalizeHospitalSetup(draft: SetupWizardDraft): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  await saveSetupWizardStep(7, draft);

  if (supabase && draft.staff.length) {
    for (const member of draft.staff) {
      await supabase.from('staff').insert({
        full_name: member.fullName,
        role: member.role,
        email: member.email || `${member.fullName.toLowerCase().replace(/\s+/g, '.')}@hospital.local`,
      });
    }
  }

  if (supabase && draft.doctors.length) {
    for (const doc of draft.doctors) {
      await supabase.from('staff').insert({
        full_name: doc.fullName,
        role: 'Doctor',
        department: doc.department,
        email: `${doc.fullName.toLowerCase().replace(/\s+/g, '.')}@hospital.local`,
        consultation_fee: doc.consultationFee,
      });
    }
  }

  if (supabase) {
    const { data: existing } = await supabase.from('hospital_profile').select('id').limit(1).maybeSingle();
    if (existing?.id) {
      await supabase
        .from('hospital_profile')
        .update({ setup_completed: true, setup_step: 7, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
  }

  useHospitalStore.getState().updateSettings({
    hospitalName: draft.hospitalName,
    address: draft.address,
    phone: draft.phone,
    email: draft.email,
    departments: draft.departments,
    workingHoursStart: draft.opdHoursStart,
    workingHoursEnd: draft.opdHoursEnd,
    rbacEnabled: true,
  });
}
