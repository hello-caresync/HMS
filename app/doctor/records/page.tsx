'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Droplets,
  FileText,
  FlaskConical,
  FolderHeart,
  HeartPulse,
  Loader2,
  Paperclip,
  Search,
  ShieldAlert,
  Upload,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  fetchPatientClinicalBundle,
  type FamilyMemberRecord,
  type PatientProfileRecord,
} from '@/lib/doctor/patient-records.service';
import { getDoctorSession } from '@/lib/doctor/session';
import { supabase } from '@/lib/supabaseClient';

const RECORDS_KEY = 'curasync_patient_records';

type MedicalRecord = {
  id: string;
  patient_id: string;
  patient_name: string;
  file_name: string;
  file_path?: string;
  file_url?: string;
  uploaded_by?: string;
  created_at: string;
  source?: 'database' | 'local';
};

type PatientVisit = {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department?: string;
  hospital_name?: string;
  appointment_date: string;
  slot_time?: string;
  queue_status?: string;
  diagnosis?: string | null;
  clinical_notes?: string | null;
  notes?: string | null;
  reason?: string | null;
};

const clayCard =
  'rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#F2F6FA] shadow-[10px_10px_24px_rgba(137,74,102,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)]';
const glassPanel =
  'rounded-3xl border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_18px_45px_rgba(44,36,59,0.10)]';

