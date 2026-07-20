'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  GitCompare,
  Plus,
  Search,
  TestTube2,
} from 'lucide-react';

type LabFilter = 'order' | 'pending' | 'completed';

type PendingTest = {
  id: string;
  orderId: string;
  patientInitials: string;
  testName: string;
  orderedAt: string;
  status: 'Processing' | 'Sample Collected' | 'Awaiting Review';
};

type CompletedReport = {
  id: string;
  orderId: string;
  patientInitials: string;
  testName: string;
  completedAt: string;
  resultSummary: string;
  flag: 'Critical' | 'Normal' | 'Borderline';
};

type TrendSeries = {
  id: 'hba1c' | 'creatinine';
  label: string;
  unit: string;
  points: { month: string; value: number }[];
  referenceMax: number;
};

type CriticalAlert = {
  id: string;
  analyte: string;
  value: string;
  detail: string;
};

const ROUTING_SUMMARY =
  'Standalone diagnostic routing · sandbox initials · order · queue · trend analytics · 13 Jul 2026';

const TEST_PACKAGES = [
  'Full Executive Panel',
  'Lipid Profile',
  'CBC',
  'LFT Panel',
  'Renal Function Panel',
  'HbA1c Single Test',
];

const FORMULARY_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Serum Creatinine',
  'HbA1c',
  'LFT Panel',
  'Thyroid Profile (TSH, T4)',
  'Urine Routine',
  'Electrolyte Panel',
];

const PENDING_TESTS: PendingTest[] = [
  {
    id: 'p-1',
    orderId: 'LAB-ORD-2401',
    patientInitials: 'P.N.',
    testName: 'HbA1c',
    orderedAt: '2026-07-13 08:40',
    status: 'Processing',
  },
  {
    id: 'p-2',
    orderId: 'LAB-ORD-2402',
    patientInitials: 'R.S.',
    testName: 'Lipid Profile',
    orderedAt: '2026-07-13 09:05',
    status: 'Sample Collected',
  },
  {
    id: 'p-3',
    orderId: 'LAB-ORD-2403',
    patientInitials: 'K.V.',
    testName: 'Electrolyte Panel',
    orderedAt: '2026-07-13 09:22',
    status: 'Awaiting Review',
  },
];

const COMPLETED_REPORTS: CompletedReport[] = [
  {
    id: 'c-1',
    orderId: 'LAB-ORD-2390',
    patientInitials: 'P.N.',
    testName: 'Serum Creatinine',
    completedAt: '2026-07-12',
    resultSummary: '1.1 mg/dL · within reference',
    flag: 'Normal',
  },
  {
    id: 'c-2',
    orderId: 'LAB-ORD-2388',
    patientInitials: 'K.V.',
    testName: 'Electrolyte Panel',
    completedAt: '2026-07-11',
    resultSummary: 'K+ 2.8 mEq/L · CRITICAL LOW',
    flag: 'Critical',
  },
  {
    id: 'c-3',
    orderId: 'LAB-ORD-2385',
    patientInitials: 'P.N.',
    testName: 'HbA1c',
    completedAt: '2026-06-10',
    resultSummary: '7.2 % · borderline control',
    flag: 'Borderline',
  },
];

const CRITICAL_ALERTS: CriticalAlert[] = [
  {
    id: 'crit-1',
    analyte: 'Potassium',
    value: '2.8 mEq/L',
    detail: 'CRITICAL LOW · K.V. · immediate clinical review',
  },
  {
    id: 'crit-2',
    analyte: 'Hemoglobin',
    value: '7.1 g/dL',
    detail: 'CRITICAL LOW · flagged on CBC delta check',
  },
];

const TREND_SERIES: TrendSeries[] = [
  {
    id: 'hba1c',
    label: 'HbA1c Trend',
    unit: '%',
    referenceMax: 8,
    points: [
      { month: 'Jan', value: 7.8 },
      { month: 'Mar', value: 7.5 },
      { month: 'May', value: 7.2 },
      { month: 'Jul', value: 7.0 },
    ],
  },
  {
    id: 'creatinine',
    label: 'Serum Creatinine Trend',
    unit: 'mg/dL',
    referenceMax: 1.6,
    points: [
      { month: 'Jan', value: 1.3 },
      { month: 'Mar', value: 1.2 },
      { month: 'May', value: 1.15 },
      { month: 'Jul', value: 1.1 },
    ],
  },
];

const FILTER_TABS: { id: LabFilter; label: string }[] = [
  { id: 'order', label: 'Order Placement' },
  { id: 'pending', label: 'Pending Queue' },
  { id: 'completed', label: 'Completed Reports Analysis' },
];

const PENDING_STATUS_STYLES: Record<PendingTest['status'], string> = {
  Processing: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Sample Collected': 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  'Awaiting Review': 'bg-indigo-100 text-indigo-950 border border-indigo-400 font-bold',
};

