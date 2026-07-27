'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { APP_ROUTES } from '../../lib/routes';

type PatientNavId =
  | 'dashboard'
  | 'appointments'
  | 'virtual_consultations'
  | 'billing_ledger'
  | 'records'
  | 'prescriptions'
  | 'messages';

type PatientNavItem = {
  id: PatientNavId;
  label: string;
};

const NAV_ITEMS: PatientNavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'appointments', label: 'Live Appointments' },
  { id: 'virtual_consultations', label: 'Virtual Consultations' },
  { id: 'billing_ledger', label: 'Billing Ledger' },
  { id: 'records', label: 'Diagnostics History' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'messages', label: 'Care Messages' },
];

const ACTIVE_NAV_CLASS =
  'w-full text-left px-4 py-3 flex items-center bg-[#E0A89F] text-patient-charcoal font-black shadow-sm shadow-[#E0A89F]/20 rounded-xl cursor-pointer text-xs';

const INACTIVE_NAV_CLASS =
  'w-full text-left px-4 py-3 flex items-center text-patient-text hover:text-[#E0A89F] hover:bg-slate-800/50 transition-all font-semibold text-xs rounded-xl cursor-pointer';

export default function PatientCommandCenter() {
  const [activeTab, setActiveTab] = useState<PatientNavId>('dashboard');
  const [symptoms, setSymptoms] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<string | null>(null);
  const [triageStatus, setTriageStatus] = useState<string | null>(null);

  const handleCheckIn = () => {
    setCheckInStatus('Check-in signal transmitted to the facility desk queue.');
    setTimeout(() => setCheckInStatus(null), 3500);
  };

  const handleTriageRequest = () => {
    if (!symptoms.trim()) {
      setTriageStatus('Describe your symptoms before requesting a specialty consult.');
      return;
    }

    setTriageStatus(
      'AI triage assistant queued your case for specialty routing. A care coordinator will respond shortly.',
    );
    setTimeout(() => setTriageStatus(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FDF4F2] flex">
      <aside className="w-64 bg-[#0F172A] text-white p-4 flex flex-col justify-between shrink-0 border-r border-patient-lavender/20 800">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#E0A89F]/80">
            CuraSync Patient Hub
          </p>
          <p className="mt-2 text-sm font-black tracking-tight text-white">
            Command Center
          </p>

          <nav className="mt-8 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={activeTab === item.id ? ACTIVE_NAV_CLASS : INACTIVE_NAV_CLASS}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2 border-t border-patient-lavender/20 800 pt-4">
          <Link
            href={APP_ROUTES.hospital}
            className="flex w-full items-center justify-center rounded-xl border border-patient-lavender/20 700/80 bg-slate-800/40 px-3 py-2.5 text-center text-[10px] font-semibold text-patient-text transition-all hover:bg-slate-800/50 hover:text-[#E0A89F]"
          >
            Hospital procurement console
          </Link>
          <p className="text-center font-mono text-[9px] uppercase tracking-wider text-patient-text">
            Secure patient lane · v2
          </p>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#A65E53]">
            Patient workspace
          </p>
          <h1 className="text-patient-charcoal font-black text-3xl tracking-tight mt-1">
            Victoria Healthcare Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-xs font-medium text-patient-text">
            On-site arrival triage, AI-assisted symptom routing, and live care navigation
            in one premium patient workspace.
          </p>
        </header>

        <section className="mt-8 bg-white border-2 border-patient-lavender/20 200 rounded-2xl p-6 shadow-xs mb-6 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-patient-text">
              On-site arrival
            </p>
            <h2 className="mt-1 text-lg font-black text-patient-charcoal tracking-tight">
              Facility desk check-in
            </h2>
            <p className="mt-1 text-xs font-medium text-patient-text">
              Signal your arrival to the front-desk triage queue before your consultation.
            </p>
            {checkInStatus && (
              <p className="mt-3 text-xs font-semibold text-[#A65E53]">{checkInStatus}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            className="bg-[#A65E53] hover:bg-[#8D4B41] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#A65E53]/10 transition-all cursor-pointer shrink-0"
          >
            Tap to Check-In at Facility Desk
          </button>
        </section>

        <section className="bg-white border-2 border-patient-lavender/20 200 rounded-2xl p-6 shadow-xs mb-6">
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-patient-text">
              AI clinical triage
            </p>
            <h2 className="mt-1 text-lg font-black text-patient-charcoal tracking-tight">
              Symptom assistant
            </h2>
            <p className="mt-1 text-xs font-medium text-patient-text">
              Describe how you feel. The assistant routes your case to the right specialty
              lane.
            </p>
          </div>

          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="e.g. Persistent headache with mild fever for 2 days…"
            className="w-full border border-patient-lavender/20 200 rounded-xl p-4 text-xs font-semibold bg-[#FDF4F2]/30 text-patient-charcoal focus:outline-none focus:border-[#D48D82] focus:ring-1 focus:ring-[#D48D82] h-24 placeholder-slate-400 resize-none"
          />

          {triageStatus && (
            <p className="mt-3 text-xs font-semibold text-[#A65E53]">{triageStatus}</p>
          )}

          <button
            type="button"
            onClick={handleTriageRequest}
            className="bg-[#475569] hover:bg-[#334155] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer ml-auto block mt-4"
          >
            Request Specialty Routing
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className="bg-white border-2 border-patient-lavender/20 200 rounded-2xl p-6 shadow-xs hover:border-[#D48D82]/50 transition-all cursor-pointer group text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-patient-text">
              Live schedule
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-patient-charcoal tracking-tight">
                View Live Appointments
              </h3>
              <span
                aria-hidden
                className="text-[#D48D82] text-lg font-black transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-patient-text">
              Track upcoming consultations, queue position, and provider assignments.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className="bg-white border-2 border-patient-lavender/20 200 rounded-2xl p-6 shadow-xs hover:border-[#D48D82]/50 transition-all cursor-pointer group text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-patient-text">
              Clinical archive
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-patient-charcoal tracking-tight">
                Access Diagnostics History
              </h3>
              <span
                aria-hidden
                className="text-[#D48D82] text-lg font-black transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-patient-text">
              Review lab panels, imaging summaries, and prior visit documentation.
            </p>
          </button>
        </section>
      </main>
    </div>
  );
}
