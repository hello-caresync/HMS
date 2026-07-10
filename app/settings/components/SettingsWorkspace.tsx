'use client';

import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useSettings } from '../context/SettingsProvider';
import { PANEL_LABELS } from '../types';
import ConfigAuditLogsPanel from './ConfigAuditLogsPanel';
import DepartmentsPanel from './DepartmentsPanel';
import HospitalProfilePanel from './HospitalProfilePanel';
import InsurancePanel from './InsurancePanel';
import NotificationSettingsPanel from './NotificationSettingsPanel';
import PackagesPanel from './PackagesPanel';
import RbacMatrixPanel from './RbacMatrixPanel';
import ServicesPackagesPanel from './ServicesPackagesPanel';
import SettingsSidebar from './SettingsSidebar';
import SettingsToastStack from './SettingsToastStack';
import TaxConfigPanel from './TaxConfigPanel';

function ActivePanel() {
  const { activePanel } = useSettings();

  switch (activePanel) {
    case 'hospital-profile':
      return <HospitalProfilePanel />;
    case 'departments':
      return <DepartmentsPanel />;
    case 'taxes':
      return <TaxConfigPanel />;
    case 'services':
      return <ServicesPackagesPanel />;
    case 'packages':
      return <PackagesPanel />;
    case 'insurance':
      return <InsurancePanel />;
    case 'roles-permissions':
      return <RbacMatrixPanel />;
    case 'notifications':
      return <NotificationSettingsPanel />;
    case 'audit-logs':
      return <ConfigAuditLogsPanel />;
    default:
      return null;
  }
}

export default function SettingsWorkspace() {
  const { activePanel } = useSettings();

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
          <Settings className="h-4 w-4 text-slate-900" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 19 · Configuration
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">System Control Center</h1>
          </div>
        </div>
        <span className="hidden rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-800 sm:inline">
          CONFIG v3.1 · ADMIN
        </span>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b-2 border-slate-200 bg-white lg:w-52 lg:border-b-0 lg:border-r">
          <SettingsSidebar />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b-2 border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
              Active Panel
            </p>
            <p className="text-sm font-bold text-slate-800">{PANEL_LABELS[activePanel]}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <ActivePanel />
          </div>
        </main>
      </div>

      <SettingsToastStack />
    </div>
  );
}
