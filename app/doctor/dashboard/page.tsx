'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  UserCheck,
  Play,
  RotateCw,
  Calendar,
  Activity,
  HeartPulse,
  FileText,
  Loader2,
  Plus,
  CalendarClock,
  Building2,
  Banknote,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import {
  admitAppointmentToQueue,
  bypassToNextWaiting,
  callNextPatientInQueue,
  createWalkInAppointment,
  getNextUpcomingBooking,
  getUpcomingBookings,
  isInConsultationStatus,
  isWaitingStatus,
  updateAppointmentRecord,
  type LiveAppointmentRecord,
} from '@/lib/doctor/appointments-realtime';

const REGAL_HOSPITAL = 'Regal Hospital';

const CLINICIAN_OPTIONS = [
  { id: 'ALL', label: 'All Hospital Appointments', keywords: [] as string[] },
  {
    id: 'chandrakanth',
    label: 'Dr. Chandrakanth S. Kesari — General Surgery',
    keywords: ['chandrakanth'],
  },
  { id: 'suriraju', label: 'Dr. Suriraju V — Urology', keywords: ['suriraju'] },
  { id: 'ananya', label: 'Dr. Ananya R — General Medicine', keywords: ['ananya'] },
  { id: 'vikram', label: 'Dr. Vikramaditya Rao — Cardiology', keywords: ['vikram'] },
  { id: 'meera', label: 'Dr. Meera Nambiar — Cardiology', keywords: ['meera'] },
  { id: 'rajesh', label: 'Dr. Rajesh Kumar Hegde — Orthopedics', keywords: ['rajesh', 'hegde'] },
  { id: 'shalini', label: 'Dr. Shalini Deshmukh — Orthopedics', keywords: ['shalini'] },
  { id: 'arvind', label: 'Dr. Arvind Swamy — Neurology', keywords: ['arvind'] },
  { id: 'kavitha', label: 'Dr. Kavitha Reddy — Neurosurgery', keywords: ['kavitha'] },
];

function appointmentMatchesClinician(
  appt: LiveAppointmentRecord,
  clinicianId: string,
): boolean {
  if (clinicianId === 'ALL') return true;
  const option = CLINICIAN_OPTIONS.find((entry) => entry.id === clinicianId);
  if (!option || option.keywords.length === 0) return true;

  const haystack = `${appt.doctor_name ?? ''} ${appt.type ?? ''} ${appt.doctor_id ?? ''}`.toLowerCase();
  return option.keywords.every((keyword) => haystack.includes(keyword.toLowerCase()));
}

function formatFeeLabel(fee?: string): string {
  if (!fee) return '—';
  const numeric = Number(String(fee).replace(/[^\d.]/g, ''));
  if (Number.isNaN(numeric)) return fee;
  return `₹${numeric.toLocaleString('en-IN')}`;
}

function formatAppointmentDateLabel(date?: string): string {
  if (!date) {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function queueStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'IN_CONSULTATION') {
    return 'bg-[#227B6B] text-white border-[#1A6357]';
  }
  if (normalized === 'COMPLETED') {
    return 'bg-[#EAF5F2] text-[#113831] border-[#A6E2D8]';
  }
  return 'bg-[#FFF7E6] text-[#8A5A00] border-[#F5D78E]';
}

function formatTokenLabel(token?: string, fallbackIndex?: number): string {
  if (token) return token.startsWith('T-') ? token : `T-${String(token).padStart(2, '0')}`;
  return `T-${String((fallbackIndex ?? 0) + 1).padStart(2, '0')}`;
}

const getRegisteredPatientName = (patient: unknown): string => {
  if (!patient || typeof patient !== 'object') return 'Registered Patient';

  const p = patient as Record<string, unknown>;
  const nestedPatient = p.patient as Record<string, unknown> | undefined;
  const nestedPatients = p.patients as Record<string, unknown> | undefined;
  const nestedProfiles = p.profiles as Record<string, unknown> | undefined;
  const userMetadata = p.user_metadata as Record<string, unknown> | undefined;

  return (
    String(p.patient_name ?? '').trim() ||
    String(p.full_name ?? '').trim() ||
    String(p.name ?? '').trim() ||
    String(nestedPatient?.full_name ?? '').trim() ||
    String(nestedPatient?.name ?? '').trim() ||
    String(nestedPatients?.full_name ?? '').trim() ||
    String(nestedProfiles?.full_name ?? '').trim() ||
    String(nestedProfiles?.name ?? '').trim() ||
    String(userMetadata?.full_name ?? '').trim() ||
    'Registered Patient'
  );
};