const FLAG_STYLES: Record<CompletedReport['flag'], string> = {
  Critical: 'bg-rose-100 text-rose-950 border border-rose-400 font-black',
  Normal: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Borderline: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function barHeight(value: number, max: number): string {
  const pct = Math.min(100, Math.max(12, Math.round((value / max) * 100)));
  return `${pct}%`;
}

export default function LaboratoryDiagnosticsPage() {
  const [activeFilter, setActiveFilter] = useState<LabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [criticalBannerVisible, setCriticalBannerVisible] = useState(true);
  const [activeTrendId, setActiveTrendId] = useState<'hba1c' | 'creatinine'>('hba1c');
  const [actionNote, setActionNote] = useState<string | null>(null);

  const filteredTests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return FORMULARY_TESTS;
    return FORMULARY_TESTS.filter((test) => test.toLowerCase().includes(query));
  }, [searchQuery]);

  const activeTrend = useMemo(
    () => TREND_SERIES.find((series) => series.id === activeTrendId) ?? TREND_SERIES[0],
    [activeTrendId],
  );

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const handleOrderTest = (testName: string) => {
    showNotice(`Lab order queued · ${testName} · sandbox routing · P.N. · ${testName}`);
  };

  const handleCompareReports = (report: CompletedReport) => {
    showNotice(
      `Compare old reports · ${report.testName} · ${report.orderId} · historical delta sandbox view`,
    );
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Diagnostics header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Laboratory Order &amp; Diagnostics Engine
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {ROUTING_SUMMARY}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <ClipboardList className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>LAB_ROUTING_ACTIVE</span>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="flex w-full flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-lg border-2 px-4 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                activeFilter === tab.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {criticalBannerVisible && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border-2 border-rose-400 bg-rose-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-800" aria-hidden />
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-rose-950">
                  Critical Result Alert
                </p>
                <p className="mt-1 text-xs font-bold text-rose-950">
                  One or more sandbox critical values require immediate provider review.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCriticalBannerVisible(false)}
              className="shrink-0 text-[10px] font-black uppercase text-rose-800 hover:text-rose-950"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Utility grid — order + critical panel */}
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-black text-slate-950">Order Lab Tests</h2>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search individual tests or panels…"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
            {searchQuery.trim() && (
              <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-2">
                {filteredTests.map((test) => (
                  <li key={test}>
                    <button
                      type="button"
                      onClick={() => handleOrderTest(test)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-bold text-slate-950 hover:bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      {test}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-800">
                Test Packages
              </p>
              <div className="flex flex-wrap gap-2">
                {TEST_PACKAGES.map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      handleOrderTest(pkg);
                    }}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs font-black transition-colors ${
                      selectedPackage === pkg
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-950 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full rounded-xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-black uppercase tracking-wide text-rose-950">
              Critical Result Alerts
            </h2>
            <ul className="mt-3 space-y-3">
              {CRITICAL_ALERTS.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border-2 border-rose-400 bg-white px-3 py-3"
                >
                  <p className="text-sm font-black text-rose-950">
                    {alert.analyte}: {alert.value}
                  </p>
                  <p className="mt-1 text-xs font-bold text-rose-900">{alert.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Main canvas split */}
        <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Left — queue & reports */}
          <section className="w-full space-y-5 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-black text-slate-950">Queue &amp; Report Ledger</h2>

            {(activeFilter === 'order' || activeFilter === 'pending') && (
              <div>
                <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-950">
                  View Pending Tests
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Order ID
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Patient
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Test
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PENDING_TESTS.map((row) => (
                        <tr key={row.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.orderId}
                          </td>
                          <td className="px-3 py-2.5 font-black text-slate-950">
                            {row.patientInitials}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-950">{row.testName}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${PENDING_STATUS_STYLES[row.status]}`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeFilter === 'order' || activeFilter === 'completed') && (
              <div>
                <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-950">
                  View Completed Reports
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Order ID
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Test
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Result
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPLETED_REPORTS.map((row) => (
                        <tr key={row.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                            {row.orderId}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-black text-slate-950">{row.testName}</p>
                            <p className="text-[10px] font-bold text-slate-800">{row.completedAt}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-bold text-slate-950">{row.resultSummary}</p>
                            <span
                              className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${FLAG_STYLES[row.flag]}`}
                            >
                              {row.flag}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCompareReports(row)}
                              className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-950 hover:bg-slate-50"
                            >
                              <GitCompare className="h-3 w-3" aria-hidden />
                              Compare Old Reports
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Right — trend analytics */}
          <section className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Trend Graphs &amp; Compare Previous Scans
                </h2>
                <p className="text-xs font-medium text-slate-800">
                  Pure layout simulation · no external chart libraries
                </p>
              </div>
              <div className="flex gap-2">
                {TREND_SERIES.map((series) => (
                  <button
                    key={series.id}
                    type="button"
                    onClick={() => setActiveTrendId(series.id)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-[10px] font-black uppercase ${
                      activeTrendId === series.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-950'
                    }`}
                  >
                    {series.id === 'hba1c' ? 'HbA1c' : 'Creatinine'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
              <p className="text-sm font-black text-slate-950">{activeTrend.label}</p>
              <p className="text-xs font-bold text-slate-800">Unit · {activeTrend.unit}</p>

              <div className="mt-6 flex h-48 items-end justify-between gap-3 border-b-2 border-slate-300 px-2 pb-2">
                {activeTrend.points.map((point) => (
                  <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-black tabular-nums text-slate-950">
                      {point.value}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-md bg-slate-800 transition-all"
                      style={{ height: barHeight(point.value, activeTrend.referenceMax) }}
                      aria-hidden
                    />
                    <span className="text-[10px] font-bold text-slate-800">{point.month}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {activeTrend.points.map((point) => (
                  <div
                    key={`${point.month}-stat`}
                    className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="text-[10px] font-black uppercase text-slate-800">{point.month}</p>
                    <p className="text-lg font-black tabular-nums text-slate-950">
                      {point.value}
                      <span className="ml-1 text-xs font-bold text-slate-800">
                        {activeTrend.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
              <TestTube2 className="h-4 w-4 text-slate-950" aria-hidden />
              <span>Historical trend sandbox · P.N. · compare prior intervals before final sign-off</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
