'use client';

import {
  AlertTriangle,
  BellRing,
  CalendarPlus,
  FileText,
  Package,
  Siren,
  UserPlus,
} from 'lucide-react';

import { formatEventTime } from '../../lib/executiveOperationsData';
import type { ExecutiveOperationsData } from '../../types/executiveOperations';
import { ExecutivePanel, SeverityPill } from './executiveUi';

const ACTION_ICONS = {
  'Register Patient': UserPlus,
  'Book Appointment': CalendarPlus,
  'Admit Patient': FileText,
  'Generate Invoice': FileText,
  'Create Purchase Request': Package,
  'Emergency Admission': Siren,
} as const;

type UtilityStripProps = {
  data: Pick<ExecutiveOperationsData, 'liveAlerts' | 'quickActions'>;
  onQuickAction?: (moduleId: string) => void;
};

export default function UtilityStrip({ data, onQuickAction }: UtilityStripProps) {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
      <ExecutivePanel
        title="Live Notifications"
        subtitle="Critical lab · emergency · equipment · inventory · patient load"
        icon={BellRing}
        className="xl:col-span-7"
        dense
        headerRight={
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 ring-1 ring-red-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {data.liveAlerts.filter((a) => a.severity === 'critical').length} critical
          </span>
        }
      >
        <ul className="custom-scrollbar max-h-[72px] space-y-1.5 overflow-y-auto pr-1">
          {data.liveAlerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5"
            >
              <SeverityPill severity={alert.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[#0F172A]">
                  {alert.category}
                  <span className="ml-1.5 font-normal text-slate-400">
                    · {formatEventTime(alert.timestamp)}
                  </span>
                </p>
                <p className="truncate text-[10px] text-slate-600">{alert.message}</p>
              </div>
              {alert.severity === 'critical' && (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </ExecutivePanel>

      <ExecutivePanel
        title="Quick Actions"
        subtitle="One-click operational triggers"
        className="xl:col-span-5"
        dense
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {data.quickActions.map((action) => {
            const Icon = ACTION_ICONS[action.label as keyof typeof ACTION_ICONS] ?? FileText;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction?.(action.moduleId)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-[10px] font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB]/40 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                <Icon className="h-3 w-3 shrink-0 text-[#2563EB]" strokeWidth={2} />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      </ExecutivePanel>
    </div>
  );
}
