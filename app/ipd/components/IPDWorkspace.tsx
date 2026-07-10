'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, BedDouble } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useIPD } from '../context/IPDProvider';
import type { IPDBed } from '../types';
import AdmitPatientModal from './AdmitPatientModal';
import BedTransferModal from './BedTransferModal';
import ClinicalShiftConsole from './ClinicalShiftConsole';
import DischargeBillingFooter from './DischargeBillingFooter';
import FloorBedGrid from './FloorBedGrid';
import IPDToastStack from './IPDToastStack';

export default function IPDWorkspace() {
  const { occupancyStats } = useIPD();
  const [admitBed, setAdmitBed] = useState<IPDBed | null>(null);
  const [transferBed, setTransferBed] = useState<IPDBed | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | undefined>('bed-icu-01');

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] pb-48">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b-2 border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={APP_ROUTES.dashboard}
            className="rounded-lg p-1.5 text-slate-800 hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <BedDouble className="h-4 w-4 text-indigo-700" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Module 5 · IPD Command Center
            </p>
            <h1 className="text-sm font-bold text-slate-900">Bed Management & Clinical Shift</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
            {occupancyStats.occupied} occ.
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
            {occupancyStats.available} avail.
          </span>
          <span className="hidden text-slate-800 sm:inline">
            {occupancyStats.total} beds
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 p-4">
        <FloorBedGrid
          onTransfer={(bed) => setTransferBed(bed)}
          onBedSelect={(bed) => setSelectedBedId(bed.id)}
          selectedBedId={selectedBedId}
        />
        <ClinicalShiftConsole />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <DischargeBillingFooter />
      </div>

      <AdmitPatientModal bed={admitBed} open={!!admitBed} onClose={() => setAdmitBed(null)} />
      <BedTransferModal
        fromBed={transferBed}
        open={!!transferBed}
        onClose={() => setTransferBed(null)}
      />
      <IPDToastStack />
    </div>
  );
}
