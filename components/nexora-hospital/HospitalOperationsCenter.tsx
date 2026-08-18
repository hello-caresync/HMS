'use client';

/**
 * REGAL HOSPITAL OPERATIONS & ADMIN HUB (RH-BLR-01)
 * Eleven workspaces in one container, matching Doctor Command Center tokens and density.
 * Supabase reads are error-tolerant for operational modules; the Patient Directory
 * is live-only (no dummy fallbacks). Writes try each historical table name so the
 * UI never dead-ends on schema drift.
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  BedDouble,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  ListOrdered,
  MessageSquare,
  Package,
  Search,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { formatINR } from '@/lib/utils/currency';
import { MDOT, EM_DASH, ELLIPSIS, EMPTY_VALUE } from '@/lib/utils/typography';
import { emitEcosystemSystemEvent } from '@/lib/ecosystem/messaging-service';
import EcosystemMessagesView from '@/components/nexora-hospital/EcosystemMessagesView';
import EcosystemNotificationCenter from '@/components/nexora-hospital/EcosystemNotificationCenter';
import EmergencyTriageDesk from '@/components/nexora-hospital/EmergencyTriageDesk';
import SupplyChainWorkspace from '@/components/nexora-hospital/SupplyChainWorkspace';
import { REGAL_HOSPITAL_ID } from '@/lib/regal/constants';
import {
  loadEmergencyTriagesLive,
} from '@/lib/hospital/operations/emergency-triage-sync';
import {
  collectConsultationBillPayment,
  consultationBillToHospitalRow,
  loadHospitalBillsLive,
} from '@/lib/hospital/operations/consultation-billing-sync';
import {
  loadHospitalAppointmentsLive,
  nextWalkInToken,
  registerWalkInAppointment,
  transitionHospitalAppointment,
} from '@/lib/hospital/operations/appointment-sync';
import {
  REGAL_FACILITY,
  SEED_BEDS,
  SEED_PRESCRIPTIONS,
  SEED_STAFF,
} from '@/components/nexora-hospital/hospital-ops-seed';

/* â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const NAVY = '#0F3E5D';
const NAVY_DEEP = '#0B2C42';
const NAVY_ACTIVE = '#1E567B';
const TEAL = '#00A896';
const TEAL_LIGHT = '#2DD4BF';

const ui = {
  card: 'rounded-xl border border-slate-200 bg-white shadow-sm',
  cardTitle: 'text-sm font-bold text-slate-900',
  meta: 'text-xs font-medium text-slate-500',
  label: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
  metric: 'mt-1.5 text-2xl font-black tabular-nums text-slate-900',
  input:
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A896] focus:outline-none focus:ring-1 focus:ring-[#00A896]/30',
  btnTeal:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00A896] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#00806f] disabled:opacity-50',
  btnNavy:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F3E5D] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1E567B]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50',
  btnRed:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700',
  pill: 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#00A896] hover:text-[#0F3E5D]',
  th: 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
  td: 'whitespace-nowrap px-4 py-3 text-sm text-slate-700',
  tr: 'border-t border-slate-100 hover:bg-slate-50/70',
} as const;

/* â”€â”€ Official 41-clinician directory (Walk-in selector + Doctor Directory) â”€ */

export interface RegalDoctor {
  id: string;
  name: string;
  department: string;
  fee: number;
  room: string;
}

