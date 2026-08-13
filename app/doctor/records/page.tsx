'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ClipboardList,
  FileText,
  FolderHeart,
  Loader2,
  Pill,
  Plus,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import WriteConsultationModal, {
  type ConsultationFormState,
} from '@/components/doctor/WriteConsultationModal';
import {
  DEFAULT_ACTIVE_DOCTOR_ID,
  getActiveDoctorProfile,
  parsePrescriptionMedications,
  savePatientClinicalEncounter,
} from '@/lib/doctor/command-center/supabase-service';
import { supabase } from '@/lib/supabaseClient';

type PatientProfile = {
  id?: string;
  patient_id?: string;
  full_name: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  chronic_conditions?: string | null;
  known_allergies?: string | null;
};

type ConsultationRow = {
  id: string;
  created_at?: string;
  chief_complaint?: string;
  diagnosis?: string;
  clinical_notes?: string;
  follow_up_date?: string | null;
};

type VitalsRow = {
  id?: string;
  created_at?: string;
  temperature_f?: number | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  pulse_bpm?: number | null;
  spo2_percent?: number | null;
  weight_kg?: number | null;
};

type PrescriptionRow = {
  id: string;
  created_at?: string;
  medications?: unknown;
  special_instructions?: string | null;
  consultations?: { diagnosis?: string } | { diagnosis?: string }[] | null;
};

type DetailTab = 'overview' | 'history' | 'vitals' | 'prescriptions' | 'diagnostics';

const clayCard =
  'rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#F2F6FA] shadow-[10px_10px_24px_rgba(137,74,102,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)]';
const glassPanel =
  'rounded-3xl border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_18px_45px_rgba(44,36,59,0.10)]';

function resolvePatientId(patient: PatientProfile): string {
  return String(patient.id ?? patient.patient_id ?? '');
}

