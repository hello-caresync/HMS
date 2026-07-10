'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Menu,
  Siren,
  UserPlus,
  UserSearch,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import EmergencyQuickReg from './EmergencyQuickReg';
import PatientAdvancedSearch from './PatientAdvancedSearch';
import PatientRegistrationWizard from './PatientRegistrationWizard';

type HubTab = 'register' | 'search';

export default function PatientRegistrationHub() {
  const [tab, setTab] = useState<HubTab>('register');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 lg:hidden ${navOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setNavOpen(false)}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b-2 border-slate-200 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Patient Registration</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-800">Phase 4 · Nexora</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setNavOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
              tab === 'register' ? 'bg-primary text-white' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('search');
              setNavOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
              tab === 'search' ? 'bg-primary text-white' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserSearch className="h-4 w-4" />
            Advanced Search
          </button>
        </nav>
        <div className="border-t border-slate-200 p-2">
          <Link
            href={APP_ROUTES.dashboard}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b-2 border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-800">
                Admin / Patients
              </p>
              <h1 className="truncate text-sm font-semibold text-slate-900">
                {tab === 'register' ? 'Register New Patient' : 'Patient Search'}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-rose-700"
          >
            <Siren className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Emergency Quick-Reg</span>
            <span className="sm:hidden">ER Reg</span>
          </button>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === 'register' ? (
            <div className="mx-auto max-w-3xl">
              <PatientRegistrationWizard onComplete={() => setTab('search')} />
            </div>
          ) : (
            <PatientAdvancedSearch />
          )}
        </main>
      </div>

      <EmergencyQuickReg open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}
