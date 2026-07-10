'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  UserCog,
  Wallet,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useHr } from '../context/HrProvider';
import type { HrTab } from '../types';
import AttendanceTerminal from './AttendanceTerminal';
import EmployeeDirectory from './EmployeeDirectory';
import PayrollLedger from './PayrollLedger';
import ShiftRotaGrid from './ShiftRotaGrid';
import WorkforceMetricsGrid from './WorkforceMetricsGrid';

const TABS: { id: HrTab; label: string; icon: typeof UserCog }[] = [
  { id: 'directory', label: 'Directory', icon: ClipboardList },
  { id: 'rota', label: 'Rota & Attendance', icon: CalendarDays },
  { id: 'payroll', label: 'Payroll', icon: Wallet },
];

export default function HrWorkspace() {
  const { activeTab, setActiveTab, metrics } = useHr();

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
          <UserCog className="h-4 w-4 text-teal-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 16 · HR
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">Workforce Command Center</h1>
          </div>
        </div>
        <span className="rounded bg-teal-950 px-2 py-0.5 font-mono text-[10px] text-teal-400">
          {metrics.staffOnDutyNow} on duty
        </span>
      </header>

      <div className="border-b-2 border-slate-200 bg-white px-3">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                activeTab === id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-3 p-3">
        {(activeTab === 'directory' || activeTab === 'rota') && <WorkforceMetricsGrid />}
        {activeTab === 'directory' && <EmployeeDirectory />}
        {activeTab === 'rota' && (
          <>
            <ShiftRotaGrid />
            <AttendanceTerminal />
          </>
        )}
        {activeTab === 'payroll' && <PayrollLedger />}
      </main>
    </div>
  );
}
