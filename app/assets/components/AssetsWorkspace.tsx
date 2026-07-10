'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ClipboardCheck, Cpu, Wrench } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useAssets } from '../context/AssetsProvider';
import type { AssetTab } from '../types';
import AssetMetricsGrid from './AssetMetricsGrid';
import AssetToastStack from './AssetToastStack';
import CalibrationLedger from './CalibrationLedger';
import EquipmentMasterTable from './EquipmentMasterTable';
import ReportFaultSheet from './ReportFaultSheet';

const TABS: { id: AssetTab; label: string; icon: typeof Cpu }[] = [
  { id: 'master', label: 'Asset Control', icon: Cpu },
  { id: 'calibration', label: 'Calibration & AMC', icon: ClipboardCheck },
];

export default function AssetsWorkspace() {
  const { activeTab, setActiveTab, metrics } = useAssets();
  const [faultOpen, setFaultOpen] = useState(false);

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
          <Cpu className="h-4 w-4 text-orange-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 17 · Assets
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Medical Asset Control Center
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFaultOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700"
        >
          <Wrench className="h-3.5 w-3.5" />
          Report Fault
        </button>
      </header>

      <div className="border-b-2 border-slate-200 bg-white px-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-x-auto py-2">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                  activeTab === id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {metrics.outOfService > 0 && (
            <span className="shrink-0 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
              {metrics.outOfService} out of service
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-3 p-3">
        <AssetMetricsGrid />
        {activeTab === 'master' && <EquipmentMasterTable />}
        {activeTab === 'calibration' && <CalibrationLedger />}
      </main>

      <ReportFaultSheet open={faultOpen} onClose={() => setFaultOpen(false)} />
      <AssetToastStack />
    </div>
  );
}
