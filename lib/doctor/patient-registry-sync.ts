import type { SupabaseClient } from '@supabase/supabase-js';

export type ClinicalPatient360 = {
  id: string;
  uhid: string;
  name: string;
  age: number | null;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string[];
  chronicTags: string[];
  totalVisits: number;
  lastVisit: string;
  appointments: Record<string, unknown>[];
  consultations: Record<string, unknown>[];
  prescriptions: Record<string, unknown>[];
};

type PatientAccumulator = ClinicalPatient360 & { _lastVisitTs: number };

function patientKey(name: string, patientId?: string | null): string {
  if (patientId) return `id:${patientId}`;
  return `name:${name.toLowerCase().trim()}`;
}

function formatUhid(patient: Record<string, unknown>, fallbackId: string): string {
  if (patient.uhid) return String(patient.uhid);
  const id = String(patient.id ?? fallbackId);
  return `REG-2026-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

function normalizeAllergies(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const items = raw.map(String).filter(Boolean);
    return items.length ? items : ['NKDA'];
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  }
  return ['NKDA'];
}

function normalizeChronicTags(raw: unknown, fallback?: string): string[] {
  const tags: string[] = [];
  if (Array.isArray(raw)) {
    tags.push(...raw.map(String).filter(Boolean));
  } else if (typeof raw === 'string' && raw.trim()) {
    tags.push(...raw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean));
  }
  if (fallback?.trim()) tags.push(fallback.trim());
  const unique = [...new Set(tags)];
  return unique.length ? unique : ['None'];
}

function parseVisitTimestamp(row: Record<string, unknown>): number {
  const raw =
    row.consultation_date ??
    row.appointment_date ??
    row.created_at ??
    row.updated_at ??
    row.issued_at;
  if (!raw) return 0;
  const ts = new Date(String(raw)).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function formatVisitDate(ts: number): string {
  if (!ts) return 'No prior visit';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts));
}

function calcAge(dob?: unknown): number | null {
  if (!dob) return null;
  const born = new Date(String(dob));
  if (Number.isNaN(born.getTime())) return null;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function ensurePatient(
  map: Map<string, PatientAccumulator>,
  key: string,
  seed: Partial<PatientAccumulator>,
): PatientAccumulator {
  const existing = map.get(key);
  if (existing) return existing;

  const row: PatientAccumulator = {
    id: String(seed.id ?? `pending-${Date.now()}`),
    uhid: seed.uhid ?? 'REG-2026-00000',
    name: seed.name ?? 'Patient',
    age: seed.age ?? null,
    gender: seed.gender ?? '—',
    phone: seed.phone ?? '',
    email: seed.email ?? '',
    bloodGroup: seed.bloodGroup ?? 'O+',
    allergies: seed.allergies ?? ['NKDA'],
    chronicTags: seed.chronicTags ?? ['None'],
    totalVisits: 0,
    lastVisit: 'No prior visit',
    appointments: [],
    consultations: [],
    prescriptions: [],
    _lastVisitTs: 0,
  };
  map.set(key, row);
  return row;
}

function bumpVisit(row: PatientAccumulator, visitRow: Record<string, unknown>): void {
  row.totalVisits += 1;
  const ts = parseVisitTimestamp(visitRow);
  if (ts >= row._lastVisitTs) {
    row._lastVisitTs = ts;
    row.lastVisit = formatVisitDate(ts);
  }
}

/** Aggregate patients, appointments, consultations, and prescriptions into Clinical 360° rows. */
export async function fetchPatientsDirectory(
  supabase: SupabaseClient,
): Promise<ClinicalPatient360[]> {
  const [patientsRes, profilesRes, appointmentsRes, consultsRes, rxRes] = await Promise.all([
    supabase.from('patients').select('*').order('created_at', { ascending: false }),
    supabase.from('patient_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').order('created_at', { ascending: false }),
    supabase.from('consultations').select('*').order('created_at', { ascending: false }),
    supabase.from('prescriptions').select('*').order('created_at', { ascending: false }),
  ]);

  const patientMap = new Map<string, PatientAccumulator>();

  const ingestPatientRow = (p: Record<string, unknown>) => {
    const name = String(p.full_name ?? p.name ?? '').trim();
    if (!name) return;
    const id = String(p.id ?? '');
    const key = patientKey(name, id);
    ensurePatient(patientMap, key, {
      id,
      uhid: formatUhid(p, id),
      name,
      age: p.age != null ? Number(p.age) : calcAge(p.date_of_birth ?? p.dob),
      gender: String(p.gender ?? '—'),
      phone: String(p.phone ?? p.mobile ?? ''),
      email: String(p.email ?? ''),
      bloodGroup: String(p.blood_group ?? p.bloodGroup ?? 'O+'),
      allergies: normalizeAllergies(p.allergies),
      chronicTags: normalizeChronicTags(p.chronic_conditions ?? p.chronic_conditions_list),
    });
  };

  for (const row of (patientsRes.data ?? []) as Record<string, unknown>[]) {
    ingestPatientRow(row);
  }

  if (!(patientsRes.data?.length)) {
    for (const row of (profilesRes.data ?? []) as Record<string, unknown>[]) {
      ingestPatientRow(row);
    }
  }

  for (const app of (appointmentsRes.data ?? []) as Record<string, unknown>[]) {
    const name = String(app.patient_name ?? app.full_name ?? 'Patient').trim();
    const pid = app.patient_id ? String(app.patient_id) : null;
    const key = patientKey(name, pid);
    const row = ensurePatient(patientMap, key, {
      id: pid ?? String(app.id ?? ''),
      uhid: formatUhid(app, String(app.patient_id ?? app.id ?? '0000')),
      name,
      age: app.age != null ? Number(app.age) : null,
      gender: String(app.gender ?? '—'),
      phone: String(app.phone ?? app.patient_phone ?? ''),
      bloodGroup: 'O+',
      allergies: ['NKDA'],
      chronicTags: normalizeChronicTags([], String(app.chief_complaint ?? app.reason ?? '')),
    });
    row.appointments.push(app);
    bumpVisit(row, app);
  }

  for (const consult of (consultsRes.data ?? []) as Record<string, unknown>[]) {
    const name = String(consult.patient_name ?? consult.full_name ?? 'Patient').trim();
    const pid = consult.patient_id ? String(consult.patient_id) : null;
    const key = patientKey(name, pid);
    const row = ensurePatient(patientMap, key, {
      id: pid ?? String(consult.id ?? ''),
      uhid: formatUhid(consult, String(consult.patient_id ?? consult.id ?? '0000')),
      name,
      chronicTags: normalizeChronicTags([], String(consult.diagnosis ?? consult.chief_complaint ?? '')),
    });
    row.consultations.push(consult);
    bumpVisit(row, consult);
  }

  for (const rx of (rxRes.data ?? []) as Record<string, unknown>[]) {
    const name = String(rx.patient_name ?? rx.full_name ?? 'Patient').trim();
    const pid = rx.patient_id ? String(rx.patient_id) : null;
    const key = patientKey(name, pid);
    const row = ensurePatient(patientMap, key, {
      id: pid ?? String(rx.id ?? ''),
      uhid: formatUhid(rx, String(rx.patient_id ?? rx.id ?? '0000')),
      name,
    });
    row.prescriptions.push(rx);
  }

  return Array.from(patientMap.values())
    .map(({ _lastVisitTs, ...patient }) => patient)
    .sort((a, b) => a.name.localeCompare(b.name));
}
