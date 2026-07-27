'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileText,
  HeartPulse,
  Pill,
  ScanLine,
  TestTubeDiagonal,
} from 'lucide-react';

import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatRadiologyStatus, patientToastCopy } from '@/lib/patient/status-copy';

type RecordsTab = 'emr' | 'prescription' | 'diagnostic';

type DiagnosisRecord = {
  id: string;
  condition: string;
  since: string;
  status: string;
};

type AllergyRecord = {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'Critical' | 'Moderate';
};

type FamilyHistoryRecord = {
  id: string;
  relation: string;
  condition: string;
};

type PrescriptionRecord = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  reminderLabel: string;
};

type LabTrend = {
  id: string;
  marker: string;
  unit: string;
  values: { month: string; value: number; max: number }[];
};

type RadiologyRecord = {
  id: string;
  modality: string;
  studyDate: string;
  facility: string;
  status: 'REPORT_READY_VERIFIED' | 'Pending Review';
};

const CARD_CLASS =
  'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const TAB_OPTIONS: { id: RecordsTab; label: string; icon: typeof FileText }[] = [
  { id: 'emr', label: 'EMR Clinical Profile', icon: HeartPulse },
  { id: 'prescription', label: 'Prescription Companion', icon: Pill },
  { id: 'diagnostic', label: 'Diagnostic Test Vault', icon: TestTubeDiagonal },
];

const DIAGNOSES: DiagnosisRecord[] = [
  { id: 'dx-1', condition: 'Essential Hypertension', since: '2022', status: 'Controlled · Ongoing' },
  { id: 'dx-2', condition: 'Type 2 Diabetes Mellitus', since: '2023', status: 'Managed · HbA1c 6.4%' },
  { id: 'dx-3', condition: 'Mild Iron Deficiency Anemia', since: '2025', status: 'Supplement protocol active' },
];

const ALLERGIES: AllergyRecord[] = [
  { id: 'al-1', allergen: 'Penicillin', reaction: 'Urticaria · bronchospasm risk', severity: 'Critical' },
  { id: 'al-2', allergen: 'Shellfish', reaction: 'Angioedema', severity: 'Critical' },
  { id: 'al-3', allergen: 'Latex', reaction: 'Contact dermatitis', severity: 'Moderate' },
];

const FAMILY_HISTORY: FamilyHistoryRecord[] = [
  { id: 'fh-1', relation: 'Mother', condition: 'Hypothyroidism · diagnosed age 42' },
  { id: 'fh-2', relation: 'Father', condition: 'Coronary artery disease · CABG 2019' },
  { id: 'fh-3', relation: 'Sibling', condition: 'No chronic conditions reported' },
];

const PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: 'rx-1',
    medication: 'Metformin 500 mg',
    dosage: '1 tablet',
    frequency: 'Twice daily · with meals',
    reminderLabel: 'Medicine Reminder Active · next dose 8:00 PM',
  },
  {
    id: 'rx-2',
    medication: 'Amlodipine 5 mg',
    dosage: '1 tablet',
    frequency: 'Once daily · morning',
    reminderLabel: 'Medicine Reminder Active · next dose 7:30 AM',
  },
  {
    id: 'rx-3',
    medication: 'Vitamin D3 60K IU',
    dosage: '1 capsule',
    frequency: 'Once weekly · Sunday',
    reminderLabel: 'Medicine Reminder Active · next dose Sun 9:00 AM',
  },
  {
    id: 'rx-4',
    medication: 'Atorvastatin 10 mg',
    dosage: '1 tablet',
    frequency: 'Once daily · bedtime',
    reminderLabel: 'Medicine Reminder Active · next dose 10:00 PM',
  },
];

const LAB_TRENDS: LabTrend[] = [
  {
    id: 'lab-1',
    marker: 'Hemoglobin',
    unit: 'g/dL',
    values: [
      { month: 'Jan', value: 11.2, max: 16 },
      { month: 'Mar', value: 11.8, max: 16 },
      { month: 'May', value: 12.4, max: 16 },
      { month: 'Jul', value: 12.9, max: 16 },
    ],
  },
  {
    id: 'lab-2',
    marker: 'LDL Cholesterol',
    unit: 'mg/dL',
    values: [
      { month: 'Jan', value: 142, max: 160 },
      { month: 'Mar', value: 128, max: 160 },
      { month: 'May', value: 118, max: 160 },
      { month: 'Jul', value: 104, max: 160 },
    ],
  },
];

const RADIOLOGY_LOGS: RadiologyRecord[] = [
  {
    id: 'rad-1',
    modality: 'Chest X-Ray · PA View',
    studyDate: '02 Jun 2026',
    facility: 'Nexora Imaging · Block B',
    status: 'REPORT_READY_VERIFIED',
  },
  {
    id: 'rad-2',
    modality: 'MRI Lumbar Spine',
    studyDate: '18 May 2026',
    facility: 'Nexora MRI Suite',
    status: 'REPORT_READY_VERIFIED',
  },
  {
    id: 'rad-3',
    modality: 'CT Abdomen · Contrast',
    studyDate: '04 Apr 2026',
    facility: 'Nexora CT Wing',
    status: 'Pending Review',
  },
];

