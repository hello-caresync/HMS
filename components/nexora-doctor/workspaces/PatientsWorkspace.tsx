'use client';

import { useState } from 'react';
import {
  AlertCircle,
  FileText,
  FlaskConical,
  Heart,
  Pill,
  Scan,
  User,
} from 'lucide-react';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, FilterTabs, SearchBar, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { usePatient, usePatients } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'follow-up', label: 'Follow-up' },
];

export function PatientsWorkspace() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const selectedId = useDoctorClinicalStore((s) => s.selectedPatientId);
  const setSelectedPatient = useDoctorClinicalStore((s) => s.setSelectedPatient);
  const patients = usePatients(search, filter);
  const patient = usePatient(selectedId ?? patients[0]?.id ?? null);

  return (
    <div className={ui.page}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Patients</h1>
          <p className={ui.pageSubtitle}>{patients.length} assigned patients</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, MRN, diagnosis…" />
      </div>

      <div className="mb-6">
        <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${ui.card} lg:col-span-1 max-h-[70vh] overflow-y-auto`}>
          <SectionHeader title="Patient List" />
          {patients.length === 0 ? (
            <EmptyState title="No patients found" />
          ) : (
            <ul className="space-y-2">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(p.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      patient?.id === p.id ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-900">{p.fullName}</p>
                    <p className="text-xs text-slate-500">{p.mrn} · {p.age}y · {p.gender}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {patient ? (
          <div className="space-y-6 lg:col-span-2">
            <section className={ui.card}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                  <User className="h-7 w-7 text-teal-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{patient.fullName}</h2>
                  <p className="text-sm text-slate-500">{patient.mrn} · {patient.age}y · {patient.gender} · {patient.bloodGroup}</p>
                  {patient.diagnosis && <p className="mt-1 text-sm text-teal-800">{patient.diagnosis}</p>}
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className={ui.card}>
                <SectionHeader title="Vitals" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Vital label="BP" value={patient.vitals.bp} />
                  <Vital label="HR" value={patient.vitals.hr} />
                  <Vital label="Temp" value={patient.vitals.temp} />
                  <Vital label="SpO₂" value={patient.vitals.spo2} />
                </div>
              </section>

              <section className={ui.card}>
                <SectionHeader title="Allergies" />
                {patient.allergies.length === 0 ? (
                  <p className="text-sm text-slate-500">No known allergies</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3 w-3" /> {a}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className={ui.card}>
              <SectionHeader title="Current Medications" />
              <ul className="space-y-2">
                {patient.medications.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <Pill className="h-4 w-4 text-teal-600" />
                    <span>{m.name} — {m.dose} {m.frequency}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={ui.card}>
              <SectionHeader title="Medical History" />
              <p className="text-sm text-slate-600">{patient.chronicConditions.join(' · ') || 'None recorded'}</p>
            </section>

            <section className={ui.card}>
              <SectionHeader title="Previous Visits" />
              <ul className="space-y-3">
                {patient.visits.map((v) => (
                  <li key={v.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                    <p className="font-medium text-slate-900">{v.date} — {v.type}</p>
                    <p className="text-slate-600">{v.summary}</p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className={ui.card}>
                <SectionHeader title="Lab Reports" />
                {patient.labReports.map((l) => (
                  <div key={l.id} className="mb-2 flex items-center gap-2 text-sm">
                    <FlaskConical className="h-4 w-4 text-amber-600" />
                    <span>{l.test}: {l.result}</span>
                  </div>
                ))}
              </section>
              <section className={ui.card}>
                <SectionHeader title="Radiology" />
                {patient.radiologyReports.length === 0 ? (
                  <p className="text-sm text-slate-500">No reports</p>
                ) : (
                  patient.radiologyReports.map((r) => (
                    <div key={r.id} className="mb-2 flex items-start gap-2 text-sm">
                      <Scan className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div><p className="font-medium">{r.study}</p><p className="text-slate-600">{r.findings}</p></div>
                    </div>
                  ))
                )}
              </section>
            </div>

            <section className={ui.card}>
              <SectionHeader title="Timeline" />
              <ul className="space-y-2">
                {[...patient.visits, ...patient.labReports.map((l) => ({ id: l.id, date: l.orderedAt, label: `Lab: ${l.test}` }))].map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <Heart className="h-3.5 w-3.5 text-slate-400" />
                    {'label' in item ? item.label : `${item.date} — ${item.type}`}
                  </li>
                ))}
              </ul>
            </section>

            {patient.documents.length > 0 && (
              <section className={ui.card}>
                <SectionHeader title="Documents" />
                {patient.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-slate-500" />
                    {d.title}
                  </div>
                ))}
              </section>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="Select a patient" description="Choose a patient from the list to view their profile." />
          </div>
        )}
      </div>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}
