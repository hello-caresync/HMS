'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  Download,
  FileImage,
  FlaskConical,
  GitCompare,
  History,
  ScanLine,
  ShieldCheck,
  TestTubeDiagonal,
} from 'lucide-react';

import {
  PatientHeaderBadge,
  PatientStatusBanner,
  patientVerifiedChipClass,
} from '@/components/patient/PatientStatusBanner';
import { formatHeaderBadge, formatRadiologyStatus, patientToastCopy } from '@/lib/patient/status-copy';

type LabReportStatus = 'Verified' | 'Pending Review';

type LabMetric = {
  label: string;
  value: string;
  unit: string;
  reference: string;
};

type LabReport = {
  id: string;
  panelName: string;
  category: 'Blood' | 'ECG';
  collectedDate: string;
  verificationKey: string;
  status: LabReportStatus;
  metrics: LabMetric[];
};

type RadiologyModality = 'X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound';

type RadiologyReport = {
  id: string;
  modality: RadiologyModality;
  studyName: string;
  studyDate: string;
  facility: string;
  protocolNotes: string;
  status: 'REPORT_READY_VERIFIED' | 'Pending Review';
};

type BiomarkerKey = 'HbA1c' | 'LDL Cholesterol' | 'Hemoglobin' | 'Total Cholesterol';

type BiomarkerSnapshot = {
  period: string;
  date: string;
  value: number;
  unit: string;
};

type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  type: 'Pathology' | 'Radiology' | 'ECG';
  detail: string;
};

const PANEL_CLASS = 'rounded-2xl border border-[#f0d8dc] bg-white p-6 shadow-sm';

const RADIOLOGY_CARD_CLASS =
  'rounded-xl border border-[#f0d8dc] bg-white p-5 shadow-sm transition-all hover:border-[#f0d8dc]';

const BIOMARKER_OPTIONS: BiomarkerKey[] = [
  'HbA1c',
  'LDL Cholesterol',
  'Hemoglobin',
  'Total Cholesterol',
];

const BIOMARKER_HISTORY: Record<BiomarkerKey, BiomarkerSnapshot[]> = {
  HbA1c: [
    { period: 'Period A · Mar 2026', date: '22 Mar 2026', value: 6.8, unit: '%' },
    { period: 'Period B · Jul 2026', date: '08 Jul 2026', value: 6.4, unit: '%' },
  ],
  'LDL Cholesterol': [
    { period: 'Period A · Mar 2026', date: '22 Mar 2026', value: 128, unit: 'mg/dL' },
    { period: 'Period B · Jul 2026', date: '08 Jul 2026', value: 104, unit: 'mg/dL' },
  ],
  Hemoglobin: [
    { period: 'Period A · Mar 2026', date: '22 Mar 2026', value: 11.8, unit: 'g/dL' },
    { period: 'Period B · Jul 2026', date: '08 Jul 2026', value: 12.9, unit: 'g/dL' },
  ],
  'Total Cholesterol': [
    { period: 'Period A · Mar 2026', date: '22 Mar 2026', value: 218, unit: 'mg/dL' },
    { period: 'Period B · Jul 2026', date: '08 Jul 2026', value: 198, unit: 'mg/dL' },
  ],
};