export default function PatientRecordsPage() {
  const [activeTab, setActiveTab] = useState<RecordsTab>('emr');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownloadPdf = () => {
    setDownloadNotice(patientToastCopy.healthRecordGenerated);
    window.setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="min-h-full w-full space-y-6 font-sans text-patient-charcoal">
      {/* Suite header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-black text-patient-plum">
          Personal Health Chart &amp; Diagnostic Records
        </h1>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-2 rounded-xl border border-patient-lavender/30 bg-patient-card px-4 py-2.5 text-sm font-bold text-patient-primary transition-all hover:bg-patient-lavender/25"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download Complete Health Record PDF
        </button>
      </header>

      {downloadNotice ? (
        <PatientStatusBanner message={downloadNotice} variant="success" />
      ) : null}

      {/* Tab navigation */}
      <nav aria-label="Records sections" className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-patient-primary text-white shadow-sm'
                : 'border border-patient-lavender/30 bg-white text-patient-lavender hover:bg-patient-lavender/10/80 hover:text-patient-plum'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {/* EMR Clinical Profile */}
      {activeTab === 'emr' ? (
        <section aria-label="EMR clinical profile" className={`space-y-4 ${CARD_CLASS}`}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-patient-plum">
                Diagnoses
              </h2>
              <ul className="space-y-2">
                {DIAGNOSES.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-3"
                  >
                    <p className="font-bold text-patient-charcoal">{item.condition}</p>
                    <p className="mt-1 text-xs font-medium text-patient-lavender">
                      Since {item.since} · {item.status}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-patient-plum">
                <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />
                Allergies
              </h2>
              <ul className="space-y-2">
                {ALLERGIES.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 font-bold text-rose-700"
                  >
                    <p>{item.allergen}</p>
                    <p className="mt-1 text-xs font-bold opacity-90">{item.reaction}</p>
                    <span className="mt-2 inline-flex rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase">
                      {item.severity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-patient-plum">
              Family History Summary
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FAMILY_HISTORY.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-patient-lavender/30 bg-white p-3 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-patient-primary">
                    {item.relation}
                  </p>
                  <p className="mt-1 text-sm font-bold text-patient-charcoal">{item.condition}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Prescription Companion */}
      {activeTab === 'prescription' ? (
        <section aria-label="Prescription companion" className={CARD_CLASS}>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-patient-plum">
            Active Daily Medicines
          </h2>
          <ul className="space-y-4">
            {PRESCRIPTIONS.map((rx) => (
              <li
                key={rx.id}
                className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-black text-patient-charcoal">{rx.medication}</p>
                    <p className="mt-1 text-sm font-bold text-patient-charcoal">
                      {rx.dosage} · {rx.frequency}
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-patient-lavender/30 bg-patient-card px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-patient-primary">
                      {rx.reminderLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-bold text-patient-primary hover:underline"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Download Rx PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Diagnostic Test Vault */}
      {activeTab === 'diagnostic' ? (
        <section aria-label="Diagnostic test vault" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <TestTubeDiagonal className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-sm font-black uppercase tracking-wider text-patient-plum">
                Laboratory Blood Counts
              </h2>
            </div>
            <div className="space-y-6">
              {LAB_TRENDS.map((trend) => (
                <div key={trend.id}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="text-sm font-black text-patient-charcoal">{trend.marker}</p>
                    <p className="text-xs font-bold text-patient-lavender">{trend.unit}</p>
                  </div>
                  <div className="space-y-2">
                    {trend.values.map((point) => (
                      <div key={point.month} className="flex items-center gap-3">
                        <span className="w-8 text-[10px] font-bold text-patient-lavender">{point.month}</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-patient-primary transition-all"
                            style={{ width: `${Math.round((point.value / point.max) * 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs font-black tabular-nums text-patient-primary">
                          {point.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-sm font-black uppercase tracking-wider text-patient-plum">
                Radiology Data Sheets
              </h2>
            </div>
            <ul className="space-y-3">
              {RADIOLOGY_LOGS.map((study) => (
                <li
                  key={study.id}
                  className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4"
                >
                  <p className="font-black text-patient-charcoal">{study.modality}</p>
                  <p className="mt-1 text-xs font-bold text-patient-lavender">
                    {study.studyDate} · {study.facility}
                  </p>
                  <span
                    className={`mt-2 ${
                      study.status === 'REPORT_READY_VERIFIED'
                        ? 'inline-flex rounded-full border border-patient-primary/40 bg-patient-card px-3 py-1 text-xs font-semibold tracking-wide text-[#15803d]'
                        : 'inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800'
                    }`}
                  >
                    {formatRadiologyStatus(study.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
