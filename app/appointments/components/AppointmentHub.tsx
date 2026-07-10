'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Menu,
  Plus,
  Radio,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import CommunicationsSidebar from './CommunicationsSidebar';
import NewAppointmentModal from './NewAppointmentModal';
import NotificationToastStack from './NotificationToastStack';
import QueueControlCenter from './QueueControlCenter';
import SchedulingFilterBar from './SchedulingFilterBar';
import SchedulingMatrix from './SchedulingMatrix';

type HubView = 'scheduling' | 'queue';

export default function AppointmentHub() {
  const [view, setView] = useState<HubView>('scheduling');
  const [modalOpen, setModalOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const navItems: { id: HubView; label: string; icon: typeof CalendarDays; description: string }[] =
    [
      {
        id: 'scheduling',
        label: 'Scheduling Matrix',
        icon: CalendarDays,
        description: 'Day-at-a-glance · 15-min slots',
      },
      {
        id: 'queue',
        label: 'Queue Control Center',
        icon: Radio,
        description: 'Token generation · live queue board',
      },
    ];

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 lg:hidden ${navOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setNavOpen(false)}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-800 bg-sidebar-panel transition-transform lg:static lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-700/60 px-4 py-4">
          <p className="text-sm font-bold text-white">Appointments</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-800">
            Module 3 · Queue Engine
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                setNavOpen(false);
              }}
              className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors ${
                view === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-900 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span
                className={`mt-0.5 pl-6 text-[10px] ${view === id ? 'text-white/70' : 'text-slate-800'}`}
              >
                {description}
              </span>
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-700/60 p-2">
          <Link
            href={APP_ROUTES.dashboard}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-800 hover:bg-slate-700/50 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Executive Dashboard
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
                Appointment Management
              </p>
              <h1 className="truncate text-sm font-semibold text-slate-900">
                {navItems.find((n) => n.id === view)?.label}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            New Appointment
          </button>
        </header>

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="mx-auto grid w-full max-w-[2400px] grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
            <div className="space-y-4 xl:col-span-8 2xl:col-span-9">
              {view === 'scheduling' && (
                <>
                  <SchedulingFilterBar />
                  <SchedulingMatrix />
                </>
              )}
              {view === 'queue' && <QueueControlCenter />}
            </div>

            <div className="xl:col-span-4 2xl:col-span-3">
              <CommunicationsSidebar />
            </div>
          </div>
        </main>
      </div>

      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <NotificationToastStack />
    </div>
  );
}
