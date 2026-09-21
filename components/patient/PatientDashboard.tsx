'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { DashboardOverview, type DashboardPrescription, type DashboardVisit } from '@/components/patient/DashboardOverview';
import { BookAppointmentModal } from '@/components/patient/BookAppointmentModal';
import {
  subscribeConsultationBilling,
} from '@/lib/hospital/operations/consultation-billing-sync';
import {
  buildBillingSnapshotFromBills,
  loadPatientBillingSnapshot,
  type PatientBillingSnapshot,
} from '@/lib/patient/patient-billing-status';
import {
  buildPatientScopeOrFilter,
  readPatientAuthSession,
  rowMatchesPatientSession,
  type PatientAuthSession,
} from '@/lib/auth/patientAuth';
import { resolveActiveAuthUser } from '@/lib/auth/resolve-active-auth-user';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import {
  fetchPatientClinicalRecordByPhone,
  mapPatientsRowToClinicalRecord,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import { isDemoMode } from '@/lib/shared/demo-mode';
import { isTodayClinicAppointment } from '@/lib/hospital/smartq-wait';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { resolveEffectivePatientId } from '@/lib/patient/resolve-effective-patient-id';
import { usePatientProfileCompleteness } from '@/lib/patient/usePatientProfileCompleteness';
import { profileIncompleteBookingMessage } from '@/lib/utils/profileCompleteness';
import { supabase } from '@/lib/supabaseClient';

interface ActiveTokenRecord extends DashboardVisit {
  patient_id?: string;
  patient_name: string;
  hospital_name: string;
  fee?: string;
  created_at?: string;
}

function readCachedPatientAppointments(session: PatientAuthSession | null): ActiveTokenRecord[] {
  if (!session || !isDemoMode()) return [];
  const primary = readLocalJson<ActiveTokenRecord[]>(CACHE_KEYS.patientAppointments);
  const alt = readLocalJson<ActiveTokenRecord[]>(CACHE_KEYS.patientAppointmentsAlt);
  const rows = Array.isArray(primary) && primary.length > 0 ? primary : Array.isArray(alt) ? alt : [];
  return rows.filter((row) =>
    rowMatchesPatientSession(row as unknown as Record<string, unknown>, session),
  );
}

function parseTokenNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').trim();
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function mapAppointmentRow(row: Record<string, unknown>): ActiveTokenRecord {
  return {
    id: String(row.id ?? row.appointment_id ?? ''),
    patient_id: String(row.patient_id ?? row.uhid ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    doctor_name: String(row.doctor_name ?? 'Doctor'),
    department: String(row.department ?? 'OPD'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: String(row.appointment_date ?? row.created_at ?? ''),
    appointment_time: String(
      row.appointment_time ?? row.slot_time ?? row.time_slot ?? '',
    ),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? row.created_at ?? ''),
    token_number: parseTokenNumber(row.token_number),
    queue_status: String(row.queue_status ?? row.status ?? 'checked_in'),
    status: String(row.status ?? row.queue_status ?? 'CONFIRMED'),
    booking_for: row.booking_for ? String(row.booking_for) : undefined,
    fee: row.fee != null ? String(row.fee) : undefined,
    reason: row.chief_complaint ? String(row.chief_complaint) : row.reason ? String(row.reason) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function isTodayVisit(row: ActiveTokenRecord): boolean {
  return isTodayClinicAppointment({
    appointment_date: row.appointment_date,
    created_at: row.created_at,
  });
}

function isActiveQueueStatus(status: string): boolean {
  const normalized = status.trim().toUpperCase();
  return ['WAITING', 'SCHEDULED', 'CONFIRMED', 'PENDING', 'IN_CONSULTATION', 'CHECKED_IN'].includes(
    normalized,
  );
}

async function fetchScopedAppointments(
  table: 'appointments' | 'patient_appointments',
  scopeFilter: string,
  session: PatientAuthSession,
  linkedPatientIds: string[],
): Promise<ActiveTokenRecord[]> {
  const scoped = (data: Record<string, unknown>[] | null) =>
    (data ?? [])
      .filter((row) => rowMatchesPatientSession(row, session, linkedPatientIds))
      .map((row) => mapAppointmentRow(row));

  const withHospital = await supabase
    .from(table)
    .select('*')
    .or(scopeFilter)
    .or(`hospital_id.eq.${REGAL_HOSPITAL_CODE},hospital_code.eq.${REGAL_HOSPITAL_CODE}`)
    .order('created_at', { ascending: false })
    .limit(24);

  if (!withHospital.error && withHospital.data?.length) {
    return scoped(withHospital.data as Record<string, unknown>[]);
  }

  const fallback = await supabase
    .from(table)
    .select('*')
    .or(scopeFilter)
    .order('created_at', { ascending: false })
    .limit(24);

  if (fallback.error || !fallback.data?.length) return [];
  return scoped(fallback.data as Record<string, unknown>[]);
}

function mergeAppointmentRows(rows: ActiveTokenRecord[]): ActiveTokenRecord[] {
  const seen = new Set<string>();
  const merged: ActiveTokenRecord[] = [];
  for (const row of rows) {
    const key = row.id || `${row.appointment_date}-${row.slot_time}-${row.doctor_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

const EMPTY_VITALS: PatientClinicalRecord = {
  patient_id: '',
  full_name: '',
  phone: '',
  email: '',
  age: '',
  gender: '',
  blood_group: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  allergies: '',
  chronic_conditions: '',
  current_medications: '',
  height_cm: '',
  weight_kg: '',
  bmi: '',
  blood_pressure: '',
  heart_rate_bpm: '',
  spo2_percentage: '',
  temperature_f: '',
  hospital_id: REGAL_HOSPITAL_CODE,
};

export default function PatientDashboard() {
  const router = useRouter();

  const [currentPatient, setCurrentPatient] = useState<PatientAuthSession | null>(() =>
    typeof window === 'undefined' ? null : readPatientAuthSession(),
  );
  const [activeVisit, setActiveVisit] = useState<DashboardVisit | null>(null);
  const [activeVisitsCount, setActiveVisitsCount] = useState(0);
  const [patientName, setPatientName] = useState(() => readPatientAuthSession()?.name ?? '');
  const [patientId, setPatientId] = useState(() => readPatientAuthSession()?.patientId ?? '');
  const [authUserId, setAuthUserId] = useState('');
  const [bookingPatientId, setBookingPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [billingSnapshot, setBillingSnapshot] = useState<PatientBillingSnapshot>(() =>
    buildBillingSnapshotFromBills([]),
  );
  const [billsLoading, setBillsLoading] = useState(true);
  const [recentPrescriptions, setRecentPrescriptions] = useState<DashboardPrescription[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [vitals, setVitals] = useState<PatientClinicalRecord | null>(null);
  const [doctorsAvailable, setDoctorsAvailable] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const {
    loading: profileGateLoading,
    complete: profileComplete,
    missingFields: profileMissingFields,
  } = usePatientProfileCompleteness();

  const handleBookConsultation = useCallback(() => {
    if (!profileComplete) {
      toast.error(profileIncompleteBookingMessage(profileMissingFields));
      router.push('/patient/profile');
      return;
    }
    setIsBookingModalOpen(true);
  }, [profileComplete, profileMissingFields, router]);

  const fetchPrescriptions = useCallback(async (session: PatientAuthSession) => {
    const scopeFilter = buildPatientScopeOrFilter(session);
    if (!scopeFilter) {
      setRecentPrescriptions([]);
      setPrescriptionCount(0);
      return;
    }

    const { data, count } = await supabase
      .from('prescriptions')
      .select('id, doctor_name, diagnosis, created_at, patient_id, patient_name', { count: 'exact' })
      .or(scopeFilter)
      .order('created_at', { ascending: false })
      .limit(5);

    const scoped = (data ?? []).filter((entry: Record<string, unknown>) =>
      rowMatchesPatientSession(entry, session),
    );

    setPrescriptionCount(count ?? scoped.length);
    setRecentPrescriptions(
      scoped.slice(0, 3).map((row: Record<string, unknown>) => ({
        id: String(row.id ?? ''),
        doctor_name: String(row.doctor_name ?? 'Your doctor'),
        diagnosis: String(row.diagnosis ?? 'Digital prescription'),
        created_at: String(row.created_at ?? ''),
      })),
    );
  }, []);

  const fetchVitals = useCallback(async (session: PatientAuthSession) => {
    const phone = session.phone || readPatientPortalSession()?.phone || '';
    if (!phone) {
      setVitals(null);
      return;
    }

    try {
      const row = await fetchPatientClinicalRecordByPhone(supabase, phone);
      if (!row) {
        setVitals(null);
        return;
      }
      setVitals(
        mapPatientsRowToClinicalRecord(row, {
          ...EMPTY_VITALS,
          patient_id: session.patientId,
          full_name: session.name,
          phone,
          email: session.email ?? '',
        }),
      );
    } catch {
      setVitals(null);
    }
  }, []);

  const fetchDoctorsAvailable = useCallback(async () => {
    const { count } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', REGAL_HOSPITAL_CODE);

    setDoctorsAvailable(count ?? 0);
  }, []);

  const fetchBillingSnapshot = useCallback(async (pid: string, uhid?: string) => {
    setBillsLoading(true);
    try {
      const snapshot = await loadPatientBillingSnapshot(supabase, pid, uhid);
      setBillingSnapshot(snapshot);
    } finally {
      setBillsLoading(false);
    }
  }, []);

  const fetchActiveToken = useCallback(async () => {
    setLoading(true);
    let latestAppointment: ActiveTokenRecord | null = null;
    let todayCount = 0;

    const session = readPatientAuthSession();
    if (!session) {
      router.replace('/patient/login');
      setLoading(false);
      return;
    }

    setCurrentPatient(session);
    setPatientName(session.name);
    setPatientId(session.patientId);

    const resolvedPatient = await resolveEffectivePatientId(supabase, {
      phone: session.phone,
      sessionPatientId: session.patientId,
    });

    const linkedPatientIds = resolvedPatient.linkedPatientIds;
    const scopeFilter = buildPatientScopeOrFilter(session, linkedPatientIds);
    if (!scopeFilter) {
      setActiveVisit(null);
      setActiveVisitsCount(0);
      setLoading(false);
      return;
    }

    const cachedMatches = readCachedPatientAppointments(session);
    if (cachedMatches.length > 0) {
      todayCount = cachedMatches.filter(isTodayVisit).length;
      latestAppointment = cachedMatches.find(isTodayVisit) ?? cachedMatches[0] ?? null;
    }

    try {
      const [appointmentRows, ledgerRows] = await Promise.all([
        fetchScopedAppointments('appointments', scopeFilter, session, linkedPatientIds),
        fetchScopedAppointments('patient_appointments', scopeFilter, session, linkedPatientIds),
      ]);

      const scopedRows = mergeAppointmentRows([...appointmentRows, ...ledgerRows]);
      const todayRows = scopedRows.filter(isTodayVisit);
      const activeTodayRows = todayRows.filter((row) => isActiveQueueStatus(row.queue_status));

      todayCount = activeTodayRows.length > 0 ? activeTodayRows.length : todayRows.length;
      latestAppointment =
        activeTodayRows[0] ??
        todayRows[0] ??
        scopedRows.find((row) => isActiveQueueStatus(row.queue_status)) ??
        scopedRows[0] ??
        null;

      if (scopedRows.length > 0) {
        writeLocalJson(CACHE_KEYS.patientAppointments, scopedRows);
        writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, scopedRows);
      }
    } catch {
      console.warn('Dashboard DB load fallback active');
    } finally {
      setActiveVisit(latestAppointment);
      setActiveVisitsCount(todayCount);
      if (latestAppointment) {
        writeLocalJson(CACHE_KEYS.patientAppointments, [latestAppointment]);
        writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, [latestAppointment]);
      }

      const resolvedPatientId = session.patientId;
      await Promise.all([
        fetchBillingSnapshot(resolvedPatientId, session.uhid),
        fetchPrescriptions(session),
        fetchVitals(session),
        fetchDoctorsAvailable(),
      ]);
      setLoading(false);
    }
  }, [
    fetchBillingSnapshot,
    fetchDoctorsAvailable,
    fetchPrescriptions,
    fetchVitals,
    router,
  ]);

  useEffect(() => {
    const session = readPatientAuthSession();
    if (!session) {
      router.replace('/patient/login');
      return;
    }
    setCurrentPatient(session);
    setPatientName(session.name);
    setPatientId(session.patientId);

    void (async () => {
      const auth = await resolveActiveAuthUser(supabase, session.patientId);
      if (auth?.userId) setAuthUserId(auth.userId);

      const resolved = await resolveEffectivePatientId(supabase, {
        phone: session.phone,
        sessionPatientId: auth?.userId || session.patientId,
      });
      setBookingPatientId(resolved.effectivePatientId || session.patientId);
    })();

    void fetchActiveToken();

    const queueChannel = supabase
      .channel('realtime_patient_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_appointments' }, () => {
        void fetchActiveToken();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void fetchActiveToken();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => {
        const liveSession = readPatientAuthSession();
        if (liveSession) void fetchPrescriptions(liveSession);
      })
      .subscribe();

    const unsubscribeBilling = subscribeConsultationBilling(supabase, () => {
      void fetchBillingSnapshot(patientId);
    });

    return () => {
      supabase.removeChannel(queueChannel);
      unsubscribeBilling();
    };
  }, [fetchActiveToken, fetchBillingSnapshot, fetchPrescriptions, patientId, router]);

  return (
    <>
      <DashboardOverview
        patientName={currentPatient?.name || patientName}
        loading={loading}
        billsLoading={billsLoading}
        activeVisit={activeVisit}
        activeVisitsCount={activeVisitsCount}
        prescriptionCount={prescriptionCount}
        recentPrescriptions={recentPrescriptions}
        doctorsAvailable={doctorsAvailable}
        billingSnapshot={billingSnapshot}
        bills={billingSnapshot.bills}
        vitals={vitals}
        onRefresh={() => void fetchActiveToken()}
        onBookConsultation={handleBookConsultation}
        profileComplete={profileComplete}
        profileGateLoading={profileGateLoading}
        profileMissingFields={profileMissingFields}
      />

      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        hospitalId={readPatientPortalSession()?.hospital_id}
        patientId={bookingPatientId || patientId}
        userId={authUserId || patientId}
        onBookingSuccess={() => void fetchActiveToken()}
      />
    </>
  );
}
