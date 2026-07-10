'use client';

import Link from 'next/link';
import { useState, type ComponentType } from 'react';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  ClipboardList,
  Database,
  Layers,
  Menu,
  Pill,
  Stethoscope,
  X,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { MASTER_DATA_TABS, type MasterDataTab } from '../types';
import DepartmentView from './views/DepartmentView';
import DoctorRegistryView from './views/DoctorRegistryView';
import MedicineMasterView from './views/MedicineMasterView';
import RoomBedView from './views/RoomBedView';
import ServiceCatalogView from './views/ServiceCatalogView';
import VendorDirectoryView from './views/VendorDirectoryView';

const TAB_ICONS: Record<MasterDataTab, ComponentType<{ className?: string }>> = {
  departments: Layers,
  doctors: Stethoscope,
  medicines: Pill,
  services: ClipboardList,
  vendors: Building2,
  roomBeds: BedDouble,
};

function TabPanel({ tab }: { tab: MasterDataTab }) {
  switch (tab) {
    case 'departments':
      return <DepartmentView />;
    case 'doctors':
      return <DoctorRegistryView />;
    case 'medicines':
      return <MedicineMasterView />;
    case 'services':
      return <ServiceCatalogView />;
    case 'vendors':
      return <VendorDirectoryView />;
    case 'roomBeds':
      return <RoomBedView />;
  }
}

export default function MasterDataShell() {
  const [activeTab, setActiveTab] = useState<MasterDataTab>('doctors');
  const [navOpen, setNavOpen] = useState(false);

  const current = MASTER_DATA_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 lg:hidden ${navOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setNavOpen(false)}
        aria-hidden
      />

      {/* Side navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b-2 border-slate-200 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-canvas text-white">
            <Database className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">Master Data</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-slate-800">Nexora MDM</p>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="rounded-lg p-1 text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-2">
          {MASTER_DATA_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setNavOpen(false);
                }}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-800 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-800'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{tab.label}</p>
                  <p className={`truncate text-[10px] ${active ? 'text-white/75' : 'text-slate-800'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <Link
            href={APP_ROUTES.dashboard}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b-2 border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-slate-900">{current.label}</h1>
            <p className="truncate text-[11px] text-slate-800">{current.description}</p>
          </div>
          <span className="hidden rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 sm:inline">
            Admin
          </span>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          <TabPanel tab={activeTab} />
        </main>
      </div>
    </div>
  );
}
