'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Droplets,
  FileText,
  Heart,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  fetchPatientsDirectory,
  type ClinicalPatient360,
} from '@/lib/doctor/patient-registry-sync';
import { ccClasses } from '@/lib/doctor/command-center/theme';

export function PatientRegistry() {
  const [patients, setPatients] = useState<ClinicalPatient360[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadDirectory = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const rows = await fetchPatientsDirectory(createClient());
      setPatients(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    } catch (err) {
      console.error('Error fetching patients directory:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('doctor_patient_registry_360')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () =>
        void loadDirectory(true),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () =>
        void loadDirectory(true),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () =>
        void loadDirectory(true),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () =>
        void loadDirectory(true),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDirectory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) => {
      const haystack = `${patient.name} ${patient.uhid} ${patient.phone} ${patient.chronicTags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [patients, search]);

  const selected = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  const stats = useMemo(() => {
    const allergyAlerts = patients.filter((p) => !p.allergies.includes('NKDA')).length;
    const chronicCases = patients.filter((p) => !p.chronicTags.includes('None')).length;
    const totalVisits = patients.reduce((sum, p) => sum + p.totalVisits, 0);
    return {
      total: patients.length,
      totalVisits,
      allergyAlerts,
      chronicCases,
    };
  }, [patients]);

  return (
    <div className="space-y-6">
      <header className={`p-6 ${ccClasses.card}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
              Clinical Intelligence Hub
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#173F5F]">Patient Registry · 360° Workstation</h1>
            <p className="mt-1 text-sm font-semibold text-[#5A7A94]">
              Live merge of patients, appointments, consultations, and prescriptions
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDirectory(true)}
            disabled={isRefreshing}
            className={`${ccClasses.btnPrimary} inline-flex items-center gap-2`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Registry
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A7A94]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, UHID, phone, or chronic tag…"
            className={`${ccClasses.input} pl-10`}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Registered Patients', value: stats.total, icon: Users },
          { label: 'Aggregate Visits', value: stats.totalVisits, icon: Calendar },
          { label: 'Chronic Cases', value: stats.chronicCases, icon: Heart },
          { label: 'Allergy Alerts', value: stats.allergyAlerts, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`p-4 ${ccClasses.card}`}>
            <div className="flex items-center justify-between text-[#5A7A94]">
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-1 text-2xl font-black text-[#173F5F]">{value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-2 text-sm font-semibold text-[#5A7A94]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Building clinical 360° directory…
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2 space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className={`p-8 text-center ${ccClasses.card}`}>
                <p className="font-black text-[#173F5F]">No patients match your search</p>
              </div>
            ) : (
              filtered.map((patient) => {
                const active = selected?.id === patient.id;
                return (
                  <article
                    key={`${patient.id}-${patient.uhid}`}
                    className={`cursor-pointer p-4 transition ${ccClasses.card} ${
                      active ? 'ring-2 ring-[#2A9D8F] shadow-md' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedId(patient.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setSelectedId(patient.id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F1F8] text-[#20639B]">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-black text-[#173F5F]">{patient.name}</h2>
                        <p className="text-[11px] font-bold text-[#2A9D8F]">{patient.uhid}</p>
                        <p className="text-xs font-semibold text-[#5A7A94]">
                          {patient.age ?? '—'} yrs · {patient.gender} · {patient.totalVisits} visits
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {patient.chronicTags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#E8F1F8] px-2 py-0.5 text-[10px] font-bold text-[#173F5F]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="xl:col-span-3">
            {selected ? (
              <Patient360Panel patient={selected} />
            ) : (
              <div className={`flex h-full min-h-[320px] items-center justify-center p-8 ${ccClasses.card}`}>
                <p className="text-sm font-semibold text-[#5A7A94]">Select a patient to open 360° view</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Patient360Panel({ patient }: { patient: ClinicalPatient360 }) {
  const hasAllergyAlert = !patient.allergies.includes('NKDA');

  return (
    <div className={`space-y-4 p-6 ${ccClasses.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">360° Clinical Profile</p>
          <h2 className="mt-1 text-2xl font-black text-[#173F5F]">{patient.name}</h2>
          <p className="text-sm font-semibold text-[#5A7A94]">
            {patient.uhid} · Last visit {patient.lastVisit}
          </p>
        </div>
        <Link
          href={`/doctor/patients/${patient.id}/`}
          className={`${ccClasses.btnPrimary} text-xs`}
        >
          Open Full Chart
        </Link>
      </div>

      {hasAllergyAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-[#D9534F]/30 bg-[#D9534F]/10 px-4 py-3 text-sm font-black text-[#D9534F]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          ALLERGIES: {patient.allergies.join(' · ')}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Blood Group', value: patient.bloodGroup, icon: Droplets },
          { label: 'Total Visits', value: String(patient.totalVisits), icon: Activity },
          { label: 'Appointments', value: String(patient.appointments.length), icon: Calendar },
          { label: 'Prescriptions', value: String(patient.prescriptions.length), icon: Pill },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[#E8F1F8] bg-[#F8FBFD] p-3">
            <div className="flex items-center gap-1.5 text-[#5A7A94]">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="mt-1 text-lg font-black text-[#173F5F]">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5A7A94]">Chronic Conditions</p>
        <div className="flex flex-wrap gap-2">
          {patient.chronicTags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-[#E8F1F8] bg-white px-2.5 py-1 text-xs font-bold text-[#173F5F]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TimelineColumn
          title="Recent Appointments"
          icon={Calendar}
          empty="No appointments on record"
          items={patient.appointments.slice(0, 5).map((row) => ({
            id: String(row.id ?? row.appointment_id ?? Math.random()),
            primary: String(row.chief_complaint ?? row.reason ?? row.status ?? 'Appointment'),
            secondary: String(row.appointment_date ?? row.created_at ?? '—'),
          }))}
        />
        <TimelineColumn
          title="Consultations"
          icon={Stethoscope}
          empty="No consultations on record"
          items={patient.consultations.slice(0, 5).map((row) => ({
            id: String(row.id ?? Math.random()),
            primary: String(row.diagnosis ?? row.chief_complaint ?? 'Consultation'),
            secondary: String(row.consultation_date ?? row.created_at ?? '—'),
          }))}
        />
        <TimelineColumn
          title="Prescriptions"
          icon={FileText}
          empty="No prescriptions on record"
          items={patient.prescriptions.slice(0, 5).map((row) => ({
            id: String(row.id ?? Math.random()),
            primary: String(row.medication ?? row.drug_name ?? row.status ?? 'Prescription'),
            secondary: String(row.created_at ?? row.issued_at ?? '—'),
          }))}
        />
      </div>

      {(patient.phone || patient.email) && (
        <div className="rounded-xl border border-[#E8F1F8] bg-[#F8FBFD] p-4 text-xs font-semibold text-[#5A7A94]">
          {patient.phone && <p>Phone: {patient.phone}</p>}
          {patient.email && <p className="mt-1">Email: {patient.email}</p>}
        </div>
      )}
    </div>
  );
}

function TimelineColumn({
  title,
  icon: Icon,
  empty,
  items,
}: {
  title: string;
  icon: typeof Calendar;
  empty: string;
  items: { id: string; primary: string; secondary: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#E8F1F8] p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[#20639B]" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A7A94]">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs font-semibold text-[#5A7A94]">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-[#E8F1F8]">
              <p className="truncate text-xs font-bold text-[#173F5F]">{item.primary}</p>
              <p className="text-[10px] font-semibold text-[#5A7A94]">{item.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PatientRegistry;