export const REGAL_DOCTORS: RegalDoctor[] = [
  { id: 'RH-D01', name: 'Dr. Suriraju V', department: 'Urology', fee: 700, room: 'Room 101' },
  { id: 'RH-D02', name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery', fee: 800, room: 'Room 204' },
  { id: 'RH-D03', name: 'Dr. Ananya R', department: 'General Medicine', fee: 600, room: 'Room 102' },
  { id: 'RH-D04', name: 'Dr. Vikramaditya Rao', department: 'Cardiology', fee: 900, room: 'Room 301' },
  { id: 'RH-D05', name: 'Dr. Meera Nambiar', department: 'Cardiology', fee: 850, room: 'Room 302' },
  { id: 'RH-D06', name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics', fee: 850, room: 'Room 201' },
  { id: 'RH-D07', name: 'Dr. Shalini Deshmukh', department: 'Orthopedics', fee: 750, room: 'Room 202' },
  { id: 'RH-D08', name: 'Dr. Arvind Swamy', department: 'Neurology', fee: 950, room: 'Room 401' },
  { id: 'RH-D09', name: 'Dr. Kavitha Reddy', department: 'Neurosurgery', fee: 1200, room: 'Room 402' },
  { id: 'RH-D10', name: 'Dr. Pradeep Verma', department: 'Gastroenterology', fee: 800, room: 'Room 205' },
  { id: 'RH-D11', name: 'Dr. Sunitha Gopal', department: 'Gastroenterology', fee: 750, room: 'Room 206' },
  { id: 'RH-D12', name: 'Dr. Anand Kulkarni', department: 'Nephrology', fee: 850, room: 'Room 105' },
  { id: 'RH-D13', name: 'Dr. Archana Bhat', department: 'Pediatrics', fee: 650, room: 'Room 108' },
  { id: 'RH-D14', name: "Dr. Rohan D'Souza", department: 'Pediatrics', fee: 650, room: 'Room 109' },
  { id: 'RH-D15', name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology', fee: 800, room: 'Room 210' },
  { id: 'RH-D16', name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology', fee: 750, room: 'Room 211' },
  { id: 'RH-D17', name: 'Dr. Harish Prasad', department: 'Pulmonology', fee: 700, room: 'Room 305' },
  { id: 'RH-D18', name: 'Dr. Nandini Sen', department: 'Dermatology', fee: 600, room: 'Room 112' },
  { id: 'RH-D19', name: 'Dr. Karthik Subramanian', department: 'ENT', fee: 650, room: 'Room 115' },
  { id: 'RH-D20', name: 'Dr. Smita Joshi', department: 'Ophthalmology', fee: 700, room: 'Room 118' },
  { id: 'RH-D21', name: 'Dr. Manoj Kumar', department: 'Ophthalmology', fee: 700, room: 'Room 119' },
  { id: 'RH-D22', name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology', fee: 800, room: 'Room 308' },
  { id: 'RH-D23', name: 'Dr. Rakesh Nair', department: 'Oncology', fee: 1000, room: 'Room 405' },
  { id: 'RH-D24', name: 'Dr. Gautham Pai', department: 'Oncology', fee: 1000, room: 'Room 406' },
  { id: 'RH-D25', name: 'Dr. Vani S. Rao', department: 'Psychiatry', fee: 750, room: 'Room 122' },
  { id: 'RH-D26', name: 'Dr. Ashok Patel', department: 'Rheumatology', fee: 800, room: 'Room 310' },
  { id: 'RH-D27', name: 'Dr. Varun Sundaram', department: 'Vascular Surgery', fee: 900, room: 'Room 215' },
  { id: 'RH-D28', name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology', fee: 700, room: 'OT Wing' },
  { id: 'RH-D29', name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery', fee: 1100, room: 'Room 218' },
  { id: 'RH-D30', name: 'Dr. Nithya Srinivas', department: 'Pathology', fee: 500, room: 'Central Lab' },
  { id: 'RH-D31', name: 'Dr. Jayakrishnan Nair', department: 'Radiology', fee: 600, room: 'Imaging Block' },
  { id: 'RH-D32', name: 'Dr. Bhavana Shah', department: 'Radiology', fee: 600, room: 'Imaging Block' },
  { id: 'RH-D33', name: 'Dr. Santosh Shetty', department: 'Emergency Medicine', fee: 800, room: 'ER Trauma 1' },
  { id: 'RH-D34', name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine', fee: 900, room: 'Diagnostic Wing' },
  { id: 'RH-D35', name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab', fee: 650, room: 'Rehab Unit' },
  { id: 'RH-D36', name: 'Dr. Anushree Roy', department: 'Clinical Immunology', fee: 750, room: 'Room 312' },
  { id: 'RH-D37', name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery', fee: 1300, room: 'Room 304' },
  { id: 'RH-D38', name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery', fee: 850, room: 'Room 110' },
  { id: 'RH-D39', name: 'Dr. Hemanth Kumar', department: 'Geriatrics', fee: 700, room: 'Room 106' },
  { id: 'RH-D40', name: 'Dr. Aparna Nair', department: 'Infectious Diseases', fee: 750, room: 'Room 104' },
  { id: 'RH-D41', name: 'Dr. Balaji Venkat', department: 'Pain Management', fee: 800, room: 'Room 220' },
];

const DEFAULT_REGAL_DOCTOR = REGAL_DOCTORS[1];

/* â”€â”€ Types, navigation & catalogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type TabId =
  | 'dashboard'
  | 'opd'
  | 'patients'
  | 'ipd'
  | 'records'
  | 'emergency'
  | 'billing'
  | 'supply'
  | 'staff'
  | 'messages';

type Row = Record<string, unknown>;

/** Lets a dashboard quick action jump to a workspace and open its primary modal. */
type Intent = 'walk-in' | 'admit' | 'bypass' | 'purchase-order' | null;

const DEFAULT_CONSULTANT = DEFAULT_REGAL_DOCTOR.name;

const NAV: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'opd', label: 'SmartQ OPD', icon: ListOrdered },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'ipd', label: 'IPD & Bed Census', icon: BedDouble },
  { id: 'records', label: 'Records & Pharmacy', icon: ClipboardList },
  { id: 'emergency', label: 'Emergency Desk', icon: AlertTriangle },
  { id: 'billing', label: 'Billing & Cashier', icon: IndianRupee },
  { id: 'supply', label: 'Supply & Orders', icon: Package },
  { id: 'staff', label: 'Doctors & Staff', icon: Stethoscope },
  { id: 'messages', label: 'Ecosystem Messages', icon: MessageSquare },
];

const HEADINGS: Record<TabId, { title: string; sub: string }> = {
  dashboard: { title: 'Operations Dashboard', sub: 'Live census across OPD, wards, pharmacy and emergency' },
  opd: { title: 'SmartQ OPD & Reception', sub: 'Check-in desk, walk-in tokens and doctor handoff' },
  patients: { title: 'Patient Directory', sub: 'Universal Health ID registry and EHR status' },
  ipd: { title: 'IPD & Bed Census', sub: 'Ward occupancy, admissions, transfers and discharges' },
  records: { title: 'Records & Central Pharmacy', sub: 'E-prescriptions streaming in from the Doctor App' },
  emergency: { title: 'Emergency Triage Desk', sub: 'Priority intake and doctor bypass broadcast' },
  billing: { title: 'Billing & Cashier Desk', sub: 'Consolidated invoices across every department' },
  supply: { title: 'Supply Chain & Vendor POs', sub: 'Stock thresholds and purchase order dispatch' },
  staff: { title: 'Doctors & Staff Directory', sub: `41 Regal Hospital clinicians ${MDOT} duty roster and RBAC` },
  messages: {
    title: 'Ecosystem Communications',
    sub: 'Dispatch alerts to Patient, Doctor and Vendor apps with delivery tracking',
  },
};

const OPD_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'booked', label: 'Booked' },
  { id: 'checked_in', label: 'Checked In' },
  { id: 'in_consultation', label: 'In Consultation' },
  { id: 'completed', label: 'Completed' },
];

const PAYMENT_MODES = ['Cash', 'UPI QR', 'Card', 'TPA Insurance'] as const;

const RBAC_MATRIX: { role: string; access: string[] }[] = [
  { role: 'Admin', access: ['All modules', 'Staff & RBAC', 'Financial reports'] },
  { role: 'Doctor', access: ['Clinical queue', 'Prescriptions', 'Lab orders'] },
  { role: 'Receptionist', access: ['SmartQ OPD', 'Patient registry', 'Token issue'] },
  { role: 'Nurse', access: ['IPD & beds', 'Vitals', 'Emergency triage'] },
  { role: 'Pharmacist', access: ['Pharmacy queue', 'Stock deduction'] },
  { role: 'Lab Tech', access: ['Specimen worklist', 'Result publishing'] },
  { role: 'Biller', access: ['Billing ledger', 'Payment collection'] },
  { role: 'Procurement', access: ['Inventory', 'Vendor purchase orders'] },
];

/* â”€â”€ Table candidates (schema drift tolerant) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TABLES = {
  appointments: ['appointments'],
  patients: ['patients'],
  beds: ['hospital_beds', 'beds'],
  prescriptions: ['prescriptions'],
  labs: ['lab_orders'],
  triages: ['emergency_triage', 'emergency_triages'],
  bills: ['billing_invoices', 'bills'],
  inventory: ['inventory_items', 'pharmacy_inventory'],
  purchaseOrders: ['purchase_orders'],
  staff: ['hospital_members', 'staff', 'doctors'],
  notifications: ['system_notifications'],
  messages: ['system_notifications', 'ecosystem_messages'],
} as const;

/* â”€â”€ Data helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function client() {
  return createClient();
}

function str(value: unknown, fallback = ''): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value: unknown, fallback = ''): string {
  return str(value, fallback).toLowerCase().replace(/[\s-]+/g, '_');
}

function statusOf(row: Row): string {
  return normalize(row.status ?? row.queue_status, 'booked');
}

/** Collision-proof key: falls back to a business identifier plus the row index. */
function rowKey(item: Row, index: number): string {
  const id = str(item.id);
  if (id) return id;
  const alternate = str(
    item.token_number || item.uhid || item.employee_id || item.invoice_number || item.item_code,
    'item',
  );
  return `${alternate}-${index}`;
}

function staffName(row: Row): string {
  const display = str(row.display_name ?? row.full_name);
  if (display) return display;
  const joined = `${str(row.first_name)} ${str(row.last_name)}`.trim();
  return joined || 'Staff member';
}

/** Returns only live Supabase rows {EM_DASH} never injects dummy patient fallbacks. */
async function loadPatientsLive(): Promise<Row[]> {
  for (const table of TABLES.patients) {
    try {
      const { data, error } = await client()
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) return data as Row[];
    } catch {
      /* try the next candidate table */
    }
  }
  return [];
}

/** Never throws: returns the seed dataset whenever every candidate table is empty or unreachable. */
async function safeSelect(tables: readonly string[], fallback: Row[]): Promise<Row[]> {
  for (const table of tables) {
    try {
      const { data, error } = await client().from(table).select('*').limit(200);
      if (!error && data && data.length > 0) return data as Row[];
    } catch {
      /* try the next candidate table */
    }
  }
  return fallback;
}

async function tryUpdate(tables: readonly string[], id: string, patch: Row): Promise<boolean> {
  for (const table of tables) {
    try {
      const { error } = await client().from(table).update(patch).eq('id', id);
      if (!error) return true;
    } catch {
      /* try the next candidate table */
    }
  }
  return false;
}

async function tryInsert(tables: readonly string[], row: Row): Promise<boolean> {
  for (const table of tables) {
    try {
      const { error } = await client().from(table).insert(row);
      if (!error) return true;
    } catch {
      /* try the next candidate table */
    }
  }
  return false;
}

/** Broadcasts an ecosystem event that the Doctor, Patient and Vendor apps listen on. */
async function emitEvent(
  event_type: string,
  message: string,
  severity: 'info' | 'warning' | 'critical' = 'info',
  payload: Row = {},
  target_roles: string[] = ['hospital', 'doctor', 'patient', 'vendor'],
) {
  await emitEcosystemSystemEvent(client(), {
    event_type,
    source_app: 'hospital',
    severity,
    target_roles,
    payload: { message, facility: REGAL_FACILITY.code, ...payload },
  });
}

/** Walk-in tokens continue the T-0X series independently of department tokens. */
function newUhid(): string {
  return `RH-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function clockNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* â”€â”€ UI atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={ui.card}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className={ui.cardTitle}>{title}</h2>
          {subtitle && <p className={`mt-0.5 ${ui.meta}`}>{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusBadge({ value }: { value: string }) {
  const s = normalize(value, 'booked');
  const tone =
    s === 'completed' || s === 'dispensed' || s === 'verified' || s === 'paid' || s === 'active'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : s === 'in_consultation' || s === 'in_diagnostics' || s === 'partial'
        ? 'bg-sky-50 text-sky-700 ring-sky-200'
        : s === 'checked_in' || s === 'sample_collected' || s === 'insurance_pending'
          ? 'bg-amber-50 text-amber-700 ring-amber-200'
          : s === 'unpaid'
            ? 'bg-rose-50 text-rose-700 ring-rose-200'
            : 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${tone}`}
    >
      {s.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const normalized = str(value, 'P3').toUpperCase();
  const tier = normalized.startsWith('P1') ? 'P1' : normalized.startsWith('P2') ? 'P2' : 'P3';
  const config =
    tier === 'P1'
      ? { tone: 'bg-red-600 text-white', text: 'P1 Critical' }
      : tier === 'P2'
        ? { tone: 'bg-amber-500 text-white', text: 'P2 Urgent' }
        : { tone: 'bg-slate-200 text-slate-700', text: 'P3 Non-Urgent' };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${config.tone}`}>
      {config.text}
    </span>
  );
}

function Token({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#0F3E5D] px-2 py-0.5 text-xs font-bold tabular-nums text-white">
      {value}
    </span>
  );
}

function Stat({ label, value, accent = 'text-slate-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5">
      <p className={ui.label}>{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className={ui.cardTitle}>{title}</h3>
            {subtitle && <p className={`mt-0.5 ${ui.meta}`}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function EmptyRow({ span, message }: { span: number; message: string }) {
  return (
    <tr>
      <td colSpan={span} className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
        {message}
      </td>
    </tr>
  );
}

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option, index) => (
        <button
          key={option.id || `filter-${index}`}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            value === option.id
              ? 'bg-[#0F3E5D] text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[240px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className={`${ui.input} pl-9`}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Searchable doctor picker for walk-in registration {EM_DASH} auto-fills department and fee. */
function DoctorSearchSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (doctor: RegalDoctor) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return REGAL_DOCTORS;
    return REGAL_DOCTORS.filter((doctor) => {
      const haystack = `${doctor.id} ${doctor.name} ${doctor.department} ${doctor.room}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query]);

  const selected = REGAL_DOCTORS.find((doctor) => doctor.id === value) ?? DEFAULT_REGAL_DOCTOR;

  return (
    <div className="space-y-2">
      <input
        className={ui.input}
        placeholder={`Search by name, RH-DXX ID, department or room${ELLIPSIS}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <select
        className={ui.input}
        required
        value={value}
        onChange={(event) => {
          const doctor = REGAL_DOCTORS.find((item) => item.id === event.target.value);
          if (doctor) onChange(doctor);
        }}
      >
        {filtered.map((doctor, index) => (
          <option key={doctor.id || `doctor-${index}`} value={doctor.id}>
            {doctor.id} · {doctor.name} · {doctor.department} · {doctor.room} · {formatINR(doctor.fee)}
          </option>
        ))}
      </select>
      <p className="text-xs font-medium text-slate-500">
        Selected · {selected.id} · {selected.name} · {selected.department} · {formatINR(selected.fee)} ·{' '}
        {selected.room}
      </p>
    </div>
  );
}

/* â”€â”€ Root container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function HospitalOperationsCenter() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [intent, setIntent] = useState<Intent>(null);
  const [emergencyQuickEntry, setEmergencyQuickEntry] = useState(false);
  const [live, setLive] = useState(false);

  const [appointments, setAppointments] = useState<Row[]>([]);
  const [patients, setPatients] = useState<Row[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [beds, setBeds] = useState<Row[]>(SEED_BEDS as Row[]);
  const [prescriptions, setPrescriptions] = useState<Row[]>(SEED_PRESCRIPTIONS as Row[]);
  const [triages, setTriages] = useState<Row[]>([]);
  const [bills, setBills] = useState<Row[]>([]);
  const [staff, setStaff] = useState<Row[]>(SEED_STAFF as Row[]);

  const load = useCallback(async () => {
    const [ap, pt, bd, rx, tr, billRows, st] = await Promise.all([
      loadHospitalAppointmentsLive(client()),
      loadPatientsLive(),
      safeSelect(TABLES.beds, SEED_BEDS as Row[]),
      safeSelect(TABLES.prescriptions, SEED_PRESCRIPTIONS as Row[]),
      loadEmergencyTriagesLive(client()),
      loadHospitalBillsLive(client()).then((rows) =>
        rows.map((row) => consultationBillToHospitalRow(row) as Row),
      ),
      safeSelect(TABLES.staff, SEED_STAFF as Row[]),
    ]);
    setAppointments(ap);
    setPatients(pt);
    setPatientsLoading(false);
    setBeds(bd);
    setPrescriptions(rx);
    setTriages(tr);
    setBills(billRows);
    setStaff(st.length >= REGAL_DOCTORS.length ? st : (SEED_STAFF as Row[]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    const supabase = client();
    const channel = supabase
      .channel('regal-hospital-operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_appointments' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opd_tokens' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_messages' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_triage' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_triages' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_invoices' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => void load())
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_events' },
        (message: { new?: Row | null }) => {
          const event = (message.new ?? {}) as Row;
          const eventType = str(event.event_type);
          const payload = (event.payload ?? {}) as Row;

          if (str(event.severity) === 'critical') {
            if (eventType === 'EMERGENCY_BYPASS_TRIGGERED') {
              toast.message('Doctor bypass broadcast', {
                description: str(payload.message, 'Emergency bypass alert sent to on-duty doctors'),
                duration: 6000,
                className: 'border-amber-300 bg-amber-50 text-amber-900',
              });
            } else {
              toast.error(str(payload.message, 'Critical ecosystem alert received'), { duration: 6000 });
            }
          }
          void load();
        },
      )
      .subscribe((state: string) => {
        if (alive) setLive(state === 'SUBSCRIBED');
      });

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const go = useCallback((next: TabId, nextIntent: Intent = null) => {
    setActiveTab(next);
    setIntent(nextIntent);
  }, []);

  const clearIntent = useCallback(() => setIntent(null), []);

  const heading = HEADINGS[activeTab];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col justify-between bg-[#0F3E5D] text-white select-none">
        <div>
          <div className="px-4 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: TEAL_LIGHT }}>
              Hospital App
            </p>
            <h1 className="mt-1 text-base font-black leading-tight text-white">{REGAL_FACILITY.name}</h1>
            <p className="text-xs font-medium text-white/50">{REGAL_FACILITY.code}</p>
          </div>

          <nav className="space-y-0.5 px-2">
            {NAV.map((item, index) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id || `nav-${index}`}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    active
                      ? 'text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  style={active ? { background: NAVY_ACTIVE } : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: active ? TEAL_LIGHT : undefined }} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-4 text-xs font-semibold" style={{ background: NAVY_DEEP }}>
          <span className="flex items-center gap-2 text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ background: live ? TEAL : '#FBBF24' }} />
            {live ? 'Realtime sync active' : 'Cached snapshot'}
          </span>
          <p className="mt-1 text-white/35">{REGAL_FACILITY.node}</p>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">{heading.title}</h2>
            <p className={`mt-0.5 ${ui.meta}`}>{heading.sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmergencyQuickEntry(true);
                if (activeTab !== 'emergency') {
                  setIntent('bypass');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Emergency Quick-Entry
            </button>
            <span className="rounded-full bg-[#00A896]/10 px-3 py-1 text-xs font-bold text-[#00806f]">
              {DEFAULT_REGAL_DOCTOR.name} {MDOT} {DEFAULT_REGAL_DOCTOR.id}
            </span>
          </div>
        </header>

        <div className="flex-1 space-y-5 p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab appointments={appointments} beds={beds} triages={triages} onGo={go} />
          )}
          {activeTab === 'opd' && (
            <OpdTab
              appointments={appointments}
              setAppointments={setAppointments}
              setPatients={setPatients}
              autoOpen={intent === 'walk-in'}
              onIntentHandled={clearIntent}
            />
          )}
          {activeTab === 'patients' && (
            <PatientsTab
              patients={patients}
              setPatients={setPatients}
              loading={patientsLoading}
            />
          )}
          {activeTab === 'ipd' && (
            <IpdTab
              beds={beds}
              setBeds={setBeds}
              autoOpen={intent === 'admit'}
              onIntentHandled={clearIntent}
            />
          )}
          {activeTab === 'records' && (
            <RecordsTab prescriptions={prescriptions} setPrescriptions={setPrescriptions} />
          )}
          {activeTab === 'emergency' && (
            <EmergencyTriageDesk
              supabase={client()}
              facilityCode={REGAL_FACILITY.code}
              hospitalId={REGAL_HOSPITAL_ID}
              isOpenModalExternally={emergencyQuickEntry || intent === 'bypass'}
              onCloseExternalModal={() => {
                setEmergencyQuickEntry(false);
                clearIntent();
              }}
            />
          )}
          {activeTab !== 'emergency' && emergencyQuickEntry && (
            <EmergencyTriageDesk
              supabase={client()}
              facilityCode={REGAL_FACILITY.code}
              hospitalId={REGAL_HOSPITAL_ID}
              modalOnly
              isOpenModalExternally={emergencyQuickEntry}
              onCloseExternalModal={() => {
                setEmergencyQuickEntry(false);
                clearIntent();
              }}
            />
          )}
          {activeTab === 'billing' && <BillingTab bills={bills} setBills={setBills} />}
          {activeTab === 'supply' && (
            <SupplyChainWorkspace
              supabase={client()}
              facilityCode={REGAL_FACILITY.code}
              autoOpenPurchaseOrder={intent === 'purchase-order'}
              onIntentHandled={clearIntent}
            />
          )}
          {activeTab === 'staff' && <StaffTab staff={staff} setStaff={setStaff} />}
          {activeTab === 'messages' && <MessagesTab patients={patients} />}
        </div>
      </main>
    </div>
  );
}

/* â”€â”€ 1 {MDOT} Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function DashboardTab({
  appointments,
  beds,
  triages,
  onGo,
}: {
  appointments: Row[];
  beds: Row[];
  triages: Row[];
  onGo: (tab: TabId, intent?: Intent) => void;
}) {
  const counts = useMemo(() => {
    let waiting = 0;
    let consulting = 0;
    let completed = 0;
    for (const row of appointments) {
      const s = statusOf(row);
      if (s === 'booked' || s === 'checked_in') waiting += 1;
      else if (s === 'in_consultation') consulting += 1;
      else if (s === 'completed') completed += 1;
    }
    return { waiting, consulting, completed };
  }, [appointments]);

  const occupied = beds.filter((bed) => Boolean(bed.is_occupied) || normalize(bed.status) === 'occupied').length;
  const criticalCases = triages.filter((row) =>
    str(row.priority_tier ?? row.priority, 'P3').toUpperCase().startsWith('P1'),
  ).length;

  const kpis = [
    { label: 'Patients Today', value: appointments.length, tab: 'opd' as TabId, accent: 'text-slate-900' },
    { label: 'Waiting Queue', value: counts.waiting, tab: 'opd' as TabId, accent: 'text-amber-600' },
    { label: 'In Consultation', value: counts.consulting, tab: 'opd' as TabId, accent: 'text-sky-700' },
    { label: 'Completed Today', value: counts.completed, tab: 'records' as TabId, accent: 'text-emerald-600' },
  ];

  const actions: { label: string; tab: TabId; intent: Intent; style: string }[] = [
    { label: 'Register Walk-in Patient', tab: 'opd', intent: 'walk-in', style: ui.btnTeal },
    { label: 'Open SmartQ OPD', tab: 'opd', intent: null, style: ui.btnNavy },
    { label: 'Check Prescriptions', tab: 'records', intent: null, style: ui.pill },
    { label: 'Review Low Stock', tab: 'supply', intent: null, style: ui.pill },
    { label: 'Admit Patient', tab: 'ipd', intent: 'admit', style: ui.pill },
    { label: 'Ecosystem Message', tab: 'messages', intent: null, style: ui.pill },
  ];

  const snapshot = appointments.filter((row) => statusOf(row) !== 'completed').slice(0, 6);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <button
            key={kpi.label || `kpi-${index}`}
            type="button"
            onClick={() => onGo(kpi.tab)}
            className={`${ui.card} p-4 text-left transition hover:border-[#00A896]`}
          >
            <p className={ui.label}>{kpi.label}</p>
            <p className={`${ui.metric} ${kpi.accent}`}>{kpi.value}</p>
          </button>
        ))}
      </div>

      <Panel
        title="Quick Actions"
        subtitle={`${occupied} beds occupied ${MDOT} ${criticalCases} P1 case${criticalCases === 1 ? '' : 's'} on the floor`}
      >
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <button
              key={action.label || `action-${index}`}
              type="button"
              className={action.style}
              onClick={() => onGo(action.tab, action.intent)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Live OPD Queue Snapshot"
        subtitle="Synced from Patient App bookings and walk-in registrations"
        action={
          <button type="button" className={ui.btnGhost} onClick={() => onGo('opd')}>
            Open reception desk
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={ui.th}>Token</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Consulting Doctor</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.map((row, index) => (
                <tr key={rowKey(row, index)} className={ui.tr}>
                  <td className={ui.td}>
                    <Token value={str(row.token_number, EMPTY_VALUE)} />
                  </td>
                  <td className={ui.td}>
                    <p className="font-semibold text-slate-900">{str(row.patient_name, 'Patient')}</p>
                    <p className="text-xs text-slate-400">{str(row.uhid, EMPTY_VALUE)}</p>
                  </td>
                  <td className={ui.td}>{str(row.doctor_name, DEFAULT_CONSULTANT)}</td>
                  <td className={ui.td}>{str(row.department, 'General Medicine')}</td>
                  <td className={ui.td}>
                    <StatusBadge value={statusOf(row)} />
                  </td>
                </tr>
              ))}
              {snapshot.length === 0 && <EmptyRow span={5} message="Queue is clear for now" />}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* â”€â”€ 2 {MDOT} SmartQ OPD & Reception â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function OpdTab({
  appointments,
  setAppointments,
  setPatients,
  autoOpen,
  onIntentHandled,
}: {
  appointments: Row[];
  setAppointments: React.Dispatch<React.SetStateAction<Row[]>>;
  setPatients: React.Dispatch<React.SetStateAction<Row[]>>;
  autoOpen: boolean;
  onIntentHandled: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [form, setForm] = useState({
    patient_name: '',
    doctor_id: DEFAULT_REGAL_DOCTOR.id,
    doctor_name: DEFAULT_REGAL_DOCTOR.name,
    department: DEFAULT_REGAL_DOCTOR.department,
    fee: String(DEFAULT_REGAL_DOCTOR.fee),
    chief_complaint: '',
  });

  useEffect(() => {
    if (autoOpen) {
      setWalkInOpen(true);
      onIntentHandled();
    }
  }, [autoOpen, onIntentHandled]);

  const rows = appointments.filter((row) => {
    const matchesStatus = filter === 'all' || statusOf(row) === filter;
    const haystack = `${str(row.patient_name)} ${str(row.token_number)} ${str(row.doctor_name)} ${str(row.uhid)}`;
    return matchesStatus && haystack.toLowerCase().includes(query.toLowerCase());
  });

  const advance = async (row: Row, next: 'checked_in' | 'in_consultation' | 'completed') => {
    const id = str(row.id || row.appointment_id);
    setAppointments((current) =>
      current.map((item) => (str(item.id || item.appointment_id) === id ? { ...item, status: next } : item)),
    );

    const result = await transitionHospitalAppointment(client(), id, next, {
      doctorEmployeeId: str(row.doctor_id),
      token_number: str(row.token_number),
    });
    if (!result.ok) {
      toast.error(result.error ?? 'Failed to update appointment in database');
      void loadHospitalAppointmentsLive(client()).then(setAppointments);
      return;
    }

    if (next === 'checked_in') {
      await emitEvent(
        'PATIENT_CHECKED_IN',
        `${str(row.patient_name, 'Patient')} checked in on token ${str(row.token_number, EMPTY_VALUE)}`,
        'info',
        {
          appointment_id: id,
          doctor_id: str(row.doctor_id),
          doctor_name: str(row.doctor_name, DEFAULT_CONSULTANT),
          department: str(row.department),
          token_number: str(row.token_number),
        },
        ['doctor', 'hospital'],
      );
      toast.success(`Checked in ${MDOT} patient moved to the Doctor App queue`);
      return;
    }
    toast.success(next === 'completed' ? 'Consultation closed' : 'Patient sent in for consultation');
  };

  const issueWalkIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.patient_name.trim()) {
      toast.error('Enter the patient name to issue a token');
      return;
    }
    if (!form.chief_complaint.trim()) {
      toast.error('Describe the reason for visit / chief complaint');
      return;
    }

    const result = await registerWalkInAppointment(
      client(),
      {
        patient_name: form.patient_name.trim(),
        doctor_id: form.doctor_id,
        doctor_name: form.doctor_name,
        department: form.department,
        chief_complaint: form.chief_complaint.trim(),
        fee: num(form.fee, 800),
      },
      appointments,
    );

    if (!result.ok || !result.row) {
      toast.error(result.error ?? 'Failed to register walk-in {EM_DASH} check Supabase connection');
      return;
    }

    const appointmentRow = result.row as Row;
    const token = str(appointmentRow.token_number);
    const uhid = str(appointmentRow.uhid);

    const patientRow: Row = {
      id: str(result.patientId),
      uhid,
      full_name: form.patient_name.trim(),
      name: form.patient_name.trim(),
      doctor_id: form.doctor_id,
      doctor_name: form.doctor_name,
      department: form.department,
      chief_complaint: form.chief_complaint.trim(),
      status: 'checked_in',
      ehr_status: 'Active',
      admission_status: 'OPD',
      last_visit: today(),
      created_at: new Date().toISOString(),
    };

    setPatients((current) => [patientRow, ...current]);
    setAppointments((current) => [appointmentRow, ...current]);
    await emitEvent(
      'PATIENT_CHECKED_IN',
      `Walk-in ${str(patientRow.full_name)} ${MDOT} token ${token} ${MDOT} ${str(appointmentRow.doctor_name)}`,
      'info',
      {
        appointment_id: str(result.appointmentId),
        token_number: token,
        doctor_id: form.doctor_id,
        doctor_uuid: str(result.doctorUuid),
        doctor_name: str(appointmentRow.doctor_name),
        department: str(appointmentRow.department),
        patient_name: str(appointmentRow.patient_name),
        uhid,
        chief_complaint: str(appointmentRow.chief_complaint),
        appointment_date: str(appointmentRow.appointment_date),
      },
      ['doctor', 'hospital'],
    );

    toast.success(`Token ${token} issued ${MDOT} ${str(appointmentRow.doctor_name)} live queue updated`);
    setForm({
      patient_name: '',
      doctor_id: DEFAULT_REGAL_DOCTOR.id,
      doctor_name: DEFAULT_REGAL_DOCTOR.name,
      department: DEFAULT_REGAL_DOCTOR.department,
      fee: String(DEFAULT_REGAL_DOCTOR.fee),
      chief_complaint: '',
    });
    setWalkInOpen(false);
  };

  return (
    <>
      <Panel
        title="Reception Desk"
        subtitle={`${rows.length} of ${appointments.length} appointments shown`}
        action={
          <button type="button" className={ui.btnTeal} onClick={() => setWalkInOpen(true)}>
            Register Walk-in Patient
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search token, patient, UHID or doctor" />
          <FilterChips options={OPD_FILTERS} value={filter} onChange={setFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className={ui.th}>Token</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Assigned Doctor</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Fee</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const s = statusOf(row);
                return (
                  <tr key={rowKey(row, index)} className={ui.tr}>
                    <td className={ui.td}>
                      <Token value={str(row.token_number, EMPTY_VALUE)} />
                    </td>
                    <td className={ui.td}>
                      <p className="font-semibold text-slate-900">{str(row.patient_name, 'Patient')}</p>
                      <p className="text-xs text-slate-400">{str(row.uhid, EMPTY_VALUE)}</p>
                    </td>
                    <td className={ui.td}>{str(row.doctor_name, DEFAULT_CONSULTANT)}</td>
                    <td className={ui.td}>{str(row.department, 'General Medicine')}</td>
                    <td className={`${ui.td} tabular-nums`}>{formatINR(num(row.consultation_fee ?? row.fee, 800))}</td>
                    <td className={ui.td}>
                      <StatusBadge value={s} />
                    </td>
                    <td className={`${ui.td} text-right`}>
                      {s === 'booked' && (
                        <button type="button" className={ui.btnTeal} onClick={() => void advance(row, 'checked_in')}>
                          Check-In
                        </button>
                      )}
                      {s === 'checked_in' && (
                        <button
                          type="button"
                          className={ui.btnNavy}
                          onClick={() => void advance(row, 'in_consultation')}
                        >
                          Send to Doctor
                        </button>
                      )}
                      {s === 'in_consultation' && (
                        <button type="button" className={ui.btnGhost} onClick={() => void advance(row, 'completed')}>
                          Close Visit
                        </button>
                      )}
                      {s === 'completed' && <span className="text-xs font-semibold text-emerald-600">Settled</span>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <EmptyRow span={7} message="No appointments match this filter" />}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={walkInOpen}
        title="Register Walk-in Patient"
        subtitle="Tokens generate automatically in the T-0X series"
        onClose={() => setWalkInOpen(false)}
      >
        <form className="space-y-3" onSubmit={issueWalkIn}>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Next token {MDOT} <span className="font-black text-[#0F3E5D]">{nextWalkInToken(appointments)}</span>
          </div>
          <Field label="Patient name">
            <input
              className={ui.input}
              required
              value={form.patient_name}
              onChange={(event) => setForm({ ...form, patient_name: event.target.value })}
            />
          </Field>
          <Field label="Assigned doctor (41-clinician directory)">
            <DoctorSearchSelect
              value={form.doctor_id}
              onChange={(doctor) =>
                setForm({
                  ...form,
                  doctor_id: doctor.id,
                  doctor_name: doctor.name,
                  department: doctor.department,
                  fee: String(doctor.fee),
                })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Doctor ID">
              <input className={ui.input} readOnly value={form.doctor_id} />
            </Field>
            <Field label="Department">
              <input className={ui.input} readOnly value={form.department} />
            </Field>
            <Field label="Consultation fee (INR)">
              <input className={ui.input} readOnly type="number" value={form.fee} />
            </Field>
          </div>
          <Field label="Reason for visit / Chief complaint">
            <textarea
              className={`${ui.input} min-h-[96px]`}
              required
              placeholder={`Describe symptoms, referral reason, or presenting complaint${ELLIPSIS}`}
              value={form.chief_complaint}
              onChange={(event) => setForm({ ...form, chief_complaint: event.target.value })}
            />
          </Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Appointment date {MDOT} <span className="font-black text-[#0F3E5D]">{today()}</span> {MDOT} writes to{' '}
            <span className="font-black text-[#00806f]">patients</span> +{' '}
            <span className="font-black text-[#00806f]">appointments</span> {MDOT} status{' '}
            <span className="font-black text-[#00806f]">checked_in</span>
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={ui.btnGhost} onClick={() => setWalkInOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={ui.btnTeal}>
              Generate Token &amp; Check In
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* â”€â”€ 3 {MDOT} Patient Directory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function PatientsTab({
  patients,
  setPatients,
  loading,
}: {
  patients: Row[];
  setPatients: React.Dispatch<React.SetStateAction<Row[]>>;
  loading: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    gender: 'Female',
    phone: '',
    blood_group: 'O+',
  });

  const rows = patients.filter((row) => {
    const haystack = `${str(row.full_name ?? row.name)} ${str(row.phone)} ${str(row.uhid)}`;
    return haystack.toLowerCase().includes(query.toLowerCase());
  });

  const register = async (event: FormEvent) => {
    event.preventDefault();
    const uhid = newUhid();
    const row: Row = {
      id: `pt-${Date.now()}`,
      uhid,
      full_name: form.full_name.trim(),
      age: num(form.age),
      gender: form.gender,
      phone: form.phone.trim(),
      blood_group: form.blood_group,
      ehr_status: 'Active',
      status: 'registered',
      last_visit: today(),
      created_at: new Date().toISOString(),
    };

    setPatients((current) => [row, ...current]);
    await tryInsert(TABLES.patients, row);
    await emitEvent('PATIENT_REGISTERED', `${str(row.full_name)} registered as ${uhid}`);

    toast.success(`Registered ${MDOT} ${uhid}`);
    setForm({ full_name: '', age: '', gender: 'Female', phone: '', blood_group: 'O+' });
    setOpen(false);
  };

  return (
    <>
      <Panel
        title="Universal Health ID Registry"
        subtitle={
          loading
            ? `Loading live patient records from Supabase${ELLIPSIS}`
            : `${rows.length} of ${patients.length} registered patient${patients.length === 1 ? '' : 's'}`
        }
        action={
          <button type="button" className={ui.btnTeal} onClick={() => setOpen(true)}>
            {patients.length === 0 ? 'Register First Patient' : 'Register Patient'}
          </button>
        }
      >
        {loading ? (
          <p className="py-10 text-center text-sm font-medium text-slate-500">{`Fetching patient registry${ELLIPSIS}`}</p>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-900">No patients registered yet</p>
            <p className={`mt-1 max-w-md ${ui.meta}`}>
              The directory shows only live Supabase records {EM_DASH} no demo patients are injected. Register
              the first patient or check in a walk-in from SmartQ OPD.
            </p>
            <button type="button" className={`${ui.btnTeal} mt-4`} onClick={() => setOpen(true)}>
              Register First Patient
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by name, phone or UHID (RH-2026-XXXXXX)"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr>
                    <th className={ui.th}>UHID</th>
                    <th className={ui.th}>Name</th>
                    <th className={ui.th}>Contact</th>
                    <th className={ui.th}>Gender</th>
                    <th className={ui.th}>Blood Group</th>
                    <th className={ui.th}>EHR</th>
                    <th className={ui.th}>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={rowKey(row, index)} className={ui.tr}>
                      <td className={`${ui.td} font-semibold tabular-nums text-[#0F3E5D]`}>
                        {str(row.uhid, EMPTY_VALUE)}
                      </td>
                      <td className={ui.td}>
                        <p className="font-semibold text-slate-900">
                          {str(row.full_name ?? row.name, 'Patient')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {str(row.age, EMPTY_VALUE)} yrs {MDOT} {str(row.doctor ?? row.doctor_name, EMPTY_VALUE)}
                        </p>
                      </td>
                      <td className={`${ui.td} tabular-nums`}>{str(row.phone, EMPTY_VALUE)}</td>
                      <td className={ui.td}>{str(row.gender, EMPTY_VALUE)}</td>
                      <td className={ui.td}>
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {str(row.blood_group, EMPTY_VALUE)}
                        </span>
                      </td>
                      <td className={ui.td}>
                        <StatusBadge value={str(row.ehr_status ?? row.status ?? row.admission_status, 'active')} />
                      </td>
                      <td className={`${ui.td} tabular-nums text-slate-500`}>
                        {str(row.last_visit ?? row.created_at, EMPTY_VALUE).slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <EmptyRow span={7} message="No patients matched this search" />
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      <Modal
        open={open}
        title="Register Patient"
        subtitle="A Universal Health ID is allocated automatically"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-3" onSubmit={register}>
          <Field label="Full name">
            <input
              className={ui.input}
              required
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Age">
              <input
                className={ui.input}
                type="number"
                min="0"
                value={form.age}
                onChange={(event) => setForm({ ...form, age: event.target.value })}
              />
            </Field>
            <Field label="Gender">
              <select
                className={ui.input}
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                {['Female', 'Male', 'Other'].map((option, index) => (
                  <option key={option || `gender-${index}`}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Blood group">
              <select
                className={ui.input}
                value={form.blood_group}
                onChange={(event) => setForm({ ...form, blood_group: event.target.value })}
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((option, index) => (
                  <option key={option || `blood-${index}`}>{option}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Mobile number">
            <input
              className={ui.input}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={ui.btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={ui.btnTeal}>
              Save Patient
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* â”€â”€ 4 {MDOT} IPD & Bed Census â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function bedState(bed: Row): 'occupied' | 'cleaning' | 'available' {
  const raw = normalize(bed.status);
  if (raw === 'cleaning' || raw === 'sanitizing') return 'cleaning';
  if (Boolean(bed.is_occupied) || raw === 'occupied') return 'occupied';
  return 'available';
}

function IpdTab({
  beds,
  setBeds,
  autoOpen,
  onIntentHandled,
}: {
  beds: Row[];
  setBeds: React.Dispatch<React.SetStateAction<Row[]>>;
  autoOpen: boolean;
  onIntentHandled: () => void;
}) {
  const wards = useMemo(() => {
    const unique: string[] = [];
    for (const bed of beds) {
      const ward = str(bed.ward, 'General Ward');
      if (!unique.includes(ward)) unique.push(ward);
    }
    return unique;
  }, [beds]);

  const [ward, setWard] = useState(wards[0] ?? 'ICU');
  const [admitOpen, setAdmitOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<Row | null>(null);
  const [form, setForm] = useState({ patient_name: '', bed_id: '', doctor_name: DEFAULT_CONSULTANT });

  useEffect(() => {
    if (wards.length > 0 && !wards.includes(ward)) setWard(wards[0]);
  }, [wards, ward]);

  useEffect(() => {
    if (autoOpen) {
      setAdmitOpen(true);
      onIntentHandled();
    }
  }, [autoOpen, onIntentHandled]);

  const census = useMemo(
    () =>
      wards.map((name) => {
        const wardBeds = beds.filter((bed) => str(bed.ward, 'General Ward') === name);
        return {
          ward: name,
          total: wardBeds.length,
          occupied: wardBeds.filter((bed) => bedState(bed) === 'occupied').length,
          cleaning: wardBeds.filter((bed) => bedState(bed) === 'cleaning').length,
          available: wardBeds.filter((bed) => bedState(bed) === 'available').length,
        };
      }),
    [beds, wards],
  );

  const wardBeds = beds.filter((bed) => str(bed.ward, 'General Ward') === ward);
  const openBeds = beds.filter((bed) => bedState(bed) === 'available');

  const patchBed = async (id: string, patch: Row) => {
    setBeds((current) => current.map((bed) => (str(bed.id) === id ? { ...bed, ...patch } : bed)));
    await tryUpdate(TABLES.beds, id, { ...patch, updated_at: new Date().toISOString() });
  };

  const admit = async (event: FormEvent) => {
    event.preventDefault();
    const target = beds.find((bed) => str(bed.id) === form.bed_id);
    if (!form.patient_name.trim() || !target) {
      toast.error('Choose an available bed and enter the patient name');
      return;
    }

    await patchBed(str(target.id), {
      is_occupied: true,
      status: 'occupied',
      patient_name: form.patient_name.trim(),
      doctor_name: form.doctor_name || DEFAULT_CONSULTANT,
    });
    await emitEvent(
      'PATIENT_ADMITTED',
      `${form.patient_name.trim()} admitted to ${str(target.ward)} ${MDOT} bed ${str(target.bed_number)}`,
      'info',
      { bed_id: str(target.id), consultant: form.doctor_name },
    );

    toast.success(`Admitted to ${str(target.ward)} ${MDOT} bed ${str(target.bed_number)}`);
    setForm({ patient_name: '', bed_id: '', doctor_name: DEFAULT_CONSULTANT });
    setAdmitOpen(false);
  };

  const discharge = async (bed: Row) => {
    const name = str(bed.patient_name, 'Patient');
    await patchBed(str(bed.id), {
      is_occupied: false,
      status: 'cleaning',
      patient_name: null,
    });
    await emitEvent('PATIENT_DISCHARGED', `${name} discharged from ${str(bed.ward)} ${MDOT} bed sanitizing`);
    toast.success(`${name} discharged ${MDOT} bed marked for sanitizing`);
  };

  const transfer = async (event: FormEvent) => {
    event.preventDefault();
    const source = transferSource;
    const target = beds.find((bed) => str(bed.id) === form.bed_id);
    if (!source || !target) {
      toast.error('Choose a destination bed');
      return;
    }

    const name = str(source.patient_name, 'Patient');
    await patchBed(str(target.id), {
      is_occupied: true,
      status: 'occupied',
      patient_name: name,
      doctor_name: str(source.doctor_name, DEFAULT_CONSULTANT),
    });
    await patchBed(str(source.id), { is_occupied: false, status: 'cleaning', patient_name: null });
    await emitEvent(
      'PATIENT_TRANSFERRED',
      `${name} moved to ${str(target.ward)} ${MDOT} bed ${str(target.bed_number)}`,
    );

    toast.success(`${name} transferred to bed ${str(target.bed_number)}`);
    setTransferSource(null);
    setForm({ patient_name: '', bed_id: '', doctor_name: DEFAULT_CONSULTANT });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {census.map((entry, index) => (
          <div key={entry.ward || `ward-${index}`} className={`${ui.card} p-4`}>
            <p className={ui.label}>{entry.ward}</p>
            <p className={ui.metric}>
              {entry.occupied}
              <span className="text-sm font-bold text-slate-400"> / {entry.total}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {entry.available} available {MDOT} {entry.cleaning} sanitizing
            </p>
          </div>
        ))}
      </div>

      <Panel
        title="Bed Visualizer"
        subtitle={`${wardBeds.length} beds in ${ward}`}
        action={
          <button type="button" className={ui.btnTeal} onClick={() => setAdmitOpen(true)}>
            Admit Patient
          </button>
        }
      >
        <div className="mb-4">
          <FilterChips
            options={wards.map((name) => ({ id: name, label: name }))}
            value={ward}
            onChange={setWard}
          />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wardBeds.map((bed, index) => {
            const state = bedState(bed);
            const tone =
              state === 'occupied'
                ? 'border-[#0F3E5D] bg-[#0F3E5D] text-white'
                : state === 'cleaning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50/60 text-emerald-900';
            return (
              <div key={rowKey(bed, index)} className={`rounded-lg border p-3 ${tone}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tabular-nums">Bed {str(bed.bed_number, EMPTY_VALUE)}</span>
                  <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                    {state === 'cleaning' ? 'Sanitizing' : state}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold opacity-90">
                  {state === 'occupied' ? str(bed.patient_name, 'Patient') : 'Unassigned'}
                </p>
                {state === 'occupied' && (
                  <p className="truncate text-xs opacity-60">{str(bed.doctor_name, DEFAULT_CONSULTANT)}</p>
                )}
                <div className="mt-2.5 flex gap-1.5">
                  {state === 'occupied' && (
                    <>
                      <button
                        type="button"
                        className="rounded-md bg-white/15 px-2 py-1 text-xs font-bold text-white hover:bg-white/25"
                        onClick={() => {
                          setTransferSource(bed);
                          setForm({ patient_name: str(bed.patient_name), bed_id: '', doctor_name: str(bed.doctor_name, DEFAULT_CONSULTANT) });
                        }}
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#0F3E5D] hover:bg-slate-100"
                        onClick={() => void discharge(bed)}
                      >
                        Discharge
                      </button>
                    </>
                  )}
                  {state === 'available' && (
                    <button
                      type="button"
                      className="rounded-md bg-white px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                      onClick={() => {
                        setForm({ patient_name: '', bed_id: str(bed.id), doctor_name: DEFAULT_CONSULTANT });
                        setAdmitOpen(true);
                      }}
                    >
                      Admit here
                    </button>
                  )}
                  {state === 'cleaning' && (
                    <button
                      type="button"
                      className="rounded-md bg-white px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50"
                      onClick={() => void patchBed(str(bed.id), { status: 'available', is_occupied: false })}
                    >
                      Mark ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {wardBeds.length === 0 && (
            <p className="col-span-full py-8 text-center text-xs font-semibold text-slate-400">
              No beds configured for this ward
            </p>
          )}
        </div>
      </Panel>

      <Modal
        open={admitOpen}
        title="Admit Patient"
        subtitle="Assign an open bed and the primary consultant"
        onClose={() => setAdmitOpen(false)}
      >
        <form className="space-y-3" onSubmit={admit}>
          <Field label="Patient name">
            <input
              className={ui.input}
              required
              value={form.patient_name}
              onChange={(event) => setForm({ ...form, patient_name: event.target.value })}
            />
          </Field>
          <Field label={`Available bed (${openBeds.length} open)`}>
            <select
              className={ui.input}
              required
              value={form.bed_id}
              onChange={(event) => setForm({ ...form, bed_id: event.target.value })}
            >
              <option value="">Select a bed</option>
              {openBeds.map((bed, index) => (
                <option key={rowKey(bed, index)} value={str(bed.id)}>
                  {str(bed.ward)} {MDOT} Bed {str(bed.bed_number)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primary consultant">
            <input
              className={ui.input}
              value={form.doctor_name}
              onChange={(event) => setForm({ ...form, doctor_name: event.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={ui.btnGhost} onClick={() => setAdmitOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={ui.btnTeal}>
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(transferSource)}
        title="Transfer Patient"
        subtitle={`Moving ${str(transferSource?.patient_name, 'patient')} from bed ${str(transferSource?.bed_number, EMPTY_VALUE)}`}
        onClose={() => setTransferSource(null)}
      >
        <form className="space-y-3" onSubmit={transfer}>
          <Field label={`Destination bed (${openBeds.length} open)`}>
            <select
              className={ui.input}
              required
              value={form.bed_id}
              onChange={(event) => setForm({ ...form, bed_id: event.target.value })}
            >
              <option value="">Select a bed</option>
              {openBeds.map((bed, index) => (
                <option key={rowKey(bed, index)} value={str(bed.id)}>
                  {str(bed.ward)} {MDOT} Bed {str(bed.bed_number)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={ui.btnGhost} onClick={() => setTransferSource(null)}>
              Cancel
            </button>
            <button type="submit" className={ui.btnNavy}>
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* â”€â”€ 5 {MDOT} Records & Central Pharmacy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function RecordsTab({
  prescriptions,
  setPrescriptions,
}: {
  prescriptions: Row[];
  setPrescriptions: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  const pending = prescriptions.filter((row) => !row.is_dispensed && statusOf(row) !== 'dispensed');

  const dispense = async (rx: Row) => {
    const id = str(rx.id);
    setPrescriptions((current) =>
      current.map((item) =>
        str(item.id) === id ? { ...item, is_dispensed: true, status: 'dispensed' } : item,
      ),
    );
    await tryUpdate(TABLES.prescriptions, id, {
      is_dispensed: true,
      status: 'dispensed',
      dispensed_at: new Date().toISOString(),
    });

    const meds = Array.isArray(rx.medications) ? (rx.medications as Row[]) : [];
    await emitEvent(
      'PRESCRIPTION_DISPENSED',
      `${meds.length} medicines dispensed to ${str(rx.patient_name, 'patient')}`,
      'info',
      { prescription_id: id, uhid: str(rx.uhid) },
    );
    toast.success(`Dispensed ${MDOT} stock deducted for ${meds.length} item${meds.length === 1 ? '' : 's'}`);
  };

  return (
    <Panel
      title="E-Prescription Fulfillment Deck"
      subtitle={`${pending.length} awaiting dispense ${MDOT} routed live from the Doctor App`}
    >
      <ul className="space-y-3">
        {prescriptions.map((rx, index) => {
          const meds = Array.isArray(rx.medications) ? (rx.medications as Row[]) : [];
          const done = Boolean(rx.is_dispensed) || statusOf(rx) === 'dispensed';
          return (
            <li key={rowKey(rx, index)} className="rounded-lg border border-slate-200 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{str(rx.patient_name, 'Patient')}</p>
                  <p className={ui.meta}>
                    {str(rx.uhid, EMPTY_VALUE)} {MDOT} prescribed by {str(rx.doctor_name, DEFAULT_CONSULTANT)}
                  </p>
                </div>
                {done ? (
                  <StatusBadge value="dispensed" />
                ) : (
                  <button type="button" className={ui.btnTeal} onClick={() => void dispense(rx)}>
                    Dispense Medicines
                  </button>
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {meds.map((med, medIndex) => (
                  <li
                    key={`${str(med.name, 'med')}-${medIndex}`}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    {str(med.name, 'Medicine')} {MDOT} {str(med.dosage, EMPTY_VALUE)} {MDOT} {str(med.frequency, '')}
                    {med.days ? ` ${MDOT} ${str(med.days)}d` : ''}
                  </li>
                ))}
                {meds.length === 0 && (
                  <li className="text-xs font-semibold text-slate-400">No itemised medication on this record</li>
                )}
              </ul>
            </li>
          );
        })}
        {prescriptions.length === 0 && (
          <li className="py-8 text-center text-xs font-semibold text-slate-400">
            No prescriptions in the queue
          </li>
        )}
      </ul>
    </Panel>
  );
}

/* â”€â”€ 8 {MDOT} Billing & Cashier Desk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function BillingTab({
  bills,
  setBills,
}: {
  bills: Row[];
  setBills: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Row | null>(null);
  const [form, setForm] = useState({ amount: '', mode: PAYMENT_MODES[0] as string, reference: '' });

  const totals = useMemo(() => {
    let billed = 0;
    let collected = 0;
    for (const bill of bills) {
      billed += num(bill.total_amount);
      collected += num(bill.paid_amount);
    }
    return { billed, collected, outstanding: billed - collected };
  }, [bills]);

  const openPayment = (bill: Row) => {
    const balance = num(bill.total_amount) - num(bill.paid_amount);
    setForm({ amount: String(Math.max(balance, 0)), mode: PAYMENT_MODES[0], reference: '' });
    setPayFor(bill);
  };

  const collect = async (event: FormEvent) => {
    event.preventDefault();
    if (!payFor) return;

    const id = str(payFor.id);
    const amount = num(form.amount);
    const paid = num(payFor.paid_amount) + amount;
    const total = num(payFor.total_amount);
    const status = paid >= total ? 'paid' : 'partial';

    const result = await collectConsultationBillPayment(client(), {
      billId: id,
      amount,
      paymentMode: form.mode,
      paymentReference: form.reference.trim() || undefined,
      patientId: str(payFor.patient_id),
      patientName: str(payFor.patient_name, 'Patient'),
      invoiceNumber: str(payFor.invoice_number),
    });

    if (!result.ok) {
      toast.error(result.error ?? 'Could not record payment');
      return;
    }

    if (result.bill) {
      const row = consultationBillToHospitalRow(result.bill) as Row;
      setBills((current) => current.map((bill) => (str(bill.id) === id ? row : bill)));
    } else {
      setBills((current) =>
        current.map((bill) =>
          str(bill.id) === id ? { ...bill, paid_amount: paid, status } : bill,
        ),
      );
    }

    toast.success(
      status === 'paid'
        ? `Invoice settled · ${formatINR(paid)} received`
        : `Part payment recorded · ${formatINR(total - paid)} outstanding`,
    );
    setPayFor(null);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${ui.card} p-4`}>
          <p className={ui.label}>Total Billed</p>
          <p className={ui.metric}>{formatINR(totals.billed)}</p>
        </div>
        <div className={`${ui.card} p-4`}>
          <p className={ui.label}>Collected</p>
          <p className={`${ui.metric} text-emerald-600`}>{formatINR(totals.collected)}</p>
        </div>
        <div className={`${ui.card} p-4`}>
          <p className={ui.label}>Outstanding</p>
          <p className={`${ui.metric} text-rose-600`}>{formatINR(totals.outstanding)}</p>
        </div>
      </div>

      <Panel
        title="Consolidated Billing Ledger"
        subtitle="Consultation, IPD bed charges, pharmacy and lab orders on one tax invoice"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr>
                <th className={ui.th}>Invoice</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Items</th>
                <th className={ui.th}>Total</th>
                <th className={ui.th}>Paid</th>
                <th className={ui.th}>Balance</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, index) => {
                const key = rowKey(bill, index);
                const lines = Array.isArray(bill.lines) ? (bill.lines as Row[]) : [];
                const total = num(bill.total_amount);
                const paid = num(bill.paid_amount);
                const balance = total - paid;
                const settled = normalize(bill.status) === 'paid' || balance <= 0;
                return (
                  <Fragment key={key}>
                    <tr className={ui.tr}>
                      <td className={`${ui.td} font-semibold tabular-nums text-[#0F3E5D]`}>
                        {str(bill.invoice_number, EMPTY_VALUE)}
                      </td>
                      <td className={ui.td}>
                        <p className="font-semibold text-slate-900">{str(bill.patient_name, 'Patient')}</p>
                        <p className="text-xs text-slate-400">{str(bill.patient_uhid ?? bill.uhid, EMPTY_VALUE)}</p>
                      </td>
                      <td className={ui.td}>
                        <button
                          type="button"
                          className="text-xs font-bold text-[#00806f] hover:underline"
                          onClick={() => setExpanded(expanded === key ? null : key)}
                        >
                          {lines.length} line item{lines.length === 1 ? '' : 's'}
                        </button>
                      </td>
                      <td className={`${ui.td} tabular-nums`}>{formatINR(total)}</td>
                      <td className={`${ui.td} tabular-nums text-emerald-700`}>{formatINR(paid)}</td>
                      <td className={`${ui.td} tabular-nums font-semibold text-rose-600`}>
                        {formatINR(Math.max(balance, 0))}
                      </td>
                      <td className={ui.td}>
                        <StatusBadge value={str(bill.status, 'unpaid')} />
                      </td>
                      <td className={`${ui.td} text-right`}>
                        {settled ? (
                          <span className="text-xs font-semibold text-emerald-600">Settled</span>
                        ) : (
                          <button type="button" className={ui.btnTeal} onClick={() => openPayment(bill)}>
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === key && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="px-4 py-3">
                          <ul className="space-y-1.5">
                            {lines.map((line, lineIndex) => (
                              <li
                                key={`${key}-line-${lineIndex}`}
                                className="flex items-center justify-between text-xs font-semibold text-slate-600"
                              >
                                <span>{str(line.item, 'Charge')}</span>
                                <span className="tabular-nums text-slate-900">{formatINR(num(line.amount))}</span>
                              </li>
                            ))}
                            {lines.length === 0 && (
                              <li className="text-xs font-semibold text-slate-400">
                                No itemised charges recorded
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {bills.length === 0 && <EmptyRow span={8} message="No invoices raised yet" />}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={Boolean(payFor)}
        title="Collect Payment"
        subtitle={`${str(payFor?.invoice_number, 'Invoice')} ${MDOT} ${str(payFor?.patient_name, 'patient')}`}
        onClose={() => setPayFor(null)}
      >
        <form className="space-y-3" onSubmit={collect}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Invoice total" value={formatINR(num(payFor?.total_amount))} />
            <Stat
              label="Balance due"
              value={formatINR(Math.max(num(payFor?.total_amount) - num(payFor?.paid_amount), 0))}
              accent="text-rose-600"
            />
          </div>
          <Field label="Amount received (INR)">
            <input
              className={ui.input}
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </Field>
          <Field label="Payment mode">
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map((mode, index) => (
                <button
                  key={mode || `mode-${index}`}
                  type="button"
                  onClick={() => setForm({ ...form, mode })}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    form.mode === mode
                      ? 'bg-[#00A896] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Reference / claim number">
            <input
              className={ui.input}
              placeholder="UTR, card last 4 digits or TPA claim ID"
              value={form.reference}
              onChange={(event) => setForm({ ...form, reference: event.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={ui.btnGhost} onClick={() => setPayFor(null)}>
              Cancel
            </button>
            <button type="submit" className={ui.btnTeal}>
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ── 10 · Doctors & Staff Directory ─────────────────────────────────────── */

function StaffTab({
  staff,
  setStaff,
}: {
  staff: Row[];
  setStaff: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  const [dutyMap, setDutyMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REGAL_DOCTORS.map((doctor) => [doctor.id, true])),
  );

  const doctorRows = useMemo<Row[]>(
    () =>
      REGAL_DOCTORS.map((doctor) => ({
        id: doctor.id,
        employee_id: doctor.id,
        display_name: doctor.name,
        full_name: doctor.name,
        role: 'Doctor',
        department: doctor.department,
        consultation_fee: doctor.fee,
        room_number: doctor.room,
        is_on_duty: dutyMap[doctor.id] ?? true,
      })),
    [dutyMap],
  );

  const adminStaff = useMemo(
    () => staff.filter((member) => str(member.role) !== 'Doctor'),
    [staff],
  );

  const departments = useMemo(() => {
    const unique: string[] = ['all'];
    for (const doctor of REGAL_DOCTORS) {
      if (!unique.includes(doctor.department)) unique.push(doctor.department);
    }
    for (const member of adminStaff) {
      const department = str(member.department, 'Administration');
      if (!unique.includes(department)) unique.push(department);
    }
    return unique;
  }, [adminStaff]);

  const [department, setDepartment] = useState('all');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Doctor'>('Doctor');

  const sourceRows = roleFilter === 'Doctor' ? doctorRows : [...doctorRows, ...adminStaff];

  const rows = sourceRows.filter((member) => {
    const matchesDepartment = department === 'all' || str(member.department, 'Administration') === department;
    const haystack = `${staffName(member)} ${str(member.role)} ${str(member.employee_id ?? member.id)} ${str(member.department)} ${str(member.room_number)}`;
    return matchesDepartment && haystack.toLowerCase().includes(query.toLowerCase());
  });

  const doctorsOnDuty = doctorRows.filter((member) => member.is_on_duty !== false).length;

  const onDuty = (member: Row) => member.is_on_duty !== false;

  const toggleDuty = async (member: Row) => {
    const doctorId = str(member.employee_id ?? member.id);
    if (REGAL_DOCTORS.some((doctor) => doctor.id === doctorId)) {
      const next = !(dutyMap[doctorId] ?? true);
      setDutyMap((current) => ({ ...current, [doctorId]: next }));
      toast.success(`${staffName(member)} marked ${next ? 'on duty' : 'off duty'}`);
      return;
    }

    const id = str(member.id);
    const next = !onDuty(member);
    setStaff((current) =>
      current.map((row) => (str(row.id) === id ? { ...row, is_on_duty: next } : row)),
    );
    await tryUpdate(TABLES.staff, id, { is_on_duty: next });
    toast.success(`${staffName(member)} marked ${next ? 'on duty' : 'off duty'}`);
  };

  return (
    <>
      <Panel
        title="Regal Hospital Doctor Directory"
        subtitle={`${REGAL_DOCTORS.length} official clinicians ${MDOT} ${doctorsOnDuty} on duty ${MDOT} ${rows.length} shown`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, ID, department or role" />
          <FilterChips
            options={[
              { id: 'Doctor', label: 'Doctors only' },
              { id: 'all', label: 'All staff' },
            ]}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as 'all' | 'Doctor')}
          />
          <FilterChips
            options={departments.map((name) => ({ id: name, label: name === 'all' ? 'All departments' : name }))}
            value={department}
            onChange={setDepartment}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr>
                <th className={ui.th}>Employee ID</th>
                <th className={ui.th}>Name</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Room</th>
                <th className={ui.th}>Consultation Fee</th>
                <th className={ui.th}>Role</th>
                <th className={`${ui.th} text-right`}>Duty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member, index) => (
                <tr key={rowKey(member, index)} className={ui.tr}>
                  <td className={`${ui.td} font-semibold tabular-nums text-slate-500`}>
                    {str(member.employee_id, EMPTY_VALUE)}
                  </td>
                  <td className={`${ui.td} font-semibold text-slate-900`}>{staffName(member)}</td>
                  <td className={ui.td}>{str(member.department, 'Administration')}</td>
                  <td className={ui.td}>{str(member.room_number, EMPTY_VALUE)}</td>
                  <td className={`${ui.td} tabular-nums font-semibold`}>
                    {member.consultation_fee != null ? formatINR(num(member.consultation_fee)) : '\u2014'}
                  </td>
                  <td className={ui.td}>
                    <span className="rounded-md bg-[#00A896]/10 px-2 py-0.5 text-xs font-bold text-[#00806f]">
                      {str(member.role, 'Staff')}
                    </span>
                  </td>
                  <td className={`${ui.td} text-right`}>
                    <button
                      type="button"
                      onClick={() => void toggleDuty(member)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        onDuty(member)
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {onDuty(member) ? 'On duty' : 'Off duty'}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow span={7} message="No staff matched this filter" />}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Role-Based Access Overview" subtitle="Module permissions granted per role">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {RBAC_MATRIX.map((entry, index) => (
            <div key={entry.role || `role-${index}`} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-900">{entry.role}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {entry.access.map((item, accessIndex) => (
                  <li
                    key={`${entry.role}-${accessIndex}`}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* â”€â”€ 11 {MDOT} Ecosystem Communications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function MessagesTab({ patients }: { patients: Row[] }) {
  const patientOptions = useMemo(
    () =>
      patients.map((patient, index) => ({
        uhid: str(patient.uhid, `UHID-${index + 1}`),
        name: str(patient.full_name ?? patient.name, 'Registered Patient'),
      })),
    [patients],
  );

  return (
    <>
      <EcosystemMessagesView doctors={REGAL_DOCTORS} patients={patientOptions} />
      <EcosystemNotificationCenter doctors={REGAL_DOCTORS} patients={patientOptions} />
    </>
  );
}
