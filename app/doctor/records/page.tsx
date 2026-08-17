'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  HeartPulse,
  Loader2,
  Pill,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { fetchPatientMedicalTimeline } from '@/lib/doctor/command-center/supabase-service';
import type { PatientMedicalTimelineItem } from '@/lib/doctor/command-center/types';

type PatientListRow = {
  id?: string;
  appointment_id?: string;
  patient_id?: string;
  patient_name?: string;
  name?: string;
  age?: number;
  gender?: string;
  created_at?: string;
  chief_complaint?: string;
  diagnosis?: string;
  last_status?: string;
};

// Safe deduplication helper
const dedupePatientList = (list: PatientListRow[] | null | undefined = []) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item) return false;
    const key = (item.patient_name || item.name || item.id || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const REGAL_HOSPITAL = 'Regal Hospital';

function getPatientDisplayName(patient: PatientListRow): string {
  return String(patient.patient_name || patient.name || 'Patient').trim() || 'Patient';
}

function formatDateLabel(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function getTimelineSubtitle(entry: PatientMedicalTimelineItem): string {
  if (entry.type === 'CONSULTATION') {
    return [entry.diagnosis, entry.notes, entry.doctor_name].filter(Boolean).join(' · ');
  }
  if (entry.type === 'PRESCRIPTION') {
    const medCount = Array.isArray(entry.medications) ? entry.medications.length : 0;
    return [
      medCount > 0 ? `${medCount} medication(s)` : null,
      entry.instructions,
      entry.doctor_name,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (entry.type === 'VITALS') {
    return entry.vitalsSummary || '';
  }
  return entry.doctor_name || '';
}

function timelineIcon(type: string) {
  switch (type) {
    case 'CONSULTATION':
      return Stethoscope;
    case 'PRESCRIPTION':
      return Pill;
    case 'VITALS':
      return HeartPulse;
    default:
      return CalendarClock;
  }
}

function timelineBadgeClass(type: string): string {
  switch (type) {
    case 'CONSULTATION':
      return 'bg-[#227B6B] text-white border-[#1A6357]';
    case 'PRESCRIPTION':
      return 'bg-[#EAF5F2] text-[#113831] border-[#A6E2D8]';
    case 'VITALS':
      return 'bg-[#FFF7E6] text-[#8A5A00] border-[#F5D78E]';
    default:
      return 'bg-white text-[#227B6B] border-[#D5E8E3]';
  }
}

export default function DoctorRecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientList, setPatientList] = useState<PatientListRow[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientListRow | null>(null);
  const [timeline, setTimeline] = useState<PatientMedicalTimelineItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const searchPatients = useCallback(async (queryText: string) => {
    setIsSearching(true);
    const supabase = createClient();

    try {
      const trimmed = (queryText || '').trim();

      let appointmentsQuery = supabase
        .from('appointments')
        .select('id, patient_id, patient_name, age, gender, created_at, chief_complaint')
        .order('created_at', { ascending: false });

      if (trimmed.length >= 2) {
        appointmentsQuery = appointmentsQuery.ilike('patient_name', `%${trimmed}%`);
      } else {
        appointmentsQuery = appointmentsQuery.limit(20);
      }

      const { data: appointmentsData, error: appError } = await appointmentsQuery;
      if (appError) {
        console.warn('Appointments search note:', appError.message);
      }

      let consultationsQuery = supabase
        .from('consultations')
        .select(
          'id, appointment_id, patient_id, patient_name, created_at, chief_complaint, diagnosis',
        )
        .order('created_at', { ascending: false });

      if (trimmed.length >= 2) {
        consultationsQuery = consultationsQuery.ilike('patient_name', `%${trimmed}%`);
      } else {
        consultationsQuery = consultationsQuery.limit(20);
      }

      const { data: consultationsData, error: consultError } = await consultationsQuery;
      if (consultError) {
        console.warn('Consultations search note:', consultError.message);
      }

      const merged: PatientListRow[] = [
        ...((appointmentsData ?? []) as PatientListRow[]),
        ...((consultationsData ?? []) as PatientListRow[]),
      ];

      const cleanList = dedupePatientList(merged);
      setPatientList(cleanList);
    } catch (err) {
      console.error('Handled search fallback:', err);
      setPatientList([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const loadPatientTimeline = useCallback(async (patient: PatientListRow) => {
    const patientKey =
      patient.patient_id || patient.id || getPatientDisplayName(patient);
    if (!patientKey) {
      setTimeline([]);
      return;
    }

    setIsTimelineLoading(true);
    try {
      const entries = await fetchPatientMedicalTimeline(patientKey);
      setTimeline(entries);
    } catch (err) {
      console.error('[loadPatientTimeline]:', err);
      setTimeline([]);
    } finally {
      setIsTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchPatients(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, searchPatients]);

  const handleSelectPatient = (patient: PatientListRow) => {
    setSelectedPatient(patient);
    void loadPatientTimeline(patient);
  };

  const timelineSummary = useMemo(() => {
    return {
      consultations: timeline.filter((entry) => entry.type === 'CONSULTATION').length,
      prescriptions: timeline.filter((entry) => entry.type === 'PRESCRIPTION').length,
      vitals: timeline.filter((entry) => entry.type === 'VITALS').length,
      total: timeline.length,
    };
  }, [timeline]);

  return (
    <div className="w-full min-h-screen bg-[#F4FAF8] p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#D5E8E3] shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-black text-[#0E2924] tracking-tight">
            Patient Consultation &amp; Clinical Records
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#113831] text-[#A6E2D8]">
            {REGAL_HOSPITAL}
          </span>
        </div>
        <p className="text-xs text-[#227B6B] mt-1 font-semibold">
          Search completed encounters, open a patient chart, and review the full medical timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#D5E8E3] shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#EAF5F2] pb-3">
            <Search className="w-4 h-4 text-[#227B6B]" />
            <h2 className="text-sm font-black text-[#0E2924]">Patient Search</h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#227B6B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name (min 2 chars)..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5E8E3] bg-[#F4FAF8] text-sm text-[#0E2924] placeholder:text-[#227B6B]/60 focus:outline-none focus:ring-2 focus:ring-[#227B6B]/30"
            />
          </div>

          <p className="text-[11px] font-semibold text-[#227B6B]">
            {searchQuery.trim().length < 2
              ? 'Showing 20 most recent patients from appointments & consultations'
              : `Search results for "${searchQuery.trim()}"`}
          </p>

          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-[#227B6B]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm font-semibold">Searching Supabase...</span>
            </div>
          ) : patientList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D5E8E3] bg-[#F4FAF8] p-6 text-center">
              <UserRound className="w-8 h-8 text-[#227B6B]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#113831]">No patients found</p>
              <p className="text-xs text-[#227B6B] mt-1">
                Try another name or complete an OPD encounter first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {patientList.map((patient) => {
                const displayName = getPatientDisplayName(patient);
                const isSelected =
                  selectedPatient?.patient_id === patient.patient_id &&
                  getPatientDisplayName(selectedPatient) === displayName;

                return (
                  <button
                    key={`${patient.patient_id}-${patient.id}-${displayName}`}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full text-left rounded-xl border p-3 transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#227B6B] bg-[#EAF5F2] shadow-sm'
                        : 'border-[#D5E8E3] bg-white hover:border-[#227B6B]/40 hover:bg-[#F4FAF8]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#113831] text-[#A6E2D8] flex items-center justify-center text-sm font-black shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#0E2924] truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-[#227B6B] font-semibold mt-0.5">
                          {patient.age ? `${patient.age} yrs` : 'Age —'}
                          {patient.gender ? ` · ${patient.gender}` : ''}
                        </p>
                        <p className="text-[10px] text-[#227B6B]/80 mt-1">
                          Last seen {formatDateLabel(patient.created_at)}
                        </p>
                      </div>
                      {patient.last_status ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4FAF8] text-[#227B6B] border border-[#D5E8E3] shrink-0">
                          {patient.last_status}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="lg:col-span-8 bg-white rounded-2xl border border-[#D5E8E3] shadow-sm p-4 md:p-5 space-y-4 min-h-[520px]">
          {!selectedPatient ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ClipboardList className="w-12 h-12 text-[#227B6B]/30 mb-3" />
              <p className="text-base font-black text-[#113831]">Select a patient to view records</p>
              <p className="text-sm text-[#227B6B] mt-1 max-w-md">
                Choose a patient from the left panel to load appointments, consultations,
                prescriptions, vitals, and lab history from Supabase.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[#D5E8E3] bg-[#F4FAF8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#113831] text-[#A6E2D8] flex items-center justify-center text-xl font-black">
                    {getPatientDisplayName(selectedPatient).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#0E2924]">
                      {getPatientDisplayName(selectedPatient)}
                    </h2>
                    <p className="text-xs text-[#227B6B] font-semibold">
                      Patient ID: {selectedPatient.patient_id || 'Not linked'}
                      {selectedPatient.gender ? ` · ${selectedPatient.gender}` : ''}
                      {selectedPatient.age ? ` · ${selectedPatient.age} yrs` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-white border border-[#D5E8E3] px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#227B6B]">Consults</p>
                    <p className="text-lg font-black text-[#0E2924]">
                      {timelineSummary.consultations}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#D5E8E3] px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#227B6B]">Rx</p>
                    <p className="text-lg font-black text-[#0E2924]">
                      {timelineSummary.prescriptions}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#D5E8E3] px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#227B6B]">Vitals</p>
                    <p className="text-lg font-black text-[#0E2924]">{timelineSummary.vitals}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#D5E8E3] px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-[#227B6B]">Total</p>
                    <p className="text-lg font-black text-[#0E2924]">{timelineSummary.total}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-[#EAF5F2] pb-3">
                <Stethoscope className="w-4 h-4 text-[#227B6B]" />
                <h3 className="text-sm font-black text-[#0E2924]">Complete Medical Timeline</h3>
              </div>

              {isTimelineLoading ? (
                <div className="flex items-center justify-center py-16 text-[#227B6B]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm font-semibold">Loading medical history...</span>
                </div>
              ) : timeline.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D5E8E3] bg-[#F4FAF8] p-8 text-center">
                  <FileText className="w-8 h-8 text-[#227B6B]/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#113831]">No clinical records yet</p>
                  <p className="text-xs text-[#227B6B] mt-1">
                    Completed consultations and prescriptions will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {timeline.map((entry) => {
                    const Icon = timelineIcon(entry.type);
                    const subtitle = getTimelineSubtitle(entry);

                    return (
                      <article
                        key={`${entry.type}-${entry.id}-${entry.date}`}
                        className="rounded-xl border border-[#D5E8E3] bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F4FAF8] border border-[#D5E8E3] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#227B6B]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-black text-[#0E2924]">{entry.title}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${timelineBadgeClass(entry.type)}`}
                              >
                                {entry.type.replace('_', ' ')}
                              </span>
                            </div>
                            {subtitle ? (
                              <p className="text-xs text-[#227B6B] mt-1">{subtitle}</p>
                            ) : null}
                            <p className="text-[10px] text-[#227B6B]/80 mt-2 font-semibold">
                              {formatDateLabel(entry.date)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
