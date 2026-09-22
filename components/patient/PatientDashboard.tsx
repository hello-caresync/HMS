'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  DashboardOverview,
  type DashboardPrescription,
  type DashboardVisit,
} from '@/components/patient/DashboardOverview';
import {
  BookAppointmentModal,
  type AppointmentBookingPrefill,
} from '@/components/patient/BookAppointmentModal';
import { subscribeConsultationBilling } from '@/lib/hospital/operations/consultation-billing-sync';
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
import {
  deduplicateAppointments,
  fetchMyPrivateAppointments,
  type MyAppointmentRecord,
} from '@/lib/patient/my-appointments';
import {
  mapToDashboardVisit,
  partitionDashboardAppointments,
} from '@/lib/patient/dashboard-appointments';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';
import { isDemoMode } from '@/lib/shared/demo-mode';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { usePatientProfileCompleteness } from '@/lib/patient/usePatientProfileCompleteness';
import { profileIncompleteBookingMessage } from '@/lib/utils/profileCompleteness';
import { supabase } from '@/lib/supabaseClient';

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

function readCachedAppointments(session: PatientAuthSession): MyAppointmentRecord[] {
  if (typeof window === 'undefined') return [];
  const primary = readLocalJson<MyAppointmentRecord[]>(CACHE_KEYS.patientAppointments);
  const alt = readLocalJson<MyAppointmentRecord[]>(CACHE_KEYS.patientAppointmentsAlt);
  const rows = Array.isArray(primary) && primary.length > 0 ? primary : Array.isArray(alt) ? alt : [];
  return rows.filter((row) =>
    rowMatchesPatientSession(row as unknown as Record<string, unknown>, session),
  );
}

export default function PatientDashboard() {
  const router = useRouter();

  const [currentPatient, setCurrentPatient] = useState<PatientAuthSession | null>(() =>
    typeof window === 'undefined' ? null : readPatientAuthSession(),
  );
  const [activeVisits, setActiveVisits] = useState<DashboardVisit[]>([]);
  const [actionRequiredVisits, setActionRequiredVisits] = useState<DashboardVisit[]>([]);
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
  const [reschedulePrefill, setReschedulePrefill] = useState<AppointmentBookingPrefill | null>(null);
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
    setReschedulePrefill(null);
    setIsBookingModalOpen(true);
  }, [profileComplete, profileMissingFields, router]);

  const handleReschedule = useCallback((visit: DashboardVisit) => {
    setReschedulePrefill({
      doctorId: visit.doctor_id,
      department: visit.department,
      symptoms: visit.symptoms ?? visit.reason,
      reason: visit.reason ?? visit.symptoms,
    });
    setIsBookingModalOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setReschedulePrefill(null);
  }, []);

  const fetchPrescriptions = useCallback(async (session: PatientAuthSession, linkedIds: string[] = []) => {
    const scopeFilter = buildPatientScopeOrFilter(session, linkedIds);
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
      rowMatchesPatientSession(entry, session, linkedIds),
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

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const session = readPatientAuthSession();
    if (!session) {
      router.replace('/patient/login');
      setLoading(false);
      return;
    }

    setCurrentPatient(session);
    setPatientName(session.name);
    setPatientId(session.patientId);

    try {
      const { appointments: scopedRows, context } = await fetchMyPrivateAppointments(
        supabase,
        session,
      );

      let combined = [...scopedRows];
      if (isDemoMode()) {
        const cached = readCachedAppointments(session);
        combined = deduplicateAppointments([...combined, ...cached]);
      }

      if (combined.length > 0) {
        writeLocalJson(CACHE_KEYS.patientAppointments, combined);
        writeLocalJson(CACHE_KEYS.patientAppointmentsAlt, combined);
      }

      const { activeUpcoming, actionRequired } = partitionDashboardAppointments(combined);
      setActiveVisits(activeUpcoming.map(mapToDashboardVisit));
      setActionRequiredVisits(actionRequired.map(mapToDashboardVisit));
      setActiveVisitsCount(activeUpcoming.length);

      const linkedIds = context?.linkedPatientIds ?? [];
      const resolvedPatientId = context?.resolvedPatientId ?? session.patientId;

      if (context?.authUserId) setAuthUserId(context.authUserId);
      setBookingPatientId(resolvedPatientId);

      await Promise.all([
        fetchBillingSnapshot(resolvedPatientId, session.uhid),
        fetchPrescriptions(session, linkedIds),
        fetchVitals(session),
        fetchDoctorsAvailable(),
      ]);
    } catch (err) {
      console.warn('[PatientDashboard] load error:', err);
      const cached = readCachedAppointments(session);
      if (cached.length > 0) {
        const { activeUpcoming, actionRequired } = partitionDashboardAppointments(cached);
        setActiveVisits(activeUpcoming.map(mapToDashboardVisit));
        setActionRequiredVisits(actionRequired.map(mapToDashboardVisit));
        setActiveVisitsCount(activeUpcoming.length);
      } else {
        setActiveVisits([]);
        setActionRequiredVisits([]);
        setActiveVisitsCount(0);
      }
    } finally {
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
    })();

    void loadDashboard();

    const queueChannel = supabase
      .channel('realtime_patient_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_appointments' }, () => {
        void loadDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void loadDashboard();
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
  }, [fetchBillingSnapshot, fetchPrescriptions, loadDashboard, patientId, router]);

  return (
    <>
      <DashboardOverview
        patientName={currentPatient?.name || patientName}
        loading={loading}
        billsLoading={billsLoading}
        activeVisits={activeVisits}
        actionRequiredVisits={actionRequiredVisits}
        activeVisitsCount={activeVisitsCount}
        prescriptionCount={prescriptionCount}
        recentPrescriptions={recentPrescriptions}
        doctorsAvailable={doctorsAvailable}
        billingSnapshot={billingSnapshot}
        bills={billingSnapshot.bills}
        vitals={vitals}
        onRefresh={() => void loadDashboard()}
        onBookConsultation={handleBookConsultation}
        onReschedule={handleReschedule}
        profileComplete={profileComplete}
        profileGateLoading={profileGateLoading}
        profileMissingFields={profileMissingFields}
      />

      <BookAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        hospitalId={readPatientPortalSession()?.hospital_id}
        patientId={bookingPatientId || patientId}
        userId={authUserId || patientId}
        prefill={reschedulePrefill}
        onBookingSuccess={() => {
          closeBookingModal();
          void loadDashboard();
        }}
      />
    </>
  );
}