async function enrichAppointmentsWithProfiles(
  rows: Record<string, unknown>[],
): Promise<LiveAppointmentRecord[]> {
  const supabase = createClient();
  const patientIds = Array.from(
    new Set(rows.map((row) => String(row.patient_id ?? '')).filter(Boolean)),
  );

  const profileMap = new Map<string, Record<string, unknown>>();
  if (patientIds.length > 0) {
    const { data: profiles } = await supabase
      .from('patient_profiles')
      .select('id, full_name, gender, date_of_birth, dob')
      .in('id', patientIds);

    for (const profile of (profiles ?? []) as Record<string, unknown>[]) {
      if (profile.id) profileMap.set(String(profile.id), profile);
    }
  }

  return rows.map((row, index) => {
    const profile = profileMap.get(String(row.patient_id ?? ''));
    const merged = {
      ...row,
      profiles: profile,
      patients: profile,
      patient: profile,
      full_name: profile?.full_name ?? row.full_name,
    };

    const normalized = normalizeAppointmentRow(merged, index);
    normalized.patient_name = getRegisteredPatientName(merged);

    if (profile?.gender) {
      normalized.gender = String(profile.gender);
    }

    const dob = (profile?.date_of_birth ?? profile?.dob) as string | undefined;
    if (dob) {
      const born = new Date(dob);
      if (!Number.isNaN(born.getTime())) {
        normalized.age = Math.floor(
          (Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000),
        );
      }
    }

    return normalized;
  });
}

