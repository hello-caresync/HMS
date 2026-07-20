'use client';

import { useState } from 'react';
import {
  Activity,
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  ScanLine,
  Stethoscope,
} from 'lucide-react';

type EmrCategory = 'baseline' | 'encounters' | 'interventions' | 'diagnostics';

type PreviousVisit = {
  id: string;
  date: string;
  department: string;
  reason: string;
  provider: string;
};

type AllergyRecord = {
  id: string;
  allergen: string;
  severity: 'Critical' | 'Moderate';
  reaction: string;
};

type VaccinationRecord = {
  id: string;
  vaccine: string;
  date: string;
  dose: string;
};

type ChronicDiseaseRecord = {
  id: string;
  condition: string;
  since: string;
  status: string;
};

type PrescriptionRecord = {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  duration: string;
};

type SurgeryRecord = {
  id: string;
  date: string;
  procedure: string;
  facility: string;
};

type AdmissionRecord = {
  id: string;
  admitDate: string;
  dischargeDate: string;
  ward: string;
  diagnosis: string;
};

type LabReportRecord = {
  id: string;
  date: string;
  testName: string;
  result: string;
  status: 'Final' | 'Pending Review';
};

type RadiologyReportRecord = {
  id: string;
  date: string;
  study: string;
  impression: string;
};

type ProgressNoteRecord = {
  id: string;
  date: string;
  author: string;
  summary: string;
  body: string;
};

type DischargeSummaryRecord = {
  id: string;
  date: string;
  title: string;
  snippet: string;
};

const ARCHIVAL_SUMMARY =
  'Isolated read-only vault · single patient chart · sandbox initials · no cross-tester PII · archival index NX-2026-301882 · 13 Jul 2026';

const PATIENT = {
  initials: 'P.N.',
  uhid: 'NX-2026-301882',
  age: 35,
  gender: 'Female',
};

const NAV_ITEMS: { id: EmrCategory; label: string; icon: typeof HeartPulse }[] = [
  { id: 'baseline', label: 'Baseline Profile', icon: HeartPulse },
  { id: 'encounters', label: 'Encounters', icon: Stethoscope },
  { id: 'interventions', label: 'Interventions', icon: Pill },
  { id: 'diagnostics', label: 'Diagnostics', icon: FlaskConical },
];

const PREVIOUS_VISITS: PreviousVisit[] = [
  {
    id: 'v-1',
    date: '2026-06-12',
    department: 'General Medicine',
    reason: 'Fever · URI symptoms',
    provider: 'Dr. Sandbox · MD',
  },
  {
    id: 'v-2',
    date: '2026-03-04',
    department: 'Cardiology',
    reason: 'Hypertension follow-up',
    provider: 'Dr. Sandbox · MD',
  },
  {
    id: 'v-3',
    date: '2025-11-18',
    department: 'Endocrinology',
    reason: 'Diabetes review · HbA1c',
    provider: 'Dr. Sandbox · MD',
  },
];

const ALLERGIES: AllergyRecord[] = [
  { id: 'a-1', allergen: 'Penicillin', severity: 'Critical', reaction: 'Anaphylaxis risk' },
  { id: 'a-2', allergen: 'Sulfa drugs', severity: 'Moderate', reaction: 'Rash · urticaria' },
];

const VACCINATIONS: VaccinationRecord[] = [
  { id: 'vac-1', vaccine: 'Influenza (IIV4)', date: '2025-10-01', dose: '0.5 mL IM' },
  { id: 'vac-2', vaccine: 'COVID-19 Booster', date: '2025-08-14', dose: 'Booster dose' },
  { id: 'vac-3', vaccine: 'Tdap', date: '2023-05-22', dose: '0.5 mL IM' },
];

const CHRONIC_DISEASES: ChronicDiseaseRecord[] = [
  { id: 'c-1', condition: 'Type 2 Diabetes Mellitus', since: '2019', status: 'Active · monitored' },
  { id: 'c-2', condition: 'Essential Hypertension', since: '2021', status: 'Active · controlled' },
];

const PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: 'rx-1',
    date: '2026-06-12',
    medication: 'Metformin 500 mg',
    dosage: '1 tab BID',
    duration: '90 days',
  },
  {
    id: 'rx-2',
    date: '2026-06-12',
    medication: 'Amlodipine 5 mg',
    dosage: '1 tab OD',
    duration: '90 days',
  },
  {
    id: 'rx-3',
    date: '2026-03-04',
    medication: 'Atorvastatin 10 mg',
    dosage: '1 tab HS',
    duration: '90 days',
  },
];

const SURGERIES: SurgeryRecord[] = [
  {
    id: 'sx-1',
    date: '2022-08-09',
    procedure: 'Appendectomy · laparoscopic',
    facility: 'Nexora Sandbox Surgical Unit',
  },
];

