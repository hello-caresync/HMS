'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  FlaskConical,
  Menu,
  Microscope,
  TestTube,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useLab } from '../context/LabProvider';
import LabOrderTable from './LabOrderTable';
import PathologistApprovalQueue from './PathologistApprovalQueue';

type LabView = 'collection' | 'results' | 'approval';

const VIEWS: { id: LabView; label: string; icon: typeof FlaskConical }[] = [
  { id: 'collection', label: 'Pending Collection', icon: TestTube },
  { id: 'results', label: 'Awaiting Result Entry', icon: Microscope },
  { id: 'approval', label: 'Doctor Approval', icon: ClipboardCheck },
];

export default function LabWorkspace() {
  const { pendingCollection, awaitingResults, pendingApproval } = useLab();
  const [view, setView] = useState<LabView>('collection');
  const [navOpen, setNavOpen] = useState(false);

  const counts: Record<LabView, number> = {
    collection: pendingCollection.length,
    results: awaitingResults.length,
    approval: pendingApproval.length,
  };

  return (
    <div className="flex min-h-screen bg-[#eef1f5]">
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
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <FlaskConical className="h-4 w-4 text-primary" />
            Laboratory
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-800">Phase 7 · LIS</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const count = counts[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id);
                  setNavOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
                  view === id ? 'bg-primary text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      view === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b-2 border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded p-1.5 text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-800">
              Lab Technician Command
            </p>
            <h1 className="text-sm font-bold text-slate-900">
              {VIEWS.find((v) => v.id === view)?.label}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3">
          {view === 'collection' && <LabOrderTable view="collection" />}
          {view === 'results' && <LabOrderTable view="results" />}
          {view === 'approval' && <PathologistApprovalQueue />}
        </main>
      </div>
    </div>
  );
}