function normalizeAppointmentRow(
  row: Record<string, unknown>,
  index: number,
): LiveAppointmentRecord {
  return {
    id: String(row.appointment_id ?? row.id ?? ''),
    doctor_id: String(row.doctor_id ?? ''),
    patient_id: row.patient_id ? String(row.patient_id) : undefined,
    patient_name: getRegisteredPatientName(row),
    age: row.age ? Number(row.age) : undefined,
    gender: row.gender ? String(row.gender) : undefined,
    doctor_name: row.doctor_name ? String(row.doctor_name) : undefined,
    chief_complaint: String(
      row.reason_for_visit ?? row.chief_complaint ?? row.reason ?? 'OPD Review',
    ),
    symptoms: String(row.symptoms ?? row.reason ?? row.chief_complaint ?? ''),
    vitals_summary: row.vitals_summary ? String(row.vitals_summary) : undefined,
    token_number: row.token_number != null ? String(row.token_number) : undefined,
    appointment_date: row.appointment_date
      ? String(row.appointment_date).slice(0, 10)
      : undefined,
    time_slot: String(row.appointment_time ?? row.time_slot ?? row.slot_time ?? 'Today'),
    type: String(row.department ?? row.type ?? 'Standard Consultation'),
    fee: row.fee ? String(row.fee) : undefined,
    hospital_name: REGAL_HOSPITAL,
    status: String(row.status ?? row.queue_status ?? 'WAITING').toUpperCase(),
    predicted_wait_min: Number(
      row.predicted_wait_min ?? row.estimated_wait_minutes ?? 5 + index * 3,
    ),
    ml_duration_min: Number(row.ml_duration_min ?? row.estimated_duration ?? 15),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export default function DoctorDashboardPage() {
  const router = useRouter();

  const doctorName = 'Dr. Chandrakanth S Kesari';
  const department = 'General Surgery • Room 204';
  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [appointments, setAppointments] = useState<LiveAppointmentRecord[]>([]);
  const [activePatient, setActivePatient] = useState<LiveAppointmentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'appointments'>('queue');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [bypassing, setBypassing] = useState(false);
  const [admittingId, setAdmittingId] = useState<string | null>(null);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState('chandrakanth');
  const [cardActionId, setCardActionId] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchLiveAppointments = useCallback(async (silent = false) => {
    const supabase = createClient();
    try {
      if (!silent) setIsLoading(true);

      const [appointmentsRes, patientAppointmentsRes] = await Promise.all([
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase
          .from('patient_appointments')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (appointmentsRes.error) {
        console.error('❌ Supabase Fetch Error (appointments):', appointmentsRes.error.message);
      }
      if (patientAppointmentsRes.error) {
        console.error(
          '❌ Supabase Fetch Error (patient_appointments):',
          patientAppointmentsRes.error.message,
        );
      }

      const mergedRaw: Record<string, unknown>[] = [];
      const seenIds = new Set<string>();

      for (const row of (appointmentsRes.data ?? []) as Record<string, unknown>[]) {
        const id = String(row.appointment_id ?? row.id ?? '');
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          mergedRaw.push(row);
        }
      }

      for (const row of (patientAppointmentsRes.data ?? []) as Record<string, unknown>[]) {
        const id = String(row.id ?? row.appointment_id ?? '');
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          mergedRaw.push({
            ...row,
            status: row.queue_status ?? row.status,
            appointment_time: row.slot_time ?? row.appointment_time,
          });
        }
      }

      console.log('✅ Fetched Appointments Data:', mergedRaw);

      if (mergedRaw.length > 0) {
        const normalized = await enrichAppointmentsWithProfiles(mergedRaw);
        setAppointments(normalized);

        const waitingOrActive = normalized.filter(
          (a) => a.status.toUpperCase() !== 'COMPLETED',
        );

        if (waitingOrActive.length > 0) {
          const inConsultationPatient = waitingOrActive.find((a) =>
            isInConsultationStatus(a.status),
          );
          setActivePatient(inConsultationPatient || waitingOrActive[0]);
        } else {
          setActivePatient(null);
        }
      } else {
        setAppointments([]);
        setActivePatient(null);
      }

      setHasLoadedOnce(true);
    } catch (err) {
      console.error('❌ Unexpected fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveAppointments();

    const supabase = createClient();
    const channel = supabase
      .channel('permanent_appointments_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          void fetchLiveAppointments(true);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          void fetchLiveAppointments(true);
        },
      )
      .subscribe();

    const pollInterval = window.setInterval(() => {
      void fetchLiveAppointments(true);
    }, 5000);

    const onWindowFocus = () => {
      void fetchLiveAppointments(true);
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(pollInterval);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [fetchLiveAppointments]);

  const filteredAppointments = appointments.filter((appt) =>
    appointmentMatchesClinician(appt, selectedClinicianId),
  );

  const waitingQueue = filteredAppointments.filter((a) => isWaitingStatus(a.status));
  const inConsultationQueue = filteredAppointments.filter((a) =>
    isInConsultationStatus(a.status),
  );
  const completedQueue = filteredAppointments.filter(
    (a) => a.status.toUpperCase() === 'COMPLETED',
  );
  const liveQueue = [...inConsultationQueue, ...waitingQueue];
  const upcomingBookings = getUpcomingBookings(filteredAppointments);
  const nextUpcoming = getNextUpcomingBooking(filteredAppointments);

  const totalPatients = filteredAppointments.length;
  const totalWaiting = waitingQueue.length;
  const inConsultation = inConsultationQueue.length;
  const completedToday = completedQueue.length;

  const canCallNext = waitingQueue.length > 0 && !callingNext;
  const canStartConsultation = Boolean(activePatient);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchLiveAppointments();
  };

  const handleCallNext = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue. Patient bookings from the app will appear automatically.');
      return;
    }

    setCallingNext(true);
    try {
      const next = await callNextPatientInQueue(filteredAppointments, activePatient);
      if (next) {
        await fetchLiveAppointments();
        toast.success(`Called ${getRegisteredPatientName(next)} into consultation`);
      }
    } catch (err) {
      console.error('[Call Next]:', err);
      toast.error('Failed to call next patient');
    } finally {
      setCallingNext(false);
    }
  };

  const handleBypass = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue');
      return;
    }

    setBypassing(true);
    try {
      const next = await bypassToNextWaiting(filteredAppointments);
      if (next) {
        await fetchLiveAppointments();
        toast.success(`Emergency bypass: ${getRegisteredPatientName(next)} moved to consultation`);
      }
    } catch (err) {
      console.error('[Emergency Bypass]:', err);
      toast.error('Emergency bypass failed');
    } finally {
      setBypassing(false);
    }
  };

  const handleStartConsultation = () => {
    if (!activePatient?.id) {
      toast.error('No active patient selected for consultation');
      return;
    }
    void handleStartConsultationForCard(activePatient);
  };

  const handleStartConsultationForCard = async (appt: LiveAppointmentRecord) => {
    if (!appt.id) {
      toast.error('Invalid appointment record');
      return;
    }

    setCardActionId(appt.id);
    try {
      await updateAppointmentRecord(appt.id, { status: 'IN_CONSULTATION' });
      setActivePatient(appt);
      router.push(`/doctor/consultations?appointmentId=${appt.id}`);
    } catch (err) {
      console.error('[Start Consultation]:', err);
      toast.error('Failed to start consultation');
    } finally {
      setCardActionId(null);
    }
  };

  const handleMarkDone = async (appt: LiveAppointmentRecord) => {
    if (!appt.id) return;

    setCardActionId(appt.id);
    try {
      await updateAppointmentRecord(appt.id, { status: 'COMPLETED' });
      await fetchLiveAppointments(true);
      toast.success(`${getRegisteredPatientName(appt)} marked as completed`);
    } catch (err) {
      console.error('[Mark Done]:', err);
      toast.error('Failed to complete appointment');
    } finally {
      setCardActionId(null);
    }
  };

  const handleAdmitFromBookings = async (appt: LiveAppointmentRecord) => {
    setAdmittingId(appt.id);
    try {
      await admitAppointmentToQueue(appt.id, 'IN_CONSULTATION');
      await fetchLiveAppointments();
      toast.success(`${getRegisteredPatientName(appt)} admitted from bookings`);
    } catch (err) {
      console.error('[Admit from bookings]:', err);
      toast.error('Failed to admit patient from bookings');
    } finally {
      setAdmittingId(null);
    }
  };

  const handleQuickWalkIn = async () => {
    const name = window.prompt('Enter walk-in patient name for quick triage intake:');
    if (!name?.trim()) return;

    setWalkInLoading(true);
    try {
      await createWalkInAppointment(name.trim());
      await fetchLiveAppointments();
      toast.success(`Walk-in patient "${name.trim()}" added to OPD list`);
    } catch (err) {
      console.error('[Quick walk-in]:', err);
      toast.error('Failed to add walk-in patient');
    } finally {
      setWalkInLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F4FAF8] p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#D5E8E3] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-[#0E2924] tracking-tight">
              OPD Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF5F2] text-[#227B6B] border border-[#A6E2D8]">
              <span className="w-2 h-2 rounded-full bg-[#227B6B] animate-pulse" />
              Live Sync Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#113831] text-[#A6E2D8]">
              <Building2 className="w-3 h-3" />
              {REGAL_HOSPITAL}
            </span>
          </div>
          <p className="text-xs text-[#227B6B] mt-1 font-semibold flex flex-wrap items-center gap-2">
            <span>{doctorName}</span>
            <span>•</span>
            <span>{department}</span>
            <span>•</span>
            <span>{currentDate}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative min-w-[240px]">
            <select
              value={selectedClinicianId}
              onChange={(e) => setSelectedClinicianId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#D5E8E3] bg-[#F4FAF8] px-3 py-2.5 pr-9 text-xs font-bold text-[#113831] focus:outline-none focus:ring-2 focus:ring-[#227B6B]/30"
            >
              {CLINICIAN_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#227B6B]" />
          </div>

          <button
            onClick={handleRefresh}
            className="px-3.5 py-2.5 bg-[#113831] hover:bg-[#227B6B] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#D5E8E3] shadow-sm">
          <div className="flex items-center justify-between text-[#227B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-[#0E2924] mt-1">{totalPatients}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E8E3] shadow-sm">
          <div className="flex items-center justify-between text-[#227B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Waiting Queue</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-[#113831] mt-1">{totalWaiting}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E8E3] shadow-sm">
          <div className="flex items-center justify-between text-[#227B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Consultation</span>
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-[#227B6B] mt-1">{inConsultation}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5E8E3] shadow-sm">
          <div className="flex items-center justify-between text-[#227B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-[#113831] mt-1">{completedToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D5E8E3] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
            <div className="flex gap-1.5 p-1 bg-[#F4FAF8] rounded-xl">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'queue'
                    ? 'bg-white text-[#0E2924] shadow-sm border border-[#D5E8E3]'
                    : 'text-[#227B6B] hover:text-[#113831]'
                }`}
              >
                Live Queue ({liveQueue.length})
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-white text-[#0E2924] shadow-sm border border-[#D5E8E3]'
                    : 'text-[#227B6B] hover:text-[#113831]'
                }`}
              >
                All Bookings ({filteredAppointments.length})
              </button>
            </div>

            <button
              onClick={() => void handleCallNext()}
              disabled={!canCallNext}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                canCallNext
                  ? 'bg-[#113831] hover:bg-[#227B6B] text-white shadow-sm'
                  : 'bg-[#F4FAF8] text-[#A6C4BC] border border-[#D5E8E3] cursor-not-allowed'
              }`}
            >
              {callingNext ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              Call Next
            </button>
          </div>

          {activeTab === 'queue' && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
              {isLoading && !hasLoadedOnce ? (
                <div className="py-12 text-center text-[#227B6B]">
                  <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#227B6B] mb-2" />
                  <p className="text-xs font-medium">Connecting to patient bookings...</p>
                </div>
              ) : liveQueue.length === 0 ? (
                <div className="space-y-3">
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-[#F4FAF8] to-white border border-[#D5E8E3] flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF5F2] text-[#227B6B] border border-[#A6E2D8] flex items-center justify-center shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#227B6B] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#227B6B]" />
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0E2924] text-sm">
                        {upcomingBookings.length > 0
                          ? 'Queue Standby • Upcoming Appointments Available'
                          : 'OPD Queue is Currently Clear'}
                      </h4>
                      <p className="text-xs text-[#227B6B] mt-1 max-w-xs">
                        {filteredAppointments.length > 0
                          ? `You have ${filteredAppointments.length} scheduled booking(s) for today.`
                          : 'Patient check-ins from the mobile app will sync here live.'}
                      </p>
                    </div>
                    {filteredAppointments.length > 0 && (
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="px-4 py-2 bg-[#113831] hover:bg-[#227B6B] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        View Scheduled Bookings ({filteredAppointments.length})
                      </button>
                    )}
                  </div>

                  {nextUpcoming && (
                    <div className="p-4 rounded-xl border border-[#F5D78E]/80 bg-gradient-to-r from-[#FFF7E6]/80 to-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-[#FFF7E6] text-[#8A5A00] shrink-0">
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A00]">
                            Next Upcoming
                          </p>
                          <p className="font-bold text-xs text-[#0E2924] truncate">
                            {getRegisteredPatientName(nextUpcoming)}
                          </p>
                          <p className="text-[11px] text-[#227B6B]">
                            {nextUpcoming.time_slot || 'Today'} · {nextUpcoming.status}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleAdmitFromBookings(nextUpcoming)}
                        disabled={admittingId === nextUpcoming.id}
                        className="shrink-0 px-3 py-2 bg-[#113831] hover:bg-[#227B6B] disabled:opacity-60 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                      >
                        {admittingId === nextUpcoming.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Admit / Call
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                liveQueue.map((item, idx) => {
                  const isSelected = activePatient?.id === item.id;
                  const isInConsultation = isInConsultationStatus(item.status);
                  const complaint =
                    item.chief_complaint && item.chief_complaint !== 'OPD Review'
                      ? item.chief_complaint
                      : item.symptoms || 'No chief complaint recorded';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePatient(item)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-[#EAF5F2]/70 border-[#227B6B] shadow-sm ring-1 ring-[#227B6B]/20'
                          : 'bg-[#F4FAF8]/70 hover:bg-[#EAF5F2]/50 border-[#D5E8E3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-[#113831] text-white font-black text-xs flex items-center justify-center shrink-0">
                            {formatTokenLabel(item.token_number, idx)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-[#0E2924] truncate">
                              {getRegisteredPatientName(item)}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#113831] text-[#A6E2D8]">
                                <Building2 className="w-2.5 h-2.5" />
                                {REGAL_HOSPITAL}
                              </span>
                              {item.doctor_name && (
                                <span className="text-[10px] font-semibold text-[#227B6B] truncate">
                                  {item.doctor_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border uppercase tracking-wide shrink-0 ${queueStatusBadgeClass(item.status)}`}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-[#227B6B]">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="font-semibold text-[#113831]">
                            {formatAppointmentDateLabel(item.appointment_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#227B6B]">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="font-semibold text-[#113831]">
                            {item.time_slot || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#227B6B] col-span-2">
                          <Banknote className="w-3 h-3 shrink-0" />
                          <span className="font-semibold text-[#113831]">
                            Consultation Fee: {formatFeeLabel(item.fee)}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 border border-[#D5E8E3]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#227B6B] mb-0.5">
                          Chief Complaint
                        </p>
                        <p className="text-xs font-medium text-[#0E2924] line-clamp-2">{complaint}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleStartConsultationForCard(item);
                          }}
                          disabled={cardActionId === item.id}
                          className="flex-1 py-2 text-[11px] font-bold rounded-lg bg-[#113831] hover:bg-[#227B6B] text-white transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          {cardActionId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          {isInConsultation ? 'Resume Consultation' : 'Start Consultation'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMarkDone(item);
                          }}
                          disabled={cardActionId === item.id}
                          className="px-3 py-2 text-[11px] font-bold rounded-lg bg-[#EAF5F2] hover:bg-[#A6E2D8] text-[#113831] border border-[#A6E2D8] transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          {cardActionId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Done
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
              {filteredAppointments.length === 0 ? (
                <div className="py-12 text-center text-[#227B6B]">
                  <Calendar className="w-8 h-8 mx-auto text-[#A6E2D8] mb-2" />
                  <p className="font-bold text-xs text-[#113831]">No patient bookings found</p>
                </div>
              ) : (
                filteredAppointments.map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="p-4 bg-[#F4FAF8]/80 rounded-xl border border-[#D5E8E3] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-[#0E2924]">
                          {getRegisteredPatientName(appt)}
                        </p>
                        <span className="text-[10px] text-[#227B6B] font-semibold">
                          {appt.type || 'Standard Consultation'} · {appt.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-[#113831] text-[#A6E2D8]">
                        {formatTokenLabel(appt.token_number, idx)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#227B6B]">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {REGAL_HOSPITAL}
                      </span>
                      <span>·</span>
                      <span>{formatAppointmentDateLabel(appt.appointment_date)}</span>
                      <span>·</span>
                      <span>{appt.time_slot || 'Today'}</span>
                      <span>·</span>
                      <span>{formatFeeLabel(appt.fee)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isWaitingStatus(appt.status) &&
                        !isInConsultationStatus(appt.status) &&
                        appt.status !== 'COMPLETED' && (
                          <button
                            onClick={() => void handleAdmitFromBookings(appt)}
                            disabled={admittingId === appt.id}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#113831] text-white hover:bg-[#227B6B] disabled:opacity-60"
                          >
                            {admittingId === appt.id ? '...' : 'Admit'}
                          </button>
                        )}
                      {appt.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => void handleStartConsultationForCard(appt)}
                            disabled={cardActionId === appt.id}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#227B6B] text-white hover:bg-[#113831] disabled:opacity-60"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => void handleMarkDone(appt)}
                            disabled={cardActionId === appt.id}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#EAF5F2] text-[#113831] border border-[#A6E2D8] disabled:opacity-60"
                          >
                            Done
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D5E8E3] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAF5F2]">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#EAF5F2] text-[#227B6B] rounded-xl">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#0E2924] text-sm">Active Clinical Encounter</h2>
                <p className="text-[11px] text-[#227B6B]">Live patient on-deck workstation</p>
              </div>
            </div>

            <button
              onClick={() => void handleBypass()}
              disabled={waitingQueue.length === 0 || bypassing}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                waitingQueue.length > 0 && !bypassing
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70'
                  : 'bg-[#F4FAF8] text-[#A6C4BC] border border-[#D5E8E3] cursor-not-allowed'
              }`}
            >
              {bypassing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              )}
              Emergency Bypass
            </button>
          </div>

          {activePatient ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#0E2924] to-[#113831] rounded-xl text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#227B6B]/30 border border-[#227B6B]/40 flex items-center justify-center font-black text-[#A6E2D8] text-base">
                    {formatTokenLabel(activePatient.token_number)}
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight">
                      {getRegisteredPatientName(activePatient)}
                    </h3>
                    <p className="text-xs text-[#A6E2D8] mt-0.5">
                      {activePatient.age || 25} Yrs • {activePatient.gender || '—'}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#227B6B]/40 text-[#EAF5F2]">
                      <Building2 className="w-2.5 h-2.5" />
                      {REGAL_HOSPITAL}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#A6E2D8] block tracking-wider">
                    Status
                  </span>
                  <span className="text-sm font-bold text-white">
                    {activePatient.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#F4FAF8]/80 rounded-xl border border-[#D5E8E3] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#227B6B]">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Recorded Vitals
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0E2924]">
                    {activePatient.vitals_summary || 'Awaiting vitals capture in consultation'}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F4FAF8]/80 rounded-xl border border-[#D5E8E3] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#227B6B]">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Chief Complaint
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0E2924]">
                    {activePatient.chief_complaint || activePatient.symptoms || 'General consultation review'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleStartConsultation}
                  disabled={!canStartConsultation || cardActionId === activePatient.id}
                  className={`py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                    canStartConsultation
                      ? 'bg-[#113831] hover:bg-[#227B6B] text-white'
                      : 'bg-[#F4FAF8] text-[#A6C4BC] cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Consultation
                </button>
                <button
                  onClick={() => void handleMarkDone(activePatient)}
                  disabled={cardActionId === activePatient.id}
                  className="py-3 font-bold text-sm rounded-xl border border-[#A6E2D8] bg-[#EAF5F2] hover:bg-[#A6E2D8] text-[#113831] transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {cardActionId === activePatient.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#F4FAF8]/80 via-white to-[#EAF5F2]/30 border border-[#D5E8E3] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5F2]/80 border border-[#A6E2D8] flex items-center justify-center text-[#227B6B] shadow-sm">
                <Stethoscope className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F2] text-[#227B6B] border border-[#A6E2D8] text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#227B6B] animate-pulse" />
                  Live Clinical Standby
                </div>
                <p className="text-[11px] text-[#227B6B] font-semibold mt-2 animate-pulse">
                  Waiting for check-in from Patient App or Front Desk
                </p>
                <h3 className="font-black text-[#0E2924] text-base mt-2">
                  No Active Encounter On-Deck
                </h3>
                <p className="text-xs text-[#227B6B] max-w-sm mx-auto">
                  Select a patient from the queue, admit a scheduled appointment, or click
                  &quot;Call Next&quot; when a patient checks in.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => void handleCallNext()}
                  disabled={waitingQueue.length === 0 || callingNext}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    waitingQueue.length > 0 && !callingNext
                      ? 'bg-[#113831] text-white hover:bg-[#227B6B] shadow-sm'
                      : 'bg-[#F4FAF8] text-[#A6C4BC] border border-[#D5E8E3] cursor-not-allowed'
                  }`}
                >
                  {callingNext ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Call Next in Line
                </button>

                {nextUpcoming && (
                  <button
                    onClick={() => void handleAdmitFromBookings(nextUpcoming)}
                    disabled={admittingId === nextUpcoming.id}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#227B6B] hover:bg-[#113831] text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {admittingId === nextUpcoming.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Admit from Bookings
                  </button>
                )}

                <button
                  onClick={() => void handleQuickWalkIn()}
                  disabled={walkInLoading}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs border border-[#A6E2D8] bg-[#EAF5F2] text-[#113831] hover:bg-[#A6E2D8] transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {walkInLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Quick Walk-In Intake
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