const ADMISSIONS: AdmissionRecord[] = [
  {
    id: 'adm-1',
    admitDate: '2024-01-14',
    dischargeDate: '2024-01-18',
    ward: 'General Ward · 3A',
    diagnosis: 'Acute gastroenteritis · dehydration',
  },
];

const LAB_REPORTS: LabReportRecord[] = [
  {
    id: 'lab-1',
    date: '2026-06-10',
    testName: 'HbA1c',
    result: '7.2 %',
    status: 'Final',
  },
  {
    id: 'lab-2',
    date: '2026-06-10',
    testName: 'Complete Blood Count',
    result: 'Within reference · Hb 12.8 g/dL',
    status: 'Final',
  },
  {
    id: 'lab-3',
    date: '2026-03-01',
    testName: 'Lipid Panel',
    result: 'LDL 118 mg/dL · pending lifestyle review',
    status: 'Pending Review',
  },
];

const RADIOLOGY_REPORTS: RadiologyReportRecord[] = [
  {
    id: 'rad-1',
    date: '2025-09-22',
    study: 'Chest X-Ray · PA view',
    impression: 'No acute cardiopulmonary abnormality',
  },
  {
    id: 'rad-2',
    date: '2024-01-15',
    study: 'Abdominal Ultrasound',
    impression: 'Unremarkable hepatobiliary study · sandbox read',
  },
];

const PROGRESS_NOTES: ProgressNoteRecord[] = [
  {
    id: 'pn-1',
    date: '2026-06-12',
    author: 'Dr. Sandbox · MD',
    summary: 'OPD review · URI · vitals stable',
    body: 'Patient presented with 3-day fever and cough. Lungs clear. Advised hydration and symptomatic care. Sandbox narrative only.',
  },
  {
    id: 'pn-2',
    date: '2026-03-04',
    author: 'Dr. Sandbox · MD',
    summary: 'Hypertension follow-up · BP improved',
    body: 'Home BP log reviewed. Continue amlodipine. Lifestyle counseling reinforced. No edema.',
  },
];

const DISCHARGE_SUMMARIES: DischargeSummaryRecord[] = [
  {
    id: 'dc-1',
    date: '2024-01-18',
    title: 'Discharge Summary · GEN-3A Admission',
    snippet:
      'Admitted for acute gastroenteritis. IV fluids completed. Tolerating oral intake. Discharged stable with oral rehydration advice.',
  },
];

