// curasync/app/dashboard/page.tsx
"use client";

import React, { useState } from 'react';
import { Activity } from 'lucide-react';

import NexoraSystemSidebar from './components/NexoraSystemSidebar';
import ExecutiveDashboardView from './DashboardView';
import PatientsModuleWorkspace from '../patients/module/PatientsModuleWorkspace';
import AppointmentsModuleWorkspace from '../appointments/module/AppointmentsModuleWorkspace';
import OpdModuleWorkspace from '../opd/module/OpdModuleWorkspace';
import MasterDeptsView from './MasterDeptsView';
import MasterDoctorsView from './MasterDoctorsView';
import MasterServicesView from './MasterServicesView';
import MasterMedicinesView from './MasterMedicinesView';
import MasterRoomsBedsView from './MasterRoomsBedsView';
import MasterFinancesView from './MasterFinancesView';
import PatientRegistrationView from './PatientRegistrationView';
import PatientProfileView from './PatientProfileView';
import QueueMgmtView from './QueueMgmtView';
import BedAllocationView from './BedAllocationView';
import AdmissionRequests from './AdmissionRequests';
import PatientAdmissionIntake from './PatientAdmissionIntake';
import BedAllocationMatrix from './BedAllocationMatrix';
import PatientTransferView from './PatientTransferView';
import InpatientCensusMgmt from './InpatientCensusMgmt';
import DischargeMgmtView from './DischargeMgmtView';
import StaffDirectoryModuleWorkspace from '../staff/module/StaffDirectoryModuleWorkspace';
import AdmissionsModuleWorkspace from '../admissions/module/AdmissionsModuleWorkspace';
import IpdModuleWorkspace from '../ipd/module/IpdModuleWorkspace';
import EmergencyModuleWorkspace from '../emergency/module/EmergencyModuleWorkspace';
import OtModuleWorkspace from '../ot/module/OtModuleWorkspace';
import EmrModuleWorkspace from '../emr/module/EmrModuleWorkspace';
import LaboratoryModuleWorkspace from '../laboratory/module/LaboratoryModuleWorkspace';
import RadiologyModuleWorkspace from '../radiology/module/RadiologyModuleWorkspace';
import PharmacyModuleWorkspace from '../pharmacy/module/PharmacyModuleWorkspace';
import InventoryModuleWorkspace from '../inventory/module/InventoryModuleWorkspace';
import ProcurementModuleWorkspace from '../procurement/module/ProcurementModuleWorkspace';
import VendorCoordinationModuleWorkspace from '../vendor-coordination/module/VendorCoordinationModuleWorkspace';
import BillingModuleWorkspace from '../billing/module/BillingModuleWorkspace';
import HpWorkspaceModuleWorkspace from '../hp-workspace/module/HpWorkspaceModuleWorkspace';
import AssetModuleWorkspace from '../assets/module/AssetModuleWorkspace';
import ReportsModuleWorkspace from '../reports/module/ReportsModuleWorkspace';
import MasterDataModuleWorkspace from '../master-data/module/MasterDataModuleWorkspace';
import AdministrationModuleWorkspace from '../administration/module/AdministrationModuleWorkspace';
import SettingsModuleWorkspace from '../settings/module/SettingsModuleWorkspace';
import AdmissionReportsView from './AdmissionReportsView';

const DummyView = ({ title }: { title: string }) => (
  <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
    <Activity className="mb-2 h-8 w-8 animate-pulse text-slate-300" />
    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-1 text-[11px] text-slate-400">Module workspace pending integration.</p>
  </div>
);

