'use client';

import { useMemo, useState } from 'react';

import StaffModuleHeader from './components/StaffModuleHeader';
import {
  AddEmployeeModal,
  ApproveLeaveModal,
  AssignShiftModal,
  GenerateIdCardModal,
  ResetPasswordModal,
} from './components/StaffModals';
import { searchEmployees, MOCK_EMPLOYEES } from './lib/staffMockData';
import {
  STAFF_WORKSPACE_TABS,
  type StaffModalType,
  type StaffWorkspaceTab,
} from './staffNav.types';
import PrivilegesManagementTab from './views/PrivilegesManagementTab';
import ProfileVaultTab from './views/ProfileVaultTab';
import WorkforceOperationsTab from './views/WorkforceOperationsTab';

export default function StaffDirectoryModuleWorkspace() {
  const [activeTab, setActiveTab] = useState<StaffWorkspaceTab>('operations');
  const [lookupQuery, setLookupQuery] = useState('');
  const [modal, setModal] = useState<StaffModalType>(null);

  const lookupResults = useMemo(() => {
    const q = lookupQuery.trim();
    if (!q) return undefined;
    return searchEmployees(q).length;
  }, [lookupQuery]);

  const defaultEmployee = MOCK_EMPLOYEES[0];

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F8FAFC]">
      <StaffModuleHeader
        lookupValue={lookupQuery}
        onLookupChange={setLookupQuery}
        resultCount={lookupResults}
        onAddEmployee={() => setModal('add-employee')}
      />

      <nav className="shrink-0 border-b border-[#E2E8F0] bg-white px-4" aria-label="Staff directory workspace tabs">
        <div className="flex gap-1 overflow-x-auto py-1.5">
          {STAFF_WORKSPACE_TABS.map((tab) => (
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
          <WorkforceOperationsTab lookupQuery={lookupQuery} onQuickAction={(a) => setModal(a)} />
        )}
        {activeTab === 'directory' && <ProfileVaultTab lookupQuery={lookupQuery} />}
        {activeTab === 'privileges' && <PrivilegesManagementTab />}
      </div>

      {modal === 'add-employee' && <AddEmployeeModal onClose={() => setModal(null)} />}
      {modal === 'assign-shift' && <AssignShiftModal onClose={() => setModal(null)} />}
      {modal === 'approve-leave' && <ApproveLeaveModal onClose={() => setModal(null)} />}
      {modal === 'reset-password' && <ResetPasswordModal onClose={() => setModal(null)} />}
      {modal === 'generate-id' && (
        <GenerateIdCardModal
          onClose={() => setModal(null)}
          employeeName={defaultEmployee.name}
          employeeCode={defaultEmployee.employeeCode}
        />
      )}
    </div>
  );
}
