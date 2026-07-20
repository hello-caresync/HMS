'use client';

import {
  Activity,
  Bot,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Lock,
  Zap,
} from 'lucide-react';

import type { ReportsModalType } from '../reportsNav.types';
import { DEPARTMENT_STATUS_STREAM, EXECUTIVE_CENSUS, formatInrCr, formatTime } from '../lib/reportsMockData';
import { HbiPanel, SecurePatientPlaceholder, StatusIndicatorPill } from '../components/reportsUi';

type ExecutiveCommandTabProps = {
  onQuickAction: (action: Exclude<ReportsModalType, null>) => void;
};

export default function ExecutiveCommandTab({ onQuickAction }: ExecutiveCommandTabProps) {
  const c = EXECUTIVE_CENSUS;
  const profitPositive = c.netProfitLoss >= 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {[
          { label: 'OPD Today', value: c.opdToday.toLocaleString(), accent: true },
          { label: 'IPD Census', value: c.ipdCensus.toLocaleString(), accent: true },
          { label: 'ER Active', value: c.erActive, danger: true },
          { label: 'Bed Occupancy', value: `${c.bedOccupancyPct}%`, warn: c.bedOccupancyPct > 85 },
          { label: 'ALOS (Days)', value: c.alosDays, steel: true },
          { label: 'OT Utilization', value: `${c.otUtilizationPct}%`, success: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.accent ? 'text-[#2563EB]' : k.steel ? 'text-[#64748B]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'ICU Occupancy', value: `${c.icuOccupancyPct}%`, warn: c.icuOccupancyPct > 85 },
          { label: 'Total Revenue', value: formatInrCr(c.totalRevenue), success: true },
          { label: 'Collections', value: formatInrCr(c.collections), success: true },
          { label: 'Expenses', value: formatInrCr(c.expenses), steel: true },
          { label: 'Net P&L', value: formatInrCr(c.netProfitLoss), success: profitPositive, danger: !profitPositive },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.danger ? 'text-red-600' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : 'text-[#2563EB]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <HbiPanel title="Real-Time Departmental Status Stream" subtitle="Live hospital operations command metrics" icon={Activity} critical>
        <SecurePatientPlaceholder hipaa />
        <table className="mt-2 w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Department', 'Metric', 'Live Value', 'Status', 'Updated'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPARTMENT_STATUS_STREAM.map((row) => (
              <tr key={row.id} className={`border-b border-slate-50 ${row.status === 'Critical' ? 'bg-red-50/40 animate-pulse' : row.status === 'Warning' ? 'bg-amber-50/20' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{row.department}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{row.metric}</td>
                <td className="px-1.5 py-1 text-[9px] font-medium">{row.value}</td>
                <td className="px-1.5 py-1"><StatusIndicatorPill status={row.status} /></td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(row.lastUpdated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </HbiPanel>

      <HbiPanel title="Quick Actions Matrix" subtitle="Report builder · export · schedule · AI forecast · access security" icon={Zap}>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Custom Report Builder', icon: LayoutDashboard, action: 'custom-report-builder' as const },
            { label: 'Export Dashboard', icon: Download, action: 'export-dashboard' as const },
            { label: 'Schedule Report', icon: FileSpreadsheet, action: 'schedule-report' as const },
            { label: 'AI Forecast Run', icon: Bot, action: 'ai-forecast' as const },
            { label: 'Report Access Security', icon: Lock, action: 'report-access-security' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 transition-colors hover:border-[#2563EB] hover:bg-blue-50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-center text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </HbiPanel>
    </div>
  );
}