export default function NexoraMasterEngine() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');

  const renderActiveModuleView = () => {
    switch (activeModule) {
      case 'dashboard':
        return <ExecutiveDashboardView onNavigate={setActiveModule} />;
      case 'hp-workspace':
        return <HpWorkspaceModuleWorkspace />;
      case 'patients':
        return <PatientsModuleWorkspace />;
      case 'appointments':
        return <AppointmentsModuleWorkspace />;
      case 'admissions':
        return <AdmissionsModuleWorkspace />;
      case 'ipd-dashboard':
      case 'ipd':
        return <IpdModuleWorkspace />;
      case 'opd':
        return <OpdModuleWorkspace />;
      case 'emergency':
        return <EmergencyModuleWorkspace />;
      case 'ot':
        return <OtModuleWorkspace />;
      case 'emr':
        return <EmrModuleWorkspace />;
      case 'laboratory':
        return <LaboratoryModuleWorkspace />;
      case 'radiology':
        return <RadiologyModuleWorkspace />;
      case 'pharmacy':
        return <PharmacyModuleWorkspace />;
      case 'inventory':
        return <InventoryModuleWorkspace />;
      case 'procurement':
        return <ProcurementModuleWorkspace />;
      case 'vendor-coordination':
        return <VendorCoordinationModuleWorkspace />;
      case 'billing':
        return <BillingModuleWorkspace />;
      case 'staff-directory':
        return <StaffDirectoryModuleWorkspace />;
      case 'hr-workforce':
        return <DummyView title="HR & Workforce" />;
      case 'assets':
        return <AssetModuleWorkspace />;
      case 'reports':
        return <ReportsModuleWorkspace />;
      case 'master-data':
        return <MasterDataModuleWorkspace />;
      case 'administration':
        return <AdministrationModuleWorkspace />;
      case 'settings':
        return <SettingsModuleWorkspace />;
      case 'patient-registration':
        return <PatientRegistrationView />;
      case 'patient-profile':
        return <PatientProfileView />;
      case 'queue-mgmt':
        return <QueueMgmtView />;
      case 'bed-allocation':
        return <BedAllocationView />;
      case 'ipd-requests':
        return <AdmissionRequests />;
      case 'ipd-intake':
        return <PatientAdmissionIntake />;
      case 'ipd-bed-matrix':
        return <BedAllocationMatrix />;
      case 'ipd-transfer':
        return <PatientTransferView />;
      case 'ipd-census':
        return <InpatientCensusMgmt />;
      case 'ipd-discharge':
        return <DischargeMgmtView />;
      case 'ipd-reports':
        return <AdmissionReportsView />;
      case 'master-depts':
        return <MasterDeptsView />;
      case 'master-doctors':
        return <MasterDoctorsView />;
      case 'master-services':
        return <MasterServicesView />;
      case 'master-medicines':
        return <MasterMedicinesView />;
      case 'master-vendors':
        return <DummyView title="Vendor Master Matrix" />;
      case 'master-rooms-beds':
        return <MasterRoomsBedsView />;
      case 'master-taxes':
      case 'master-insurance':
      case 'master-payments':
        return <MasterFinancesView />;
      default:
        return <DummyView title="Core Operational Workspace" />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased">
      <NexoraSystemSidebar
        activeModuleId={activeModule}
        onNavigate={setActiveModule}
        user={{ name: 'Dr. Admin Console', role: 'Admin / Operations' }}
        onSignOut={() => window.alert('Sign out — session handler pending')}
        onSettings={() => setActiveModule('settings')}
      />

      <main className="min-w-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 lg:p-5">
        {activeModule === 'hp-workspace' || activeModule === 'patients' || activeModule === 'appointments' || activeModule === 'staff-directory' || activeModule === 'admissions' || activeModule === 'ipd' || activeModule === 'ipd-dashboard' || activeModule === 'opd' || activeModule === 'emergency' || activeModule === 'ot' || activeModule === 'emr' || activeModule === 'laboratory' || activeModule === 'radiology' || activeModule === 'pharmacy' || activeModule === 'inventory' || activeModule === 'procurement' || activeModule === 'vendor-coordination' || activeModule === 'billing' || activeModule === 'assets' || activeModule === 'reports' || activeModule === 'master-data' || activeModule === 'administration' || activeModule === 'settings' ? (
          renderActiveModuleView()
        ) : (
          <div className="mx-auto max-w-[1600px]">{renderActiveModuleView()}</div>
        )}
      </main>
    </div>
  );
}