const LAB_REPORTS: LabReport[] = [
  {
    id: 'lab-001',
    panelName: 'Complete Blood Count · Hemoglobin Panel',
    category: 'Blood',
    collectedDate: '08 Jul 2026',
    verificationKey: 'NX-LAB-2026-44102',
    status: 'Verified',
    metrics: [
      { label: 'Hemoglobin', value: '12.9', unit: 'g/dL', reference: '12.0 – 16.0' },
      { label: 'WBC Count', value: '7.2', unit: '×10³/µL', reference: '4.0 – 11.0' },
      { label: 'Platelet Count', value: '248', unit: '×10³/µL', reference: '150 – 400' },
    ],
  },
  {
    id: 'lab-002',
    panelName: 'Lipid Profile · Cholesterol Panel',
    category: 'Blood',
    collectedDate: '08 Jul 2026',
    verificationKey: 'NX-LAB-2026-44103',
    status: 'Verified',
    metrics: [
      { label: 'Total Cholesterol', value: '198', unit: 'mg/dL', reference: '< 200' },
      { label: 'LDL Cholesterol', value: '104', unit: 'mg/dL', reference: '< 100' },
      { label: 'HDL Cholesterol', value: '52', unit: 'mg/dL', reference: '> 40' },
      { label: 'Triglycerides', value: '142', unit: 'mg/dL', reference: '< 150' },
    ],
  },
  {
    id: 'lab-003',
    panelName: 'HbA1c · Glycemic Control Panel',
    category: 'Blood',
    collectedDate: '08 Jul 2026',
    verificationKey: 'NX-LAB-2026-44104',
    status: 'Verified',
    metrics: [
      { label: 'HbA1c', value: '6.4', unit: '%', reference: '< 5.7' },
      { label: 'Fasting Glucose', value: '108', unit: 'mg/dL', reference: '70 – 100' },
      { label: 'eAG Estimate', value: '137', unit: 'mg/dL', reference: '< 126' },
    ],
  },
  {
    id: 'lab-004',
    panelName: '12-Lead ECG · Rhythm Analysis',
    category: 'ECG',
    collectedDate: '22 Jun 2026',
    verificationKey: 'NX-ECG-2026-33102',
    status: 'Verified',
    metrics: [
      { label: 'Rhythm', value: 'Normal sinus', unit: '', reference: '60 – 100 bpm' },
      { label: 'Heart Rate', value: '72', unit: 'bpm', reference: 'Normal' },
      { label: 'QTc Interval', value: '412', unit: 'ms', reference: '< 450 ms' },
    ],
  },
];

const RADIOLOGY_REPORTS: RadiologyReport[] = [
  {
    id: 'rad-001',
    modality: 'X-Ray',
    studyName: 'Chest X-Ray · PA & Lateral',
    studyDate: '02 Jun 2026',
    facility: 'Nexora Imaging · Block B',
    protocolNotes: 'No acute cardiopulmonary abnormality · heart size WNL',
    status: 'REPORT_READY_VERIFIED',
  },
  {
    id: 'rad-002',
    modality: 'MRI',
    studyName: 'MRI Lumbar Spine · T1/T2 Sequences',
    studyDate: '18 May 2026',
    facility: 'Nexora MRI Suite · Level 3',
    protocolNotes: 'Mild L4-L5 disc desiccation · no neural compression',
    status: 'REPORT_READY_VERIFIED',
  },
  {
    id: 'rad-003',
    modality: 'CT Scan',
    studyName: 'CT Abdomen · Contrast Protocol',
    studyDate: '04 Apr 2026',
    facility: 'Nexora CT Wing',
    protocolNotes: 'Liver homogeneous · kidneys unremarkable · no mass lesion',
    status: 'REPORT_READY_VERIFIED',
  },
  {
    id: 'rad-004',
    modality: 'Ultrasound',
    studyName: 'Abdominal Ultrasound · Complete Study',
    studyDate: '12 Mar 2026',
    facility: 'Nexora Sonography Desk',
    protocolNotes: 'Gallbladder normal · no cholelithiasis · spleen normal',
    status: 'Pending Review',
  },
];

const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    id: 'tl-1',
    date: '08 Jul 2026',
    title: 'Lipid Profile · HbA1c Panel Released',
    type: 'Pathology',
    detail: 'NX-LAB-2026-44103 · verified signature clearance',
  },
  {
    id: 'tl-2',
    date: '08 Jul 2026',
    title: 'CBC · Hemoglobin Panel Released',
    type: 'Pathology',
    detail: 'NX-LAB-2026-44102 · Hb 12.9 g/dL',
  },
  {
    id: 'tl-3',
    date: '22 Jun 2026',
    title: '12-Lead ECG Rhythm Report',
    type: 'ECG',
    detail: 'NX-ECG-2026-33102 · normal sinus rhythm',
  },
  {
    id: 'tl-4',
    date: '02 Jun 2026',
    title: 'Chest X-Ray Imaging Report',
    type: 'Radiology',
    detail: 'NX-RAD-2026-22801 · PA & lateral verified',
  },
  {
    id: 'tl-5',
    date: '18 May 2026',
    title: 'MRI Lumbar Spine Study',
    type: 'Radiology',
    detail: 'NX-RAD-2026-21904 · T1/T2 sequences complete',
  },
  {
    id: 'tl-6',
    date: '04 Apr 2026',
    title: 'CT Abdomen Contrast Protocol',
    type: 'Radiology',
    detail: 'NX-RAD-2026-20118 · contrast study verified',
  },
];

