'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import {
  fetchPatientClinicalRecordByPhone,
  mapPatientsRowToClinicalRecord,
  type PatientClinicalRecord,
} from '@/lib/patient/patients-record';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import { isDemoMode } from '@/lib/shared/demo-mode';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
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

function mapAppointmentRow(row: Record<string, unknown>): ActiveTokenRecord {
  return {
    id: String(row.id ?? ''),
    patient_id: String(row.patient_id ?? row.uhid ?? ''),
    patient_name: String(row.patient_name ?? 'Patient'),
    doctor_name: String(row.doctor_name ?? 'Doctor'),
    department: String(row.department ?? 'OPD'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    appointment_date: String(row.appointment_date ?? row.created_at ?? ''),
    slot_time: String(row.slot_time ?? row.appointment_time ?? row.time_slot ?? row.created_at ?? ''),
    token_number: Number(row.token_number ?? 0),
    queue_status: String(row.queue_status ?? row.status ?? 'checked_in'),
    fee: row.fee != null ? String(row.fee) : undefined,
    reason: row.chief_complaint ? String(row.chief_complaint) : row.reason ? String(row.reason) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function isTodayVisit(row: ActiveTokenRecord): boolean {
  const today = new Date().toISOString().split('T')[0];
  const dateValue = String(row.appointment_date ?? row.created_at ?? '').slice(0, 10);
  return dateValue === today;
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

    const scopeFilter = buildPatientScopeOrFilter(session);
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
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .or(scopeFilter)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!error && data && data.length > 0) {
        const scopedRows = (data as Record<string, unknown>[])
          .filter((row) => rowMatchesPatientSession(row, session))
          .map((row) => ({
            ...mapAppointmentRow(row),
            hospital_name: 'Regal Hospital',
          }));
        todayCount = scopedRows.filter(isTodayVisit).length;
        latestAppointment = scopedRows.find(isTodayVisit) ?? scopedRows[0] ?? null;
        if (scopedRows.length > 0) {
          writeLocalJson(CACHE_KEYS.patientAppointments, scopedRows);
          writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, scopedRows);
        }
      }

      if (!latestAppointment) {
        const { data: apptRows } = await supabase
          .from('appointments')
          .select('*')
          .or(scopeFilter)
          .order('created_at', { ascending: false })
          .limit(12);

        if (apptRows && apptRows.length > 0) {
          const scopedRows = (apptRows as Record<string, unknown>[])
            .filter((row) => rowMatchesPatientSession(row, session))
            .map((row) => mapAppointmentRow(row));
          todayCount = scopedRows.filter(isTodayVisit).length;
          latestAppointment = scopedRows.find(isTodayVisit) ?? scopedRows[0] ?? null;
        }
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
        onBookConsultation={() => setIsBookingModalOpen(true)}
      />

      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        hospitalId={readPatientPortalSession()?.hospital_id}
        patientId={patientId}
        onBookingSuccess={() => void fetchActiveToken()}
      />
    </>
  );
}
