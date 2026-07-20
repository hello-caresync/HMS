'use client';

import { useMemo, useState } from 'react';

import PatientsModuleHeader from './components/PatientsModuleHeader';
import { ModalOverlay } from './components/patientsUi';
import { getPatientByUhid, searchPatients } from './lib/patientsMockData';
import {
  PATIENTS_WORKSPACE_TABS,
  type PatientsWorkspaceTab,
  type QuickActionModalType,
} from './patientsNav.types';
import AlertsCommunicationTab from './views/AlertsCommunicationTab';
import DirectorySearchTab from './views/DirectorySearchTab';
import OperationsMetricsTab from './views/OperationsMetricsTab';
import PatientRegistrationWorkspaceView from './views/PatientRegistrationWorkspaceView';
import { QuickActionModalContent } from './views/QuickActionsMatrixView';

const MODAL_TITLES: Record<Exclude<QuickActionModalType, null>, string> = {
  'print-card': 'Print Patient Card',
  'print-barcode': 'Print Barcode Label',
  'generate-qr': 'Generate QR Code',
  'send-sms': 'Send SMS Notification',
};

export default function PatientsModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<PatientsWorkspaceTab>('operations');
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedUhid, setSelectedUhid] = useState<string | null>('NX-2026-000412');
  const [quickActionModal, setQuickActionModal] = useState<QuickActionModalType>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const lookupResults = useMemo(() => searchPatients(lookupQuery), [lookupQuery]);
  const activePatient = selectedUhid ? getPatientByUhid(selectedUhid) : undefined;

  const handleQuickAction = (type: Exclude<QuickActionModalType, null>) => {
    if (type === 'send-sms') {
      setQuickActionModal('send-sms');
      return;
    }
    if (!selectedUhid) return;
    setQuickActionModal(type);
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <PatientsModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupQuery.trim() ? lookupResults.length : undefined}
        onRegisterClick={() => setRegistrationOpen(true)}
      />

      <nav
        className="shrink-0 border-b border-slate-200 bg-white px-4"
        aria-label="Patients workspace tabs"
      >
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {PATIENTS_WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                activeTab === tab.id
                  ? 'bg-[#0F172A] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[11px] font-bold">{tab.label}</span>
              <span className={`block text-[9px] ${activeTab === tab.id ? 'text-slate-400' : 'text-slate-400'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === 'operations' && (
          <OperationsMetricsTab
            onQuickAction={handleQuickAction}
            selectedUhid={selectedUhid}
          />
        )}
        {activeTab === 'directory' && (
          <DirectorySearchTab
            lookupQuery={lookupQuery}
            selectedUhid={selectedUhid}
            onSelectPatient={setSelectedUhid}
          />
        )}
        {activeTab === 'alerts' && <AlertsCommunicationTab />}
      </div>

      {registrationOpen && (
        <ModalOverlay title="Register New Patient" onClose={() => setRegistrationOpen(false)}>
          <div className="max-h-[70vh] overflow-y-auto">
            <PatientRegistrationWorkspaceView />
          </div>
        </ModalOverlay>
      )}

      {quickActionModal && (quickActionModal === 'send-sms' || activePatient) && (
        <ModalOverlay
          title={MODAL_TITLES[quickActionModal]}
          onClose={() => setQuickActionModal(null)}
        >
          <QuickActionModalContent
            type={quickActionModal}
            uhid={activePatient?.uhid ?? '—'}
            patientName={activePatient?.name ?? 'Patient'}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