const MODALITY_ICONS: Record<RadiologyModality, typeof ScanLine> = {
  'X-Ray': FileImage,
  MRI: ScanLine,
  'CT Scan': ScanLine,
  Ultrasound: TestTubeDiagonal,
};

export default function PatientDiagnosticsPage() {
  const [compareBiomarker, setCompareBiomarker] = useState<BiomarkerKey>('HbA1c');
  const [compareSelections, setCompareSelections] = useState<string[]>(['Period A · Mar 2026', 'Period B · Jul 2026']);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const compareData = useMemo(() => BIOMARKER_HISTORY[compareBiomarker], [compareBiomarker]);

  const comparisonBars = useMemo(() => {
    const selected = compareData.filter((snap) => compareSelections.includes(snap.period));
    if (selected.length < 2) return null;
    const [a, b] = selected;
    const delta = b.value - a.value;
    const pctChange = Math.round((delta / a.value) * 100);
    const maxVal = Math.max(a.value, b.value);
    return { a, b, delta, pctChange, maxVal };
  }, [compareData, compareSelections]);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const toggleCompareSelection = useCallback((period: string) => {
    setCompareSelections((prev) => {
      if (prev.includes(period)) {
        return prev.length > 1 ? prev.filter((p) => p !== period) : prev;
      }
      if (prev.length >= 2) return [prev[1]!, period];
      return [...prev, period];
    });
  }, []);

  const handleDownload = useCallback(
    (title: string) => {
      showNotice(patientToastCopy.labReportExport(title));
    },
    [showNotice],
  );

  return (
    <div className="min-h-screen w-full space-y-6 bg-[#faf6f7] p-6 font-sans text-slate-950">
      {/* Logistical hub header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#8c2b39]">
            Diagnostics Vault &amp; Imaging Suite
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Secure signature clearances active · pathology &amp; radiology vault linked · integrity
            seal NX-DIAG-2026 · 14 Jul 2026
          </p>
        </div>
        <PatientHeaderBadge
          label={formatHeaderBadge('SIGNATURE_CLEARANCE_OK')}
          tone="verified"
          icon={ShieldCheck}
        />
      </header>

      {actionNotice ? <PatientStatusBanner message={actionNotice} variant="success" /> : null}

      {/* Top metric panel — compare engine */}
      <section aria-label="Report comparison engine" className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-[#f47c8c]" aria-hidden />
          <h2 className="text-lg font-black text-[#8c2b39]">Interactive Report Comparison Engine</h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {BIOMARKER_OPTIONS.map((marker) => (
            <button
              key={marker}
              type="button"
              onClick={() => setCompareBiomarker(marker)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                compareBiomarker === marker
                  ? 'bg-[#f47c8c] text-white shadow-sm'
                  : 'bg-[#fde8eb] text-[#f47c8c] hover:bg-[#e06373]/10'
              }`}
            >
              {marker}
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Select two calendar periods to compare
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {compareData.map((snap) => (
            <button
              key={snap.period}
              type="button"
              onClick={() => toggleCompareSelection(snap.period)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                compareSelections.includes(snap.period)
                  ? 'border-[#f0d8dc] bg-[#fde8eb] text-[#8c2b39]'
                  : 'border-[#f0d8dc] bg-white text-slate-600 hover:border-[#f0d8dc]'
              }`}
            >
              {snap.period}
            </button>
          ))}
        </div>

        {comparisonBars ? (
          <div className="space-y-3">
            {[comparisonBars.a, comparisonBars.b].map((snap) => (
              <div
                key={snap.period}
                className="flex items-center justify-between rounded-xl border border-[#f0d8dc] bg-[#f47c8c]/20 p-4 text-[#8c2b39]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">{snap.period}</p>
                  <p className="text-lg font-black tabular-nums">
                    {snap.value} {snap.unit}
                  </p>
                  <p className="text-[10px] font-medium opacity-70">{snap.date}</p>
                </div>
                <div className="h-3 w-32 overflow-hidden rounded-full bg-white/60 sm:w-48">
                  <div
                    className="h-full rounded-full bg-[#f47c8c] transition-all"
                    style={{ width: `${Math.round((snap.value / comparisonBars.maxVal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-sm font-bold text-[#f47c8c]">
              {compareBiomarker} shift: {comparisonBars.delta > 0 ? '+' : ''}
              {comparisonBars.delta} {comparisonBars.a.unit} ({comparisonBars.pctChange > 0 ? '+' : ''}
              {comparisonBars.pctChange}% vs prior period)
            </p>
          </div>
        ) : null}
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — pathology & imaging (60%) */}
        <div className="space-y-6">
          <section aria-label="Blood reports and ECG" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-[#f47c8c]" aria-hidden />
              <h2 className="text-lg font-black text-[#8c2b39]">Blood Reports &amp; ECG Deck</h2>
            </div>
            <ul className="space-y-4">
              {LAB_REPORTS.map((report) => (
                <li
                  key={report.id}
                  className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{report.panelName}</h3>
                    <span className="inline-flex rounded-md border border-[#f47c8c]/20 bg-[#f47c8c]/5 px-2 py-0.5 text-[10px] font-bold uppercase text-[#8c2b39]">
                      {report.category}
                    </span>
                    {report.status === 'Verified' ? (
                      <span className={patientVerifiedChipClass}>✓ Verified</span>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-800">
                        Pending Review
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[10px] font-bold text-[#f47c8c]">
                    {report.verificationKey} · {report.collectedDate}
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[300px] border-collapse text-sm">
                      <tbody>
                        {report.metrics.map((metric) => (
                          <tr key={metric.label} className="border-b border-[#f0d8dc]">
                            <td className="py-2 pr-3 font-bold text-slate-800">{metric.label}</td>
                            <td className="py-2 pr-3 font-black tabular-nums text-[#f47c8c]">
                              {metric.value} {metric.unit}
                            </td>
                            <td className="py-2 text-xs font-medium text-slate-500">
                              {metric.reference}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Radiology suite" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-[#f47c8c]" aria-hidden />
              <h2 className="text-lg font-black text-[#8c2b39]">Radiology Suite</h2>
            </div>
            <ul className="space-y-4">
              {RADIOLOGY_REPORTS.map((study) => {
                const ModalityIcon = MODALITY_ICONS[study.modality];
                return (
                  <li key={study.id} className={RADIOLOGY_CARD_CLASS}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-[#f0d8dc] bg-[#fde8eb] p-2.5 text-[#8c2b39]">
                        <ModalityIcon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#8c2b39]">
                            {study.modality}
                          </span>
                          {study.status === 'REPORT_READY_VERIFIED' ? (
                            <span className={patientVerifiedChipClass}>
                              {formatRadiologyStatus(study.status)}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-1 text-sm font-black text-slate-900">{study.studyName}</h3>
                        <p className="mt-0.5 text-xs font-bold text-slate-600">
                          {study.studyDate} · {study.facility}
                        </p>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">
                          {study.protocolNotes}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDownload(study.studyName)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#f47c8c] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          Download Verified Report PDF
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Right column — timeline spine (40%) */}
        <aside aria-label="Diagnostic timeline" className={PANEL_CLASS}>
          <div className="mb-5 flex items-center gap-2">
            <History className="h-5 w-5 text-[#f47c8c]" aria-hidden />
            <h2 className="text-lg font-black text-[#8c2b39]">Longitudinal Report Timeline</h2>
          </div>

          <div className="relative pl-6">
            <div
              className="absolute left-3 top-2 h-[calc(100%-0.5rem)] border-l-2 border-[#f0d8dc]"
              aria-hidden
            />
            <ol className="space-y-5">
              {TIMELINE_ENTRIES.map((entry) => (
                <li key={entry.id} className="relative">
                  <span
                    className="absolute -left-[1.15rem] top-2 h-3 w-3 rounded-full border-2 border-white bg-[#f47c8c] shadow-sm"
                    aria-hidden
                  />
                  <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black text-[#8c2b39]">{entry.date}</p>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          entry.type === 'Pathology'
                            ? 'bg-[#fde8eb] text-[#f47c8c]'
                            : entry.type === 'ECG'
                              ? 'bg-[#f47c8c]/5 text-[#8c2b39]'
                              : 'bg-[#fde8eb] text-[#f47c8c]'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-900">{entry.title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{entry.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 rounded-xl border border-[#f0d8dc] bg-[#fde8eb] p-4">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#8c2b39]">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Compare Engine Active
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Tracking {compareBiomarker} across {compareSelections.length} selected periods
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