function readLocalRecords(): MedicalRecord[] {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) ?? '[]') as MedicalRecord[];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: MedicalRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function mergeRecords(local: MedicalRecord[], remote: MedicalRecord[]) {
  const records = new Map<string, MedicalRecord>();
  local.forEach((record) => records.set(record.id, { ...record, source: 'local' }));
  remote.forEach((record) => records.set(record.id, { ...record, source: 'database' }));
  return [...records.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function DoctorRecordsPage() {
  const [session] = useState(getDoctorSession);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientProfileRecord[]>([]);
  const [selected, setSelected] = useState<PatientProfileRecord | null>(null);
  const [family, setFamily] = useState<FamilyMemberRecord[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [searching, setSearching] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offline, setOffline] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadRecords = useCallback(async (patient: PatientProfileRecord) => {
    const local = readLocalRecords().filter((record) => record.patient_id === patient.patient_id);
    const localAppointments = (() => {
      try {
        return (JSON.parse(localStorage.getItem('curasync_appointments') ?? '[]') as PatientVisit[])
          .filter(
            (visit) =>
              visit.patient_id === patient.patient_id || visit.patient_name === patient.full_name,
          )
          .sort(
            (a, b) =>
              new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime(),
          );
      } catch {
        return [];
      }
    })();
    try {
      const [recordsResult, visitsResult] = await Promise.all([
        supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', patient.patient_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('patient_appointments')
          .select('*')
          .eq('patient_id', patient.patient_id)
          .order('appointment_date', { ascending: false }),
      ]);
      if (recordsResult.error) throw recordsResult.error;
      const merged = mergeRecords(local, (recordsResult.data ?? []) as MedicalRecord[]);
      setRecords(merged);
      saveLocalRecords(
        mergeRecords(readLocalRecords(), (recordsResult.data ?? []) as MedicalRecord[]),
      );
      if (visitsResult.error) {
        setVisits(localAppointments);
        setOffline(true);
      } else {
        const visitMap = new Map(localAppointments.map((visit) => [visit.id, visit]));
        ((visitsResult.data ?? []) as PatientVisit[]).forEach((visit) =>
          visitMap.set(visit.id, visit),
        );
        setVisits(
          [...visitMap.values()].sort(
            (a, b) =>
              new Date(b.appointment_date).getTime() -
              new Date(a.appointment_date).getTime(),
          ),
        );
        setOffline(false);
      }
    } catch {
      setRecords(local);
      setVisits(localAppointments);
      setOffline(true);
    }
  }, []);

  const choosePatient = useCallback(
    async (patient: PatientProfileRecord) => {
      setSelected(patient);
      setDetailsLoading(true);
      try {
        const bundle = await fetchPatientClinicalBundle(patient.full_name);
        setSelected(bundle.profile ?? patient);
        setFamily(bundle.familyMembers);
        await loadRecords(bundle.profile ?? patient);
      } catch (error) {
        setFamily([]);
        setRecords(
          readLocalRecords().filter((record) => record.patient_id === patient.patient_id),
        );
        setVisits([]);
        setOffline(true);
        toast.error('Could not load the complete record', {
          description: error instanceof Error ? error.message : 'Local information is shown.',
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [loadRecords],
  );

  const searchPatients = useCallback(async () => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select(
          'patient_id, full_name, phone, blood_group, known_allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone, date_of_birth, gender',
        )
        .ilike('full_name', `%${term}%`)
        .limit(20);
      if (error) throw error;
      setResults((data ?? []) as PatientProfileRecord[]);
      setOffline(false);
    } catch (error) {
      setOffline(true);
      const cachedProfile = localStorage.getItem('curasync_patient_profile');
      try {
        const profile = cachedProfile ? (JSON.parse(cachedProfile) as PatientProfileRecord) : null;
        setResults(
          profile?.full_name.toLowerCase().includes(term.toLowerCase()) ? [profile] : [],
        );
      } catch {
        setResults([]);
      }
      toast.warning('Patient search is offline', {
        description: error instanceof Error ? error.message : 'Showing cached results only.',
      });
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void searchPatients(), 350);
    return () => window.clearTimeout(timer);
  }, [searchPatients]);

  const uploadRecord = async (file: File) => {
    if (!selected) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large', { description: 'Choose a file smaller than 10 MB.' });
      return;
    }

    setUploading(true);
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${selected.patient_id}/${Date.now()}-${safeName}`;
    const localRecord: MedicalRecord = {
      id,
      patient_id: selected.patient_id,
      patient_name: selected.full_name,
      file_name: file.name,
      file_path: filePath,
      uploaded_by: session.employeeId,
      created_at: new Date().toISOString(),
      source: 'local',
    };

    const local = [localRecord, ...readLocalRecords()];
    saveLocalRecords(local);
    setRecords((current) => [localRecord, ...current]);

    try {
      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('medical-records').getPublicUrl(filePath);
      const metadata = {
        id,
        patient_id: selected.patient_id,
        patient_name: selected.full_name,
        file_name: file.name,
        file_path: filePath,
        file_url: publicData.publicUrl,
        uploaded_by: session.employeeId,
        created_at: localRecord.created_at,
      };
      const { error: metadataError } = await supabase.from('medical_records').insert(metadata);
      if (metadataError) throw metadataError;

      saveLocalRecords(
        readLocalRecords().map((record) =>
          record.id === id ? { ...record, ...metadata, source: 'database' } : record,
        ),
      );
      await loadRecords(selected);
      setOffline(false);
      toast.success('Medical record uploaded');
    } catch (error) {
      setOffline(true);
      toast.warning('Record saved locally', {
        description:
          error instanceof Error ? error.message : 'Upload will need to be retried when online.',
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const history = useMemo<Array<[string, string | null | undefined, LucideIcon]>>(
    () => [
      ['Blood group', selected?.blood_group, Droplets],
      ['Allergies', selected?.known_allergies, ShieldAlert],
      ['Chronic conditions', selected?.chronic_conditions, HeartPulse],
      ['Date of birth', selected?.date_of_birth, CalendarDays],
      ['Gender', selected?.gender, UserRound],
      [
        'Emergency contact',
        [selected?.emergency_contact_name, selected?.emergency_contact_phone]
          .filter(Boolean)
          .join(' · '),
        FileText,
      ],
    ],
    [selected],
  );

  const diagnoses = useMemo(
    () =>
      visits
        .map((visit) => visit.diagnosis?.trim())
        .filter((diagnosis): diagnosis is string => Boolean(diagnosis))
        .filter((diagnosis, index, all) => all.indexOf(diagnosis) === index),
    [visits],
  );

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top_left,_#BDE2F5_0,_#F2F6FA_38%,_#F2F6FA_100%)] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`${glassPanel} overflow-hidden p-5 sm:p-7`}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#BDE2F5] to-[#A9C5E3] p-3 text-[#894A66] shadow-[5px_5px_12px_rgba(137,74,102,0.14),-4px_-4px_10px_white]">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Patient records</h1>
              <p className="mt-1 text-sm text-[#2C243B]/60">
                Search verified profiles and review clinical history.
              </p>
            </div>
          </div>
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9887B1]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient name…"
              className="w-full rounded-2xl border border-white/80 bg-white/65 py-3.5 pl-12 pr-12 text-sm shadow-inner outline-none backdrop-blur transition focus:border-[#894A66] focus:ring-2 focus:ring-[#894A66]/15"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#894A66]" />
            )}
          </div>
        </header>

        {offline && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#93688E]/35 bg-[#BDE2F5]/45 px-4 py-3 text-sm text-[#2C243B]">
            <AlertCircle className="h-4 w-4 shrink-0" /> Some data is being shown from this device.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className={`${clayCard} overflow-hidden`}>
            <div className="border-b border-[#9DA6CD]/25 px-5 py-4">
              <h2 className="font-bold">Search results</h2>
            </div>
            {query.trim().length < 2 ? (
              <p className="p-6 text-sm text-[#2C243B]/55">Enter at least two characters.</p>
            ) : results.length === 0 && !searching ? (
              <div className="p-8 text-center">
                <UserRound className="mx-auto mb-3 h-8 w-8 text-[#9887B1]" />
                <p className="text-sm font-semibold">No patient profiles found</p>
              </div>
            ) : (
              <div className="divide-y divide-[#9DA6CD]/20">
                {results.map((patient) => (
                  <button
                    key={patient.patient_id}
                    type="button"
                    onClick={() => void choosePatient(patient)}
                    className={`w-full p-4 text-left transition hover:bg-[#BDE2F5]/25 active:scale-95 ${
                      selected?.patient_id === patient.patient_id ? 'bg-[#BDE2F5]/45' : ''
                    }`}
                  >
                    <p className="font-bold">{patient.full_name}</p>
                    <p className="mt-1 text-xs text-[#2C243B]/55">
                      {patient.phone || 'Phone not provided'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="space-y-6">
            {!selected ? (
              <div className={`${clayCard} flex min-h-96 flex-col items-center justify-center p-8 text-center`}>
                <FolderHeart className="mb-4 h-12 w-12 text-[#9887B1]" />
                <h2 className="text-lg font-bold">Select a patient</h2>
                <p className="mt-1 max-w-md text-sm text-[#2C243B]/55">
                  Clinical history and uploaded documents will appear here.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className={`${glassPanel} flex min-h-96 items-center justify-center`}>
                <Loader2 className="h-8 w-8 animate-spin text-[#894A66]" />
              </div>
            ) : (
              <>
                <div className={`${clayCard} p-5 sm:p-6`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#93688E]">Clinical profile</p>
                      <h2 className="mt-1 text-xl font-black">{selected.full_name}</h2>
                      <p className="mt-1 text-sm text-[#2C243B]/55">{selected.phone || 'No phone recorded'}</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#894A66] to-[#93688E] px-4 py-2.5 text-sm font-bold text-white shadow-[5px_5px_12px_rgba(137,74,102,0.28),-3px_-3px_9px_white] transition active:scale-95">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload record
                      <input
                        ref={fileInput}
                        type="file"
                        className="sr-only"
                        disabled={uploading}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadRecord(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {history.map(([label, value, Icon]) => (
                      <div key={String(label)} className="rounded-2xl border border-white/80 bg-gradient-to-br from-white to-[#BDE2F5]/35 p-4 shadow-[5px_5px_13px_rgba(157,166,205,0.20),-4px_-4px_10px_white]">
                        <p className="flex items-center gap-2 text-xs font-bold text-[#93688E]">
                          {Icon && <Icon className="h-4 w-4" />} {label}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{value || 'Not recorded'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className={`${clayCard} p-5`}>
                    <h3 className="flex items-center gap-2 font-bold">
                      <Activity className="h-5 w-5 text-[#894A66]" /> Diagnoses & conditions
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-[#F2F6FA]/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#93688E]">
                          Present chronic conditions
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {selected.chronic_conditions || 'No chronic conditions recorded.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#BDE2F5]/35 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#93688E]">
                          Visit diagnoses
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {diagnoses.length ? diagnoses.join(' · ') : 'No diagnosis recorded in visits.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${clayCard} p-5`}>
                    <h3 className="flex items-center gap-2 font-bold">
                      <CalendarDays className="h-5 w-5 text-[#93688E]" /> Past OPD visits
                    </h3>
                    {visits.length ? (
                      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {visits.map((visit) => (
                          <div key={visit.id} className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold">{visit.department || 'General OPD'}</p>
                                <p className="mt-1 text-xs text-[#2C243B]/55">
                                  {visit.doctor_name} · {visit.hospital_name || 'Hospital not recorded'}
                                </p>
                              </div>
                              <span className="rounded-full bg-[#A9C5E3]/40 px-2.5 py-1 text-[10px] font-bold">
                                {visit.queue_status || 'VISIT'}
                              </span>
                            </div>
                            <p className="mt-3 text-xs font-semibold text-[#93688E]">
                              {new Date(visit.appointment_date).toLocaleDateString()}
                              {visit.slot_time ? ` · ${visit.slot_time}` : ''}
                            </p>
                            <p className="mt-1 text-xs text-[#2C243B]/65">
                              {visit.diagnosis || visit.clinical_notes || visit.notes || visit.reason || 'No clinical note recorded.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#2C243B]/55">No past OPD visits found.</p>
                    )}
                  </div>

                  <div className={`${clayCard} p-5`}>
                    <h3 className="flex items-center gap-2 font-bold">
                      <UsersRound className="h-5 w-5 text-[#93688E]" /> Family members
                    </h3>
                    {family.length ? (
                      <div className="mt-4 space-y-2">
                        {family.map((member) => (
                          <div key={member.id} className="rounded-xl bg-[#F2F6FA] p-3">
                            <p className="text-sm font-bold">{member.full_name}</p>
                            <p className="text-xs text-[#2C243B]/55">{member.relation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#2C243B]/55">No family members recorded.</p>
                    )}
                  </div>

                  <div className={`${clayCard} p-5`}>
                    <h3 className="flex items-center gap-2 font-bold">
                      <FlaskConical className="h-5 w-5 text-[#93688E]" /> Lab & medical attachments
                    </h3>
                    {records.length ? (
                      <div className="mt-4 space-y-2">
                        {records.map((record) => (
                          <a
                            key={record.id}
                            href={record.file_url}
                            target={record.file_url ? '_blank' : undefined}
                            rel="noreferrer"
                            className={`block rounded-2xl border border-white/80 bg-white/60 p-3 ${
                              record.file_url ? 'transition hover:bg-[#BDE2F5]/25 active:scale-95' : 'cursor-default'
                            }`}
                            onClick={(event) => {
                              if (!record.file_url) event.preventDefault();
                            }}
                          >
                            <p className="flex items-center gap-2 truncate text-sm font-bold">
                              <Paperclip className="h-4 w-4 shrink-0 text-[#894A66]" />
                              {record.file_name}
                            </p>
                            <p className="mt-1 text-xs text-[#2C243B]/50">
                              {new Date(record.created_at).toLocaleString()} · {record.source}
                            </p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-[#2C243B]/55">No medical documents uploaded.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
