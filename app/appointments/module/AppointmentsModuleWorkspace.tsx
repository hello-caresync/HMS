'use client';

import { useMemo, useState } from 'react';

import AppointmentsModuleHeader from './components/AppointmentsModuleHeader';
import {
  BookAppointmentModal,
  CheckInModal,
  DoctorScheduleModal,
  PrintSlipModal,
} from './components/AppointmentModals';
import { MOCK_QUEUE } from './lib/appointmentsMockData';
import {
  APPOINTMENTS_WORKSPACE_TABS,
  type AppointmentModalType,
  type AppointmentsWorkspaceTab,
} from './appointmentsNav.types';
import LifecycleOutcomesTab from './views/LifecycleOutcomesTab';
import OperationsQueueTab from './views/OperationsQueueTab';
import SchedulingCalendarTab from './views/SchedulingCalendarTab';

export default function AppointmentsModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<AppointmentsWorkspaceTab>('operations');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<AppointmentModalType>(null);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return undefined;
    return MOCK_QUEUE.filter(
      (e) =>
        e.patientName.toLowerCase().includes(q) ||
        e.uhid.toLowerCase().includes(q) ||
        e.token.toLowerCase().includes(q) ||
        e.doctorName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    ).length;
  }, [lookupQuery]);

  const handleQuickAction = (action: Exclude<AppointmentModalType, null>) => {
    setModal(action);
  };

  const firstQueuePatient = MOCK_QUEUE.find((q) => q.status === 'Waiting') ?? MOCK_QUEUE[0];

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <AppointmentsModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        onBookClick={() => setModal('book')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Appointments workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {APPOINTMENTS_WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[11px] font-bold">{tab.label}</span>
              <span className="block text-[9px] text-slate-400">{tab.description}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === 'operations' && (
          <OperationsQueueTab lookupQuery={lookupQuery} onQuickAction={handleQuickAction} />
        )}
        {activeTab === 'scheduling' && <SchedulingCalendarTab />}
        {activeTab === 'lifecycle' && <LifecycleOutcomesTab />}
      </div>

      {modal === 'book' && <BookAppointmentModal onClose={() => setModal(null)} />}
      {modal === 'check-in' && <CheckInModal onClose={() => setModal(null)} />}
      {modal === 'doctor-schedule' && <DoctorScheduleModal onClose={() => setModal(null)} />}
      {modal === 'print-slip' && (
        <PrintSlipModal
          onClose={() => setModal(null)}
          patientName={firstQueuePatient.patientName}
          token={firstQueuePatient.token}
        />
      )}
      {modal === 'generate-token' && <CheckInModal onClose={() => setModal(null)} />}
    </div>
  );
}
