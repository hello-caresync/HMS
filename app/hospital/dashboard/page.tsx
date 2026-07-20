"use client";

import React from 'react';
import { 
  Activity, Users, BedDouble, Stethoscope, 
  DollarSign, ShoppingBag, Landmark, Building2, ArrowUpRight, Zap
} from 'lucide-react';

export default function ExecutiveDashboardWorkspace() {
  const coreStats = [
    { title: "Live OPD Queue", value: "148 Patients", sub: "Across 12 clinics", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "IPD Census Count", value: "84 / 100 Beds", sub: "84% Occupancy load", icon: BedDouble, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Staff On Duty", value: "42 Active", sub: "6 Doctors, 24 Nurses, 12 Techs", icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const departmentSummaries = [
    { name: "Cardiology Unit", opd: 32, ipd: 18, status: "Optimal Load", color: "bg-emerald-500" },
    { name: "Neurology Clinic", opd: 24, ipd: 12, status: "High Wait-Times", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Executive Hospital Command Center</h1>
          <p className="text-sm font-medium text-slate-500">Real-time enterprise workflows and capacity ceilings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coreStats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{stat.title}</span>
                  <div className="mt-1 text-xl font-black text-slate-800 tracking-tight">{stat.value}</div>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> Systemic Department Load Ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-200/60 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-5">Department Unit Name</th>
                <th className="p-3.5 text-center">Active OPD</th>
                <th className="p-3.5 text-center">Census IPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {departmentSummaries.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pl-5">{dept.name}</td>
                  <td className="p-4 text-center">{dept.opd} Cases</td>
                  <td className="p-4 text-center">{dept.ipd} Beds Filled</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}