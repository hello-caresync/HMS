'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  HeartHandshake,
  IndianRupee,
  LayoutGrid,
  ListOrdered,
  Loader2,
  LogOut,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  Smartphone,
  Stethoscope,
  TicketPlus,
  Users,
  X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { isHospitalSetupCompleted } from '@/lib/auth/admin-setup';
import { clearActiveSession } from '@/lib/auth/active-session';
import {
  isHospitalAdminRole,
  isHospitalAppRole,
  readHospitalAppSession,
} from '@/lib/auth/ecosystem-sessions';
import {
  buildHospitalDirectoryOrFilter,
  hospitalDirectoryFilterIds,
  hospitalIdQueryValues,
  isUuidColumnError,
  isUuidValue,
  recordBelongsToHospitalNode,
} from '@/lib/hospital/hospital-node';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import { dedupeEncounterList, encounterIdentityKey } from '@/lib/queue/dedupe-encounters';
import { computeCheckoutTotal, isConsultationBillingEligible } from '@/lib/billing/invoice-breakdown';
import {
  mapBillingInvoiceRow,
  type InvoiceMedicineLine,
  type PrescribedItem,
} from '@/lib/billing/post-consultation-invoice';
import { createWalkInBillingRecord } from '@/lib/db/billing';
import {
  completeConsultationRecord,
  createConsultationFromAppointment,
} from '@/lib/db/consultations';
import { handoffConsultationToHospitalBilling } from '@/lib/billing/consultation-billing-handoff';
import { DynamicSlotPicker } from '@/components/patient/DynamicSlotPicker';
import {
  assertSlotAvailableForBooking,
  loadDynamicDoctorSchedule,
  resolveAutoSelectedSlot,
} from '@/lib/scheduling/doctor-slot-service';
import type { DynamicSlot } from '@/lib/scheduling/dynamic-slots';
import {
  PharmacyBillingModal,
  type DirectBillingSeed,
} from '@/components/hospital/PharmacyBillingModal';
import { DoctorsStaffCommandCenter } from '@/components/hospital/DoctorsStaffCommandCenter';
import { IpdBedCensus } from '@/components/hospital/IpdBedCensus';
import { SupplyOrdersCommandCenter } from '@/components/hospital/SupplyOrdersCommandCenter';
import { RegalHospitalLogoMark } from '@/components/brand/RegalHospitalLogo';
import { DASHBOARD_TAB_STORAGE_KEY } from '@/components/hospital/DashboardTabRedirect';
import { mapHospitalStaffMember, toDashboardStaffRow } from '@/lib/hospital/staff-directory';
import {
  fetchActiveHospitalDoctors,
  formatConsultationFee,
  type DoctorStaffRecord,
} from '@/lib/hospital/hospital-staff-roster';
import { formatDoctorBookingOptionLabel } from '@/lib/hospital/doctors';
import {
  isTenDigitPhone,
  parsePatientAge,
  validatePhoneField,
} from '@/lib/hospital/indian-patient';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { acknowledgeEmergencyAlert } from '@/lib/hospital/operations/emergency-alert-sync';
import {
  createPurchaseOrder,
  DELIVERY_WINDOWS,
  fetchHospitalVendors,
  formatVendorOptionLabel,
  isEligibleHospitalVendor,
  mapPurchaseOrderRow,
  markPurchaseOrderDelivered,
  PO_CATEGORIES,
  resolvePoVendorId,
  saveHospitalVendorRecord,
  type HospitalVendor,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import { OfficialReceiptModal } from '@/components/hospital/OfficialReceiptModal';
import type { PrintableInvoice } from '@/lib/hospital/invoice-receipt';
import { EMPTY_SUPPLY_FORM } from '@/lib/hospital/po-form';
import {
  filterHospitalAppointmentsByDate,
  type HospitalAppointmentDateFilter,
} from '@/lib/hospital/appointments';
import { OutpatientStatusCell } from '@/components/hospital/OutpatientStatusCell';
import {
  formatAdvanceBookingToast,
  formatBillingReadyToast,
  isAdvanceBookingRecord,
  isBillingPendingEncounterStatus,
  playBillingCheckoutChime,
} from '@/lib/notifications/opd-alerts';
import { resolveDoctorConsultationFee } from '@/lib/hospital/doctors';
import {
  clinicSessionWaitMinutes,
  formatClinicWait,
  isSlaBreachWaiting,
} from '@/lib/hospital/smartq-wait';
import { formatQueueDateBadge } from '@/lib/scheduling/queue-date-filter';
import {
  BED_STATUS_OPTIONS,
  BED_TYPE_RATES,
  defaultRateForBedType,
  formatInr as formatBedRate,
  inferBedTypeFromWard,
  WARD_OPTIONS,
  type BedType,
} from '@/lib/hospital/ward-beds';
import {
  DEFAULT_HOSPITAL_DEPARTMENT,
  doctorsForDepartment,
  mergeDepartmentOptions,
} from '@/lib/hospital/departments';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type NavModule =
  | 'dashboard'
  | 'smartq'
  | 'patients'
  | 'ipd'
  | 'emergency'
  | 'billing'
  | 'supply'
  | 'staff';

const NAV_MODULES: NavModule[] = [
  'dashboard',
  'smartq',
  'patients',
  'ipd',
  'emergency',
  'billing',
  'supply',
  'staff',
];

function isNavModule(value: string | null | undefined): value is NavModule {
  return Boolean(value && NAV_MODULES.includes(value as NavModule));
}

function readInitialDashboardTab(): NavModule {
  if (typeof window === 'undefined') return 'dashboard';
  const fromQuery = new URLSearchParams(window.location.search).get('tab');
  if (isNavModule(fromQuery)) return fromQuery;
  const stored = sessionStorage.getItem(DASHBOARD_TAB_STORAGE_KEY);
  if (isNavModule(stored)) {
    sessionStorage.removeItem(DASHBOARD_TAB_STORAGE_KEY);
    return stored;
  }
  return 'dashboard';
}

type ModalKind = 'opd' | 'pharmacy' | 'bed' | 'invoice' | 'supply' | null;

type HospitalInfo = {
  id: string;
  nodeCode: string;
  name: string;
  adminName: string;
  adminEmail: string;
};

type StaffRow = {
  id: string;
  full_name: string;
  staff_type: string;
  department: string;
  email: string;
  temporary_passcode?: string;
  portal_access?: string;
  status?: string;
};

type TriageStage = 'Waiting' | 'In Consultation' | 'Completed';
type QueueChannel = 'walk-in' | 'online';

type QueueRow = {
  id: string;
  token: string;
  token_number: string;
  uhid: string;
  patient_name: string;
  department: string;
  phone: string;
  doctor_name: string;
  doctor_id: string;
  status: string;
  created_at: string;
  appointment_date: string;
  slot_time: string;
  reschedule_status: string;
  source: string;
  channel: QueueChannel;
  source_table: string;
  gender: string;
  age: number | null;
  consultation_fee: number;
};

type IncomingBookingAlert = {
  id: string;
  name: string;
  department: string;
  token: string;
};

type BillingCheckoutAlert = {
  id: string;
  patientName: string;
  token: string;
  doctorName: string;
  consultationFee: number;
};

type WalkInTokenSource = {
  uhid?: string | null;
  token?: string | null;
  appointment_date?: string | null;
  created_at?: string | null;
};

type PatientBillingStatus = 'none' | 'awaiting_consultation' | 'pending_payment' | 'paid';

type PatientProfile = {
  id: string;
  uhid: string;
  patient_name: string;
  phone: string;
  department: string;
  visits: number;
  last_encounter: string;
  first_registered: string;
  gender: string;
  age: number | null;
  patient_age: number | null;
  record_status: string;
  booking_source?: string;
  appointment_id?: string;
  encounter_status?: string;
  doctor_name?: string;
  billing_status?: PatientBillingStatus;
  pending_invoice_id?: string;
};

type PharmacyRow = {
  id: string;
  item_name: string;
  category: string;
  stock: number;
  status: string;
};

function mapPharmacyRow(row: Record<string, unknown>): PharmacyRow {
  const stock = Number(row.stock ?? row.quantity_in_stock ?? 0);
  return {
    id: String(row.id ?? ''),
    item_name: String(row.item_name ?? row.name ?? '').trim(),
    category: String(row.category ?? 'Medicine').trim() || 'Medicine',
    stock,
    status: String(row.status ?? (stock > 0 ? 'In Stock' : 'Out of Stock')),
  };
}

function formularyMatchKey(item: Pick<PharmacyRow, 'item_name' | 'category'>): string {
  return `${item.item_name.trim().toLowerCase()}::${item.category.trim().toLowerCase()}`;
}

function dedupePharmacyItems(rows: PharmacyRow[]): PharmacyRow[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const next: PharmacyRow[] = [];

  for (const row of rows) {
    if (!row.item_name) continue;
    if (row.id && seenIds.has(row.id)) continue;
    const key = formularyMatchKey(row);
    if (seenKeys.has(key)) continue;
    if (row.id) seenIds.add(row.id);
    seenKeys.add(key);
    next.push(row);
  }

  return next;
}

type BedRow = {
  id: string;
  ward_name: string;
  bed_number: string;
  bed_type: string;
  daily_rate: number;
  status: string;
  patient_name: string;
};

function mapBedRow(row: Record<string, unknown>): BedRow {
  const ward = String(row.ward_name ?? row.ward ?? '');
  const inferred = inferBedTypeFromWard(ward);
  const bedType = String(row.bed_type ?? inferred) as BedType;
  return {
    id: String(row.id ?? ''),
    ward_name: ward,
    bed_number: String(row.bed_number ?? ''),
    bed_type: bedType,
    daily_rate: Number(row.daily_rate ?? row.rate ?? defaultRateForBedType(inferred)),
    status: String(row.status ?? (row.is_occupied ? 'occupied' : 'available')),
    patient_name: String(row.patient_name ?? '-'),
  };
}

type InvoiceRow = {
  id: string;
  patient_name: string;
  service_type: string;
  amount: number;
  status: string;
  uhid?: string;
  invoice_number?: string;
  doctor_name?: string;
  department?: string;
  consultation_fee?: number;
  medicine_fee?: number;
  medicines_total?: number;
  medicines?: InvoiceMedicineLine[];
  prescribed_items?: PrescribedItem[];
  payment_method?: string;
  paid_at?: string;
  appointment_id?: string;
  booking_source?: string;
  patient_id?: string;
  token_number?: string | number | null;
};

type SupplyRow = PurchaseOrderRow;

type EmergencyRow = {
  id: string;
  patient_name: string;
  complaint: string;
  priority: string;
  status: string;
};

type EmergencyAlertRecord = {
  id: string;
  patient_info: string;
  severity: string;
  arrival: string;
  status: string;
  created_at: string;
};

function mapEmergencyAlert(row: Record<string, unknown>): EmergencyAlertRecord {
  return {
    id: String(row.id ?? ''),
    patient_info: String(row.patient_info ?? row.patient_name ?? row.chief_complaint ?? row.complaint ?? 'Unidentified trauma'),
    severity: String(row.severity ?? row.priority ?? 'code_red'),
    arrival: String(row.arrival ?? row.arrival_mode ?? 'Ambulance'),
    status: String(row.status ?? 'active'),
    created_at: String(row.created_at ?? ''),
  };
}

function isCodeRed(severity: string): boolean {
  return /red|critical|1|p1/i.test(severity);
}

function severityLabel(severity: string): string {
  return isCodeRed(severity) ? 'Code Red' : 'Code Yellow';
}

function mapCheckoutInvoice(row: Record<string, unknown>): InvoiceRow {
  if (row.consultation_fee != null || Array.isArray(row.medicines) || row.payment_status) {
    const bill = mapBillingInvoiceRow(row);
    return {
      id: bill.id,
      patient_name: bill.patient_name,
      service_type: 'OPD Consultation + Pharmacy',
      amount: bill.total_payable ?? bill.total_amount,
      status: bill.payment_status,
      uhid: bill.patient_uhid ?? bill.uhid,
      invoice_number: bill.invoice_number,
      doctor_name: bill.doctor_name,
      department: bill.department,
      consultation_fee: bill.consultation_fee,
      medicine_fee: bill.medicine_fee,
      medicines_total: bill.medicines_total,
      medicines: bill.medicines,
      prescribed_items: bill.prescribed_items,
      payment_method: bill.payment_method,
      paid_at: bill.paid_at,
      appointment_id: bill.appointment_id,
      booking_source: bill.booking_source ?? (row.booking_source ? String(row.booking_source) : undefined),
      patient_id: row.patient_id ? String(row.patient_id) : undefined,
      token_number: row.token_number != null ? (row.token_number as string | number) : undefined,
    };
  }
  return {
    id: String(row.invoice_number ?? row.id ?? ''),
    patient_name: String(row.patient_name ?? ''),
    service_type: String(row.service_type ?? row.bill_type ?? 'OPD Consultation'),
    amount: Number(row.amount ?? row.total_amount ?? 0),
    status: String(row.status ?? row.payment_status ?? 'unpaid'),
    uhid: row.uhid ? String(row.uhid) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
  };
}

function inr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function nodeCodeFor(hospitalId: string): string {
  return hospitalId;
}

const WALK_IN_TOKEN_PREFIX = 'NX-WLK';

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const getNextWalkInToken = (queue: WalkInTokenSource[], prefix = WALK_IN_TOKEN_PREFIX) => {
  const todayStr = todayIsoDate();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}-(\\d+)$`, 'i');
  let highest = 0;

  for (const item of queue || []) {
    const code = String(item.uhid || item.token || '');
    if (!code.toUpperCase().startsWith(prefix.toUpperCase())) continue;
    const onToday =
      String(item.appointment_date || '').startsWith(todayStr) ||
      String(item.created_at || '').startsWith(todayStr);
    if (!onToday) continue;
    const match = code.match(pattern);
    if (match) highest = Math.max(highest, Number(match[1]));
  }

  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
};

function classifyQueueSource(row: {
  source?: unknown;
  uhid?: unknown;
  token?: unknown;
  token_number?: unknown;
}): QueueChannel {
  const source = String(row.source ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  const uhid = String(row.uhid ?? '');
  const token = String(row.token_number ?? row.token ?? uhid);
  if (
    source === 'WALK_IN' ||
    source === 'HOSPITAL_WALKIN' ||
    uhid.startsWith('NX-WLK') ||
    uhid.startsWith('NX-OPD') ||
    token.startsWith('NX-WLK') ||
    token.startsWith('NX-OPD')
  ) {
    return 'walk-in';
  }
  return 'online';
}

function QueueChannelBadge({ channel }: { channel: QueueChannel }) {
  if (channel === 'walk-in') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase tracking-wide">
        <TicketPlus className="w-2.5 h-2.5" />
        Walk-In
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-800 border border-violet-200 text-[9px] font-black uppercase tracking-wide">
      <Smartphone className="w-2.5 h-2.5" />
      Patient App
    </span>
  );
}

function triageStage(status: string): TriageStage {
  const value = status.toLowerCase();
  if (/complete|done|discharged|closed/.test(value)) return 'Completed';
  if (/consult|in.?room|called|exam/.test(value)) return 'In Consultation';
  return 'Waiting';
}

function waitMinutes(isoDate: string): number | null {
  if (!isoDate) return null;
  const stamp = new Date(isoDate).getTime();
  if (!Number.isFinite(stamp)) return null;
  return Math.max(0, Math.round((Date.now() - stamp) / 60000));
}

function formatWait(isoDate: string): string {
  const mins = waitMinutes(isoDate);
  if (mins == null) return '—';
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatEncounter(isoDate: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function mapQueueRow(row: Record<string, unknown>, sourceTable: string): QueueRow | null {
  const status = String(row.status ?? row.queue_status ?? 'Waiting');
  const token = String(row.token_number ?? row.uhid ?? row.token ?? '').trim();
  const rawId = String(row.id ?? '').trim();
  const rawAppointmentId = String(row.appointment_id ?? '').trim();
  const id = isUuidValue(rawId) ? rawId : isUuidValue(rawAppointmentId) ? rawAppointmentId : '';
  const patientName = String(row.patient_name ?? row.name ?? '').trim();
  if (!id && !token && !patientName) return null;
  const ageRaw = row.age ?? row.patient_age;
  const channel = classifyQueueSource(row);
  return {
    id,
    token: token || (isUuidValue(rawId) ? rawId.slice(0, 8) : rawId) || '—',
    token_number: token,
    uhid: String(row.uhid ?? token ?? ''),
    patient_name: patientName || 'Unnamed Patient',
    department: String(row.department ?? 'General Medicine'),
    phone: String(row.phone ?? row.patient_phone ?? ''),
    doctor_name: String(row.doctor_name ?? 'Unassigned'),
    doctor_id: String(row.doctor_id ?? row.doctor_code ?? row.doctor_employee_id ?? ''),
    status,
    created_at: String(row.created_at ?? ''),
    appointment_date: String(row.appointment_date ?? row.created_at ?? ''),
    slot_time: String(row.slot_time ?? row.time_slot ?? row.appointment_time ?? ''),
    reschedule_status: String(row.reschedule_status ?? ''),
    source: String(row.source ?? (channel === 'walk-in' ? 'WALK_IN' : 'PATIENT_APP')),
    channel,
    source_table: sourceTable,
    gender: String(row.gender ?? row.sex ?? ''),
    age:
      ageRaw == null || ageRaw === ''
        ? null
        : Number.isFinite(Number(ageRaw))
          ? Number(ageRaw)
          : null,
    consultation_fee: resolveDoctorConsultationFee(row),
  };
}

function patchMasterQueueRow(
  previous: QueueRow[],
  row: Record<string, unknown>,
  sourceTable: string,
): QueueRow[] {
  const mapped = mapQueueRow(row, sourceTable);
  if (!mapped) return previous;
  const key = encounterIdentityKey(mapped);
  let found = false;
  const next = previous.map((entry) => {
    if (encounterIdentityKey(entry) !== key) return entry;
    found = true;
    return { ...entry, ...mapped };
  });
  if (found) return next;
  return dedupeEncounterList([mapped, ...previous]);
}

function patientKey(name: string, phone: string, uhid: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return `phone:${digits.slice(-10)}`;
  if (name.trim()) return `name:${name.trim().toLowerCase()}`;
  return `uhid:${uhid}`;
}

function buildPatientDirectory(queue: QueueRow[], extraPatients: Record<string, unknown>[]): PatientProfile[] {
  const directory = new Map<string, PatientProfile>();

  const upsert = (input: {
    id: string;
    uhid: string;
    patient_name: string;
    phone: string;
    department: string;
    created_at: string;
    gender: string;
    age: number | null;
    patient_age?: number | null;
    visits?: number;
  }) => {
    const key = patientKey(input.patient_name, input.phone, input.uhid);
    const existing = directory.get(key);
    const resolvedAge = input.patient_age ?? input.age;
    if (!existing) {
      directory.set(key, {
        id: input.id,
        uhid: input.uhid,
        patient_name: input.patient_name,
        phone: input.phone,
        department: input.department,
        visits: input.visits ?? 1,
        last_encounter: input.created_at,
        first_registered: input.created_at,
        gender: input.gender,
        age: resolvedAge,
        patient_age: resolvedAge,
        record_status: 'Verified Profile',
      });
      return;
    }
    existing.visits += input.visits ?? 1;
    if (input.created_at && (!existing.last_encounter || input.created_at > existing.last_encounter)) {
      existing.last_encounter = input.created_at;
      existing.department = input.department || existing.department;
    }
    if (input.created_at && (!existing.first_registered || input.created_at < existing.first_registered)) {
      existing.first_registered = input.created_at;
    }
    if (!existing.gender && input.gender) existing.gender = input.gender;
    if (existing.age == null && resolvedAge != null) existing.age = resolvedAge;
    if (existing.patient_age == null && resolvedAge != null) existing.patient_age = resolvedAge;
    if (existing.uhid.startsWith('NX-OPD-') && input.uhid && !input.uhid.startsWith('NX-OPD-')) {
      existing.uhid = input.uhid;
    }
  };

  for (const visit of queue) {
    upsert({
      id: visit.id,
      uhid: visit.uhid,
      patient_name: visit.patient_name,
      phone: visit.phone,
      department: visit.department,
      created_at: visit.created_at || visit.appointment_date,
      gender: visit.gender,
      age: visit.age,
      patient_age: visit.age,
    });
  }

  for (const row of extraPatients) {
    const ageRaw = row.patient_age ?? row.age;
    upsert({
      id: String(row.id ?? row.uhid ?? ''),
      uhid: String(row.uhid ?? row.id ?? ''),
      patient_name: String(row.full_name ?? row.patient_name ?? row.name ?? ''),
      phone: String(row.phone ?? row.mobile ?? ''),
      department: String(row.department ?? 'General Outpatient'),
      created_at: String(row.created_at ?? row.last_visit_at ?? ''),
      gender: String(row.gender ?? row.sex ?? ''),
      age:
        ageRaw == null || ageRaw === ''
          ? null
          : Number.isFinite(Number(ageRaw))
            ? Number(ageRaw)
            : null,
      patient_age:
        row.patient_age == null || row.patient_age === ''
          ? null
          : Number.isFinite(Number(row.patient_age))
            ? Number(row.patient_age)
            : null,
      visits: Number(row.visit_count ?? 0) || 1,
    });
  }

  return Array.from(directory.values()).map((patient) => {
    const daysSince = waitMinutes(patient.last_encounter);
    const record_status =
      daysSince != null && daysSince <= 30 * 24 * 60
        ? 'Active Chart'
        : patient.visits > 1
          ? 'Longitudinal Chart'
          : 'Verified Profile';
    return { ...patient, record_status };
  });
}

function resolveInvoiceBookingSource(
  invoice: InvoiceRow,
  queue: QueueRow[],
): string | undefined {
  if (invoice.booking_source) return invoice.booking_source;
  const match = queue.find(
    (row) =>
      (invoice.appointment_id && row.id === invoice.appointment_id) ||
      (invoice.uhid && row.uhid === invoice.uhid),
  );
  return match?.source;
}

function enrichPatientsWithBilling(
  patients: PatientProfile[],
  queue: QueueRow[],
  invoiceRows: InvoiceRow[],
): PatientProfile[] {
  return patients.map((patient) => {
    const key = patientKey(patient.patient_name, patient.phone, patient.uhid);
    const encounters = queue
      .filter((row) => patientKey(row.patient_name, row.phone, row.uhid) === key)
      .sort((a, b) => String(b.created_at || b.appointment_date).localeCompare(String(a.created_at || a.appointment_date)));
    const latest = encounters[0];
    const pendingInvoice = invoiceRows.find(
      (inv) =>
        /pending|unpaid|unbilled/i.test(inv.status) &&
        ((inv.uhid && inv.uhid === patient.uhid) ||
          (latest?.id && inv.appointment_id === latest.id) ||
          inv.patient_name.trim().toLowerCase() === patient.patient_name.trim().toLowerCase()),
    );
    const paidInvoice = invoiceRows.find(
      (inv) =>
        /paid/i.test(inv.status) &&
        ((inv.uhid && inv.uhid === patient.uhid) ||
          (latest?.id && inv.appointment_id === latest.id)),
    );

    let billing_status: PatientBillingStatus = 'none';
    if (paidInvoice && latest && isConsultationBillingEligible(latest.status)) {
      billing_status = 'paid';
    } else if (pendingInvoice && latest && isConsultationBillingEligible(latest.status)) {
      billing_status = 'pending_payment';
    } else if (latest && !isConsultationBillingEligible(latest.status)) {
      billing_status = 'awaiting_consultation';
    }

    return {
      ...patient,
      booking_source: latest?.source,
      appointment_id: latest?.id,
      encounter_status: latest?.status,
      doctor_name: latest?.doctor_name || pendingInvoice?.doctor_name,
      billing_status,
      pending_invoice_id: pendingInvoice?.id,
    };
  });
}

async function selectScoped(table: string, hospitalId: string): Promise<Record<string, unknown>[]> {
  if (!supabase || !hospitalId) return [];
  const orFilter = buildHospitalDirectoryOrFilter(hospitalDirectoryFilterIds(hospitalId));
  const { data, error } = await supabase.from(table).select('*').or(orFilter);
  if (!error && Array.isArray(data)) {
    return (data as Record<string, unknown>[]).filter((row) =>
      recordBelongsToHospitalNode(row, hospitalId),
    );
  }

  const aliases = hospitalIdQueryValues(hospitalId);
  const ids = isUuidColumnError(error?.message) ? aliases.filter(isUuidValue) : aliases;
  if (ids.length === 0) return [];
  const aliased = await supabase.from(table).select('*').in('hospital_id', ids);
  if (aliased.error || !Array.isArray(aliased.data)) return [];
  return (aliased.data as Record<string, unknown>[]).filter((row) =>
    recordBelongsToHospitalNode(row, hospitalId),
  );
}

/** Facility-wide appointments for this hospital node — never filtered by doctor. */
async function fetchNodeAppointments(hospitalId: string): Promise<Record<string, unknown>[]> {
  if (!supabase || !hospitalId) return [];
  const tables = ['hospital_appointments', 'appointments'] as const;
  const orFilter = buildHospitalDirectoryOrFilter(hospitalDirectoryFilterIds(hospitalId));
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const primary = await supabase
      .from(table)
      .select('*')
      .or(orFilter)
      .order('created_at', { ascending: false });

    let rows: Record<string, unknown>[] = [];
    if (!primary.error && Array.isArray(primary.data)) {
      rows = primary.data as Record<string, unknown>[];
    } else {
      const aliases = hospitalIdQueryValues(hospitalId);
      const fallback = await supabase
        .from(table)
        .select('*')
        .in('hospital_id', aliases.length > 0 ? aliases : [hospitalId])
        .order('created_at', { ascending: false });
      rows = (fallback.data as Record<string, unknown>[] | null) ?? [];
    }

    for (const row of rows) {
      if (!recordBelongsToHospitalNode(row, hospitalId)) continue;
      const id = String(row.id ?? row.appointment_id ?? '');
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      merged.push(row);
    }
  }

  return merged;
}

function queueIdentityKey(row: QueueRow): string {
  return encounterIdentityKey(row);
}

function dedupeQueueRows(rows: Array<QueueRow | null>): QueueRow[] {
  const seen = new Set<string>();
  const next: QueueRow[] = [];
  for (const row of rows) {
    if (!row) continue;
    const key = queueIdentityKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(row);
  }
  return next;
}

async function insertFirst(
  attempts: Array<{ table: string; payload: Record<string, unknown> }>,
): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured';
  let lastError = 'Insert failed';
  for (const attempt of attempts) {
    const { error } = await supabase.from(attempt.table).insert(attempt.payload);
    if (!error) return null;
    lastError = error.message;
  }
  return lastError;
}

type HospitalPlatformCache = {
  hospitalId: string;
  hospitalInfo: HospitalInfo;
  opdQueue: QueueRow[];
  patientRegistry: PatientProfile[];
  staffMembers: StaffRow[];
  pharmacyItems: PharmacyRow[];
  beds: BedRow[];
  invoices: InvoiceRow[];
  supplyOrders: SupplyRow[];
  emergencies: EmergencyRow[];
};

function emptyHospitalInfo(): HospitalInfo {
  return {
    id: '',
    nodeCode: '',
    name: '',
    adminName: '',
    adminEmail: '',
  };
}

function readCachedHospitalInfo(): HospitalInfo | null {
  const session = readHospitalAppSession();
  const cached = readLocalJson<Partial<HospitalInfo>>(CACHE_KEYS.hospitalInfo);
  if (session?.hospital_id) {
    return {
      id: session.hospital_id,
      nodeCode: session.hospital_id,
      name: session.hospital_name || cached?.name || 'Regal Hospital',
      adminName: session.full_name || cached?.adminName || 'Hospital User',
      adminEmail: session.email || cached?.adminEmail || '',
    };
  }
  if (cached?.id) {
    return {
      id: String(cached.id),
      nodeCode: String(cached.nodeCode || cached.id),
      name: String(cached.name || 'Regal Hospital'),
      adminName: String(cached.adminName || ''),
      adminEmail: String(cached.adminEmail || ''),
    };
  }
  return null;
}

function hydrateQueueRows(raw: unknown): QueueRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as Record<string, unknown>;
    const mapped = mapQueueRow(record, String(record.source_table ?? 'appointments'));
    return mapped ? [mapped] : [];
  });
}

function readCachedPlatform(hospitalId: string): HospitalPlatformCache | null {
  if (!hospitalId) return null;
  const snapshot = readLocalJson<HospitalPlatformCache>(CACHE_KEYS.hospitalPlatform);
  if (snapshot?.hospitalId === hospitalId && Array.isArray(snapshot.opdQueue)) {
    return {
      ...snapshot,
      opdQueue: hydrateQueueRows(snapshot.opdQueue),
    };
  }
  const queue = hydrateQueueRows(readLocalJson(CACHE_KEYS.opdQueue));
  if (!queue.length) return null;
  return {
    hospitalId,
    hospitalInfo: readCachedHospitalInfo() ?? {
      id: hospitalId,
      nodeCode: hospitalId,
      name: 'Regal Hospital',
      adminName: '',
      adminEmail: '',
    },
    opdQueue: queue,
    patientRegistry: [],
    staffMembers: [],
    pharmacyItems: [],
    beds: [],
    invoices: [],
    supplyOrders: [],
    emergencies: [],
  };
}

function persistHospitalDashboardCache(snapshot: HospitalPlatformCache): void {
  writeLocalJson(CACHE_KEYS.hospitalInfo, snapshot.hospitalInfo);
  writeLocalJson(CACHE_KEYS.opdQueue, snapshot.opdQueue);
  writeLocalJson(CACHE_KEYS.hospitalPlatform, snapshot);
}

function missingInsertColumn(message: string | null | undefined): string | null {
  const text = String(message ?? '');
  const postgrest = text.match(/Could not find the '([^']+)' column/i);
  if (postgrest?.[1]) return postgrest[1];
  const postgres = text.match(/column (?:[\w]+\.)?([a-zA-Z0-9_]+) does not exist/i);
  return postgres?.[1] ?? null;
}

async function updateByIdWithColumnRetry(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<{ updated: boolean; errorMessage: string | null }> {
  return updateMatchingRowWithColumnRetry(table, 'id', id, patch);
}

async function updateMatchingRowWithColumnRetry(
  table: string,
  column: string,
  value: string,
  patch: Record<string, unknown>,
): Promise<{ updated: boolean; errorMessage: string | null }> {
  if (!supabase || !value) return { updated: false, errorMessage: 'Missing row id' };
  if (column === 'id' && !isUuidValue(value) && table !== 'hospital_opd_queue') {
    return { updated: false, errorMessage: 'Unable to offer reschedule: Missing appointment ID' };
  }

  const row = { ...patch };
  let { data, error } = await supabase.from(table).update(row).eq(column, value).select('id');
  let attempts = 0;
  while (error && attempts < 12) {
    if (isUuidColumnError(error.message) && column === 'id') {
      return { updated: false, errorMessage: error.message };
    }
    const missing = missingInsertColumn(error.message);
    if (missing && missing in row) {
      delete row[missing];
    } else if (/check constraint|invalid input value|violates/i.test(error.message) && 'status' in row) {
      delete row.status;
    } else {
      break;
    }
    if (Object.keys(row).length === 0) break;
    attempts += 1;
    const retry = await supabase.from(table).update(row).eq(column, value).select('id');
    data = retry.data;
    error = retry.error;
  }
  if (error) return { updated: false, errorMessage: error.message };
  const count = Array.isArray(data) ? data.length : data ? 1 : 0;
  return { updated: count > 0, errorMessage: count > 0 ? null : 'No matching row' };
}

async function offerRescheduleOnLiveRow(item: QueueRow): Promise<{ updated: boolean; errorMessage: string | null }> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    reschedule_status: 'offered',
    status: 'reschedule_offered',
    reschedule_offered_at: now,
    updated_at: now,
  };
  const tables = Array.from(
    new Set(
      [item.source_table, 'appointments', 'hospital_appointments', 'hospital_opd_queue'].filter(
        (table): table is string => Boolean(table),
      ),
    ),
  );
  const uuid = isUuidValue(item.id) ? item.id : '';
  const token = String(item.token_number || item.token || item.uhid || '').trim();
  let lastError = 'Could not offer reschedule';

  for (const table of tables) {
    if (uuid) {
      const byId = await updateMatchingRowWithColumnRetry(table, 'id', uuid, patch);
      if (byId.updated) return byId;
      lastError = byId.errorMessage || lastError;
    }
    if (!token) continue;
    for (const column of ['token_number', 'uhid', 'token'] as const) {
      const byToken = await updateMatchingRowWithColumnRetry(table, column, token, patch);
      if (byToken.updated) return byToken;
      lastError = byToken.errorMessage || lastError;
    }
  }

  if (!uuid) {
    return { updated: false, errorMessage: 'Unable to offer reschedule: Missing appointment ID' };
  }
  return { updated: false, errorMessage: lastError };
}

async function insertWithColumnRetry(
  table: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; errorMessage: string | null }> {
  if (!supabase) return { ok: false, errorMessage: 'Supabase is not configured' };
  const row = { ...payload };
  let { error } = await supabase.from(table).insert([row]);
  let attempts = 0;
  while (error && attempts < 10) {
    const column = missingInsertColumn(error.message);
    if (column && column in row) {
      delete row[column];
    } else {
      break;
    }
    attempts += 1;
    const retry = await supabase.from(table).insert([row]);
    error = retry.error;
  }
  return { ok: !error, errorMessage: error?.message ?? null };
}

function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: typeof Users;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="p-12 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl">
      <Icon className="w-8 h-8 mx-auto text-slate-300" />
      <div className="text-sm font-bold text-slate-700">{title}</div>
      <p className="text-xs text-slate-400 max-w-md mx-auto">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold"
      >
        <Plus className="w-3.5 h-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

export default function HospitalMasterDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NavModule>(readInitialDashboardTab);
  const [currentUserRole, setCurrentUserRole] = useState(() => readHospitalAppSession()?.staff_type || 'Staff');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(() => readCachedHospitalInfo() ?? emptyHospitalInfo());

  const [staffMembers, setStaffMembers] = useState<StaffRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.staffMembers ?? [];
  });
  const [walkInDoctorPool, setWalkInDoctorPool] = useState<DoctorStaffRecord[]>([]);
  const [masterOpdQueue, setMasterOpdQueue] = useState<QueueRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.opdQueue ?? [];
  });
  const [activeDateFilter, setActiveDateFilter] = useState<HospitalAppointmentDateFilter>('today');
  const [patientRegistry, setPatientRegistry] = useState<PatientProfile[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.patientRegistry ?? [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [advancingTokenId, setAdvancingTokenId] = useState<string | null>(null);
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.pharmacyItems ?? [];
  });
  const [beds, setBeds] = useState<BedRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.beds ?? [];
  });
  const [settlingInvoiceId, setSettlingInvoiceId] = useState<string | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return (readCachedPlatform(scope?.id || '')?.invoices ?? []).filter((inv) =>
      /pending|unpaid|unbilled/i.test(inv.status),
    );
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.invoices ?? [];
  });
  const [supplyOrders, setSupplyOrders] = useState<SupplyRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.supplyOrders ?? [];
  });
  const [emergencies, setEmergencies] = useState<EmergencyRow[]>(() => {
    const scope = readCachedHospitalInfo();
    return readCachedPlatform(scope?.id || '')?.emergencies ?? [];
  });
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyAlertRecord[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const [emPatientInfo, setEmPatientInfo] = useState('');
  const [emSeverity, setEmSeverity] = useState('code_red');
  const [emArrival, setEmArrival] = useState('Ambulance');
  const [directBillingOpen, setDirectBillingOpen] = useState(false);
  const [directBillingSeed, setDirectBillingSeed] = useState<DirectBillingSeed | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<PrintableInvoice | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);

  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [isSubmittingFormulary, setIsSubmittingFormulary] = useState(false);
  const [onlineBookingAlert, setOnlineBookingAlert] = useState<IncomingBookingAlert | null>(null);
  const [billingCheckoutAlert, setBillingCheckoutAlert] = useState<BillingCheckoutAlert | null>(null);
  const [opdTokenPreview, setOpdTokenPreview] = useState(() => getNextWalkInToken([]));
  const [opdForm, setOpdForm] = useState<{
    patientName: string;
    department: string;
    doctorId: string;
    phone: string;
    age: string;
  }>({
    patientName: '',
    department: DEFAULT_HOSPITAL_DEPARTMENT,
    doctorId: '',
    phone: '',
    age: '',
  });
  const [opdAppointmentTime, setOpdAppointmentTime] = useState('');
  const [opdDynamicSlots, setOpdDynamicSlots] = useState<DynamicSlot[]>([]);
  const [loadingOpdSlots, setLoadingOpdSlots] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', category: 'Medicine', stock: 100 });
  const [bedForm, setBedForm] = useState<{
    ward: string;
    bedNumber: string;
    bedType: BedType;
    dailyRate: number;
    status: string;
    patientName: string;
  }>({
    ward: WARD_OPTIONS[0],
    bedNumber: '',
    bedType: 'General',
    dailyRate: BED_TYPE_RATES.General,
    status: 'available',
    patientName: '',
  });
  const [invoiceForm, setInvoiceForm] = useState({ patientName: '', service: 'OPD Consultation', amount: 800 });
  const [supplyForm, setSupplyForm] = useState({ ...EMPTY_SUPPLY_FORM, category: PO_CATEGORIES[0] as string });
  const [markingPoId, setMarkingPoId] = useState<string | null>(null);
  const [vendorsList, setVendorsList] = useState<HospitalVendor[]>([]);
  const [isProvisioningVendor, setIsProvisioningVendor] = useState(false);
  const [vendorCompany, setVendorCompany] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Pharmaceuticals');
  const [vendorPasscode, setVendorPasscode] = useState('');

  const todayOpdQueue = useMemo(
    () => filterHospitalAppointmentsByDate(masterOpdQueue, 'today'),
    [masterOpdQueue],
  );
  const tomorrowOpdQueue = useMemo(
    () => filterHospitalAppointmentsByDate(masterOpdQueue, 'tomorrow'),
    [masterOpdQueue],
  );
  const upcomingOpdQueue = useMemo(
    () => filterHospitalAppointmentsByDate(masterOpdQueue, 'upcoming'),
    [masterOpdQueue],
  );
  const opdQueue = useMemo(
    () => filterHospitalAppointmentsByDate(masterOpdQueue, activeDateFilter),
    [activeDateFilter, masterOpdQueue],
  );

  const loadPlatformData = useCallback(async (hospitalId?: string) => {
    if (!supabase) return;
    const activeNode = hospitalId || hospitalInfo.id;
    if (!activeNode) return;
    setIsLoading(true);

    try {
      const [
        staffRows,
        aptRows,
        opdRows,
        patientRows,
        hospitalPatientRows,
        pharmRows,
        inventoryRows,
        bedRows,
        invoiceRows,
        billRows,
        checkoutRows,
        poRows,
        supplyRows,
        emergencyRows,
        hospitalEmergencyRows,
      ] = await Promise.all([
        selectScoped('hospital_staff', activeNode),
        fetchNodeAppointments(activeNode),
        selectScoped('hospital_opd_queue', activeNode),
        selectScoped('patients', activeNode),
        selectScoped('hospital_patients', activeNode),
        selectScoped('hospital_pharmacy_inventory', activeNode),
        selectScoped('inventory_items', activeNode),
        selectScoped('hospital_beds', activeNode),
        selectScoped('hospital_invoices', activeNode),
        selectScoped('bills', activeNode),
        selectScoped('billing_invoices', activeNode),
        selectScoped('purchase_orders', activeNode),
        selectScoped('hospital_supply_orders', activeNode),
        selectScoped('emergency_triages', activeNode),
        selectScoped('hospital_emergencies', activeNode),
      ]);

      const mappedStaff = (staffRows || []).map((row) =>
        toDashboardStaffRow(mapHospitalStaffMember(row, activeNode)),
      );
      setStaffMembers(mappedStaff);

      const bookableDoctors = await fetchActiveHospitalDoctors(supabase, activeNode);
      setWalkInDoctorPool(bookableDoctors);

      const liveAppointments = aptRows || [];
      const liveQueue = dedupeEncounterList(
        dedupeQueueRows([
          ...liveAppointments.map((row) => mapQueueRow(row, 'appointments')),
          ...(opdRows || []).map((row) => mapQueueRow(row, 'hospital_opd_queue')),
        ]).filter((row): row is QueueRow => Boolean(row)),
      );
      setMasterOpdQueue(liveQueue);
      setPatientRegistry(
        buildPatientDirectory(liveQueue, [...(patientRows || []), ...(hospitalPatientRows || [])]),
      );

      const pharmacySource = (pharmRows || []).length > 0 ? pharmRows : inventoryRows || [];
      setPharmacyItems(dedupePharmacyItems(pharmacySource.map(mapPharmacyRow)));

      const mappedBeds = (bedRows || []).map(mapBedRow);
      setBeds(mappedBeds);

      const invoiceSource = (invoiceRows || []).length > 0 ? invoiceRows : billRows || [];
      const checkoutSource = (checkoutRows || []).length > 0 ? checkoutRows : invoiceSource;
      const mappedInvoices = checkoutSource.map(mapCheckoutInvoice);
      setInvoices(mappedInvoices);
      setPendingInvoices(mappedInvoices.filter((inv) => /pending|unpaid|unbilled/i.test(inv.status)));

      const supplySource =
        (poRows || []).length > 0 ? poRows : (supplyRows || []).length > 0 ? supplyRows : [];
      const mappedSupply = supplySource.map(mapPurchaseOrderRow);
      setSupplyOrders(mappedSupply);

      const emergencySource = (emergencyRows || []).length > 0 ? emergencyRows : hospitalEmergencyRows || [];
      const nextEmergencies = emergencySource.map((row) => ({
        id: String(row.id ?? ''),
        patient_name: String(row.patient_name ?? row.patient_info ?? ''),
        complaint: String(row.chief_complaint ?? row.patient_info ?? ''),
        priority: String(row.priority ?? row.severity ?? 'P3'),
        status: String(row.status ?? 'active'),
      }));
      setEmergencies(nextEmergencies);

      const nextHospitalInfo: HospitalInfo = {
        ...hospitalInfo,
        id: activeNode,
        nodeCode: hospitalInfo.nodeCode || activeNode,
        name: hospitalInfo.name || 'Regal Hospital',
      };
      persistHospitalDashboardCache({
        hospitalId: activeNode,
        hospitalInfo: nextHospitalInfo,
        opdQueue: liveQueue,
        patientRegistry: buildPatientDirectory(liveQueue, [...(patientRows || []), ...(hospitalPatientRows || [])]),
        staffMembers: mappedStaff,
        pharmacyItems: dedupePharmacyItems(pharmacySource.map(mapPharmacyRow)),
        beds: mappedBeds,
        invoices: checkoutSource.map(mapCheckoutInvoice),
        supplyOrders: mappedSupply,
        emergencies: nextEmergencies,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown dashboard fetch error';
      console.error('Error fetching scoped platform data for hospital dashboard:', message);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalInfo]);

  const loadPharmacyData = useCallback(async () => {
    if (!supabase) return;
    const activeHospital = hospitalInfo.id;
    try {
      const pharmRows = await selectScoped('hospital_pharmacy_inventory', activeHospital);
      const inventoryRows = pharmRows.length > 0 ? [] : await selectScoped('inventory_items', activeHospital);
      const source = pharmRows.length > 0 ? pharmRows : inventoryRows;
      setPharmacyItems(dedupePharmacyItems(source.map(mapPharmacyRow)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load formulary';
      console.error('Failed to load pharmacy data:', message);
    }
  }, [hospitalInfo.id]);

  const loadBillingInvoices = useCallback(async () => {
    if (!supabase) {
      setInvoices([]);
      setPendingInvoices([]);
      return;
    }
    const activeNode = hospitalInfo.id;

    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('hospital_id', activeNode)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Billing invoices table empty or not yet seeded:', error.message);
        setInvoices([]);
        setPendingInvoices([]);
        return;
      }

      const mapped = (data || []).map((row) => mapCheckoutInvoice(row as Record<string, unknown>));
      setInvoices(mapped);
      setPendingInvoices(mapped.filter((inv) => /pending|unpaid|unbilled/i.test(inv.status)));
    } catch {
      console.warn('Billing data unavailable, defaulting to empty state.');
      setInvoices([]);
      setPendingInvoices([]);
    }
  }, [hospitalInfo.id]);

  const loadBillingQueue = loadBillingInvoices;

  const loadEmergencyData = useCallback(async () => {
    if (!supabase) {
      setActiveEmergencies([]);
      setEmergencies([]);
      return;
    }
    const activeNode = hospitalInfo.id;

    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('hospital_id', activeNode)
        .in('status', ['active', 'Pending', 'Acknowledged', 'ACKNOWLEDGED', 'Dispatched'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Emergency alerts table empty or not yet seeded:', error.message);
        setActiveEmergencies([]);
        setEmergencies([]);
        return;
      }

      const alerts = (data || []).map((row) => mapEmergencyAlert(row as Record<string, unknown>));
      setActiveEmergencies(alerts);
      setEmergencies(
        alerts.map((alert) => ({
          id: alert.id,
          patient_name: alert.patient_info,
          complaint: alert.patient_info,
          priority: severityLabel(alert.severity),
          status: alert.status,
        })),
      );
    } catch {
      console.warn('Emergency data unavailable, defaulting to empty state.');
      setActiveEmergencies([]);
      setEmergencies([]);
    }
  }, [hospitalInfo.id]);

  const loadVendors = useCallback(async () => {
    if (!supabase) return;
    const activeHospital = hospitalInfo.id;

    try {
      const rows = await fetchHospitalVendors(supabase, activeHospital);
      setVendorsList(rows);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load vendors';
      console.error('Failed to load vendors:', message);
    }
  }, [hospitalInfo.id]);

  useEffect(() => {
    const session = readHospitalAppSession();
    const hospitalId = session?.hospital_id;
    const staffType = session?.staff_type || 'Staff';
    setCurrentUserRole(staffType);

    if (!hospitalId || !isHospitalAppRole(staffType)) {
      router.replace('/hospital/login');
      return;
    }

    void (async () => {
      if (staffType === 'Admin') {
        const completed = await isHospitalSetupCompleted(hospitalId);
        if (!completed) {
          router.replace(`/dashboard/staff-credentials?hospitalId=${encodeURIComponent(hospitalId)}`);
          return;
        }
      }

      const nextHospital: HospitalInfo = {
        id: hospitalId,
        nodeCode: nodeCodeFor(hospitalId),
        name: session.hospital_name || 'Hospital Node',
        adminName: session.full_name || 'Hospital User',
        adminEmail: session.email || '',
      };
      setHospitalInfo(nextHospital);
      writeLocalJson(CACHE_KEYS.hospitalInfo, nextHospital);
      setIsVerifying(false);
    })();
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('unauthorized') === 'staff-credentials') {
      toast.error('Staff credential vault is restricted to hospital administrators.');
      params.delete('unauthorized');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `/dashboard?${next}` : '/dashboard');
    }
  }, []);

  useEffect(() => {
    if (isVerifying) return;
    const activeNode = hospitalInfo.id;
    void loadPlatformData(activeNode);
    void loadEmergencyData();
    void loadBillingInvoices();

    if (!supabase) return;

    const reload = () => {
      void loadPlatformData(activeNode);
      void loadEmergencyData();
      void loadBillingInvoices();
    };

    const announceOnlineBooking = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const row = raw as Record<string, unknown>;
      if (classifyQueueSource(row) !== 'online') return;
      const name = String(row.patient_name ?? row.name ?? 'A patient').trim() || 'A patient';
      const department = String(row.department ?? 'OPD');
      const token = String(row.token_number ?? row.uhid ?? row.token ?? '');
      const alert: IncomingBookingAlert = {
        id: String(row.id ?? row.appointment_id ?? `${name}-${token}`),
        name,
        department,
        token,
      };
      setOnlineBookingAlert(alert);
      const message = isAdvanceBookingRecord(row)
        ? formatAdvanceBookingToast(row)
        : token
          ? `New Patient App booking: ${name}  ·  ${department}  ·  ${token}`
          : `New Patient App booking: ${name}  ·  ${department}`;
      toast.success(message);
    };

    let channel = supabase
      .channel(`hospital_dashboard_realtime_${activeNode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          if (!recordBelongsToHospitalNode(row, activeNode)) return;
          announceOnlineBooking(row);
          reload();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          const previous = (payload.old ?? {}) as Record<string, unknown>;
          if (!recordBelongsToHospitalNode(row, activeNode)) return;

          const becameBillingPending =
            isBillingPendingEncounterStatus(row.status ?? row.queue_status) &&
            !isBillingPendingEncounterStatus(previous.status ?? previous.queue_status);

          if (becameBillingPending) {
            announceBillingCheckout(row);
          }

          setMasterOpdQueue((current) => patchMasterQueueRow(current, row, 'appointments'));
          reload();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        reload,
      );
    channel = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_opd_queue',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_staff',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_beds',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_invoices',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_invoices',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_supply_orders',
          filter: `hospital_id=eq.${activeNode}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_orders',
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts',
        },
        () => {
          void loadEmergencyData();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_triage',
        },
        () => {
          void loadEmergencyData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hospitalInfo.id, isVerifying, loadPlatformData, loadEmergencyData, loadBillingInvoices]);

  useEffect(() => {
    if (isVerifying) return;
    void loadBillingQueue();

    if (!supabase) return;
    const activeNode = hospitalInfo.id;

    const billingChannel = supabase
      .channel(`hospital_billing_feed_${activeNode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_invoices',
          filter: `hospital_id=eq.${activeNode}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Record<string, unknown>;
            toast.info(
              `New invoice ready: ${String(incoming.patient_name ?? 'Patient')} — Total: ₹${Number(incoming.total_amount ?? 0)}`,
              { duration: 5000 },
            );
          }
          void loadBillingInvoices();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(billingChannel);
    };
  }, [hospitalInfo.id, isVerifying, loadBillingInvoices]);

  useEffect(() => {
    if (isVerifying) return;
    void loadPharmacyData();

    if (!supabase) return;
    const activeHospital = hospitalInfo.id;
    const channelName = `pharmacy_inventory_feed_${activeHospital}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_pharmacy_inventory',
          filter: `hospital_id=eq.${activeHospital}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = mapPharmacyRow((payload.new ?? {}) as Record<string, unknown>);
            setPharmacyItems((prev) => {
              const alreadyExists = prev.some(
                (item) =>
                  (incoming.id && item.id === incoming.id) ||
                  formularyMatchKey(item) === formularyMatchKey(incoming),
              );
              if (alreadyExists) return prev;
              return dedupePharmacyItems([incoming, ...prev]);
            });
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const incoming = mapPharmacyRow((payload.new ?? {}) as Record<string, unknown>);
            setPharmacyItems((prev) =>
              dedupePharmacyItems(
                prev.map((item) => (incoming.id && item.id === incoming.id ? incoming : item)),
              ),
            );
            return;
          }

          if (payload.eventType === 'DELETE') {
            const removedId = String((payload.old as Record<string, unknown> | null)?.id ?? '');
            setPharmacyItems((prev) => prev.filter((item) => item.id !== removedId));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hospitalInfo.id, isVerifying, loadPharmacyData]);

  useEffect(() => {
    if (isVerifying) return;
    void loadVendors();

    if (!supabase) return;
    const activeHospital = hospitalInfo.id;
    const vendorChannelName = `vendors_realtime_${activeHospital}`;

    const vendorChannel = supabase
      .channel(vendorChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Record<string, unknown>;
            toast.success(
              `Vendor ${String(incoming.company_name ?? 'partner')} provisioned in real time!`,
            );
          }
          void loadVendors();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(vendorChannel);
    };
  }, [hospitalInfo.id, isVerifying, loadVendors]);

  const closeModal = () => {
    if (isSubmittingFormulary) return;
    setIsSubmittingToken(false);
    setActiveModal(null);
  };

  useEffect(() => {
    if (activeModal !== 'opd') return;
    setIsSubmittingToken(false);
  }, [activeModal]);

  useEffect(() => {
    if (activeModal !== 'opd') return;
    setOpdTokenPreview(getNextWalkInToken(todayOpdQueue));
  }, [activeModal, todayOpdQueue]);

  useEffect(() => {
    if (activeModal !== 'opd' || !supabase || !opdForm.doctorId) {
      setOpdDynamicSlots([]);
      setOpdAppointmentTime('');
      return;
    }

    let cancelled = false;
    setLoadingOpdSlots(true);
    const walkInDate = todayIsoDate();
    void loadDynamicDoctorSchedule(supabase, opdForm.doctorId, walkInDate, 'Walk-in consultation').then(
      ({ slots }) => {
        if (cancelled) return;
        setOpdDynamicSlots(slots);
        const auto = resolveAutoSelectedSlot(slots, opdAppointmentTime);
        setOpdAppointmentTime(auto?.time ?? '');
        setLoadingOpdSlots(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [activeModal, opdForm.doctorId]);

  useEffect(() => {
    if (!onlineBookingAlert) return;
    const timer = window.setTimeout(() => setOnlineBookingAlert(null), 12000);
    return () => window.clearTimeout(timer);
  }, [onlineBookingAlert]);

  const handleIssueTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientFullName = opdForm.patientName.trim();
    if (!patientFullName || isSubmittingToken) return;
    if (!supabase) {
      toast.error('Database is not configured.');
      return;
    }

    setIsSubmittingToken(true);

    // Sequential walk-in slot for today - never write this into UUID `id`.
    const tokenString = getNextWalkInToken(todayOpdQueue);

    try {
      const activeHospitalId = hospitalInfo?.id;
      const phoneCheck = validatePhoneField(opdForm.phone, true);
      if (!phoneCheck.ok) {
        toast.error(phoneCheck.message);
        return;
      }
      const contactMobile = phoneCheck.phone!;
      const parsedAge = parsePatientAge(opdForm.age);
      if (parsedAge == null) {
        toast.error('Enter a valid patient age between 1 and 120');
        return;
      }
      const clinicalDepartment = opdForm.department || DEFAULT_HOSPITAL_DEPARTMENT;
      const assignedDoctor =
        walkInDoctors.find(
          (doctor) => doctor.doctor_id === opdForm.doctorId || doctor.id === opdForm.doctorId,
        ) ?? walkInDoctors[0] ?? null;
      if (walkInDoctors.length > 0 && !assignedDoctor) {
        toast.error('Select a consulting doctor for this department');
        return;
      }
      if (!opdAppointmentTime) {
        toast.error('Select an available consultation time slot');
        return;
      }

      const walkInDate = todayIsoDate();
      const bookingDoctorKey =
        assignedDoctor?.doctor_id || assignedDoctor?.id || opdForm.doctorId || '';
      try {
        await assertSlotAvailableForBooking(supabase, {
          doctorId: bookingDoctorKey,
          appointmentDate: walkInDate,
          slotTime: opdAppointmentTime,
        });
      } catch (slotErr: unknown) {
        toast.error(slotErr instanceof Error ? slotErr.message : 'Selected slot is no longer available');
        return;
      }

      const assignedDoctorId = assignedDoctor?.id || null;

      const insertPayload: Record<string, unknown> = {
        // DO NOT provide an `id` field here. Postgres will generate the UUID automatically.
        uhid: tokenString,
        hospital_id: activeHospitalId,
        patient_id: tokenString,
        patient_name: patientFullName,
        department: clinicalDepartment,
        doctor_id: assignedDoctorId,
        doctor_name: assignedDoctor?.full_name || null,
        doctor_code: assignedDoctorId,
        doctor_employee_id: assignedDoctorId,
        consultation_fee: assignedDoctor?.consultation_fee ?? null,
        phone: contactMobile,
        patient_phone: contactMobile,
        status: 'waiting',
        queue_status: 'waiting',
        billing_status: 'pending_checkout',
        appointment_type: 'walk_in',
        source: 'WALK_IN',
        booking_source: 'WALK-IN',
        token_number: tokenString,
        appointment_date: walkInDate,
        slot_time: opdAppointmentTime,
        appointment_time: opdAppointmentTime,
        time_slot: opdAppointmentTime,
        age: parsedAge,
        patient_age: parsedAge,
        chief_complaint: 'Walk-in consultation',
        reason_for_visit: 'Walk-in consultation',
      };
      delete insertPayload.id;

      let { data, error } = await supabase.from('appointments').insert([insertPayload]).select();

      let attempts = 0;
      while (error && attempts < 8) {
        const column = missingInsertColumn(error.message);
        if (!column || !(column in insertPayload)) break;
        delete insertPayload[column];
        delete insertPayload.id;
        if (column === 'uhid') {
          insertPayload.token_number = tokenString;
        }
        attempts += 1;
        const retry = await supabase.from('appointments').insert([insertPayload]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        // Convert full error properties into a visible string
        const errDetails = `[${error.code || 'UNKNOWN'}] ${error.message || 'No message'} - Details: ${error.details || 'None'} - Hint: ${error.hint || 'None'}`;

        console.error('EXACT OPD ERROR: ' + errDetails);
        alert('Database Error: ' + errDetails);
        toast.error(errDetails);
        return;
      }

      if (!data?.length) {
        toast.error('Database rejected token creation.');
        return;
      }

      const appointmentRow = data[0] as Record<string, unknown>;
      const appointmentId = String(appointmentRow.id ?? appointmentRow.appointment_id ?? '');
      const consultationFee =
        Number(assignedDoctor?.consultation_fee ?? insertPayload.consultation_fee ?? 500) || 500;

      const billingResult = await createWalkInBillingRecord(supabase, {
        appointmentId,
        hospitalId: activeHospitalId,
        patientUhid: tokenString,
        patientName: patientFullName,
        doctorId: assignedDoctorId,
        doctorName: assignedDoctor?.full_name || null,
        department: clinicalDepartment,
        consultationFee,
        tokenNumber: tokenString,
      });

      if (!billingResult.ok) {
        console.warn('Walk-in token created but billing queue write failed:', billingResult.error);
        toast.warning(
          `Token ${tokenString} issued, but billing desk sync failed. Refresh or re-open Billing tab.`,
        );
      }

      try {
        await createConsultationFromAppointment(supabase, {
          hospitalId: activeHospitalId,
          appointmentId,
          uhid: tokenString,
          patientName: patientFullName,
          doctorId: String(bookingDoctorKey || assignedDoctorId || 'duty-doctor'),
          doctorName: assignedDoctor?.full_name || 'Consulting Physician',
          department: clinicalDepartment,
          symptoms: 'Walk-in consultation',
          status: 'QUEUED',
          consultationDate: walkInDate,
        });
      } catch (consultErr) {
        console.warn('Walk-in consultation ledger write skipped:', consultErr);
      }

      try {
        await supabase.from('hospital_opd_queue').insert({
          hospital_id: activeHospitalId,
          token_number: tokenString,
          uhid: tokenString,
          patient_name: patientFullName,
          phone: contactMobile,
          department: clinicalDepartment,
          doctor_id: bookingDoctorKey,
          doctor_name: assignedDoctor?.full_name || null,
          status: 'WAITING',
          source: 'WALK_IN',
          appointment_date: walkInDate,
          slot_time: opdAppointmentTime,
        });
      } catch {
        /* dashboard still reads appointments */
      }

      toast.success(`Token ${tokenString} created for ${patientFullName} · ${opdAppointmentTime}`);

      setOpdForm({
        patientName: '',
        department: DEFAULT_HOSPITAL_DEPARTMENT,
        doctorId: '',
        phone: '',
        age: '',
      });
      setOpdAppointmentTime('');
      setOpdDynamicSlots([]);
      setActiveModal(null);

      await loadPlatformData(activeHospitalId);
    } catch (err: unknown) {
      console.error('Unexpected token creation exception:', err);
      const message = err instanceof Error ? err.message : 'Failed to issue walk-in token.';
      toast.error(message);
    } finally {
      setIsSubmittingToken(false);
    }
  };

  const handleCallNextInterleaved = async () => {
    if (!supabase || advancingTokenId) return;
    setAdvancingTokenId('interleave');
    try {
      const doctorId = staffMembers.find((member) => member.staff_type === 'Doctor')?.id;
      const response = await fetch('/api/queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospitalInfo.id,
          doctorId,
        }),
      });
      const payload = (await response.json()) as {
        nextPatient?: { patient_name?: string; queue_type?: string } | null;
        source?: string;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        toast.error(payload.error || 'Failed to call next interleaved patient');
        return;
      }
      if (!payload.nextPatient) {
        toast.info(payload.message || 'No arrived patients are ready to call.');
        return;
      }
      toast.success(
        `Called ${payload.nextPatient.patient_name} (${payload.nextPatient.queue_type === 'walk_in' ? 'walk-in' : payload.source || 'appointment'})`,
      );
      await loadPlatformData(hospitalInfo.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to call next patient';
      toast.error(message);
    } finally {
      setAdvancingTokenId(null);
    }
  };

  const handleAdvanceTriage = async (item: QueueRow) => {
    if (!supabase || advancingTokenId) return;
    const stage = triageStage(item.status);
    if (stage === 'Completed') return;
    const nextStatus: TriageStage = stage === 'In Consultation' ? 'Completed' : 'In Consultation';
    const lockKey = item.id || item.token;
    setAdvancingTokenId(lockKey);
    try {
      const tables = Array.from(
        new Set(
          [item.source_table, 'hospital_opd_queue', 'appointments', 'hospital_appointments'].filter(
            (table): table is string => Boolean(table),
          ),
        ),
      );
      let lastError = 'Unable to update triage status';
      let updated = false;
      const patch = { status: nextStatus };
      for (const table of tables) {
        if (isUuidValue(item.id)) {
          const byId = await updateMatchingRowWithColumnRetry(table, 'id', item.id, patch);
          if (byId.updated) {
            updated = true;
            break;
          }
          lastError = byId.errorMessage || lastError;
        }
        const token = item.token_number || item.token;
        if (!token) continue;
        for (const column of ['token_number', 'uhid', 'token'] as const) {
          const byToken = await updateMatchingRowWithColumnRetry(table, column, token, patch);
          if (byToken.updated) {
            updated = true;
            break;
          }
          lastError = byToken.errorMessage || lastError;
        }
        if (updated) break;
      }
      if (!updated) {
        toast.error(lastError);
        return;
      }

      if (nextStatus === 'Completed' && supabase) {
        const appointmentId = isUuidValue(item.id) ? item.id : '';
        try {
          await completeConsultationRecord(supabase, {
            hospitalId: hospitalInfo.id,
            appointmentId,
            uhid: item.uhid || item.token_number || item.token,
            patientName: item.patient_name,
            doctorId: item.doctor_id || item.doctor_name,
            doctorName: item.doctor_name,
            department: item.department,
            symptoms: item.slot_time ? `Walk-in · ${item.slot_time}` : 'OPD consultation',
            status: 'COMPLETED',
            consultationDate: String(item.appointment_date ?? todayIsoDate()).slice(0, 10),
          });
        } catch (consultErr) {
          console.warn('Consultation history update skipped:', consultErr);
        }

        try {
          await handoffConsultationToHospitalBilling(
            supabase,
            {
              id: appointmentId || item.token,
              appointment_id: appointmentId || null,
              patient_id: item.uhid || item.token,
              patient_name: item.patient_name,
              uhid: item.uhid,
              token_number: item.token_number || item.token,
              hospital_id: hospitalInfo.id,
              department: item.department,
              appointment_type: item.channel === 'walk-in' ? 'walk_in' : 'scheduled',
              source: item.source,
              booking_source: item.channel === 'walk-in' ? 'WALK-IN' : 'APP',
              _source_table: item.source_table,
            },
            {
              doctorId: item.doctor_id,
              doctorName: item.doctor_name,
              department: item.department,
              consultationFee: item.consultation_fee,
            },
          );
        } catch (billingErr) {
          console.warn('Billing handoff on consult complete skipped:', billingErr);
        }
      }

      toast.success(nextStatus === 'In Consultation' ? `Called ${item.token}` : `${item.token} marked complete`);
      void loadPlatformData(hospitalInfo.id);
    } finally {
      setAdvancingTokenId(null);
    }
  };

  const handleOfferReschedule = async (patient: QueueRow) => {
    if (!supabase || advancingTokenId) return;
    const lockKey = patient.id || patient.token_number || patient.token;
    if (!lockKey) {
      toast.error('Unable to offer reschedule: Missing appointment ID');
      return;
    }
    setAdvancingTokenId(lockKey);
    try {
      const result = await offerRescheduleOnLiveRow(patient);
      if (!result.updated) {
        console.error('Failed to offer reschedule:', result.errorMessage);
        toast.error(result.errorMessage || 'Could not offer reschedule');
        return;
      }

      const recipientId = patient.uhid || patient.phone || patient.patient_name;
      const notifyPayload: Record<string, unknown> = {
        recipient_id: recipientId,
        recipient_role: 'patient',
        recipient_type: 'patient',
        patient_id: patient.uhid || null,
        title: 'Reschedule offered',
        message: `Your wait for ${patient.token} has exceeded 45 minutes. You can keep waiting, cancel, or rebook the next slot with no extra consultation fee.`,
        type: 'reschedule',
        category: 'Queue',
        entity_id: patient.id || patient.token,
        hospital_id: hospitalInfo.id,
        read: false,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      await Promise.allSettled([
        insertWithColumnRetry('system_notifications', notifyPayload),
        insertWithColumnRetry('patient_notifications', notifyPayload),
      ]);

      toast.success(`Reschedule offer sent to ${patient.patient_name || patient.token}`);
      void loadPlatformData(hospitalInfo.id);
    } catch (err: unknown) {
      console.error('Failed to offer reschedule:', err);
      toast.error(err instanceof Error ? err.message : 'Could not offer reschedule');
    } finally {
      setAdvancingTokenId(null);
    }
  };

  const handleAddFormularyItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingFormulary) return;
    if (!supabase) {
      toast.error('Database is not configured.');
      return;
    }

    const itemName = medForm.name.trim();
    if (!itemName) {
      toast.error('Item name is required');
      return;
    }

    const category = medForm.category.trim() || 'Medicine';
    const stock = Number(medForm.stock) || 0;
    const duplicate = pharmacyItems.some(
      (item) => formularyMatchKey(item) === formularyMatchKey({ item_name: itemName, category }),
    );
    if (duplicate) {
      toast.error(`${itemName} is already in the formulary`);
      return;
    }

    setIsSubmittingFormulary(true);

    try {
      const activeHospital = hospitalInfo.id;
      const status = stock > 0 ? 'In Stock' : 'Out of Stock';

      let { error } = await supabase
        .from('hospital_pharmacy_inventory')
        .insert([{ hospital_id: activeHospital, item_name: itemName, category, stock, status }])
        .select();

      if (error) {
        const fallback = await supabase
          .from('inventory_items')
          .insert([
            {
              hospital_id: activeHospital,
              item_name: itemName,
              name: itemName,
              category,
              quantity_in_stock: stock,
              status,
            },
          ])
          .select();
        error = fallback.error;
      }

      if (error) throw error;

      toast.success(`${itemName} added to formulary!`);
      setMedForm({ name: '', category: 'Medicine', stock: 100 });
      setActiveModal(null);
      await loadPharmacyData();
    } catch (err: unknown) {
      console.error('Failed to add formulary item:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save inventory item');
    } finally {
      setIsSubmittingFormulary(false);
    }
  };

  const handleAddBed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bedForm.bedNumber.trim()) return;
    const occupied = bedForm.status === 'occupied';
    const error = await insertFirst([
      {
        table: 'hospital_beds',
        payload: {
          hospital_id: hospitalInfo.id,
          ward: bedForm.ward,
          ward_name: bedForm.ward,
          bed_number: bedForm.bedNumber.trim(),
          bed_type: bedForm.bedType,
          daily_rate: bedForm.dailyRate,
          rate: bedForm.dailyRate,
          status: bedForm.status,
          is_occupied: occupied,
          patient_name: occupied ? bedForm.patientName.trim() || null : null,
        },
      },
    ]);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Bed registered');
    setBedForm({
      ward: WARD_OPTIONS[0],
      bedNumber: '',
      bedType: 'General',
      dailyRate: BED_TYPE_RATES.General,
      status: 'available',
      patientName: '',
    });
    closeModal();
    void loadPlatformData(hospitalInfo.id);
  };

  const handleAddInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invoiceForm.patientName.trim()) return;
    const amount = Number(invoiceForm.amount) || 0;
    const error = await insertFirst([
      {
        table: 'hospital_invoices',
        payload: {
          hospital_id: hospitalInfo.id,
          invoice_number: `INV-${Date.now()}`,
          patient_name: invoiceForm.patientName.trim(),
          service_type: invoiceForm.service,
          amount,
          status: 'unpaid',
        },
      },
      {
        table: 'bills',
        payload: {
          hospital_id: hospitalInfo.id,
          patient_name: invoiceForm.patientName.trim(),
          bill_type: invoiceForm.service,
          total_amount: amount,
          invoice_number: `INV-${Date.now()}`,
          status: 'unpaid',
        },
      },
    ]);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Invoice posted');
    setInvoiceForm({ patientName: '', service: 'OPD Consultation', amount: 800 });
    closeModal();
    void loadPlatformData(hospitalInfo.id);
  };

  const openDirectBilling = (seed?: DirectBillingSeed) => {
    setDirectBillingSeed(seed ?? null);
    setDirectBillingOpen(true);
  };

  const openBillingModalForPatient = (item: QueueRow) => {
    openDirectBilling({
      appointmentId: item.id || undefined,
      token: item.token_number || item.token || item.uhid,
    });
  };

  const announceBillingCheckout = (row: Record<string, unknown>) => {
    const patientName = String(row.patient_name ?? row.name ?? 'Patient').trim() || 'Patient';
    const token = String(row.token_number ?? row.token_label ?? row.token ?? 'T-01');
    const doctorName = String(row.doctor_name ?? 'Attending doctor');
    const consultationFee = resolveDoctorConsultationFee(row);
    setBillingCheckoutAlert({
      id: String(row.id ?? row.appointment_id ?? `${patientName}-${token}`),
      patientName,
      token,
      doctorName,
      consultationFee,
    });
    void playBillingCheckoutChime();
    toast.info(formatBillingReadyToast(row), { duration: 6000 });
  };

  const closeDirectBilling = () => {
    setDirectBillingOpen(false);
    setDirectBillingSeed(null);
  };

  const openPatientCheckout = (patient: PatientProfile) => {
    const invoice = invoices.find((inv) => inv.id === patient.pending_invoice_id);
    if (!invoice) {
      toast.error('No pending invoice found for this patient. Complete consultation billing first.');
      return;
    }
    if (!patient.encounter_status || !isConsultationBillingEligible(patient.encounter_status)) {
      toast.error('Billing is available only after the doctor completes the consultation.');
      return;
    }
    openDirectBilling({
      token: String(invoice.token_number ?? patient.uhid ?? invoice.uhid ?? ''),
      invoiceId: invoice.id,
      appointmentId: patient.appointment_id || invoice.appointment_id,
    });
  };

  const openInvoiceCheckout = (invoice: InvoiceRow) => {
    if (!/pending|unpaid|unbilled/i.test(invoice.status)) return;
    openDirectBilling({
      token: String(invoice.token_number ?? invoice.uhid ?? ''),
      invoiceId: invoice.id,
      appointmentId: invoice.appointment_id,
    });
  };

  const handleEmergencySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingEmergency) return;
    if (!supabase) {
      toast.error('Database is not configured.');
      return;
    }

    const patientInfo = emPatientInfo.trim();
    if (!patientInfo) {
      toast.error('Patient / trauma details are required');
      return;
    }

    setIsSubmittingEmergency(true);
    try {
      const payload: Record<string, unknown> = {
        hospital_id: hospitalInfo.id,
        patient_info: patientInfo,
        patient_name: patientInfo,
        severity: emSeverity,
        arrival: emArrival,
        status: 'active',
      };

      let { error } = await supabase.from('emergency_alerts').insert([payload]).select();
      let attempts = 0;
      while (error && attempts < 6) {
        const column = missingInsertColumn(error.message);
        if (!column || !(column in payload)) break;
        delete payload[column];
        attempts += 1;
        const retry = await supabase.from('emergency_alerts').insert([payload]).select();
        error = retry.error;
      }

      if (error) throw error;

      toast.error('ðŸš¨ CODE RED INITIATED', { duration: 6000 });
      setEmPatientInfo('');
      setEmSeverity('code_red');
      setEmArrival('Ambulance');
      setShowEmergencyModal(false);
      await loadEmergencyData();
    } catch (err: unknown) {
      console.error('Failed to dispatch emergency:', err);
      toast.error(err instanceof Error ? err.message : 'Could not sound the alarm');
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  const handleAcknowledgeEmergency = async (id: string) => {
    if (!supabase || !id) return;
    try {
      const result = await acknowledgeEmergencyAlert(supabase, id);
      if (!result.ok) throw new Error(result.error ?? 'Acknowledge failed');
      toast.success('Alert acknowledged — triage case opened');
      await loadEmergencyData();
    } catch (err: unknown) {
      console.error('Failed to acknowledge emergency:', err);
      toast.error(err instanceof Error ? err.message : 'Could not acknowledge alert');
    }
  };

  const handleResolveEmergency = async (id: string) => {
    if (!supabase || !id) return;
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Emergency marked resolved');
      await loadEmergencyData();
    } catch (err: unknown) {
      console.error('Failed to resolve emergency:', err);
      toast.error(err instanceof Error ? err.message : 'Could not resolve alert');
    }
  };

  const handleProvisionVendorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isProvisioningVendor) return;
    if (!supabase) {
      toast.error('Database is not configured.');
      return;
    }

    const company = vendorCompany.trim();
    const email = vendorEmail.trim().toLowerCase();
    const passcode = vendorPasscode.trim();
    if (!company || !email || !passcode) {
      toast.error('Please complete all vendor credentials');
      return;
    }

    setIsProvisioningVendor(true);
    try {
      const activeHospital = hospitalInfo.id;
      const result = await saveHospitalVendorRecord(supabase, activeHospital, {
        company_name: company,
        email,
        gstin: '',
        passcode,
        portal_pin: passcode,
      });

      if (!result.ok) throw new Error(result.error || 'Failed to provision vendor');

      toast.success(`Access successfully provisioned for ${company}!`);
      setVendorCompany('');
      setVendorEmail('');
      setVendorPasscode('');
      setVendorCategory('Pharmaceuticals');
      await loadVendors();
    } catch (err: unknown) {
      console.error('Vendor provisioning error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to provision vendor account');
    } finally {
      setIsProvisioningVendor(false);
    }
  };

  const handleToggleVendorStatus = async (_vendorId: string, _currentStatus: string) => {
    toast.info('Vendor suspend/resume is not supported on public.vendors.');
  };

  const handleAddSupply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('Database is not configured.');
      return;
    }
    if (!supplyForm.vendor.trim() || !supplyForm.item.trim()) {
      toast.error('Select a vendor and enter the item name');
      return;
    }
    if (Number(supplyForm.quantity) < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    const rawUnitPrice = parseFloat(String(supplyForm.unitPrice).trim()) || 0;
    const rawQuantity = parseInt(String(supplyForm.quantity).trim(), 10) || 1;
    if (rawUnitPrice <= 0) {
      toast.error('Please enter a valid unit price greater than 0');
      return;
    }
    const totalAmount = parseFloat((rawUnitPrice * rawQuantity).toFixed(2));
    const selectedVendor = vendorsList.find((vendor) => vendor.company_name === supplyForm.vendor);
    const result = await createPurchaseOrder(
      supabase,
      hospitalInfo.id,
      hospitalInfo.name || 'Regal Hospital',
      {
        vendorName: supplyForm.vendor.trim(),
        vendorId: resolvePoVendorId(selectedVendor?.id) ?? undefined,
        vendorEmail: selectedVendor?.email?.trim().toLowerCase(),
        category: supplyForm.category,
        itemName: supplyForm.item.trim(),
        skuDescription: supplyForm.sku.trim(),
        quantity: rawQuantity,
        unitPrice: rawUnitPrice,
        deliveryWindow: supplyForm.deliveryWindow,
      },
    );
    if (!result.ok) {
      toast.error(result.error || 'Could not issue purchase order');
      return;
    }
    toast.success(`Purchase order ${result.order?.po_number} issued for ₹${totalAmount.toFixed(2)}`);
    setSupplyForm({ ...EMPTY_SUPPLY_FORM, category: PO_CATEGORIES[0], deliveryWindow: DELIVERY_WINDOWS[1] });
    closeModal();
    void loadPlatformData(hospitalInfo.id);
  };

  const handleMarkDelivered = async (order: SupplyRow) => {
    if (!supabase || markingPoId) return;
    setMarkingPoId(order.id);
    setSupplyOrders((prev) =>
      prev.map((row) => (row.id === order.id ? { ...row, status: 'DELIVERED' } : row)),
    );
    try {
      const result = await markPurchaseOrderDelivered(supabase, hospitalInfo.id, order);
      if (!result.ok) {
        setSupplyOrders((prev) =>
          prev.map((row) => (row.id === order.id ? { ...row, status: order.status } : row)),
        );
        throw new Error(result.error || 'Could not mark delivered');
      }
      if (result.error) {
        toast.success(`Delivery confirmed and recorded successfully (${result.error})`);
      } else {
        toast.success('Delivery confirmed and recorded successfully');
      }
      await loadPharmacyData();
      void loadPlatformData(hospitalInfo.id);
    } catch {
      toast.error('Could not confirm delivery. Please try again.');
    } finally {
      setMarkingPoId(null);
    }
  };

  const handleLogout = () => {
    const role = currentUserRole;
    clearActiveSession();
    router.push('/hospital/login');
  };

  const doctorCount = Math.max(
    staffMembers.filter((s) => s.staff_type === 'Doctor').length,
    walkInDoctorPool.length,
  );
  const provisionedStaffCount = Math.max(staffMembers.length, walkInDoctorPool.length);
  const rosterDoctors = useMemo(() => {
    const fromStaff: DoctorStaffRecord[] = staffMembers
      .filter((member) => member.staff_type === 'Doctor')
      .map((member) => ({
        doctor_id: member.id,
        id: member.id,
        full_name: member.full_name,
        name: member.full_name,
        doctor_name: member.full_name,
        department: member.department,
        specialization: member.department,
        specialty: member.department,
        qualification: '',
        consultation_fee: 0,
      }));

    const merged = [...walkInDoctorPool];
    const seen = new Set(
      merged.map((doctor) => (doctor.doctor_id || doctor.id || doctor.full_name).toLowerCase()),
    );
    for (const doctor of fromStaff) {
      const key = (doctor.doctor_id || doctor.id || doctor.full_name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(doctor);
    }

    return merged.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [staffMembers, walkInDoctorPool]);
  const walkInDepartmentOptions = useMemo(
    () => mergeDepartmentOptions(rosterDoctors.map((member) => member.department)),
    [rosterDoctors],
  );
  const walkInDoctors = useMemo(
    () => doctorsForDepartment(rosterDoctors, opdForm.department),
    [opdForm.department, rosterDoctors],
  );

  useEffect(() => {
    if (walkInDoctors.length === 0) {
      if (opdForm.doctorId) setOpdForm((prev) => ({ ...prev, doctorId: '' }));
      return;
    }
    const selectedId = opdForm.doctorId;
    const stillValid = walkInDoctors.some(
      (doctor) => doctor.doctor_id === selectedId || doctor.id === selectedId,
    );
    if (!stillValid) {
      setOpdForm((prev) => ({
        ...prev,
        doctorId: walkInDoctors[0]?.doctor_id || walkInDoctors[0]?.id || '',
      }));
    }
  }, [opdForm.doctorId, walkInDoctors]);
  const canProvisionStaff = isHospitalAdminRole(currentUserRole);
  const occupiedBeds = beds.filter((b) => /occup/i.test(b.status)).length;
  const occupancyRate = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;
  const pendingCheckout = pendingInvoices;
  const collectedTotal = invoices
    .filter((inv) => inv.status === 'paid' || /paid|settled/i.test(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCheckoutTotal = invoices
    .filter((inv) => /pending|unpaid|unbilled/i.test(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);
  const openBillsCount = invoices.filter((inv) => /pending|unpaid|unbilled/i.test(inv.status)).length;
  const totalCollections = collectedTotal;
  const outstanding = pendingCheckoutTotal;
  const waitingCount = opdQueue.filter((q) => triageStage(q.status) === 'Waiting').length;
  const inConsultCount = opdQueue.filter((q) => triageStage(q.status) === 'In Consultation').length;
  const waitingMinutes = opdQueue
    .filter((q) => triageStage(q.status) === 'Waiting')
    .map((q) => clinicSessionWaitMinutes(q))
    .filter((mins): mins is number => mins != null);
  const supplyPoTotal = parseFloat(
    (
      (parseInt(String(supplyForm.quantity || 1).trim(), 10) || 1) *
      (parseFloat(String(supplyForm.unitPrice || 0).trim()) || 0)
    ).toFixed(2),
  );
  const avgWaitLabel = waitingMinutes.length === 0
    ? '-- mins'
    : `~${Math.round(waitingMinutes.reduce((sum, mins) => sum + mins, 0) / waitingMinutes.length)} mins`;

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return patientRegistry.filter((patient) => {
      if (query) {
        const haystack = `${patient.uhid} ${patient.patient_name} ${patient.phone}`.toLowerCase();
        const digits = query.replace(/\D/g, '');
        const phoneDigits = patient.phone.replace(/\D/g, '');
        const matchesText = haystack.includes(query);
        const matchesPhone = digits.length >= 3 && phoneDigits.includes(digits);
        if (!matchesText && !matchesPhone) return false;
      }
      if (genderFilter !== 'all' && patient.gender.toLowerCase() !== genderFilter) {
        return false;
      }
      if (ageFilter === 'pediatric' && (patient.age == null || patient.age >= 18)) return false;
      if (ageFilter === 'adult' && (patient.age == null || patient.age < 18 || patient.age >= 60)) return false;
      if (ageFilter === 'senior' && (patient.age == null || patient.age < 60)) return false;
      return true;
    });
  }, [patientRegistry, searchQuery, genderFilter, ageFilter]);

  const patientsWithBilling = useMemo(
    () => enrichPatientsWithBilling(filteredPatients, masterOpdQueue, invoices),
    [filteredPatients, masterOpdQueue, invoices],
  );

  const navLinks: Array<{ id: NavModule; label: string; icon: typeof LayoutGrid; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'smartq', label: 'SmartQ OPD', icon: ListOrdered, badge: opdQueue.length },
    { id: 'patients', label: 'Patients', icon: Users, badge: patientRegistry.length },
    { id: 'ipd', label: 'IPD & Bed Census', icon: BedDouble, badge: beds.length },
    { id: 'emergency', label: 'Emergency Desk', icon: AlertTriangle, badge: activeEmergencies.length },
    { id: 'billing', label: 'Billing & Checkout', icon: IndianRupee, badge: pendingCheckout.length },
    { id: 'supply', label: 'Supply & Orders', icon: PackageCheck, badge: supplyOrders.length + vendorsList.length },
    { id: 'staff', label: 'Doctors & Staff', icon: HeartHandshake, badge: staffMembers.length },
  ];

  const sidebar = (
    <>
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <RegalHospitalLogoMark heightClass="h-7" className="h-10" />
          <div>
            <h2 className="text-sm font-extrabold text-white leading-tight tracking-wide">
              {hospitalInfo.name || 'Regal Hospital'}
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {hospitalInfo.id}
              </span>
              <span className="text-[10px] text-slate-400">Bengaluru</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 overflow-y-auto flex-1">
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-[#18537a] text-white shadow-md font-bold' : 'text-slate-300 hover:text-white hover:bg-[#0e3b5b]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge) && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${isActive ? 'bg-cyan-400 text-slate-950' : 'bg-[#144466] text-cyan-200'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-[#124263] bg-[#07253a] flex items-center justify-between">
        <div className="truncate pr-2">
          <div className="text-xs font-bold text-white truncate">{hospitalInfo.adminName}</div>
          <div className="text-[10px] text-cyan-300/70 truncate">{hospitalInfo.adminEmail}</div>
        </div>
        <button type="button" onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#0e3b5b]" title="Log Out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 font-sans overflow-hidden select-none">
      <aside className="w-64 bg-[#0a2e47] text-slate-200 hidden md:flex flex-col justify-between shrink-0 shadow-2xl z-30">
        {sidebar}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-50 h-full w-64 bg-[#0a2e47] text-slate-200 flex flex-col justify-between">{sidebar}</aside>
        </div>
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button type="button" className="md:hidden p-2 rounded-xl border border-slate-200" onClick={() => setMobileNavOpen(true)} aria-label="Open modules">
              <Menu className="w-4 h-4" />
            </button>
            <RegalHospitalLogoMark heightClass="h-7" className="h-10 border border-slate-200" />
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {`${navLinks.find((n) => n.id === activeTab)?.label} Command Center`}
              </h2>
              <p className="text-xs text-slate-500">
                Active Node: <span className="font-mono text-cyan-800 font-bold">{hospitalInfo.id} ({hospitalInfo.name})</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setActiveModal('opd')} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Issue OPD Token
            </button>
            {canProvisionStaff && (
              <Link
                href="/dashboard/staff-credentials"
                className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Staff Credentials Vault
              </Link>
            )}
            <button type="button" onClick={() => void loadPlatformData(hospitalInfo.id)} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
              <RefreshCw className={`w-4 h-4 text-cyan-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {billingCheckoutAlert && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-xs">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white border border-amber-300 text-amber-700 shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Ready for billing
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {billingCheckoutAlert.patientName}
                    <span className="font-semibold text-slate-600">
                      {' '}
                      · {billingCheckoutAlert.token} · {billingCheckoutAlert.doctorName} · ₹
                      {billingCheckoutAlert.consultationFee.toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    Consultation finished — settle pharmacy charges and print the official receipt.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    openDirectBilling({
                      token: billingCheckoutAlert.token,
                      appointmentId: billingCheckoutAlert.id,
                    });
                    setBillingCheckoutAlert(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  Settle Bill &amp; Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCheckoutAlert(null)}
                  className="p-1.5 rounded-lg text-amber-600 hover:text-amber-900 hover:bg-amber-100 cursor-pointer"
                  aria-label="Dismiss billing alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {onlineBookingAlert && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-xs">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white border border-violet-200 text-violet-700 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-violet-700">
                    New Patient App booking
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {onlineBookingAlert.name}
                    <span className="font-semibold text-slate-600">
                      {' '}
                       ·  {onlineBookingAlert.department}
                      {onlineBookingAlert.token ? `  ·  ${onlineBookingAlert.token}` : ''}
                    </span>
                  </p>
                  <p className="text-[11px] text-violet-800/80 mt-0.5">
                    Added to the SmartQ OPD triage stream. Open SmartQ to call the patient.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('smartq');
                    setOnlineBookingAlert(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  Open SmartQ
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineBookingAlert(null)}
                  className="p-1.5 rounded-lg text-violet-500 hover:text-violet-800 hover:bg-violet-100 cursor-pointer"
                  aria-label="Dismiss booking alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Facility Operations Snapshot</h3>
                <p className="text-xs text-slate-500">Live census scoped to {hospitalInfo.id}. Empty modules stay empty until real records exist.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <button type="button" onClick={() => setActiveTab('smartq')} className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">LIVE OPD QUEUE</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{opdQueue.length}</div>
                  <div className="text-xs font-medium text-cyan-700 mt-1">{opdQueue.length} waiting in triage</div>
                </button>
                <button type="button" onClick={() => setActiveTab('staff')} className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">PROVISIONED STAFF</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{provisionedStaffCount}</div>
                  <div className="text-xs font-medium text-cyan-700 mt-1">{doctorCount} doctors verified</div>
                </button>
                <button type="button" onClick={() => setActiveTab('ipd')} className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">BED OCCUPANCY</div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{occupancyRate}%</div>
                  <div className="text-xs font-medium text-cyan-700 mt-1">{occupiedBeds}/{beds.length} occupied</div>
                </button>
                <button type="button" onClick={() => setActiveTab('billing')} className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Collections (₹)
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-2">{inr(totalCollections)}</div>
                  <div className="text-xs font-medium text-emerald-600 mt-1">{inr(outstanding)} outstanding</div>
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-700" />
                      <h4 className="text-sm font-black text-slate-900">Recent Live Outpatients</h4>
                    </div>
                  </div>
                  {opdQueue.length === 0 ? (
                    <EmptyState icon={Users} title="No active OPD patients" body={`No appointments for ${hospitalInfo.id}. Issue a walk-in token to start.`} actionLabel="Issue OPD Token" onAction={() => setActiveModal('opd')} />
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                          <th className="py-2.5 px-3">Token</th>
                          <th className="py-2.5 px-3">Patient</th>
                          <th className="py-2.5 px-3">Dept</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {opdQueue.slice(0, 6).map((q) => (
                          <tr key={queueIdentityKey(q)}>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-cyan-800">{q.token}</div>
                              <div className="mt-1">
                                <QueueChannelBadge channel={q.channel} />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold">{q.patient_name}</td>
                            <td className="py-2.5 px-3">{q.department}</td>
                            <td className="py-2.5 px-3">
                              <OutpatientStatusCell
                                status={q.status}
                                onSettleBill={() => openBillingModalForPatient(q)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900">Emergency Status</h4>
                    {activeEmergencies.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Node {hospitalInfo.id} Ready
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-1">No active red alerts for this hospital node.</p>
                      </div>
                    ) : (
                      activeEmergencies.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs">
                          <div className="font-bold text-rose-800">{alert.patient_info}  ·  {severityLabel(alert.severity)}</div>
                          <p className="text-rose-700">{alert.arrival}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-[#FAFBFD] rounded-2xl border border-slate-200 p-6 space-y-3">
                    <h4 className="text-sm font-black text-slate-900">Vendor Supply</h4>
                    {supplyOrders.length === 0 ? (
                      <EmptyState icon={PackageCheck} title="No purchase orders" body="No procurement records for this node." actionLabel="Create Purchase Order" onAction={() => setActiveTab('supply')} />
                    ) : (
                      supplyOrders.slice(0, 3).map((po) => (
                        <div key={po.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                          <div className="font-mono font-bold text-cyan-800">{po.po_number}</div>
                          <div className="font-bold text-slate-900">{po.item_description}</div>
                          <div className="text-slate-500">{po.vendor_name}  ·  {inr(po.total_amount || po.quantity * po.unit_price || 0)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smartq' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[10px] font-mono font-bold text-cyan-800 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE TRIAGE ENGINE
                  </div>
                  <h3 className="text-lg font-black text-slate-900">SmartQ OPD Consultation Queue</h3>
                  <p className="text-xs text-slate-500">Live token orchestration synchronized with Doctor Workspace examination rooms.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ['today', "Today's OPD", todayOpdQueue.length],
                        ['tomorrow', "Tomorrow's Schedule", tomorrowOpdQueue.length],
                        ['upcoming', 'All Upcoming Bookings', upcomingOpdQueue.length],
                        ['all', 'All Appointments', masterOpdQueue.length],
                      ] as const
                    ).map(([filter, label, count]) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveDateFilter(filter)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition cursor-pointer ${
                          activeDateFilter === filter
                            ? 'bg-cyan-700 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCallNextInterleaved()}
                    disabled={advancingTokenId === 'interleave'}
                    className="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>{advancingTokenId === 'interleave' ? 'Calling...' : 'Call Next (Interleaved)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('opd')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue Walk-In Token</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Waiting in Lobby</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{waitingCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">In Consultation</div>
                    <div className="text-2xl font-black text-blue-700 mt-0.5">{inConsultCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Avg Wait Time</div>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">{avgWaitLabel}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {opdQueue.length === 0 ? (
                  <div className="p-12">
                    <EmptyState
                      icon={Clock}
                      title="No Patients in SmartQ Queue"
                      body={`Lobby is clear. Walk-in tokens and Patient App bookings scoped to ${hospitalInfo.name} appear in this triage stream instantly.`}
                      actionLabel="Issue First Token"
                      onAction={() => setActiveModal('opd')}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Token #</th>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4">Patient Name</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Clinic Date</th>
                          <th className="py-3 px-4">Assigned Doctor</th>
                          <th className="py-3 px-4">Wait Time</th>
                          <th className="py-3 px-4">Triage Stage</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {opdQueue.map((item) => {
                          const stage = triageStage(item.status);
                          const waitMins = clinicSessionWaitMinutes(item);
                          const slaBreach = isSlaBreachWaiting(item.status, waitMins);
                          return (
                            <tr key={queueIdentityKey(item)} className={`hover:bg-cyan-50/40 transition ${item.channel === 'online' ? 'bg-violet-50/25' : 'bg-emerald-50/20'}`}>
                              <td className="py-3.5 px-4 font-mono font-black text-cyan-800">{item.token}</td>
                              <td className="py-3.5 px-4">
                                <QueueChannelBadge channel={item.channel} />
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{item.patient_name}</td>
                              <td className="py-3.5 px-4 text-slate-600">{item.department}</td>
                              <td className="py-3.5 px-4">
                                {String(item.appointment_date ?? '').slice(0, 10) > todayIsoDate() ? (
                                  <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    {formatQueueDateBadge(String(item.appointment_date ?? '').slice(0, 10))}
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-600">
                                    {String(item.appointment_date ?? '').slice(0, 10) || 'Today'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">{item.doctor_name || 'Unassigned'}</td>
                              <td className={`py-3.5 px-4 font-mono ${slaBreach ? 'font-black text-rose-700' : 'text-slate-500'}`}>
                                {formatClinicWait(waitMins)}
                                {slaBreach ? <div className="text-[10px] font-bold uppercase">SLA 45m+</div> : null}
                              </td>
                              <td className="py-3.5 px-4">
                                {isBillingPendingEncounterStatus(item.status) ? (
                                  <OutpatientStatusCell
                                    status={item.status}
                                    onSettleBill={() => openBillingModalForPatient(item)}
                                  />
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    stage === 'In Consultation'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : stage === 'Completed'
                                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {stage}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {stage === 'Completed' ? (
                                  <span className="text-[11px] font-bold text-slate-400">Closed</span>
                                ) : (
                                  <div className="inline-flex flex-wrap justify-end gap-1.5">
                                    {slaBreach && item.reschedule_status !== 'offered' ? (
                                      <button
                                        type="button"
                                        onClick={() => void handleOfferReschedule(item)}
                                        disabled={advancingTokenId === (item.id || item.token)}
                                        className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-800 disabled:opacity-50"
                                      >
                                        Offer Reschedule
                                      </button>
                                    ) : null}
                                    {item.reschedule_status === 'offered' ? (
                                      <span className="px-2 py-1 text-[10px] font-bold uppercase text-amber-700">Offered</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => void handleAdvanceTriage(item)}
                                      disabled={advancingTokenId === (item.id || item.token)}
                                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-cyan-600 bg-white text-[11px] font-bold text-slate-700 hover:text-cyan-800 transition cursor-pointer disabled:opacity-50"
                                    >
                                      {advancingTokenId === (item.id || item.token) ? 'Updating…' : stage === 'In Consultation' ? 'Mark Complete' : 'Call Next'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Master Patient Registry &amp; EMR Index</h3>
                  <p className="text-xs text-slate-500">Demographic repository and encounter histories registered at {hospitalInfo.name}.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by UHID, name, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-700"
                    />
                  </div>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="all">All Ages</option>
                    <option value="pediatric">Pediatric (&lt;18)</option>
                    <option value="adult">Adult (18-59)</option>
                    <option value="senior">Senior (60+)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {patientRegistry.length === 0 ? (
                  <div className="p-12">
                    <EmptyState
                      icon={Users}
                      title="No Patient Records Synchronized"
                      body={`Zero mock entries. Verified profiles from the Patient App and walk-in OPD registrations scoped to ${hospitalInfo.name} (${hospitalInfo.id}) populate here.`}
                      actionLabel="Issue Walk-In Token"
                      onAction={() => setActiveModal('opd')}
                    />
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-slate-300" />
                    <div className="text-sm font-bold text-slate-700">No matching patient charts</div>
                    <p className="text-xs text-slate-400">Adjust search or gender/age filters to widen the directory.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 uppercase tracking-wider font-semibold text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Permanent UHID</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Contact Number</th>
                          <th className="py-3 px-4">Total Visits</th>
                          <th className="py-3 px-4">Last Encounter</th>
                          <th className="py-3 px-4">Clinical Record Status</th>
                          <th className="py-3 px-4 text-center">Billing & Settlement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientsWithBilling.map((patient) => {
                          const pendingInvoice = invoices.find((inv) => inv.id === patient.pending_invoice_id);
                          const breakdown = pendingInvoice
                            ? computeCheckoutTotal({
                                consultationFee: pendingInvoice.consultation_fee ?? 0,
                                pharmacyAmount: pendingInvoice.medicine_fee ?? pendingInvoice.medicines_total ?? 0,
                              })
                            : null;
                          return (
                          <tr key={patientKey(patient.patient_name, patient.phone, patient.uhid)} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-cyan-800">{patient.uhid}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{patient.patient_name}</div>
                              <div className="text-[10px] text-slate-400">
                                {patient.gender || 'Sex n/a'}
                                {'  ·  '}
                                {patient.patient_age ?? patient.age ? `${patient.patient_age ?? patient.age}y` : 'Age N/A'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{patient.phone || 'Not Provided'}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{patient.visits}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{formatEncounter(patient.last_encounter)}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {patient.record_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {patient.billing_status === 'pending_payment' && pendingInvoice ? (
                                <button
                                  type="button"
                                  disabled={isProcessingPayment}
                                  onClick={() => openPatientCheckout(patient)}
                                  className="inline-flex flex-col items-center gap-0.5 rounded-xl bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase text-amber-800 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
                                >
                                  <span>Collect {breakdown ? inr(breakdown.totalAmount) : inr(pendingInvoice.amount)}</span>
                                  <span className="font-normal normal-case text-[9px] text-amber-700">Consultation complete</span>
                                </button>
                              ) : patient.billing_status === 'paid' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Settled
                                </span>
                              ) : patient.billing_status === 'awaiting_consultation' ? (
                                <span className="text-[10px] text-slate-400 font-semibold">Awaiting consultation</span>
                              ) : (
                                <span className="text-[10px] text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Billing &amp; Checkout Command Center</h3>
                  <p className="text-xs text-slate-500">
                    Live invoices from Doctor Workspace  ·  Node {hospitalInfo.id}
                  </p>
                </div>
                <button type="button" onClick={() => openDirectBilling()} className="px-3.5 py-2 rounded-xl bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Settle by Token
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Collected</div>
                  <div className="text-3xl font-black mt-2">{inr(collectedTotal)}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/40">
                  <div className="text-[11px] font-bold text-amber-700 uppercase font-mono">Pending checkout</div>
                  <div className="text-3xl font-black mt-2 text-amber-900">{inr(pendingCheckoutTotal)}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Open bills</div>
                  <div className="text-3xl font-black mt-2">{openBillsCount}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {invoices.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon={IndianRupee} title="Checkout queue is empty" body="Itemized bills appear here when a doctor completes a consultation or a cashier posts a direct invoice." actionLabel="Settle by Token" onAction={() => openDirectBilling()} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                        <tr>
                          <th className="py-3 px-4">UHID / Bill ID</th>
                          <th className="py-3 px-4">Patient Name</th>
                          <th className="py-3 px-4">Doctor Name</th>
                          <th className="py-3 px-4">Consultation Fee</th>
                          <th className="py-3 px-4">Prescribed Medicines</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Collect Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => {
                          const pending = /pending|unpaid|unbilled/i.test(inv.status);
                          return (
                            <tr key={inv.id} className="align-top">
                              <td className="py-3.5 px-4 font-mono font-bold text-cyan-800">{inv.uhid || inv.id.slice(0, 8)}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{inv.patient_name}</td>
                              <td className="py-3.5 px-4">{inv.doctor_name || 'Duty doctor'}</td>
                              <td className="py-3.5 px-4 font-mono">{inr(inv.consultation_fee ?? 0)}</td>
                              <td className="py-3.5 px-4">
                                {(inv.prescribed_items ?? []).length === 0 ? (
                                  <span className="text-slate-400">Settled at counter</span>
                                ) : (
                                  <ul className="space-y-1">
                                    {(inv.prescribed_items ?? []).map((med) => (
                                      <li key={`${inv.id}-${med.drug}`} className="text-slate-600">
                                        {med.drug} · Qty {med.quantity ?? 1}
                                        {med.frequency ? ` · ${med.frequency}` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-black text-emerald-700">
                                {inr(
                                  /pending|unpaid|unbilled/i.test(inv.status)
                                    ? inv.consultation_fee ?? 0
                                    : inv.amount,
                                )}
                                {/pending|unpaid|unbilled/i.test(inv.status) ? (
                                  <span className="block text-[9px] font-normal text-slate-400">+ pharmacy at checkout</span>
                                ) : null}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  {pending ? 'Pending' : 'Paid'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {pending ? (
                                  <button
                                    type="button"
                                    disabled={isProcessingPayment}
                                    onClick={() => openInvoiceCheckout(inv)}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                                  >
                                    Settle &amp; Print
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center justify-end gap-2">
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {inv.paid_at ? formatEncounter(inv.paid_at) : 'Cleared'}
                                      {inv.payment_method ? `  ·  ${inv.payment_method}` : ''}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReceiptPreview({
                                          id: inv.id,
                                          invoice_number: inv.invoice_number,
                                          uhid: inv.uhid,
                                          patient_name: inv.patient_name,
                                          doctor_name: inv.doctor_name,
                                          department: inv.department,
                                          token_number: inv.token_number ?? inv.uhid,
                                          consultation_fee: inv.consultation_fee,
                                          pharmacy_amount: inv.medicine_fee ?? inv.medicines_total ?? 0,
                                          prescribed_items: inv.prescribed_items,
                                          amount: inv.amount,
                                          payment_method: inv.payment_method,
                                          paid_at: inv.paid_at,
                                        });
                                        setReceiptPreviewOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold uppercase"
                                    >
                                      <Printer className="w-3 h-3" />
                                      Receipt
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'supply' && (
            <SupplyOrdersCommandCenter
              hospitalId={hospitalInfo.id}
              hospitalName={hospitalInfo.name || 'Regal Hospital'}
              onOrdersChanged={(orders, nextVendors) => {
                setSupplyOrders(orders);
                setVendorsList(nextVendors);
              }}
            />
          )}


          {activeTab === 'ipd' && (
            <IpdBedCensus
              hospitalId={hospitalInfo.id}
              hospitalName={hospitalInfo.name}
              patients={patientRegistry.map((patient) => ({
                uhid: patient.uhid,
                patient_name: patient.patient_name,
              }))}
              onBedsChanged={(next) =>
                setBeds(
                  next.map((bed) => ({
                    id: bed.id,
                    ward_name: bed.ward_name,
                    bed_number: bed.bed_number,
                    bed_type: bed.bed_type,
                    daily_rate: bed.daily_rate,
                    status: bed.status,
                    patient_name: bed.patient_name || '-',
                  })),
                )
              }
            />
          )}

          {activeTab === 'staff' && (
            <DoctorsStaffCommandCenter
              hospitalId={hospitalInfo.id}
              hospitalName={hospitalInfo.name || 'Regal Hospital'}
              canManage={false}
              onRosterChanged={setStaffMembers}
            />
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Emergency Desk Command</h3>
                  <p className="text-xs text-slate-500">Trauma triage for {hospitalInfo.name}  ·  Node {hospitalInfo.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <Siren className="w-4 h-4 animate-pulse" />
                  Activate Emergency
                </button>
              </div>
              {activeEmergencies.length === 0 ? (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  No active red alerts currently dispatched for {hospitalInfo.id}. Triage desk is on standby.
                </div>
              ) : (
                <div className="grid gap-3">
                  {activeEmergencies.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-2xl border ${isCodeRed(alert.severity) ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${isCodeRed(alert.severity) ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                              {severityLabel(alert.severity)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-700">
                              {alert.arrival}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Dispatched {formatWait(alert.created_at)} ago
                            </span>
                          </div>
                          <div className="text-lg font-black text-slate-900 leading-tight">{alert.patient_info}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleAcknowledgeEmergency(alert.id)}
                            className="px-3 py-2 rounded-xl bg-[#0F3E5D] hover:bg-[#1E567B] text-white text-[11px] font-bold uppercase"
                          >
                            Acknowledge &amp; Triage
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleResolveEmergency(alert.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {activeModal === 'opd' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <TicketPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Issue Walk-In OPD Token</h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instant outpatient queue token &bull; Scoped to{' '}
                    <span className="font-semibold text-slate-700">{hospitalInfo.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueTokenSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Patient Full Name</span>
                  <span className="text-emerald-600 font-normal normal-case text-[10px]">* Required</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gowda"
                    value={opdForm.patientName}
                    onChange={(e) => setOpdForm((p) => ({ ...p, patientName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Age (years)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Enter age"
                  value={opdForm.age}
                  onChange={(e) => setOpdForm((p) => ({ ...p, age: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Clinical Department
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    value={opdForm.department}
                    onChange={(e) => {
                      const department = e.target.value;
                      const nextDoctors = doctorsForDepartment(rosterDoctors, department);
                      setOpdForm((p) => ({
                        ...p,
                        department,
                        doctorId: nextDoctors[0]?.doctor_id || nextDoctors[0]?.id || '',
                      }));
                    }}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition appearance-none cursor-pointer"
                  >
                    {walkInDepartmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Consulting doctor
                </label>
                <select
                  required={walkInDoctors.length > 0}
                  value={opdForm.doctorId}
                  onChange={(e) => setOpdForm((p) => ({ ...p, doctorId: e.target.value }))}
                  disabled={rosterDoctors.length === 0}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition disabled:opacity-60"
                >
                  {rosterDoctors.length === 0 ? (
                    <option value="">Loading doctors…</option>
                  ) : walkInDoctors.length === 0 ? (
                    <option value="" disabled>
                      No doctors assigned to {opdForm.department}
                    </option>
                  ) : (
                    walkInDoctors.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        {formatDoctorBookingOptionLabel(doctor)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Contact Mobile</span>
                  <span className="text-slate-400 font-normal normal-case text-[10px]">SMS Updates</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-mono font-bold text-xs pointer-events-none">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>+91</span>
                  </div>
                  <PhoneNumberInput
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={opdForm.phone}
                    onChange={(phone) => setOpdForm((p) => ({ ...p, phone }))}
                    className="w-full pl-[4.75rem] pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Consultation Time Slot
                </label>
                {!opdForm.doctorId ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                    Select a doctor to view live availability for today
                  </div>
                ) : (
                  <DynamicSlotPicker
                    slots={opdDynamicSlots}
                    selectedTime={opdAppointmentTime}
                    loading={loadingOpdSlots}
                    clinicalReason="Walk-in consultation"
                    variant="grid"
                    onSelect={(slot) => setOpdAppointmentTime(slot.time)}
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Queue Token:</span>
                <span className="font-mono font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {opdTokenPreview}
                </span>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingToken ||
                    !opdForm.patientName.trim() ||
                    !parsePatientAge(opdForm.age) ||
                    !isTenDigitPhone(opdForm.phone) ||
                    !opdForm.doctorId ||
                    !opdAppointmentTime
                  }
                  className="w-full py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  {isSubmittingToken ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <span>Create Token</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal && activeModal !== 'opd' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {activeModal === 'pharmacy' && 'Add Medicine to Formulary'}
                {activeModal === 'bed' && 'Register Ward Bed'}
                {activeModal === 'invoice' && 'Post Cashier Invoice'}
                {activeModal === 'supply' && 'Create Purchase Order'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmittingFormulary}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'pharmacy' && (
              <form onSubmit={(event) => void handleAddFormularyItemSubmit(event)} className="space-y-3 text-xs">
                <input
                  required
                  disabled={isSubmittingFormulary}
                  value={medForm.name}
                  onChange={(e) => setMedForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Medicine name"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl disabled:opacity-60"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    disabled={isSubmittingFormulary}
                    value={medForm.category}
                    onChange={(e) => setMedForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="Category"
                    className="px-3 py-2.5 border border-slate-200 rounded-xl disabled:opacity-60"
                  />
                  <input
                    type="number"
                    min={0}
                    disabled={isSubmittingFormulary}
                    value={medForm.stock}
                    onChange={(e) => setMedForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
                  />
                </div>
                <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmittingFormulary}
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFormulary}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingFormulary ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Item...</span>
                      </>
                    ) : (
                      '+ Add to Formulary'
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'bed' && (
              <form onSubmit={handleAddBed} className="space-y-3 text-xs">
                <label className="block font-bold uppercase text-slate-600">
                  Ward
                  <select
                    required
                    value={bedForm.ward}
                    onChange={(e) => {
                      const ward = e.target.value;
                      const bedType = inferBedTypeFromWard(ward);
                      setBedForm((p) => ({ ...p, ward, bedType, dailyRate: defaultRateForBedType(bedType) }));
                    }}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  >
                    {WARD_OPTIONS.map((ward) => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Bed number
                  <input
                    required
                    value={bedForm.bedNumber}
                    onChange={(e) => setBedForm((p) => ({ ...p, bedNumber: e.target.value }))}
                    placeholder="GW-105, ICU-03"
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  />
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Bed type
                  <select
                    value={bedForm.bedType}
                    onChange={(e) => {
                      const bedType = e.target.value as BedType;
                      setBedForm((p) => ({ ...p, bedType, dailyRate: defaultRateForBedType(bedType) }));
                    }}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  >
                    {Object.entries(BED_TYPE_RATES).map(([type, rate]) => (
                      <option key={type} value={type}>{type}  ·  {formatBedRate(rate)}</option>
                    ))}
                  </select>
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Status
                  <select
                    value={bedForm.status}
                    onChange={(e) => setBedForm((p) => ({ ...p, status: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  >
                    {BED_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {bedForm.status === 'occupied' ? (
                  <input
                    value={bedForm.patientName}
                    onChange={(e) => setBedForm((p) => ({ ...p, patientName: e.target.value }))}
                    placeholder="Occupying patient"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl"
                  />
                ) : null}
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono font-bold">
                  Default rate: {formatBedRate(bedForm.dailyRate)} / day
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-700 text-white font-bold uppercase">Register Bed</button>
              </form>
            )}

            {activeModal === 'invoice' && (
              <form onSubmit={handleAddInvoice} className="space-y-3 text-xs">
                <input required value={invoiceForm.patientName} onChange={(e) => setInvoiceForm((p) => ({ ...p, patientName: e.target.value }))} placeholder="Patient name" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl" />
                <input value={invoiceForm.service} onChange={(e) => setInvoiceForm((p) => ({ ...p, service: e.target.value }))} placeholder="Service type" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl" />
                <input type="number" min={0} value={invoiceForm.amount} onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-mono" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-700 text-white font-bold uppercase">Post Invoice</button>
              </form>
            )}

            {activeModal === 'supply' && (
              <form onSubmit={handleAddSupply} className="space-y-3 text-xs">
                <label className="block font-bold uppercase text-slate-600">
                  Registered supplier *
                  <select
                    required
                    value={vendorsList.find((vendor) => vendor.company_name === supplyForm.vendor)?.id ?? ''}
                    onChange={(e) => {
                      const vendor = vendorsList.find((item) => item.id === e.target.value);
                      setSupplyForm((p) => ({
                        ...p,
                        vendor: vendor?.company_name ?? '',
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
                  >
                    <option value="">
                      {vendorsList.filter(isEligibleHospitalVendor).length === 0
                        ? 'No suppliers registered yet'
                        : 'Select a registered supplier…'}
                    </option>
                    {vendorsList.filter(isEligibleHospitalVendor).map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {formatVendorOptionLabel(vendor)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Category
                  <select
                    value={supplyForm.category}
                    onChange={(e) => setSupplyForm((p) => ({ ...p, category: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  >
                    {PO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Item name
                  <input
                    required
                    value={supplyForm.item}
                    onChange={(e) => setSupplyForm((p) => ({ ...p, item: e.target.value }))}
                    placeholder="Item name"
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  />
                </label>
                <label className="block font-bold uppercase text-slate-600">
                  Detailed SKU description
                  <textarea
                    value={supplyForm.sku}
                    onChange={(e) => setSupplyForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="Strength, pack size, manufacturer"
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                    rows={2}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block font-bold uppercase text-slate-600">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      required
                      value={supplyForm.quantity}
                      onChange={(e) => setSupplyForm((p) => ({ ...p, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                      className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-mono font-medium normal-case"
                    />
                  </label>
                  <label className="block font-bold uppercase text-slate-600">
                    Unit price (₹)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={supplyForm.unitPrice}
                      onChange={(e) => setSupplyForm((p) => ({ ...p, unitPrice: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-mono font-medium normal-case"
                    />
                  </label>
                </div>
                <label className="block font-bold uppercase text-slate-600">
                  Expected delivery window
                  <select
                    value={supplyForm.deliveryWindow}
                    onChange={(e) => setSupplyForm((p) => ({ ...p, deliveryWindow: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                  >
                    {DELIVERY_WINDOWS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl bg-cyan-50 border border-cyan-200 px-3 py-2 text-cyan-900 font-black">
                  Total: ₹{supplyPoTotal.toFixed(2)}
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-700 text-white font-bold uppercase">Issue Purchase Order</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showEmergencyModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(event) => void handleEmergencySubmit(event)}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            <div className="bg-rose-600 px-5 py-4 text-white">
              <h3 className="text-base font-black">Log Emergency Alert</h3>
              <p className="text-[11px] text-rose-100 mt-0.5">Dispatch a Code Red / Code Yellow to the trauma desk.</p>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <label className="block font-bold text-slate-700 uppercase">
                Patient / trauma details
                <input
                  required
                  disabled={isSubmittingEmergency}
                  value={emPatientInfo}
                  onChange={(e) => setEmPatientInfo(e.target.value)}
                  placeholder="35 M - Multi-vehicle trauma"
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                />
              </label>
              <label className="block font-bold text-slate-700 uppercase">
                Severity
                <select
                  disabled={isSubmittingEmergency}
                  value={emSeverity}
                  onChange={(e) => setEmSeverity(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                >
                  <option value="code_red">Critical (Code Red)</option>
                  <option value="code_yellow">Urgent (Code Yellow)</option>
                </select>
              </label>
              <label className="block font-bold text-slate-700 uppercase">
                Arrival mode
                <select
                  disabled={isSubmittingEmergency}
                  value={emArrival}
                  onChange={(e) => setEmArrival(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium normal-case"
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="Police Drop">Police Drop</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end items-center gap-3 px-5 py-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmittingEmergency}
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEmergency}
                className="px-5 py-2 text-xs font-black rounded-lg bg-rose-600 hover:bg-rose-500 text-white uppercase flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmittingEmergency ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sounding...
                  </>
                ) : (
                  <>
                    <Siren className="w-3.5 h-3.5" />
                    Sound Alarm
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <PharmacyBillingModal
        open={directBillingOpen}
        hospitalId={hospitalInfo.id}
        seed={directBillingSeed}
        queue={opdQueue}
        invoices={invoices}
        doctors={walkInDoctors}
        busy={isProcessingPayment}
        onClose={closeDirectBilling}
        onSettled={() => {
          setBillingCheckoutAlert(null);
          void loadBillingInvoices();
          void loadPlatformData(hospitalInfo.id);
        }}
      />

      <OfficialReceiptModal
        open={receiptPreviewOpen}
        receipt={receiptPreview}
        autoPrint={false}
        onClose={() => {
          setReceiptPreviewOpen(false);
          setReceiptPreview(null);
        }}
      />
    </div>
  );
}
