'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Download, FileText } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useReports } from '../context/ReportsProvider';
import { DIMENSION_LABELS } from '../types';
import AuditReportPanel from './AuditReportPanel';
import DimensionMetricsGrid from './DimensionMetricsGrid';
import GenericReportPanel from './GenericReportPanel';
import ReportDimensionNav from './ReportDimensionNav';
import ReportsToastStack from './ReportsToastStack';
import RevenueReportPanel from './RevenueReportPanel';

export default function ReportsWorkspace() {
  const { activeDimension, exportReport } = useReports();

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f5]">
      <header className="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-slate-800 bg-[#0a0e14] px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <Link
            href={APP_ROUTES.dashboard}
            className="rounded p-1 text-slate-800 hover:bg-slate-800 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 18 · Analytics
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Executive Reports & Analytics
            </h1>
          </div>
        </div>
        <span className="hidden rounded bg-indigo-950 px-2 py-0.5 font-mono text-[10px] text-indigo-400 sm:inline">
          BI TERMINAL v2.4
        </span>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b-2 border-slate-200 bg-white lg:w-56 lg:border-b-0 lg:border-r">
          <ReportDimensionNav />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
                Active Dimension
              </p>
              <p className="text-sm font-bold text-slate-800">
                {DIMENSION_LABELS[activeDimension]}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => exportReport('pdf')}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5 text-rose-600" />
                Export to PDF
              </button>
              <button
                type="button"
                onClick={() => exportReport('csv')}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-600 bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            <DimensionMetricsGrid />
            {activeDimension === 'revenue' && <RevenueReportPanel />}
            {activeDimension === 'audit' && <AuditReportPanel />}
            {activeDimension !== 'revenue' && activeDimension !== 'audit' && (
              <GenericReportPanel />
            )}
          </div>
        </main>
      </div>

      <ReportsToastStack />
    </div>
  );
}
