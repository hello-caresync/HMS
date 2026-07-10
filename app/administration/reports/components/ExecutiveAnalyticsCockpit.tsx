'use client';

import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

import {
  EXECUTIVE_METRICS,
  REPORT_DEPARTMENT_FILTERS,
  filterFinancialsByDepartment,
  type ReportDepartmentFilter,
} from '../../../lib/administration';
import FinancialParametersTable from './FinancialParametersTable';

const METRIC_TONE = [
  'border-emerald-200 bg-emerald-50',
  'border-sky-200 bg-sky-50',
  'border-indigo-200 bg-indigo-50',
];

export default function ExecutiveAnalyticsCockpit() {
  const [department, setDepartment] = useState<ReportDepartmentFilter>('All Departments');

  const financialRows = useMemo(
    () => filterFinancialsByDepartment(department),
    [department],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">Executive Analytics Cockpit</h1>
              <p className="text-xs text-slate-800">
                Phase 7 · Module 22 · Leadership metrics &amp; financial parameters
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as ReportDepartmentFilter)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              {REPORT_DEPARTMENT_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {EXECUTIVE_METRICS.map((metric, i) => (
          <article
            key={metric.id}
            className={`rounded-xl border p-4 shadow-sm ${METRIC_TONE[i] ?? 'border-slate-200 bg-white'}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              {metric.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-800">{metric.subtext}</p>
            {metric.trendLabel && (
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                {metric.trendLabel}
              </p>
            )}
          </article>
        ))}
      </div>

      <FinancialParametersTable rows={financialRows} departmentFilter={department} />
    </div>
  );
}
