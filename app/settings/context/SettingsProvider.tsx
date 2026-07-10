'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  DEPARTMENT_OPTIONS,
  SEED_CONFIG_AUDIT,
  SEED_DEPARTMENTS,
  SEED_HOSPITAL_PROFILE,
  SEED_INSURANCE,
  SEED_NOTIFICATIONS,
  SEED_PACKAGES,
  SEED_PERMISSIONS,
  SEED_ROLES,
  SEED_SERVICES,
  SEED_TAX_STRUCTURES,
} from '../lib/seedSettings';
import type {
  ConfigAuditEntry,
  DepartmentConfig,
  HospitalProfile,
  InsuranceProvider,
  NotificationChannel,
  PackageConfig,
  PermissionKey,
  RolePermissionMap,
  ServiceConfig,
  SettingsPanel,
  SettingsToast,
  SystemRole,
  TaxStructure,
} from '../types';
import { generateConfigId } from '../types';

type SettingsContextValue = {
  activePanel: SettingsPanel;
  setActivePanel: (panel: SettingsPanel) => void;
  hospitalProfile: HospitalProfile;
  updateHospitalProfile: (patch: Partial<HospitalProfile>) => void;
  departments: DepartmentConfig[];
  taxes: TaxStructure[];
  services: ServiceConfig[];
  packages: PackageConfig[];
  insurance: InsuranceProvider[];
  roles: SystemRole[];
  permissions: RolePermissionMap;
  permissionsLocked: boolean;
  notifications: NotificationChannel[];
  configAudit: ConfigAuditEntry[];
  departmentOptions: string[];
  toasts: SettingsToast[];
  togglePermission: (roleId: string, key: PermissionKey) => void;
  saveAccessPolicies: () => void;
  unlockAccessPolicies: () => void;
  toggleTaxActive: (id: string) => void;
  addTax: (name: string, ratePercent: number) => void;
  updateTax: (id: string, name: string, ratePercent: number) => void;
  deleteTax: (id: string) => void;
  addService: (input: Omit<ServiceConfig, 'id'>) => void;
  updateService: (id: string, input: Omit<ServiceConfig, 'id'>) => void;
  deleteService: (id: string) => void;
  toggleNotification: (id: string, channel: 'email' | 'sms' | 'inApp') => void;
  dismissToast: (id: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function pushToast(
  prev: SettingsToast[],
  message: string,
  type: SettingsToast['type'] = 'success',
): SettingsToast[] {
  return [{ id: `cfg-toast-${Date.now()}`, message, type }, ...prev].slice(0, 4);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>('roles-permissions');
  const [hospitalProfile, setHospitalProfile] = useState(SEED_HOSPITAL_PROFILE);
  const [departments] = useState(SEED_DEPARTMENTS);
  const [taxes, setTaxes] = useState(SEED_TAX_STRUCTURES);
  const [services, setServices] = useState(SEED_SERVICES);
  const [packages] = useState(SEED_PACKAGES);
  const [insurance] = useState(SEED_INSURANCE);
  const [roles] = useState(SEED_ROLES);
  const [permissions, setPermissions] = useState<RolePermissionMap>(SEED_PERMISSIONS);
  const [permissionsLocked, setPermissionsLocked] = useState(true);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [configAudit, setConfigAudit] = useState(SEED_CONFIG_AUDIT);
  const [toasts, setToasts] = useState<SettingsToast[]>([]);

  const updateHospitalProfile = useCallback((patch: Partial<HospitalProfile>) => {
    setHospitalProfile((prev) => ({ ...prev, ...patch }));
    setToasts((prev) => pushToast(prev, 'Hospital profile updated.', 'info'));
  }, []);

  const togglePermission = useCallback(
    (roleId: string, key: PermissionKey) => {
      if (permissionsLocked) return;
      setPermissions((prev) => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [key]: !prev[roleId][key],
        },
      }));
    },
    [permissionsLocked],
  );

  const saveAccessPolicies = useCallback(() => {
    setPermissionsLocked(true);
    const entry: ConfigAuditEntry = {
      id: generateConfigId('cfg-aud'),
      timestamp: new Date().toISOString(),
      userId: 'USR-ADM-0041',
      panel: 'Roles & Permissions',
      action: 'Saved and locked access policy matrix',
    };
    setConfigAudit((prev) => [entry, ...prev]);
    setToasts((prev) =>
      pushToast(prev, 'Access policies saved and matrix locked. Changes are now enforced.', 'success'),
    );
  }, []);

  const unlockAccessPolicies = useCallback(() => {
    setPermissionsLocked(false);
    setToasts((prev) =>
      pushToast(prev, 'Permission matrix unlocked for editing. Save to re-lock.', 'warning'),
    );
  }, []);

  const toggleTaxActive = useCallback((id: string) => {
    setTaxes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
    );
  }, []);

  const addTax = useCallback((name: string, ratePercent: number) => {
    const tax: TaxStructure = {
      id: generateConfigId('tax'),
      name: name.trim(),
      ratePercent,
      active: true,
    };
    setTaxes((prev) => [...prev, tax]);
    setToasts((prev) => pushToast(prev, `Tax structure "${tax.name}" created.`));
  }, []);

  const updateTax = useCallback((id: string, name: string, ratePercent: number) => {
    setTaxes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: name.trim(), ratePercent } : t)),
    );
    setToasts((prev) => pushToast(prev, 'Tax structure updated.', 'info'));
  }, []);

  const deleteTax = useCallback((id: string) => {
    setTaxes((prev) => prev.filter((t) => t.id !== id));
    setToasts((prev) => pushToast(prev, 'Tax structure removed.', 'warning'));
  }, []);

  const addService = useCallback((input: Omit<ServiceConfig, 'id'>) => {
    const svc: ServiceConfig = { id: generateConfigId('svc'), ...input };
    setServices((prev) => [...prev, svc]);
    setToasts((prev) => pushToast(prev, `Service "${svc.name}" added to catalog.`));
  }, []);

  const updateService = useCallback((id: string, input: Omit<ServiceConfig, 'id'>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...input } : s)));
    setToasts((prev) => pushToast(prev, 'Service configuration updated.', 'info'));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setToasts((prev) => pushToast(prev, 'Service removed from catalog.', 'warning'));
  }, []);

  const toggleNotification = useCallback(
    (id: string, channel: 'email' | 'sms' | 'inApp') => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, [channel]: !n[channel] } : n)),
      );
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    (): SettingsContextValue => ({
      activePanel,
      setActivePanel,
      hospitalProfile,
      updateHospitalProfile,
      departments,
      taxes,
      services,
      packages,
      insurance,
      roles,
      permissions,
      permissionsLocked,
      notifications,
      configAudit,
      departmentOptions: DEPARTMENT_OPTIONS,
      toasts,
      togglePermission,
      saveAccessPolicies,
      unlockAccessPolicies,
      toggleTaxActive,
      addTax,
      updateTax,
      deleteTax,
      addService,
      updateService,
      deleteService,
      toggleNotification,
      dismissToast,
    }),
    [
      activePanel,
      hospitalProfile,
      updateHospitalProfile,
      departments,
      taxes,
      services,
      packages,
      insurance,
      roles,
      permissions,
      permissionsLocked,
      notifications,
      configAudit,
      toasts,
      togglePermission,
      saveAccessPolicies,
      unlockAccessPolicies,
      toggleTaxActive,
      addTax,
      updateTax,
      deleteTax,
      addService,
      updateService,
      deleteService,
      toggleNotification,
      dismissToast,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