function calcAge(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return undefined;
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function patientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-[#9DA6CD]/20 bg-white/60 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#BDE2F5]/60" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-[#BDE2F5]/60" />
              <div className="h-2 w-1/2 rounded bg-[#F2F6FA]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={`${glassPanel} min-h-96 space-y-4 p-6`}>
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 rounded bg-[#BDE2F5]/60" />
        <div className="h-4 w-32 rounded bg-[#F2F6FA]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#F2F6FA]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DoctorRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [vitals, setVitals] = useState<VitalsRow[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);

  const [searching, setSearching] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select(
          'id, full_name, phone, gender, date_of_birth, dob, blood_group, chronic_conditions, known_allergies',
        )
        .ilike('full_name', `%${term}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults((data ?? []) as PatientProfile[]);
    } catch (err) {
      console.warn('Patient search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchPatients(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm, searchPatients]);

  const loadPatientDetails = useCallback(async (patient: PatientProfile) => {
    const patientId = resolvePatientId(patient);
    if (!patientId) return;

    setDetailsLoading(true);

    try {
      const [consultationsRes, vitalsRes, prescriptionsRes] = await Promise.all([
        supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('vitals')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('prescriptions')
          .select('*, consultations(diagnosis)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
      ]);

      setConsultations((consultationsRes.data ?? []) as ConsultationRow[]);
      setVitals((vitalsRes.data ?? []) as VitalsRow[]);
      setPrescriptions((prescriptionsRes.data ?? []) as PrescriptionRow[]);
    } catch (err) {
      console.warn('Failed to load patient clinical bundle:', err);
      setConsultations([]);
      setVitals([]);
      setPrescriptions([]);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;

    const patientId = resolvePatientId(selectedPatient);
    if (!patientId) return;

    const channel = supabase
      .channel(`doctor-records-${patientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultations', filter: `patient_id=eq.${patientId}` },
        () => void loadPatientDetails(selectedPatient),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vitals', filter: `patient_id=eq.${patientId}` },
        () => void loadPatientDetails(selectedPatient),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions', filter: `patient_id=eq.${patientId}` },
        () => void loadPatientDetails(selectedPatient),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedPatient, loadPatientDetails]);

  const handleSelectPatient = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setActiveTab('overview');
    setSaveMessage(null);
    void loadPatientDetails(patient);
  };

  const handleSaveConsultation = async (form: ConsultationFormState) => {
    if (!selectedPatient) return;

    const patientId = resolvePatientId(selectedPatient);
    if (!patientId) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const doctor = await getActiveDoctorProfile();
      const doctorId = doctor?.doctor_id ? String(doctor.doctor_id) : DEFAULT_ACTIVE_DOCTOR_ID;

      await savePatientClinicalEncounter({
        doctorId,
        patientId,
        clinical: {
          chief_complaint: form.chiefComplaint,
          diagnosis: form.diagnosis,
          clinical_notes: form.clinicalNotes,
        },
        vitals: {
          temperature_f: form.temperature ? Number(form.temperature) : null,
          bp_systolic: form.bpSystolic ? Number(form.bpSystolic) : null,
          bp_diastolic: form.bpDiastolic ? Number(form.bpDiastolic) : null,
          pulse_bpm: form.pulse ? Number(form.pulse) : null,
          spo2_percent: form.spo2 ? Number(form.spo2) : null,
        },
        medications: form.medications.map(({ id: _id, ...med }) => med),
        special_instructions: form.clinicalNotes || undefined,
      });

      setModalOpen(false);
      setSaveMessage('Prescription sent successfully to patient!');
      setActiveTab('history');
      await loadPatientDetails(selectedPatient);
    } catch (err) {
      console.error('Save consultation failed:', err);
      setSaveMessage('Failed to save consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const latestVitals = vitals[0];
  const uniqueDiagnoses = useMemo(
    () =>
      [...new Set(consultations.map((c) => c.diagnosis).filter(Boolean))] as string[],
    [consultations],
  );

  const vitalsChartData = useMemo(
    () =>
      [...vitals]
        .reverse()
        .map((v, index) => ({
          label: v.created_at
            ? new Date(v.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            : `#${index + 1}`,
          systolic: v.bp_systolic ?? 0,
          diastolic: v.bp_diastolic ?? 0,
          spo2: v.spo2_percent ?? 0,
          pulse: v.pulse_bpm ?? 0,
        })),
    [vitals],
  );

  const tabs: { id: DetailTab; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'history', label: 'History & Diagnoses', icon: FileText },
    { id: 'vitals', label: 'Vitals Logs', icon: Activity },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'diagnostics', label: 'Diagnostics', icon: Stethoscope },
  ];

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top_left,_#BDE2F5_0,_#F2F6FA_38%,_#F2F6FA_100%)] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`${glassPanel} overflow-hidden p-5 sm:p-7`}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#BDE2F5] to-[#A9C5E3] p-3 text-[#894A66] shadow-[5px_5px_12px_rgba(137,74,102,0.14),-4px_-4px_10px_white]">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Patient Consultation & Clinical Records
              </h1>
              <p className="mt-1 text-sm text-[#2C243B]/60">
                Search patients, review history, and dispatch prescriptions to the patient app.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className={`${clayCard} overflow-hidden lg:col-span-1`}>
            <div className="border-b border-[#9DA6CD]/25 px-5 py-4">
              <h2 className="font-bold">Patient Search</h2>
            </div>

            <div className="relative border-b border-[#9DA6CD]/20 p-4">
              <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9887B1]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name (min. 2 chars)…"
                className="w-full rounded-xl border border-white/80 bg-white/65 py-2.5 pl-10 pr-10 text-sm shadow-inner outline-none focus:border-[#894A66] focus:ring-2 focus:ring-[#894A66]/15"
              />
              {searching && (
                <Loader2 className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#894A66]" />
              )}
            </div>

            {searchTerm.trim().length < 2 ? (
              <p className="p-6 text-sm text-[#2C243B]/55">Type at least 2 characters to search.</p>
            ) : searching ? (
              <SearchSkeleton />
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <UserRound className="mx-auto mb-3 h-8 w-8 text-[#9887B1]" />
                <p className="text-sm font-semibold">No patients found</p>
                <p className="mt-1 text-xs text-[#2C243B]/55">Try a different name spelling.</p>
              </div>
            ) : (
              <div className="max-h-[520px] divide-y divide-[#9DA6CD]/20 overflow-y-auto">
                {searchResults.map((patient) => {
                  const patientId = resolvePatientId(patient);
                  const age = calcAge(patient.dob ?? patient.date_of_birth);
                  const isSelected =
                    selectedPatient && resolvePatientId(selectedPatient) === patientId;

                  return (
                    <button
                      key={patientId || patient.full_name}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full p-4 text-left transition hover:bg-[#BDE2F5]/25 active:scale-[0.99] ${
                        isSelected ? 'bg-[#BDE2F5]/45' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#894A66]/15 text-xs font-black text-[#894A66]">
                          {patientInitials(patient.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{patient.full_name}</p>
                          <p className="mt-0.5 text-xs text-[#2C243B]/55">
                            {age != null ? `${age} yrs` : 'Age N/A'} · {patient.gender || '—'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold">
                            <span className="rounded-md bg-[#894A66]/10 px-1.5 py-0.5 text-[#894A66]">
                              {patient.blood_group || 'BG N/A'}
                            </span>
                            <span className="truncate text-[#2C243B]/45">
                              {patient.phone || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main className="space-y-4 lg:col-span-2">
            {!selectedPatient ? (
              <div className={`${clayCard} flex min-h-96 flex-col items-center justify-center p-8 text-center`}>
                <FolderHeart className="mb-4 h-12 w-12 text-[#9887B1]" />
                <h2 className="text-lg font-bold">Select a patient</h2>
                <p className="mt-1 max-w-md text-sm text-[#2C243B]/55">
                  Choose a profile from the search panel to view clinical history, vitals, and
                  prescriptions.
                </p>
              </div>
            ) : detailsLoading ? (
              <DetailSkeleton />
            ) : (
              <>
                {saveMessage && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      saveMessage.includes('success')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <div className={`${clayCard} p-5 sm:p-6`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#894A66]/15 text-lg font-black text-[#894A66]">
                        {patientInitials(selectedPatient.full_name)}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#93688E]">
                          Patient Demographics
                        </p>
                        <h2 className="mt-1 text-xl font-black">{selectedPatient.full_name}</h2>
                        <p className="mt-1 text-sm text-[#2C243B]/55">
                          {calcAge(selectedPatient.dob ?? selectedPatient.date_of_birth) ?? '—'} yrs ·{' '}
                          {selectedPatient.gender || '—'} · Blood group{' '}
                          {selectedPatient.blood_group || 'N/A'}
                        </p>
                        <p className="mt-0.5 text-sm text-[#2C243B]/55">
                          {selectedPatient.phone || 'No phone on file'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#894A66] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#7a3f5a]"
                    >
                      <Plus className="h-4 w-4" />
                      Write New Consultation / Prescription
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                        activeTab === id
                          ? 'bg-[#894A66] text-white'
                          : 'border border-white/80 bg-white/70 text-[#2C243B] hover:bg-[#BDE2F5]/30'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className={`${clayCard} p-5 sm:p-6`}>
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-bold">
                        <ClipboardList className="h-5 w-5 text-[#894A66]" /> Overview
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                          <p className="text-xs font-bold uppercase text-[#93688E]">Consultations</p>
                          <p className="mt-1 text-2xl font-black">{consultations.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                          <p className="text-xs font-bold uppercase text-[#93688E]">Prescriptions</p>
                          <p className="mt-1 text-2xl font-black">{prescriptions.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                          <p className="text-xs font-bold uppercase text-[#93688E]">Vitals Logs</p>
                          <p className="mt-1 text-2xl font-black">{vitals.length}</p>
                        </div>
                      </div>

                      {latestVitals && (
                        <div className="rounded-2xl border border-[#9DA6CD]/20 bg-[#F2F6FA]/80 p-4">
                          <p className="text-xs font-bold text-[#93688E]">Latest Vitals</p>
                          <p className="mt-1 text-sm font-semibold">
                            Temp {latestVitals.temperature_f ?? '—'}°F · BP{' '}
                            {latestVitals.bp_systolic ?? '—'}/{latestVitals.bp_diastolic ?? '—'} ·
                            Pulse {latestVitals.pulse_bpm ?? '—'} · SpO₂{' '}
                            {latestVitals.spo2_percent ?? '—'}%
                          </p>
                        </div>
                      )}

                      {consultations[0] && (
                        <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                          <p className="text-xs font-bold text-[#93688E]">Most Recent Visit</p>
                          <p className="mt-1 font-bold">
                            {consultations[0].diagnosis || 'General consultation'}
                          </p>
                          <p className="mt-1 text-sm text-[#2C243B]/65">
                            {consultations[0].chief_complaint || 'No chief complaint recorded'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-bold">
                        <FileText className="h-5 w-5 text-[#894A66]" /> History & Diagnoses
                      </h3>
                      {consultations.length === 0 ? (
                        <p className="text-sm text-[#2C243B]/55">No consultations recorded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {consultations.map((visit) => (
                            <article
                              key={visit.id}
                              className="rounded-2xl border border-white/80 bg-white/70 p-4"
                            >
                              <p className="text-xs font-bold text-[#93688E]">
                                {visit.created_at
                                  ? new Date(visit.created_at).toLocaleString('en-IN')
                                  : 'Date unknown'}
                              </p>
                              <p className="mt-1 font-bold">
                                {visit.diagnosis || 'General consultation'}
                              </p>
                              <p className="mt-1 text-sm text-[#2C243B]/65">
                                Chief complaint: {visit.chief_complaint || 'N/A'}
                              </p>
                              {visit.clinical_notes && (
                                <p className="mt-2 text-xs text-[#2C243B]/55">{visit.clinical_notes}</p>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'prescriptions' && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-bold">
                        <Pill className="h-5 w-5 text-[#894A66]" /> Prescriptions
                      </h3>
                      {prescriptions.length === 0 ? (
                        <p className="text-sm text-[#2C243B]/55">No prescriptions on file.</p>
                      ) : (
                        <div className="space-y-4">
                          {prescriptions.map((rx) => {
                            const meds = parsePrescriptionMedications(rx.medications);
                            const consult = Array.isArray(rx.consultations)
                              ? rx.consultations[0]
                              : rx.consultations;

                            return (
                              <article
                                key={rx.id}
                                className="rounded-2xl border border-white/80 bg-white/70 p-4"
                              >
                                <p className="text-xs font-bold text-[#93688E]">
                                  {rx.created_at
                                    ? new Date(rx.created_at).toLocaleDateString('en-IN')
                                    : 'Date unknown'}
                                  {consult?.diagnosis ? ` · ${consult.diagnosis}` : ''}
                                </p>
                                {meds.length > 0 ? (
                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {meds.map((med, idx) => (
                                      <div
                                        key={`${rx.id}-${idx}`}
                                        className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"
                                      >
                                        <p className="font-bold text-emerald-900">{med.name}</p>
                                        <p className="mt-0.5 text-xs text-emerald-800">
                                          {med.dosage} · {med.frequency} · {med.duration}
                                        </p>
                                        {med.instructions && (
                                          <p className="mt-1 text-[10px] text-emerald-700">
                                            {med.instructions}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-[#2C243B]/55">No medications listed.</p>
                                )}
                                {rx.special_instructions && (
                                  <p className="mt-3 text-xs italic text-[#2C243B]/60">
                                    {rx.special_instructions}
                                  </p>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'vitals' && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-bold">
                        <Activity className="h-5 w-5 text-[#894A66]" /> Vitals Logs
                      </h3>
                      {vitals.length === 0 ? (
                        <p className="text-sm text-[#2C243B]/55">No vitals recorded yet.</p>
                      ) : (
                        <>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={vitalsChartData}>
                                <XAxis dataKey="label" stroke="#9887B1" fontSize={11} />
                                <YAxis stroke="#9887B1" fontSize={11} />
                                <Tooltip />
                                <Line
                                  type="monotone"
                                  dataKey="systolic"
                                  name="Systolic"
                                  stroke="#894A66"
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="diastolic"
                                  name="Diastolic"
                                  stroke="#20639B"
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="spo2"
                                  name="SpO₂"
                                  stroke="#2E8B70"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {vitals.slice(0, 8).map((v, idx) => (
                              <div
                                key={v.id ?? idx}
                                className="rounded-xl border border-[#9DA6CD]/20 bg-[#F2F6FA]/80 p-3 text-xs"
                              >
                                <p className="font-bold text-[#93688E]">
                                  {v.created_at
                                    ? new Date(v.created_at).toLocaleString('en-IN')
                                    : 'Reading'}
                                </p>
                                <p className="mt-1 font-semibold">
                                  Temp {v.temperature_f ?? '—'}°F · BP {v.bp_systolic ?? '—'}/
                                  {v.bp_diastolic ?? '—'} · Pulse {v.pulse_bpm ?? '—'} · SpO₂{' '}
                                  {v.spo2_percent ?? '—'}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'diagnostics' && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-bold">
                        <Stethoscope className="h-5 w-5 text-[#894A66]" /> Diagnostics
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                          <p className="flex items-center gap-1 text-xs font-bold uppercase text-amber-800">
                            <AlertCircle className="h-3.5 w-3.5" /> Chronic Conditions
                          </p>
                          <p className="mt-2 text-sm">
                            {selectedPatient.chronic_conditions || 'None recorded'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                          <p className="flex items-center gap-1 text-xs font-bold uppercase text-red-800">
                            <AlertCircle className="h-3.5 w-3.5" /> Known Allergies
                          </p>
                          <p className="mt-2 text-sm">
                            {selectedPatient.known_allergies || 'None recorded'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-[#93688E]">
                          Diagnosis History
                        </p>
                        {uniqueDiagnoses.length === 0 ? (
                          <p className="text-sm text-[#2C243B]/55">No diagnoses logged yet.</p>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {uniqueDiagnoses.map((dx) => (
                              <li
                                key={dx}
                                className="rounded-full border border-[#894A66]/20 bg-[#894A66]/10 px-3 py-1 text-xs font-semibold text-[#894A66]"
                              >
                                {dx}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {selectedPatient && (
        <WriteConsultationModal
          open={modalOpen}
          patientName={selectedPatient.full_name}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveConsultation}
        />
      )}
    </section>
  );
}