export default function EmrHistoricalVaultPage() {
  const [activeCategory, setActiveCategory] = useState<EmrCategory>('baseline');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(PROGRESS_NOTES[0]?.id ?? null);
  const [viewNotice, setViewNotice] = useState<string | null>(null);

  const showViewNotice = (label: string) => {
    setViewNotice(`${label} · read-only sandbox preview · no file download in isolation mode`);
    window.setTimeout(() => setViewNotice(null), 4000);
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Archive header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Patient Electronic Medical Record Vault
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {ARCHIVAL_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Active chart · {PATIENT.initials} · {PATIENT.uhid} · {PATIENT.age} yrs ·{' '}
              {PATIENT.gender}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Archive className="h-4 w-4 text-slate-800" aria-hidden />
            <span>EMR_SECURE_READ_ONLY</span>
          </div>
        </header>

        {viewNotice && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {viewNotice}
          </p>
        )}

        {/* Split viewport */}
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          {/* Left navigation */}
          <nav
            aria-label="EMR category navigation"
            className="w-full space-y-2 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-3 shadow-sm sm:p-4"
          >
            <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-800">
              Chart Sections
            </p>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCategory(id)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-3 text-left text-sm font-bold transition-colors ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right records canvas */}
          <main className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
            {activeCategory === 'baseline' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Baseline Profile</h2>
                  <p className="text-xs font-medium text-slate-800">
                    Allergies · chronic conditions · vaccination registry
                  </p>
                </div>

                <section className="rounded-xl border-2 border-red-400 bg-red-50 p-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-red-950">
                    Critical Allergies
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {ALLERGIES.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border-2 border-red-400 bg-white p-3"
                      >
                        <p className="text-sm font-black text-red-950">{item.allergen}</p>
                        <p className="mt-1 text-xs font-bold text-red-900">{item.reaction}</p>
                        <span className="mt-2 inline-flex rounded-md border border-red-400 bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-950">
                          {item.severity}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Chronic Conditions
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {CHRONIC_DISEASES.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border-2 border-slate-300 bg-white p-3"
                      >
                        <p className="text-sm font-black text-slate-950">{item.condition}</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">Since · {item.since}</p>
                        <p className="mt-1 text-xs font-bold text-slate-950">{item.status}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Vaccinations
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-100">
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                            Vaccine
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                            Dose
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {VACCINATIONS.map((row) => (
                          <tr key={row.id} className="border-b-2 border-slate-200">
                            <td className="px-3 py-2.5 font-bold text-slate-950">{row.vaccine}</td>
                            <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                              {row.date}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-950">{row.dose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'encounters' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Encounters</h2>
                  <p className="text-xs font-medium text-slate-800">
                    Previous visits · progress notes · discharge summaries
                  </p>
                </div>

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Previous Visits Timeline
                  </h3>
                  <ol className="relative mt-4 space-y-4 border-l-2 border-slate-200 pl-6">
                    {PREVIOUS_VISITS.map((visit) => (
                      <li key={visit.id} className="relative">
                        <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-white" />
                        <article className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3">
                          <p className="font-mono text-xs font-black text-slate-950">{visit.date}</p>
                          <p className="mt-1 text-sm font-black text-slate-950">{visit.department}</p>
                          <p className="text-xs font-bold text-slate-800">{visit.reason}</p>
                          <p className="mt-1 text-xs font-bold text-slate-950">{visit.provider}</p>
                        </article>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Progress Notes
                  </h3>
                  <div className="mt-3 space-y-2">
                    {PROGRESS_NOTES.map((note) => {
                      const expanded = expandedNoteId === note.id;
                      return (
                        <article
                          key={note.id}
                          className="overflow-hidden rounded-lg border-2 border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNoteId(expanded ? null : note.id)
                            }
                            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50"
                          >
                            <div>
                              <p className="font-mono text-xs font-black text-slate-950">
                                {note.date}
                              </p>
                              <p className="text-sm font-black text-slate-950">{note.summary}</p>
                              <p className="text-xs font-bold text-slate-800">{note.author}</p>
                            </div>
                            {expanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                            )}
                          </button>
                          {expanded && (
                            <div className="border-t-2 border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-950">
                              {note.body}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Discharge Summaries
                  </h3>
                  <div className="mt-3 space-y-3">
                    {DISCHARGE_SUMMARIES.map((doc) => (
                      <article
                        key={doc.id}
                        className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs font-black text-slate-950">{doc.date}</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{doc.title}</p>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-800">
                              {doc.snippet}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => showViewNotice(doc.title)}
                            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-950 hover:bg-slate-100"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden />
                            Download Snippet
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'interventions' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Interventions</h2>
                  <p className="text-xs font-medium text-slate-800">
                    Prescriptions · surgeries · admission history
                  </p>
                </div>

                <section className="overflow-x-auto">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-950">
                    Past Prescriptions
                  </h3>
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Medication
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Dosage
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRESCRIPTIONS.map((row) => (
                        <tr key={row.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.date}
                          </td>
                          <td className="px-3 py-2.5 font-black text-slate-950">{row.medication}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.dosage}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="overflow-x-auto">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-950">
                    Surgical History
                  </h3>
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Procedure
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Facility
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SURGERIES.map((row) => (
                        <tr key={row.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.date}
                          </td>
                          <td className="px-3 py-2.5 font-black text-slate-950">{row.procedure}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.facility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="overflow-x-auto">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-950">
                    Admission Timeline
                  </h3>
                  <table className="w-full min-w-[620px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Admit
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Discharge
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Ward
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Diagnosis
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ADMISSIONS.map((row) => (
                        <tr key={row.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.admitDate}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.dischargeDate}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.ward}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.diagnosis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {activeCategory === 'diagnostics' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Diagnostics</h2>
                  <p className="text-xs font-medium text-slate-800">
                    Laboratory and radiology report archive
                  </p>
                </div>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-slate-950" aria-hidden />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                      Lab Reports
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {LAB_REPORTS.map((report) => (
                      <li
                        key={report.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="font-mono text-xs font-black text-slate-950">{report.date}</p>
                          <p className="text-sm font-black text-slate-950">{report.testName}</p>
                          <p className="text-xs font-bold text-slate-800">{report.result}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${
                              report.status === 'Final'
                                ? 'border-emerald-400 bg-emerald-100 text-emerald-950'
                                : 'border-amber-400 bg-amber-100 text-amber-950'
                            }`}
                          >
                            {report.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => showViewNotice(report.testName)}
                            className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-950 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            View File
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-slate-950" aria-hidden />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                      Radiology Reports
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {RADIOLOGY_REPORTS.map((report) => (
                      <li
                        key={report.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="font-mono text-xs font-black text-slate-950">{report.date}</p>
                          <p className="text-sm font-black text-slate-950">{report.study}</p>
                          <p className="text-xs font-bold text-slate-800">{report.impression}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => showViewNotice(report.study)}
                          className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-950 hover:bg-slate-100"
                        >
                          <FileText className="h-3.5 w-3.5" aria-hidden />
                          View File
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
                  <Activity className="h-4 w-4 text-slate-950" aria-hidden />
                  <span>Diagnostics index · read-only · sandbox isolation enforced</span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
