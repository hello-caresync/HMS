"use client";

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { 
  Activity, Users, BedDouble, Stethoscope, 
  Building2, RefreshCw, Loader2
} from 'lucide-react';

import { HospitalToastBanner, useHospitalToast } from '../_components/HospitalFeedback';
import { fetchHospitalDashboardCounts } from '../_lib/hospital-db.service';

type DeptRow = { name: string; opd: number; ipd: number; status: string; color: string };

export default function ExecutiveDashboardWorkspace() {
  const { toast, showSuccess, showError } = useHospitalToast();
  const [isPending, startTransition] = useTransition();
  const [countsLoading, setCountsLoading] = useState(true);
  const [coreStats, setCoreStats] = useState([
    { title: "Live OPD Queue", value: "—", sub: "Appointments in queue / confirmed", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "IPD Census Count", value: "—", sub: "Active admissions", icon: BedDouble, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Staff On Duty", value: "—", sub: "Active staff records", icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]);

  const [departmentSummaries, setDepartmentSummaries] = useState<DeptRow[]>([
    { name: "Cardiology Unit", opd: 32, ipd: 18, status: "Optimal Load", color: "bg-emerald-500" },
    { name: "Neurology Clinic", opd: 24, ipd: 12, status: "High Wait-Times", color: "bg-amber-500" },
  ]);

  const applyCounts = useCallback(
    (opdQueue: number, admissions: number, staff: number) => {
      setCoreStats([
        {
          title: 'Live OPD Queue',
          value: `${opdQueue} Patients`,
          sub: 'Supabase appointments (queue + confirmed)',
          icon: Users,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          title: 'IPD Census Count',
          value: `${admissions} Active`,
          sub: 'Admitted patients in census',
          icon: BedDouble,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        },
        {
          title: 'Staff On Duty',
          value: `${staff} Active`,
          sub: 'Staff with Active status',
          icon: Stethoscope,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
      ]);
    },
    [],
  );

  const loadDashboard = useCallback(async () => {
    setCountsLoading(true);
    const { opdQueue, admissions, staff, error } = await fetchHospitalDashboardCounts();
    if (error) {
      showError(error);
    } else {
      applyCounts(opdQueue, admissions, staff);
    }
    setCountsLoading(false);
  }, [applyCounts, showError]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const refreshTelemetry = () => {
    startTransition(() => {
      void (async () => {
        await loadDashboard();
        showSuccess('Command center telemetry refreshed from Supabase.');
      })();
    });
  };

  return (
    <div className="space-y-8">
      <HospitalToastBanner toast={toast} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Executive Hospital Command Center</h1>
          <p className="text-sm font-medium text-slate-500">Real-time enterprise workflows and capacity ceilings.</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={refreshTelemetry}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold uppercase text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh telemetry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coreStats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => showSuccess(`Drill-down: ${stat.title}`)}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-left transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.title}</span>
                  <div className="mt-1 text-xl font-bold text-slate-800 tracking-tight">{stat.value}</div>
                  <p className="mt-1 text-base text-slate-500">{stat.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> Systemic Department Load Ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-200/60 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-5">Department Unit Name</th>
                <th className="p-3.5 text-center">Active OPD</th>
                <th className="p-3.5 text-center">Census IPD</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base font-medium text-slate-700">
              {departmentSummaries.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pl-5">{dept.name}</td>
                  <td className="p-4 text-center">{dept.opd} Cases</td>
                  <td className="p-4 text-center">{dept.ipd} Beds Filled</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block h-2 w-2 rounded-full ${dept.color} mr-1`} />
                    {dept.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Activity className="h-4 w-4 text-emerald-500" />
        {countsLoading ? 'Loading Supabase counts…' : 'Live sync · Supabase hospital feed'}
      </div>
    </div>
  );
}
